import type { Claim, Task } from './task.js'
import type { Host } from './tooling.js'
import { randomUUID } from 'node:crypto'
import { existsSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { isAlive, logPath, spawnSession } from '@mzwing/pi-session-hub/api'
import {
  environmentPath,
  loadEnvironment,
  prepareEnvironment,
  releaseEnvironment,
  saveEnvironment,
  temporaryDirectory,
} from './env.js'
import { executorPrompt } from './prompts.js'
import { readState, updateState } from './store.js'
import { claimRoot, focusOf, isOpen, logEvent, reopen, requireTask, waitsFor } from './task.js'
import { describeError } from './tooling.js'
import { addWorkspace, bookmarkCommit, removeWorkspace } from './vcs.js'

export const STORE_FLAG = 'governor-store'
const EXECUTOR_TOOLS: string[] = [
  'read',
  'grep',
  'find',
  'ls',
  'task_show',
  'task_subtask',
  'task_develop',
  'task_review',
  'task_note',
  'task_ask',
  'task_handoff',
  'session_read',
]
const MAX_RESTARTS = 2

export type ExecutorStatus = 'preparing' | 'running' | 'asking' | 'handed-off' | 'stalled' | 'stopped'

export interface Scheduler {
  /** Brings executors in line with the store; calls during a pass fold into one more pass. */
  tick: () => void
}

export function executorStatus(claim: Claim): ExecutorStatus {
  if (claim.stalled !== undefined) {
    return 'stalled'
  }
  if (claim.sessionId === undefined) {
    return 'preparing'
  }
  if (claim.pid !== undefined && isAlive(claim.pid)) {
    return 'running'
  }
  if (claim.question !== undefined) {
    return 'asking'
  }

  return claim.handoff === true ? 'handed-off' : 'stopped'
}

function sequence(task: Task): number {
  return Number(task.id.slice(1))
}

/**
 * Runs in the coordinator, woken by events only: declarations, answers, executor exits and executor mail. It
 * launches executors for root tasks whose turn has come within the budget, gives a task a fresh executor session
 * whenever the last one ended before the task did, and removes the workspaces of finished tasks.
 */
export function createScheduler(host: Host, notify: (message: string, wake: boolean) => void): Scheduler {
  let pass: Promise<void> | undefined
  let again = false

  function stall(store: string, taskId: string, reason: string): void {
    updateState(store, state => {
      requireTask(state, taskId).claim!.stalled = reason
    })
    notify(`${taskId} stalled: ${reason}`, true)
  }

  /**
   * Starts a fresh executor session, which takes over from the last one if any. Spawning inside the lock means the
   * executor, which checks its pid under the same lock, sees it bound.
   */
  function launch(store: string, taskId: string): void {
    updateState(store, state => {
      const task = requireTask(state, taskId)
      // Cancelled while its workspace was being prepared.
      if (!isOpen(task)) {
        return
      }
      const claim = task.claim!
      const prompt = executorPrompt(state, task, claim.sessionId)
      claim.sessionId = randomUUID()
      const { model, thinking } = state.config.roles.executor
      const child = spawnSession({
        cwd: claim.workspace.path,
        sessionId: claim.sessionId,
        prompt,
        name: `${task.id} executor: ${task.title}`,
        model,
        thinking,
        tools: EXECUTOR_TOOLS,
        // `--tools` alone keeps MCP tools, which the executor's fixed tool set leaves out.
        args: ['--no-approve', '--no-mcp', `--${STORE_FLAG}`, store],
        // Pi's own temporary files, and the in-process developers and reviewers, use it too.
        env: { TMPDIR: temporaryDirectory(claim.workspace.path) },
        // So what would ask in the executor, or in its developers and reviewers, is answered by the coordinator.
        parentSessionId: state.lease!.sessionId,
      })
      if (child.pid === undefined) {
        claim.stalled = `pi could not start; see ${logPath(claim.sessionId)}`

        return
      }
      child.on('exit', tick)
      child.unref()
      claim.pid = child.pid
      claim.handoff = undefined
      logEvent(task, `executor session ${claim.sessionId} started`, Date.now())
    })
  }

  async function start(store: string, repoRoot: string, taskId: string): Promise<void> {
    const { config } = readState(store)
    const workspaceRoot = resolve(repoRoot, config.workspaceRoot ?? `${repoRoot}.tasks`)
    const workspace = { name: `task-${taskId}`, path: join(workspaceRoot, taskId) }
    const bookmark = updateState(store, state => {
      const task = claimRoot(
        state,
        taskId,
        { sessionId: undefined, pid: undefined, workspace, restarts: 0 },
        Date.now(),
      )

      return task.base.bookmark!
    })
    try {
      const base = await bookmarkCommit(repoRoot, bookmark)
      updateState(store, state => {
        requireTask(state, taskId).base.commit = base
      })
      await addWorkspace(repoRoot, workspace, base)
      saveEnvironment(store, taskId, await prepareEnvironment(workspace.path, config.env.provider, config.env.setup))
    } catch (error) {
      stall(store, taskId, `preparing its workspace failed: ${describeError(error)}`)

      return
    }
    launch(store, taskId)
  }

  /** A stop before the task ended counts against the restarts; a handoff, the coordinator's answer included, does not. */
  function relaunch(store: string, task: Task, status: ExecutorStatus): void {
    if (status === 'stopped' && task.claim!.restarts === MAX_RESTARTS) {
      stall(store, task.id, `its executor stopped ${MAX_RESTARTS + 1} times before the task ended`)

      return
    }
    updateState(store, state => {
      const root = requireTask(state, task.id)
      if (status === 'stopped') {
        root.claim!.restarts += 1
      }
      // A review the stopped executor was running died with it.
      reopen(state, focusOf(state, root).id, 'its executor stopped during the review', Date.now())
    })
    launch(store, task.id)
  }

  async function cleanUp(store: string, repoRoot: string, task: Task): Promise<void> {
    const { workspace } = task.claim!
    await removeWorkspace(repoRoot, workspace)
    rmSync(temporaryDirectory(workspace.path), { recursive: true, force: true })
    if (existsSync(environmentPath(store, task.id))) {
      await releaseEnvironment(loadEnvironment(store, task.id))
    }
  }

  async function run(): Promise<void> {
    const runtime = host.runtime()
    if (runtime?.role !== 'coordinator') {
      return
    }
    const { store, repoRoot } = runtime
    const state = readState(store)
    const roots = Object.values(state.tasks).filter(task => task.parentId === undefined)
    const finished = roots.filter(
      task =>
        !isOpen(task) &&
        task.claim !== undefined &&
        existsSync(task.claim.workspace.path) &&
        executorStatus(task.claim) !== 'running',
    )
    for (const task of finished) {
      try {
        await cleanUp(store, repoRoot, task)
      } catch (error) {
        notify(`Cleaning up after ${task.id} failed: ${describeError(error)}`, false)
      }
    }
    if (state.paused) {
      return
    }
    for (const task of roots) {
      const status = task.claim === undefined || !isOpen(task) ? undefined : executorStatus(task.claim)
      if (status === 'stopped' || status === 'handed-off') {
        relaunch(store, task, status)
      }
    }
    const busy = Object.values(readState(store).tasks).filter(
      task => isOpen(task) && task.claim !== undefined && ['preparing', 'running'].includes(executorStatus(task.claim)),
    ).length
    const queued = roots
      .filter(task => task.state === 'declared' && waitsFor(state, task).length === 0)
      .sort((left, right) => sequence(left) - sequence(right))
      .slice(0, Math.max(0, state.config.maxExecutors - busy))
    await Promise.all(queued.map(async task => start(store, repoRoot, task.id)))
    host.changed()
  }

  function tick(): void {
    if (pass !== undefined) {
      again = true

      return
    }
    pass = (async () => {
      do {
        again = false
        await run()
      } while (again)
    })()
      .catch((error: unknown) => notify(`The task scheduler failed: ${describeError(error)}`, true))
      .finally(() => {
        pass = undefined
      })
  }

  return { tick }
}

---
"@mzwing/pi-task-governor": minor
---

feat(pi-task-governor)!: require the coordinator's sign-off before a reviewed task merges

A root task that passes its review now waits for the coordinator, which receives the change, its reviewer's evidence for every criterion and the executor's note, and approves the task with `task_approve` or sends it back with findings through `task_reject`. Approved tasks merge one at a time from the coordinator, re-running their checks after a rebase; a task sent back, or whose merge conflicts or breaks a check, goes to a fresh executor session. Only the merge that finishes the last task wakes the coordinator, to report the outcome.

BREAKING CHANGE: a reviewed root task no longer merges on its own. It merges once the coordinator approves it, from the coordinator's session, so reviewed tasks wait while no coordinator runs.

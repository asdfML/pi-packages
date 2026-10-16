---
"@mzwing/pi-task-governor": minor
---

feat(pi-task-governor): work each task in fresh executor sessions instead of resuming one

A fresh executor session takes over whenever the last one hands off with `task_handoff`, reaches `roles.executor.maxTurns` turns, gets the coordinator's answer, or stops early. It starts from the task board, the task's latest events and the note the executor keeps on it with `task_note`, and can read the sessions before it with `session_read`.

After upgrading, run `/governor coordinate` again in the coordinating session, so the config its store keeps gains the turn limits of the coordinator and the executor.

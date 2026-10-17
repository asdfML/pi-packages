---
"@mzwing/pi-task-governor": minor
---

feat(pi-task-governor): show the coordinator the tasks that overlap and the tasks that wait when it signs a task off

The sign-off request lists the other tasks of the same bookmark that change files the task changes, both those merged since it started and those still open, and the declared tasks that wait for it, whose briefs the coordinator can revise before they start.

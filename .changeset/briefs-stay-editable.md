---
"@mzwing/pi-task-governor": minor
---

feat(pi-task-governor): let the coordinator revise a task's brief

`task_revise` rewrites the parts of a brief it is given, for a task no executor is working on: a root task that waits to start or for its sign-off, or a task whose executor waits for the coordinator's answer or stalled. A task left waiting for an answer goes on in a fresh executor session on the new brief, and one waiting for its sign-off goes back to be reviewed against it.

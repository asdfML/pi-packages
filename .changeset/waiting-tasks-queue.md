---
"@mzwing/pi-task-governor": minor
---

feat(pi-task-governor): let a task wait for other tasks to merge before it starts

`task_declare` takes `after`, the root tasks of the same bookmark that must be merged first, so the coordinator can plan a whole change and declare it at once. Each task starts as soon as the tasks it waits for are merged, and cancelling a task cancels the tasks waiting for it.

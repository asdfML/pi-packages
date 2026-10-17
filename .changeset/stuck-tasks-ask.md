---
"@mzwing/pi-task-governor": minor
---

feat(pi-task-governor): bring a task back to the coordinator when its reviews keep failing or its sessions run on

A task whose review fails three times in a row asks the coordinator how to go on, and its executor stops until the answer comes. Between the coordinator's words on a task, which are its answers, revised briefs, approvals and refusals, the task gets three executor sessions, and it stalls once the third ends, whether that session stopped early or handed off. Before, only sessions that stopped early counted, so a task whose sessions kept handing off ran on without the coordinator hearing of it.

---
"@mzwing/pi-session-hub": minor
"@mzwing/pi-task-governor": minor
---

feat(pi-session-hub, pi-task-governor): give each task its own `TMPDIR`

A task's executor, developers, reviewers, checks and setup commands use a temporary directory beside its workspace, which is removed with the workspace. For this, pi-session-hub's `spawnSession` takes `env`, variables set in the new session's environment over the ones it inherits.

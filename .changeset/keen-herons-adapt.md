---
"@mzwing/pi-codex-downgrade-detector": minor
"@mzwing/pi-model-info": minor
"@mzwing/pi-permission-auto-review": minor
"@mzwing/pi-session-hub": minor
"@mzwing/pi-task-governor": minor
---

feat: adapt to Pi 1.1 and jj 0.46, and accept @gotgenes/pi-permission-system v40

The Pi peer range moves to `^1.1.0`, the line these packages are built and tested against.

pi-permission-auto-review accepts `@gotgenes/pi-permission-system` v40, whose breaking change matches a bash rule written with an absolute path against the relative spelling of that path, leaving the authorizer surface unchanged. The spelling a rule matched, which v40 adds to an ask, reaches the reviewer with the rest of the request.

Since Pi 1.0.4, `--tools` no longer removes MCP tools, so pi-task-governor starts its executors with `--no-mcp`: they work with their fixed tool set alone and connect to no MCP servers.

pi-task-governor now requires jj 0.46. That release turns a workspace added to a colocated repository into a Git worktree by default, so task workspaces are added with `--no-colocate` and stay without `.git`, as the task environment and the developer prompt expect.

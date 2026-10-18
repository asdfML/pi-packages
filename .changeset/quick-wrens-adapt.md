---
"@mzwing/pi-codex-downgrade-detector": patch
"@mzwing/pi-model-info": patch
"@mzwing/pi-permission-auto-review": patch
"@mzwing/pi-session-hub": patch
"@mzwing/pi-task-governor": patch
---

chore: accept Pi 1.3 and @gotgenes/pi-permission-system v41

The Pi peer range moves to `^1.3.0`, the line these packages are built and tested against. From 1.3.0 on, a session that pi-session-hub's `session_spawn` continues with `resume` keeps its active tools instead of falling back to the default ones.

pi-permission-auto-review accepts `@gotgenes/pi-permission-system` v41. Where v40 downgrades the reviewer's `allow` on every `path` and `external_directory` ask to `defer`, v41 lets it stand on a bash `external_directory` ask whose paths name nothing on disk, such as the spreadsheet cell in `officecli set data.xlsx /Sheet1/B1`. The license that marks such an ask reaches the reviewer with the rest of the request.

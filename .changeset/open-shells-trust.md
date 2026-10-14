---
"@mzwing/pi-task-governor": minor
---

fix(pi-task-governor): remove regex based path matching disabling commands

The coordinator is the user's own session in the main workspace, so its bash runs `git`, `jj` and `pi` like any other command, and `/governor unlock` there says it has nothing to lift. Other governed sessions still find them blocked by the shims on PATH, but their commands are no longer matched as text against paths to the binaries, `nix run`, and `.git` or `.jj`, which refused harmless commands such as `grep --exclude-dir=.git` and `ls packages/pi`.

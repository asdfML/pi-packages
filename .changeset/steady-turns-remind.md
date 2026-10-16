---
"@mzwing/pi-task-governor": patch
---

fix(pi-task-governor): show the coordinator's handoff reminder when another extension owns compaction

The reminder to run `/governor handoff` counted compactions, which never happen once an extension such as pi-magic-context takes compaction over. It now comes after `roles.coordinator.maxTurns` turns, and the session `/governor handoff` opens learns which session it took over from, to read with `session_read`.

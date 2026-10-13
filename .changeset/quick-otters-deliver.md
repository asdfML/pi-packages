---
"@mzwing/pi-session-hub": patch
"@mzwing/pi-task-governor": patch
---

fix(pi-session-hub, pi-task-governor): show session mail when it arrives, not after the user's next message

Mail that does not wake its recipient, and mail waiting when a session starts, went through Pi's `nextTurn` delivery, which keeps a message out of sight until the user sends one. Such mail is now written to the session at once, or when a busy recipient's turn ends, and its model reads it in its next request. Steered mail that Pi drops when a run is stopped in the TUI is written to the session afterwards, without starting a turn.

pi-task-governor's notices that do not wake the coordinator, and the task board that `/governor handoff` puts in the new session, appear the same way.

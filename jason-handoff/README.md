# jason-handoff

Session handoff skills and hooks for seamless context transfer between Claude Code sessions.

## Overview

Captures active work state and learnings when you pause, so the next session can resume exactly where you left off — without re-explaining anything.

## Skills

### `/handoff-save`

Saves your current session state. Use when running low on context, before clearing a session, or when pausing work.

**What it captures:**
- What you were working on and where you left off
- Immediate next steps
- Failed approaches (so the next session doesn't repeat them)
- Key decisions and important context

**Files written:**
- `HANDOFF_STATE.md` — active task state (replaced each save)
- `MEMORY.md` — persistent learnings (merged, not replaced)

### `/handoff-resume`

Resumes from a previous handoff. Reads the saved state, cross-checks against current git state, and presents a summary before continuing.

**What it does:**
1. Reads HANDOFF_STATE.md and MEMORY.md
2. Verifies current git branch and status
3. Presents a summary of where you left off
4. Waits for confirmation before continuing
5. Deletes the consumed handoff file

## Installation

```
/plugin install jason-handoff@jason-claude-plugins
```

Restart Claude Code after installing.

## Author

Jason Y (https://github.com/JasonY199)

## Version

1.0.1

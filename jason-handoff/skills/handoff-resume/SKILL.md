---
name: handoff-resume
description: Use when starting a new session and continuing from a previous handoff, or when the user says "resume handoff" or "resume work" or "continue where we left off"
---

# Handoff Resume

## Overview

Resume work from a previous session using the saved handoff state and persistent learnings. The goal is to pick up exactly where the last session left off — the user should not need to explain anything.

**Core principle:** Read everything, present a summary, and be ready to continue immediately.

**Announce at start:** "Resuming from previous session."

## The Process

### Step 1: Read Handoff State

Check for the active work state file:

```
~/.claude/projects/{project-path}/memory/HANDOFF_STATE.md
```

This contains:

- What was being worked on
- Where the last session left off
- Immediate next steps
- Open items / reminders (time-sensitive things to address)

If this file doesn't exist, the previous session ended naturally (not mid-task). Skip to Step 2.

**Staleness check:** Parse the `**Saved:**` timestamp at the top of the file. If the handoff is older than 24 hours, flag it as potentially stale in your summary (Step 5) — the project state may have changed since it was saved. Still present the contents, but recommend verifying next steps against current git state and open issues before acting on them.

### Step 2: Read Session State

The session-start hook may have already loaded the latest session file. But check explicitly if needed:

```bash
ls -t ~/.claude/sessions/{projectName}/*.md | head -1
```

Read the latest session file from `~/.claude/sessions/{projectName}/` to get:

- Branch, git status, recent commits, modified files
- When the session was saved and what triggered it

### Step 3: Read Learnings

Read the project's MEMORY.md — the `## Session Learnings` section is critical:

```
~/.claude/projects/{project-path}/memory/MEMORY.md
```

Pay special attention to **Failed Approaches** — these are paths to avoid.

### Step 4: Verify Current State

Cross-check against reality:

```bash
git branch --show-current
git status --short
git log --oneline -5
```

Flag any discrepancies (e.g., branch changed, new commits since the session was saved).

### Step 5: Present Summary

**If HANDOFF_STATE.md exists** (mid-task resume):

```
Resuming from handoff saved [timestamp]:

**What we were doing:** [from handoff state]
**Where we left off:** [from handoff state]

**Next steps:**
1. [from handoff state]
2. [from handoff state]

**Reminders:** [any open items]

**Learnings to keep in mind:**
- [Key failed approaches to avoid]

**Git state:** [branch] — [clean / N uncommitted changes]

Ready to continue. Shall I pick up from step 1?
```

**If no HANDOFF_STATE.md** (fresh resume):

```
Resuming from session saved [timestamp]:

**Branch:** [branch] — [matches/doesn't match current]
**Git state:** [clean / N uncommitted changes]

**Key learnings from previous sessions:**
- [Brief summary of failed approaches to avoid]
- [Key decisions to respect]

Ready to continue. What would you like to work on?
```

### Step 6: Clean Up Handoff File

After presenting the summary, **delete `HANDOFF_STATE.md`**. The handoff has been consumed — its contents are now in the conversation context and should not be re-read by a future session.

```bash
rm ~/.claude/projects/{project-path}/memory/HANDOFF_STATE.md
```

This prevents stale handoffs from lingering across sessions. If the user needs to save state again later, they'll run `/handoff-save` which creates a fresh file.

### Step 7: Wait for Confirmation

Do not start working until the user confirms or provides direction. Their priorities may have changed.

**Exception:** If the handoff state has clear, unambiguous next steps AND the user says something like "continue" or "pick up where we left off", you can proceed directly.

## What NOT To Do

- **Don't look for `.claude/HANDOFF.md`** — that path is deprecated
- **Don't delete session files** — they're managed by hooks (auto-pruned after 7 days). Exception: HANDOFF_STATE.md is deleted after consumption (Step 6).
- **Don't start working without confirming** — always present the summary and wait
- **Don't ignore HANDOFF_STATE.md** — if it exists, it's the primary source of truth for what to do next

## Common Mistakes

**Ignoring failed approaches**

- Read the "Failed Approaches" in Session Learnings carefully and avoid those paths
- This is the highest-value context from previous sessions

**Starting work without confirming**

- User's priorities may have changed since the handoff
- Always present summary and wait for their direction

**Not reading HANDOFF_STATE.md**

- This file contains the specific task state. Without it, you're guessing what the user was working on.
- If it exists, lead with its contents in your summary.

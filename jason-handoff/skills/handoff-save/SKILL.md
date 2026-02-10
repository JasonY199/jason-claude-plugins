---
name: handoff-save
description: Use when running low on context, before clearing a session, when pausing work to continue later, or when the user says "save handoff" or "pause work"
---

# Handoff Save

## Overview

Capture **active work state and learnings** from the current session so the next session can pick up exactly where you left off. Writes to both MEMORY.md (persistent learnings) and a handoff file (current task state).

**Core principle:** The next session should be able to resume without the user explaining anything.

**Announce at start:** "Saving handoff state and session learnings."

## The Process

### Step 1: Identify File Paths

**MEMORY.md** (persistent, survives across many sessions):

```
~/.claude/projects/{project-path}/memory/MEMORY.md
```

**Handoff file** (current work state, replaced each handoff):

```
~/.claude/projects/{project-path}/memory/HANDOFF_STATE.md
```

Where `{project-path}` is the project's absolute path with `/` replaced by `-` (e.g., `-Users-jason-github-gamenights`).

Read both files to understand their current content.

### Step 2: Capture Active Work State

Review the conversation and capture what's **in flight right now**. Write this to `HANDOFF_STATE.md` (overwrite previous content):

```markdown
# Handoff State

**Saved:** [date] [time]

## What We Were Doing

[1-2 sentences: the task or issue being worked on]

## Where We Left Off

[Exactly what was completed and what remains — be specific enough that the next session can continue without asking]

## Immediate Next Steps

1. [The very next action to take]
2. [Then this]
3. [Then this]

## Open Items / Reminders

- [Anything time-sensitive or easy to forget, e.g., "re-enable Vercel deployment protection"]
```

**Be specific.** "Working on issue #19" is not enough. "Switched WAF path traversal rule to Deny, need to verify and close issue #19" tells the next session exactly what to do.

### Step 3: Gather Learnings

Review the conversation and extract:

- **Failed Approaches** — what was tried and didn't work, and WHY
- **Key Decisions** — important choices made and their rationale
- **Important Context** — non-obvious gotchas, environment quirks, dependencies

This is the **highest value** content — it prevents future sessions from repeating mistakes.

### Step 4: Update MEMORY.md

Merge new learnings into the `## Session Learnings` section in MEMORY.md. If a Session Learnings section already exists, merge new learnings with existing ones (don't duplicate). Prune stale entries that are no longer relevant.

**Format:**

```markdown
## Session Learnings

### Failed Approaches

- [What was tried and didn't work, and WHY it failed]
- [Alternatives considered and rejected, with reasoning]

### Key Decisions

- [Important choices and their rationale]
- [Architecture or design decisions future sessions should respect]

### Important Context

- [Non-obvious gotchas or environment quirks]
- [Dependencies or constraints discovered]
```

**Keep it concise.** If any section exceeds 5 bullets, you're over-explaining. Distill, don't dump.

### Step 5: Confirm

After writing both files, report:

```
Handoff saved:
- HANDOFF_STATE.md — active work state and next steps
- MEMORY.md — session learnings merged

To continue: start a fresh session and say "resume handoff".
```

## What NOT To Do

- **Don't write `.claude/HANDOFF.md`** — that path is deprecated
- **Don't duplicate git state** — hooks capture branch, status, commits, and modified files automatically
- **Don't dump the whole conversation** — distill to actionable insights only

## Common Mistakes

**Vague handoff state**

- "Working on security stuff" is useless. "Closed issues #18 and #19, issue #17 (Sentry) is next, Vercel deployment protection is currently DISABLED and needs re-enabling" is what the next session needs.
- Test: could a stranger read HANDOFF_STATE.md and know exactly what to do next? If not, add more detail.

**Omitting failed approaches**

- This is the #1 reason handoffs fail. The next session WILL try the same dead ends.
- Review the entire conversation for: rejected alternatives, things that errored, approaches discussed and ruled out.
- Rule: "Nothing failed" is almost never true. Even a setup session has rejected alternatives.

**Over-writing memory**

- MEMORY.md is loaded into every session's system prompt. Keep it under 200 lines total.
- If it's getting long, prune older learnings that are no longer relevant.
- HANDOFF_STATE.md has no size concern — it's replaced each time.

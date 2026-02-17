---
name: recall
description: Use when the user wants to search or recall memories, check what was decided, look up past patterns, or retrieve stored knowledge. Triggers on "recall", "what did we decide", "check memory", "search memory".
---

# Recall — Search Local Memory

Search project memories using the memory-researcher agent, which runs in its own context window to protect the parent session.

## Process

1. **Determine the query** — what is the user looking for? Extract the core topic.

2. **For simple stats** (e.g., "how many memories do we have?"), run directly via Bash:
   ```
   node "<cli-path>" stats
   ```

3. **For all other searches**, use the `memory-researcher` agent via the Task tool:
   ```
   Task tool → subagent_type: "jason-memory:memory-researcher"
   ```
   In the prompt, tell the agent:
   - The CLI path (from session context: look for `Store:` or `Search:` lines)
   - The search query / topic
   - Whether this is a quick lookup, feature context, or planning context (affects response size)

   Example prompt:
   > Search project memories for decisions and patterns related to "authentication flow".
   > CLI path: node "/path/to/memory-cli.js"
   > This is a quick lookup — keep the summary concise (20-50 lines).

4. **Return the agent's summary** to the user. The agent handles all the heavy searching in its own context window — only the concise result enters the parent conversation.

## Notes

- Search defaults to **active memories only**. Use `--all` flag to include superseded/archived.
- Use `stale --days 30` to find memories that haven't been accessed recently.
- Use `digest --limit 15` for a quick grouped overview of the most important active memories.

## Why an Agent?

Memory stores can grow large. Searching through hundreds of memories, scoring results, and reading related docs would pollute the parent context window with raw data. The agent does all of this in isolation and returns only the distilled summary.

## Examples

**Quick lookup:**
> User: "What did we decide about the database?"
> → Agent searches for "database" → returns key decisions

**Feature context:**
> User: "Recall everything about the auth system before I refactor it"
> → Agent does broad search → returns decisions, patterns, gotchas (~50-150 lines)

**Stats check:**
> User: "How many memories do we have?"
> → Run `stats` directly, no agent needed

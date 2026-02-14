---
name: store
description: Use when the user wants to remember something, store a decision, save a note, or persist any information to mem0. Works in any project — auto-detects dev-workflow config or uses a general bucket.
---

# Store to mem0

Store whatever the user wants to remember using the mem0 MCP tools.

## Process

1. **Detect context:** Check if `.dev-workflow.json` exists in the project root.
   - If yes: use the `app_id` from the config (e.g., "mainspring")
   - If no: use `app_id: "general"` as a catch-all bucket

2. **Understand what to store:** The user may have just described a decision, a pattern, a preference, or anything else. Summarize it clearly and concisely as a single statement of fact.

3. **Store the memory:** Use the mem0 MCP tool `add_memory` with:
   - `text`: the clear, concise statement
   - `app_id`: detected from config or "general"
   - Do NOT include `user_id` — the MCP server sets this automatically from `MEM0_DEFAULT_USER_ID`

4. **Confirm:** Tell the user what was stored and which `app_id` was used.

## Examples

**In a dev-workflow project:**
> User: "Remember that we decided to use Drizzle instead of Prisma"
> → Store: "Decided to use Drizzle ORM instead of Prisma for database access" with app_id from config

**Outside any project:**
> User: "Store that I prefer Inter font for all projects"
> → Store: "Prefers Inter font for all projects" with app_id: "general"

**After brainstorming:**
> User: "Store the key decisions from this brainstorming session"
> → Summarize each decision as a separate memory, store all with appropriate app_id

## Important

- One clear statement per memory — don't dump paragraphs
- If there are multiple things to store, create separate memories for each
- Use present tense for decisions ("Uses Drizzle" not "Decided to use Drizzle")
- If the user says "remember" or "store" or "save this", this skill applies

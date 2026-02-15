---
name: dev-help
description: Use when the user asks about the dev-workflow plugin, what commands are available, how hooks work, or wants a reference card for their development workflow tools
---

# Dev Workflow — Help

Show the user a reference card for the jason-dev-workflow plugin. Read the `.dev-workflow.json` config file from the project root to show current project configuration.

## Output Format

Present this information:

### What's Automatic (hooks — no action needed)

| Hook | When | What It Does |
|------|------|-------------|
| Session Start | Every session open | Loads Plane sprint status + mem0 decisions, injects context summary |
| Session End | Every session close | Logs session activity (branch, commits, files) to mem0 |
| Before Compaction | Context compression | Reminds to capture undocumented decisions to mem0 |

### Available Skills

| Skill | Works Where | What It Does |
|-------|------------|-------------|
| `/dev-help` | Everywhere | This reference card |
| `/store` | Everywhere | Store anything to mem0 (auto-detects project or uses "general" bucket) |
| `/spec-publish` | Dev-workflow projects | Publish design doc to Plane Wiki + create work items + store decisions |
| `/sprint-plan` | Dev-workflow projects | Plan a sprint from Plane backlog |

### Agents

| Agent | What It Does |
|-------|-------------|
| `context-researcher` | Fetches architecture context from Plane pages, mem0, and work items. Runs in its own context window and returns a focused summary. Use when starting work on a feature or needing to reference architecture decisions. |

To invoke: "Use the context-researcher agent to get context on [topic]" or Claude will use it automatically when starting feature work.

### Current Project Config

Read `.dev-workflow.json` from the project root. If it exists, show:
- Plane workspace and project ID
- mem0 app_id

If it doesn't exist, show: "Not configured for this project — hooks are inactive, /store uses app_id 'general'. Drop a .dev-workflow.json in the project root to activate. See the plugin SETUP.md for details."

### Plane Page Index

The Plane API does not support listing pages — only creating and retrieving by ID. This means CLAUDE.md must maintain a page index so the context-researcher agent (and Claude) can discover and fetch Plane wiki pages.

**Keeping the index in sync:**
- When a new Plane page is created (via UI or `/spec-publish`), add its ID and title to the `## Architecture Docs (Plane Pages)` section in CLAUDE.md
- When a page is deleted or renamed in Plane, update the index
- Page IDs are visible in the Plane URL bar when viewing a page: `plane.so/.../pages/{page-id}`

If the page index is missing or stale, the context-researcher agent won't be able to find architecture docs. **This is the single most important maintenance task for the knowledge system.**

### Environment Variables

Check if these are set (don't show the values, just whether they exist):
- `PLANE_API_TOKEN` — needed for Plane integration
- `MEM0_API_KEY` — needed for mem0 integration
- `MEM0_DEFAULT_USER_ID` — defaults to "jason" if not set

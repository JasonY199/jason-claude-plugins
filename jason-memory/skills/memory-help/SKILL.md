---
name: memory-help
description: Use when the user asks about the memory plugin, what memory commands are available, how memory hooks work, or wants a reference card for the local memory system
---

# Memory Help — Reference Card

Show the user a reference card for the jason-memory plugin. Run `node "<cli-path>" stats` to show current memory counts. The CLI path is in session context as `Memory CLI: node "..."`.

## Output Format

Present this information:

### What's Automatic (no action needed)

| Feature | How It Works |
|---------|-------------|
| **Auto-store** | Memories are captured silently as decisions, patterns, errors, and learnings emerge during work |
| **Auto-recall** | Memories are searched silently when switching topics or starting work on a new area |
| **Dedup** | Before storing, `find-similar` checks for existing memories — updates instead of duplicating |
| **Pre-compaction** | Before context compression, undocumented knowledge is captured to memory |

### Explicit Skills (override or force)

| Skill | What It Does |
|-------|-------------|
| `/remember` | Force-store a specific memory (bypasses auto-store timing) |
| `/recall` | Force-search memories (bypasses auto-recall timing) |
| `/memory-help` | This reference card |

### Agent

| Agent | What It Does |
|-------|-------------|
| `memory-researcher` | Searches memories + local docs in its own context window. Returns focused summaries. Used by both auto-recall and /recall. |

### Memory Types

| Type | Use For |
|------|---------|
| `decision` | Architectural or design choices |
| `learning` | Things learned during development |
| `error` | Error resolutions and debugging insights |
| `pattern` | Conventions and patterns to follow |
| `observation` | General notes and preferences |

### Tag Conventions

Tags are lowercase, hyphen-separated, 1-3 per memory. Examples: `auth`, `api`, `database`, `ui`, `build`, `testing`, `performance`.

### How Storage Works

- Memories stored in `.memory/memories.json` at the project root
- Committed to git by default — memories travel with the code
- Add `.memory/` to `.gitignore` if you prefer personal-only memories
- BM25-ranked search — results sorted by relevance, not just keyword match

### Dedup Workflow

Before storing any memory, the system runs:
```
node "<cli-path>" find-similar --content "proposed text" --threshold 0.5
```
- **Match found, new info supersedes**: updates the existing memory via `update --id <id> --content "..."`
- **Match found, same info**: skips storing
- **No match**: stores as new

### Current Stats

Run the stats command and display the output — total memories, breakdown by type, top tags.

### CLI Commands (for direct use)

```
node "<cli-path>" store --content "..." --type decision --tags "tag1,tag2"
node "<cli-path>" search --query "auth flow" --limit 10
node "<cli-path>" find-similar --content "proposed text" --threshold 0.5 --limit 3
node "<cli-path>" update --id <memory-id> --content "updated text" [--type type] [--tags "t1,t2"]
node "<cli-path>" list --type decision --tag auth --limit 20
node "<cli-path>" recent --limit 5
node "<cli-path>" get --id <memory-id>
node "<cli-path>" delete --id <memory-id>
node "<cli-path>" relate --from <id> --to <id> --type supports
node "<cli-path>" stats
```

### Coexistence with Other Plugins

- **jason-handoff**: Handles session continuity (git state, branch, context). Memory handles long-term knowledge.
- **jason-dev-workflow**: Uses mem0 (cloud) for memory. jason-memory is local-only, zero dependencies. Both can coexist — use whichever fits the project.

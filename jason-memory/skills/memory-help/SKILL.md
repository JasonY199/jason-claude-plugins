---
name: memory-help
description: Use when the user asks about the memory plugin, what memory commands are available, how memory hooks work, or wants a reference card for the local memory system
---

# Memory Help — Reference Card

Show the user a reference card for the jason-memory plugin. Run `node "<cli-path>" stats` to show current memory counts. The CLI path is in session context — look for `Store:` or `Search:` lines.

## Output Format

Present this information:

### How It Works

| Feature | How It Works |
|---------|-------------|
| **Session start** | Shows a digest of top memories + CLI commands |
| **Pre-compaction** | Reminds to capture knowledge before context compression |
| **Auto-dedup** | `store` checks for similar memories automatically — supersedes or skips |
| **Versioning** | Memories have statuses: active, superseded, archived |

### Explicit Skills

| Skill | What It Does |
|-------|-------------|
| `/remember` | Force-store a specific memory |
| `/recall` | Force-search memories for a topic |
| `/memory-help` | This reference card |

### Agent

| Agent | What It Does |
|-------|-------------|
| `memory-researcher` | Searches memories + local docs in its own context window. Returns focused summaries. |

### Memory Types

| Type | Use For |
|------|---------|
| `decision` | Architectural or design choices |
| `learning` | Things learned during development |
| `error` | Error resolutions and debugging insights |
| `pattern` | Conventions and patterns to follow |
| `observation` | General notes and preferences |

### Memory Statuses

| Status | Meaning |
|--------|---------|
| `active` | Current, returned by default in search/list |
| `superseded` | Replaced by a newer memory (tracked via `superseded_by`) |
| `archived` | Soft-deleted, hidden from search unless `--all` |

### Tag Conventions

Tags are lowercase, hyphen-separated, 1-3 per memory. Examples: `auth`, `api`, `database`, `ui`, `build`, `testing`, `performance`.

### How Storage Works

- Memories stored in `.memory/memories.json` at the project root
- Committed to git by default — memories travel with the code
- Add `.memory/` to `.gitignore` if you prefer personal-only memories
- BM25-ranked search with Porter stemming, bigrams, synonym expansion, and corpus-adaptive co-occurrence
- Auto-dedup on store — no need for manual find-similar

### CLI Commands

```
node "<cli-path>" store --content "..." --type decision --tags "t1,t2" [--no-dedup]
node "<cli-path>" search --query "auth flow" --limit 10 [--all]
node "<cli-path>" digest --limit 15
node "<cli-path>" stale --days 120
node "<cli-path>" archive --id <memory-id>
node "<cli-path>" find-similar --content "proposed text" --threshold 0.5 --limit 3
node "<cli-path>" update --id <memory-id> [--content "updated text"] [--type type] [--tags "t1,t2"]
node "<cli-path>" list --type decision --tag auth --limit 20 [--all]
node "<cli-path>" recent --limit 5 [--all]
node "<cli-path>" get --id <memory-id>
node "<cli-path>" delete --id <memory-id>
node "<cli-path>" relate --from <id> --to <id> --type supports
node "<cli-path>" unrelate --from <id> --to <id>
node "<cli-path>" restore --id <memory-id>
node "<cli-path>" stats
```

### Store Response Actions

| Action | Meaning |
|--------|---------|
| `created` | New memory stored |
| `superseded` | Replaced an older similar memory |
| `skipped` | Near-duplicate already exists |

### Coexistence with Other Plugins

- **jason-handoff**: Handles session continuity (git state, branch, context). Memory handles long-term knowledge.

### Access Tracking

Only meaningful access (search, get, find-similar) updates `last_accessed`. Incidental access (list, recent, digest) does not — so `stale` reflects genuine disuse.

### Current Stats

Run the stats command and display the output — total memories, breakdown by type/status, top tags.

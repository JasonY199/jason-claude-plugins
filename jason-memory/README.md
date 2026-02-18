# jason-memory — Setup

Self-contained local memory for Claude Code. Zero external dependencies. Install and forget — memories are captured and recalled automatically.

## Prerequisites

- Claude Code (that's it — no APIs, no services, no config files)

## Install

```
/plugin install jason-memory@jason-claude-plugins
```

Restart Claude Code after installing.

## How It Works

- Memories are stored in `.memory/memories.json` at your project root
- The file is created automatically on first use — no setup needed
- Works in any git repo (or any directory)
- Search uses BM25 ranking with Porter stemming, bigram phrase matching, synonym expansion, and corpus-adaptive co-occurrence
- Built-in auto-dedup: `store` checks for similar memories and supersedes or skips automatically
- Memory versioning: active, superseded, and archived statuses track knowledge evolution

## What Gets Captured

The plugin provides commands for storing:
- Architectural or design decisions and their reasoning
- Patterns, conventions, or rules established during development
- Non-obvious gotchas, workarounds, or things that broke unexpectedly
- Error resolutions that took significant debugging
- User preferences or workflow choices

## Commands

- `/remember` — store a specific memory (auto-dedup handles duplicates)
- `/recall` — search memories for a topic
- `/memory-help` — full reference card with all CLI commands

## Auto-Dedup

When you store a memory, the CLI automatically checks for similar existing ones:

| Similarity | Action | Response |
|-----------|--------|----------|
| >= 0.9 | Skip (near-duplicate) | `{action: "skipped", existing_id: "..."}` |
| threshold - 0.9 | Supersede old, store new | `{action: "superseded", replaced_id: "..."}` |
| < threshold | Store as new | `{action: "created", stored: {...}}` |

The supersede threshold adapts to memory length: 0.8 for short memories (< 8 unique tokens) and 0.6 for longer ones, preventing spurious matches on short text.

Use `--no-dedup` to bypass this check.

## Memory Statuses

| Status | Meaning |
|--------|---------|
| `active` | Current memory, shown in search/list by default |
| `superseded` | Replaced by a newer memory |
| `archived` | Soft-deleted via `archive` command |

Use `--all` flag on search/list/recent to include non-active memories.

## Git Integration

By default, `.memory/memories.json` is committed to git. This means:

- Memories travel with the code
- Team members can see project decisions
- Acts as a living knowledge base

To keep memories private, add to `.gitignore`:

```
.memory/
```

## Memory Types

| Type | Use For |
|------|---------|
| `decision` | Architectural or design choices |
| `learning` | Things learned during development |
| `error` | Error resolutions and debugging insights |
| `pattern` | Conventions and patterns to follow |
| `observation` | General notes and preferences |

## New in v4.0.0

- `restore` command — undo archive, set memory back to active
- `unrelate` command — remove relations between memories
- `update` no longer requires `--content` — can update just `--tags` or `--type`
- `update` response now shows both previous and current values (content, type, tags)
- Adaptive dedup threshold — 0.8 for short memories (< 8 tokens), 0.6 for longer ones
- Smarter `last_accessed` — only meaningful access (search, get, find-similar) updates it, not incidental (list, recent, digest)

## Coexistence with Other Plugins

- **jason-handoff**: Handles session continuity. Memory handles long-term knowledge. Complementary.

## Troubleshooting

**Memories not loading on session start?**
- Check that the plugin is installed: look for jason-memory in your plugins list
- Restart Claude Code after installing

**Search returning no results?**
- Check that memories exist: run `/memory-help` to see stats
- Try broader search terms — BM25 works on stemmed word overlap with synonym and co-occurrence expansion

**`.memory/` directory not created?**
- It's created on first memory store — use `/remember` to create your first memory

**Want to clean up old memories?**
- Use `stale --days 30` to find memories that haven't been accessed
- Use `archive --id <id>` to soft-delete without losing history

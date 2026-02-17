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

- **Automatic**: Memories are stored and recalled silently during normal work — no commands needed
- Memories are stored in `.memory/memories.json` at your project root
- The file is created automatically on first use — no setup needed
- Works in any git repo (or any directory)
- Search uses BM25 ranking — results sorted by relevance, not just keyword match
- Built-in dedup: before storing, the system checks for similar existing memories and updates instead of duplicating

## What Gets Captured

The plugin automatically stores:
- Architectural or design decisions and their reasoning
- Patterns, conventions, or rules established during development
- Non-obvious gotchas, workarounds, or things that broke unexpectedly
- Error resolutions that took significant debugging
- User preferences or workflow choices

It does NOT store trivial details, git state, or things already in CLAUDE.md.

## Explicit Commands

Auto-memory handles most cases, but you can override:

- `/remember` — force-store a specific memory
- `/recall` — force-search memories for a topic
- `/memory-help` — full reference card

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

## Coexistence with Other Plugins

- **jason-handoff**: Handles session continuity. Memory handles long-term knowledge. Complementary.
- **jason-dev-workflow**: Uses mem0 (cloud) for memory. jason-memory is local-only. Both can coexist.

## Troubleshooting

**Memories not loading on session start?**
- Check that the plugin is installed: look for jason-memory in your plugins list
- Restart Claude Code after installing

**Search returning no results?**
- Check that memories exist: run `/memory-help` to see stats
- Try broader search terms — BM25 works on word overlap

**`.memory/` directory not created?**
- It's created on first memory store — work on something and the auto-store will create it

**Too many memories being stored?**
- The quality guard limits to ~5 high-quality memories per session
- If the store is noisy, the dedup workflow will consolidate over time

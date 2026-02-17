# jason-memory — Setup

Self-contained local memory for Claude Code. Zero external dependencies.

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
- Search uses BM25 ranking — results sorted by relevance, not just keyword match

## Usage

### Store a memory

Use `/remember` or tell Claude to remember something:

> "Remember that we decided to use Tailwind instead of styled-components"

Claude will classify the memory (decision, learning, error, pattern, observation), add tags, and store it.

### Search memories

Use `/recall` or ask about past decisions:

> "What did we decide about the authentication flow?"

Searches run via the memory-researcher agent in its own context window — no context pollution.

### Reference card

Use `/memory-help` for a full reference of commands, types, and conventions.

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
- It's created on first `/remember` — store a memory first

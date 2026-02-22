# opsx — OpenSpec Skills Plugin

Claude Code skills for [OpenSpec](https://github.com/Fission-AI/OpenSpec) spec-driven development.

## Prerequisites

Install the OpenSpec CLI globally:

```bash
npm install -g @fission-ai/openspec@latest
```

Initialize OpenSpec in your project:

```bash
openspec init
```

## Skills

| Command | Description |
|---------|-------------|
| `/opsx:explore` | Think through problems before/during work |
| `/opsx:new` | Start a new change, step through artifacts |
| `/opsx:ff` | Fast-forward: create all artifacts at once |
| `/opsx:continue` | Continue working on an existing change |
| `/opsx:apply` | Implement tasks from a change |
| `/opsx:verify` | Verify implementation matches artifacts |
| `/opsx:sync` | Sync delta specs to main specs |
| `/opsx:archive` | Archive a completed change |
| `/opsx:bulk-archive` | Archive multiple changes at once |
| `/opsx:onboard` | Guided tutorial through the full workflow |

## Updating

Skills are adapted from the official OpenSpec CLI. When the CLI updates:

1. `npm update -g @fission-ai/openspec`
2. Run `openspec init` in a temp directory to get updated skill content
3. Diff against this plugin's skills and update as needed
4. Bump version in `plugin.json` and `marketplace.json`
5. Push and run `/plugin marketplace update jason-claude-plugins`

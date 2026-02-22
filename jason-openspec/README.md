# jason-openspec — OpenSpec Skills Plugin

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
| `/jason-openspec:openspec-explore` | Think through problems before/during work |
| `/jason-openspec:openspec-new` | Start a new change, step through artifacts |
| `/jason-openspec:openspec-ff` | Fast-forward: create all artifacts at once |
| `/jason-openspec:openspec-continue` | Continue working on an existing change |
| `/jason-openspec:openspec-apply` | Implement tasks from a change |
| `/jason-openspec:openspec-verify` | Verify implementation matches artifacts |
| `/jason-openspec:openspec-sync` | Sync delta specs to main specs |
| `/jason-openspec:openspec-archive` | Archive a completed change |
| `/jason-openspec:openspec-bulk-archive` | Archive multiple changes at once |
| `/jason-openspec:openspec-onboard` | Guided tutorial through the full workflow |

## Updating

Skills are adapted from the official OpenSpec CLI. When the CLI updates:

1. `npm update -g @fission-ai/openspec`
2. Run `openspec init` in a temp directory to get updated skill content
3. Diff against this plugin's skills and update as needed
4. Bump version in `jason-openspec/.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json`
5. Push and run `/plugin marketplace update jason-claude-plugins`

# openspec — OpenSpec Skills Plugin

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
| `/openspec-explore` | Think through problems before/during work |
| `/openspec-new` | Start a new change, step through artifacts |
| `/openspec-ff` | Fast-forward: create all artifacts at once |
| `/openspec-continue` | Continue working on an existing change |
| `/openspec-apply` | Implement tasks from a change |
| `/openspec-verify` | Verify implementation matches artifacts |
| `/openspec-sync` | Sync delta specs to main specs |
| `/openspec-archive` | Archive a completed change |
| `/openspec-bulk-archive` | Archive multiple changes at once |
| `/openspec-onboard` | Guided tutorial through the full workflow |

## Updating

Skills are adapted from the official OpenSpec CLI. When the CLI updates:

1. `npm update -g @fission-ai/openspec`
2. Run `openspec init` in a temp directory to get updated skill content
3. Diff against this plugin's skills and update as needed
4. Bump version in `plugin.json` and `marketplace.json`
5. Push and run `/plugin marketplace update jason-claude-plugins`

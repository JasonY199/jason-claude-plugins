---
name: openspec-setup
description: Install, update, or troubleshoot OpenSpec. Use when the user says "install openspec", "set up openspec", "update openspec", "openspec help", "how do I use openspec", or encounters "openspec command not found".
---

# OpenSpec Setup & Help

## Fresh Install (New Computer)

### 1. Install the OpenSpec CLI

```bash
npm install -g @fission-ai/openspec@latest
```

Verify it works:
```bash
openspec --version
```

Should show `1.1.1` or later.

### 2. Install the jason-openspec Claude Code plugin

In Claude Code:
```
/plugin marketplace add JasonY199/jason-claude-plugins
/plugin install jason-openspec@jason-claude-plugins
```

### 3. Initialize OpenSpec in your project

```bash
cd your-project
openspec init
```

This creates the `openspec/` directory structure in your project.

### 4. Verify

Run `/jason-openspec:openspec-onboard` for a guided walkthrough, or `/jason-openspec:openspec-new` to start your first change.

---

## Updating

### Update the CLI

```bash
npm update -g @fission-ai/openspec
openspec --version
```

### Update the plugin skills (after CLI update)

If the OpenSpec CLI ships updated skill content:

1. Create a temp directory and init:
   ```bash
   mkdir /tmp/openspec-check && cd /tmp/openspec-check
   openspec init
   ```

2. Compare the generated skills against the plugin:
   ```bash
   diff -r /tmp/openspec-check/.claude/skills/ ~/github/jason-claude-plugins/jason-openspec/skills/
   ```

3. If differences exist, update the plugin skills in `~/github/jason-claude-plugins/jason-openspec/skills/`

4. Bump version in both files:
   - `jason-openspec/.claude-plugin/plugin.json` — `"version": "X.Y.Z"`
   - `.claude-plugin/marketplace.json` — matching version for the jason-openspec entry

5. Commit, push, and update the cache:
   ```bash
   cd ~/github/jason-claude-plugins
   git add -A && git commit -m "feat: update jason-openspec skills to vX.Y.Z" && git push
   ```

6. In Claude Code:
   ```
   /plugin marketplace update jason-claude-plugins
   ```

7. Clean up:
   ```bash
   rm -rf /tmp/openspec-check
   ```

---

## Command Reference

| Command | What it does |
|---------|--------------|
| `/jason-openspec:openspec-explore` | Think through problems before/during work (no code changes) |
| `/jason-openspec:openspec-new <name>` | Start a new change, step through artifacts one at a time |
| `/jason-openspec:openspec-ff <name>` | Fast-forward: create all artifacts at once |
| `/jason-openspec:openspec-continue <name>` | Continue an existing change (next artifact) |
| `/jason-openspec:openspec-apply <name>` | Implement tasks from a change |
| `/jason-openspec:openspec-verify <name>` | Verify implementation matches artifacts |
| `/jason-openspec:openspec-sync <name>` | Sync delta specs to main specs |
| `/jason-openspec:openspec-archive <name>` | Archive a completed change |
| `/jason-openspec:openspec-bulk-archive` | Archive multiple changes at once |
| `/jason-openspec:openspec-onboard` | Guided tutorial through the full workflow |
| `/jason-openspec:openspec-setup` | This help page |

## Typical Workflow

```
/jason-openspec:openspec-explore          → Think through the problem
/jason-openspec:openspec-ff my-feature    → Create all artifacts (proposal → specs → design → tasks)
/jason-openspec:openspec-apply            → Implement the tasks
/jason-openspec:openspec-verify           → Check implementation matches specs
/jason-openspec:openspec-archive          → Archive when done
```

Or step-by-step:
```
/jason-openspec:openspec-new my-feature   → Create change, see first artifact template
/jason-openspec:openspec-continue         → Create next artifact (repeat until all done)
/jason-openspec:openspec-apply            → Implement
/jason-openspec:openspec-archive          → Done
```

---

## Troubleshooting

**"openspec: command not found"**
- Install: `npm install -g @fission-ai/openspec@latest`
- If using nvm, make sure you're on the right Node version

**Skills not showing up after install**
- Run `/plugin marketplace update jason-claude-plugins`
- Restart Claude Code (exit and reopen)

**"openspec init" fails**
- Make sure you're in a git repository
- Check Node.js version >= 18

**Plugin version mismatch**
- Version in `plugin.json` must match version in `marketplace.json`
- After updating, always bump both files together

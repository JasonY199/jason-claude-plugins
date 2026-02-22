---
name: setup
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

### 2. Install the opsx Claude Code plugin

In Claude Code:
```
/plugin marketplace add JasonY199/jason-claude-plugins
/plugin install opsx@jason-claude-plugins
```

### 3. Initialize OpenSpec in your project

```bash
cd your-project
openspec init
```

This creates the `openspec/` directory structure in your project.

### 4. Verify

Run `/opsx:onboard` for a guided walkthrough, or `/opsx:new` to start your first change.

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
   mkdir /tmp/opsx-check && cd /tmp/opsx-check
   openspec init
   ```

2. Compare the generated skills against the plugin:
   ```bash
   diff -r /tmp/opsx-check/.claude/skills/ ~/github/jason-claude-plugins/opsx/skills/
   ```

3. If differences exist, update the plugin skills in `~/github/jason-claude-plugins/opsx/skills/`

4. Bump version in both files:
   - `opsx/.claude-plugin/plugin.json` — `"version": "X.Y.Z"`
   - `.claude-plugin/marketplace.json` — matching version for the opsx entry

5. Commit, push, and update the cache:
   ```bash
   cd ~/github/jason-claude-plugins
   git add -A && git commit -m "feat: update opsx skills to vX.Y.Z" && git push
   ```

6. In Claude Code:
   ```
   /plugin marketplace update jason-claude-plugins
   ```

7. Clean up:
   ```bash
   rm -rf /tmp/opsx-check
   ```

---

## Command Reference

| Command | What it does |
|---------|--------------|
| `/opsx:explore` | Think through problems before/during work (no code changes) |
| `/opsx:new <name>` | Start a new change, step through artifacts one at a time |
| `/opsx:ff <name>` | Fast-forward: create all artifacts at once |
| `/opsx:continue <name>` | Continue an existing change (next artifact) |
| `/opsx:apply <name>` | Implement tasks from a change |
| `/opsx:verify <name>` | Verify implementation matches artifacts |
| `/opsx:sync <name>` | Sync delta specs to main specs |
| `/opsx:archive <name>` | Archive a completed change |
| `/opsx:bulk-archive` | Archive multiple changes at once |
| `/opsx:onboard` | Guided tutorial through the full workflow |
| `/opsx:setup` | This help page |

## Typical Workflow

```
/opsx:explore          → Think through the problem
/opsx:ff my-feature    → Create all artifacts (proposal → specs → design → tasks)
/opsx:apply            → Implement the tasks
/opsx:verify           → Check implementation matches specs
/opsx:archive          → Archive when done
```

Or step-by-step:
```
/opsx:new my-feature   → Create change, see first artifact template
/opsx:continue         → Create next artifact (repeat until all done)
/opsx:apply            → Implement
/opsx:archive          → Done
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

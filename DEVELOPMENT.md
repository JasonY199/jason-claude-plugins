# Development Guide

Reference for creating, updating, and debugging plugins in this marketplace.

## Marketplace Structure

```
jason-claude-plugins/
├── .claude-plugin/
│   └── marketplace.json          # lists ALL plugins with versions
├── {plugin-name}/
│   ├── .claude-plugin/
│   │   └── plugin.json           # plugin metadata
│   ├── skills/
│   │   └── {skill-name}/
│   │       └── SKILL.md          # skill definition (YAML frontmatter + markdown)
│   └── hooks/                    # optional
│       ├── hooks.json            # hook event definitions
│       └── scripts/              # hook scripts
├── README.md
├── DEVELOPMENT.md                # this file
└── LICENSE
```

## Adding a New Plugin

### 1. Create the plugin directory

```
jason-claude-plugins/
└── my-new-plugin/
    ├── .claude-plugin/
    │   └── plugin.json
    └── skills/
        └── my-skill/
            └── SKILL.md
```

### 2. Write plugin.json

```json
{
  "name": "my-new-plugin",
  "version": "1.0.0",
  "description": "What this plugin does",
  "author": {
    "name": "Jason Y",
    "url": "https://github.com/JasonY199"
  },
  "repository": "https://github.com/JasonY199/jason-claude-plugins",
  "license": "MIT",
  "keywords": ["relevant", "tags"],
  "skills": ["./skills/my-skill"]
}
```

### 3. Write SKILL.md

```markdown
---
name: my-skill
description: When Claude should use this skill (triggers automatic invocation)
---

# Skill Title

Instructions for Claude when this skill is invoked.
```

### 4. Register in marketplace.json

Add an entry to `.claude-plugin/marketplace.json`:

```json
{
  "name": "my-new-plugin",
  "description": "Same description as plugin.json",
  "version": "1.0.0",
  "source": "./my-new-plugin",
  "author": { "name": "Jason Y" }
}
```

### 5. Commit, push, and install

```bash
git add -A && git commit -m "feat: add my-new-plugin" && git push
```

Then in Claude Code: update the marketplace (see below), then `/plugin install my-new-plugin@jason-claude-plugins`.

## Adding Hooks to a Plugin

### Auto-discovery rule

**`hooks/hooks.json` is loaded automatically.** Do NOT reference it in plugin.json — this causes a "Duplicate hooks file detected" error.

```json
// plugin.json — CORRECT
{
  "name": "my-plugin",
  "skills": ["./skills/my-skill"]
  // NO "hooks" field — hooks/hooks.json is auto-discovered
}

// plugin.json — WRONG (causes duplicate error)
{
  "name": "my-plugin",
  "skills": ["./skills/my-skill"],
  "hooks": "./hooks/hooks.json"    // ← DO NOT DO THIS
}
```

The `"hooks"` field in plugin.json is only for referencing ADDITIONAL hook files beyond the standard `hooks/hooks.json`.

### hooks.json format

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup|resume",
        "hooks": [
          {
            "type": "command",
            "command": "node \"${CLAUDE_PLUGIN_ROOT}/hooks/scripts/my-script.js\""
          }
        ]
      }
    ]
  }
}
```

### Available hook events

| Event        | Matchers                         | Description                |
| ------------ | -------------------------------- | -------------------------- |
| SessionStart | startup, resume, clear, compact  | Session begins             |
| SessionEnd   | (none)                           | Session ends               |
| PreCompact   | manual, auto                     | Before context compaction  |
| PreToolUse   | tool names (e.g., "Bash")        | Before tool execution      |
| PostToolUse  | tool names (e.g., "Write\|Edit") | After tool execution       |
| Stop         | (none)                           | Claude finishes responding |
| SubagentStop | (none)                           | Subagent finishes          |

### ${CLAUDE_PLUGIN_ROOT}

Use this variable in hook commands for portable paths. It resolves to the plugin's install directory (e.g., `~/.claude/plugins/cache/jason-claude-plugins/my-plugin/1.0.0/`).

Scripts using `require("./relative-path")` resolve from `__dirname`, which works correctly from any install location.

## Updating a Plugin

### Version bumping is required

Claude Code caches plugins by version. If you change plugin content without bumping the version, users won't get the update even after reinstalling.

**Always:**

1. Bump `version` in the plugin's `.claude-plugin/plugin.json`
2. Bump `version` in `.claude-plugin/marketplace.json` for the same plugin
3. Commit and push

### How caching works

Claude Code maintains TWO separate caches:

| Cache                | Location                                                    | Contains                          |
| -------------------- | ----------------------------------------------------------- | --------------------------------- |
| Marketplace manifest | `~/.claude/plugins/marketplaces/{name}/`                    | Git clone of the marketplace repo |
| Plugin install       | `~/.claude/plugins/cache/{marketplace}/{plugin}/{version}/` | Extracted plugin files            |

**Marketplace manifest** is a git clone — it can be updated with `git pull` or by using "Update" in the Marketplaces tab.

**Plugin install cache** is keyed by version string. A new version creates a new directory; the old version directory may linger.

### Forcing a cache refresh

If updates aren't showing:

1. **Marketplace manifest stale** — the Discover tab shows old versions:

   ```bash
   cd ~/.claude/plugins/marketplaces/jason-claude-plugins && git pull
   ```

   Or: `/plugin` > Marketplaces tab > select marketplace > Update

2. **Plugin cache stale** — installed plugin has old code:

   ```bash
   rm -rf ~/.claude/plugins/cache/jason-claude-plugins/{plugin-name}/
   ```

   Then reinstall the plugin.

3. **Nuclear option** — clear everything for this marketplace:
   ```bash
   rm -rf ~/.claude/plugins/cache/jason-claude-plugins
   rm -rf ~/.claude/plugins/marketplaces/jason-claude-plugins
   ```
   Then re-add the marketplace and reinstall plugins.

Always restart Claude Code after cache changes.

## Debugging

### Plugin not showing in Discover

- Check that marketplace.json has an entry with matching `name` and valid `source` path
- Verify the source directory contains `.claude-plugin/plugin.json`
- Update the marketplace manifest (see cache refresh above)

### Skills not appearing

- Verify `skills` array in plugin.json points to directories containing `SKILL.md`
- Check SKILL.md has valid YAML frontmatter with `name` and `description`
- Restart Claude Code after installing

### Hooks not firing

- Verify `hooks/hooks.json` exists at the plugin root (auto-discovered)
- Check hook event names are exact (case-sensitive: `SessionStart` not `sessionStart`)
- Verify `${CLAUDE_PLUGIN_ROOT}` paths are quoted for spaces
- Check scripts exit with `process.exit(0)` on success

## Checklist for New Plugins

- [ ] Plugin directory created with `.claude-plugin/plugin.json`
- [ ] Skills have `SKILL.md` with YAML frontmatter (`name` + `description`)
- [ ] If hooks: `hooks/hooks.json` exists, NO `"hooks"` field in plugin.json
- [ ] Entry added to `.claude-plugin/marketplace.json` with matching version
- [ ] Version is consistent between plugin.json and marketplace.json
- [ ] Committed, pushed, marketplace cache updated
- [ ] Plugin installs without errors
- [ ] Skills appear in skill list after restart
- [ ] Hooks fire correctly (if applicable)

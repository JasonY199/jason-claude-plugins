# jason-dev-workflow — Setup Guide

## Prerequisites

- Claude Code installed
- A mem0 account (free tier works)

## 1. Install the Plugin

```
/plugin install jason-dev-workflow@jason-claude-plugins
```

Restart Claude Code after installing.

## 2. Set Environment Variables

Add to your `~/.zshrc` or `~/.zshenv`:

```bash
export MEM0_API_KEY="your_mem0_api_key_here"
export MEM0_DEFAULT_USER_ID="jason"  # or your preferred user ID
```

**Where to get these:**
- **MEM0_API_KEY:** mem0 Dashboard → API Keys → Create Key

After adding, restart your terminal or run `source ~/.zshrc`.

## 3. Configure a Project

Drop a `.dev-workflow.json` in the root of any project where you want the workflow active:

```json
{
  "mem0": {
    "appId": "your-project-name"
  }
}
```

**Finding your values:**
- **appId:** Any string that uniquely identifies this project. Memories with different app_id values are isolated from each other.

## 4. Verify

Open Claude Code in the configured project. You should see mem0 context instructions on session start.

Run `/dev-help` to see the full reference card and verify your configuration.

## What Happens Without Configuration

- **No `.dev-workflow.json`:** All hooks exit silently. The plugin has zero impact on unconfigured projects.
- **No `MEM0_API_KEY`:** mem0 features are skipped.
- **Both missing:** Plugin effectively does nothing, but won't error.

## Updating

When a new version is released:

1. Update the marketplace: `/plugin marketplace update jason-claude-plugins`
2. Go to Installed tab → jason-dev-workflow → "Update now"
3. Restart Claude Code

## Troubleshooting

**Hooks not firing:**
- Verify `hooks/hooks.json` exists in the plugin install directory
- Check Claude Code hook settings allow external plugin hooks
- Restart Claude Code

**Skills not appearing:**
- Run `/plugin` and check jason-dev-workflow is installed
- Verify plugin version matches marketplace version
- Restart Claude Code

# jason-dev-workflow — Setup Guide

## Prerequisites

- Claude Code installed
- A Plane.so account with a project created
- A mem0 account (free tier works)

## 1. Install the Plugin

```
/plugin install jason-dev-workflow@jason-claude-plugins
```

Restart Claude Code after installing.

## 2. Set Environment Variables

Add to your `~/.zshrc` or `~/.zshenv`:

```bash
export PLANE_API_TOKEN="plane_api_your_token_here"
export MEM0_API_KEY="your_mem0_api_key_here"
export MEM0_DEFAULT_USER_ID="jason"  # or your preferred user ID
```

**Where to get these:**
- **PLANE_API_TOKEN:** Plane → Profile → API Tokens → Create Token
- **MEM0_API_KEY:** mem0 Dashboard → API Keys → Create Key

After adding, restart your terminal or run `source ~/.zshrc`.

## 3. Configure a Project

Drop a `.dev-workflow.json` in the root of any project where you want the workflow active:

```json
{
  "plane": {
    "workspace": "your-workspace-slug",
    "projectId": "uuid-of-your-plane-project"
  },
  "mem0": {
    "appId": "your-project-name"
  }
}
```

**Finding your values:**
- **workspace:** The slug in your Plane URL: `app.plane.so/{workspace-slug}/`
- **projectId:** Open your project in Plane, the UUID is in the URL. Or use the Plane MCP tool `list_projects` to see project IDs.
- **appId:** Any string that uniquely identifies this project. Memories with different app_id values are isolated from each other.

## 4. Verify

Open Claude Code in the configured project. You should see a "Dev Workflow Context" section with sprint status and mem0 context on session start.

Run `/dev-help` to see the full reference card and verify your configuration.

## What Happens Without Configuration

- **No `.dev-workflow.json`:** All hooks exit silently. The plugin has zero impact on unconfigured projects. The handoff plugin (if installed) works as normal.
- **No `PLANE_API_TOKEN`:** Plane features are skipped. mem0 features still work.
- **No `MEM0_API_KEY`:** mem0 features are skipped. Plane features still work.
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

**API errors on session start:**
- Check env vars are set: `echo $PLANE_API_TOKEN` and `echo $MEM0_API_KEY`
- Verify Plane token hasn't expired
- Check Plane rate limits (60 req/min)

**Skills not appearing:**
- Run `/plugin` and check jason-dev-workflow is installed
- Verify plugin version matches marketplace version
- Restart Claude Code

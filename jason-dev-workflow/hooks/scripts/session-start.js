const { loadConfig, getEnvVar } = require("./config");
const plane = require("./plane-client");

async function main() {
  const config = loadConfig();
  if (!config) {
    process.exit(0);
  }

  const planeToken = getEnvVar("PLANE_API_TOKEN");
  const { workspace, projectId } = config.plane;
  const { appId } = config.mem0;

  const sections = [];

  // --- Plane: Sprint Status ---
  if (planeToken) {
    try {
      const [activeCycle, states] = await Promise.all([
        plane.getActiveCycle(planeToken, workspace, projectId),
        plane.getStates(planeToken, workspace, projectId),
      ]);

      const stateMap = {};
      for (const s of states) {
        stateMap[s.id] = s;
      }

      if (activeCycle) {
        const workItems = await plane.getCycleWorkItems(
          planeToken,
          workspace,
          projectId,
          activeCycle.id,
        );

        const grouped = {
          backlog: [],
          unstarted: [],
          started: [],
          completed: [],
          cancelled: [],
        };
        for (const item of workItems) {
          const wi = item.issue_detail || item;
          const state = stateMap[wi.state] || {};
          const group = state.group || "backlog";
          grouped[group].push({
            name: wi.name || wi.label || "Untitled",
            identifier: wi.identifier || "",
            state: state.name || "Unknown",
          });
        }

        const total = workItems.length;
        const done = grouped.completed.length;
        sections.push(
          `**Sprint:** ${activeCycle.name} (${activeCycle.start_date} to ${activeCycle.end_date}) — ${done}/${total} done`,
        );

        if (grouped.started.length > 0) {
          sections.push(
            "\n**In Progress:**\n" +
              grouped.started
                .map((w) => `- ${w.identifier} ${w.name}`)
                .join("\n"),
          );
        }

        if (grouped.unstarted.length > 0) {
          sections.push(
            "\n**Up Next:**\n" +
              grouped.unstarted
                .slice(0, 5)
                .map((w) => `- ${w.identifier} ${w.name}`)
                .join("\n"),
          );
        }
      } else {
        sections.push("**Sprint:** No active cycle");
      }
    } catch (err) {
      sections.push(`**Sprint:** Could not reach Plane (${err.message})`);
    }
  }

  // --- Behavioral instruction for the AI ---
  sections.push(`
---
**mem0 — long-term memory for this project**

This project uses mem0 (app_id: "${appId}") for long-term knowledge storage. mem0 is NOT queried automatically — use it on demand via the mem0 MCP tools.

**When to SAVE to mem0** (use add_memory with app_id: "${appId}"):
- Architectural or design decisions and their reasoning
- Patterns, conventions, or rules established during development
- Non-obvious gotchas, workarounds, or things that broke unexpectedly
- User preferences or workflow choices
- Anything someone would need to know weeks from now

**When to SEARCH mem0** (use search_memories with app_id: "${appId}"):
- When the user asks "what did we decide about X?"
- When starting work on a feature and you want to check for prior decisions
- When you're unsure about a convention or pattern that may have been established before

**When NOT to use mem0:**
- Session-to-session continuity (that's what the handoff plugin is for)
- Git state, commit hashes, file lists (that's visible from git)
- Things already in MEMORY.md or CLAUDE.md (already loaded every session)

**If saving to mem0 from outside this project**, classify into a sensible app_id based on context — e.g. "mdl" for Mountain Dream Living, "freelance" for client work, "dev-patterns" for general development knowledge. Use judgment; don't dump everything into a generic bucket.`);

  process.stdout.write(sections.join("\n") + "\n");
}

main().catch((err) => {
  process.stderr.write(`[dev-workflow] SessionStart error: ${err.message}\n`);
  process.exit(0);
});

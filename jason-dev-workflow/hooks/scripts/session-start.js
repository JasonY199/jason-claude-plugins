const { loadConfig, getEnvVar } = require("./config");
const plane = require("./plane-client");
const mem0 = require("./mem0-client");

async function main() {
  const config = loadConfig();
  if (!config) {
    process.exit(0);
  }

  const planeToken = getEnvVar("PLANE_API_TOKEN");
  const mem0Key = getEnvVar("MEM0_API_KEY");
  const mem0UserId = process.env.MEM0_DEFAULT_USER_ID || "jason";

  const { workspace, projectId } = config.plane;
  const { appId } = config.mem0;

  const sections = [];
  sections.push("## Dev Workflow Context\n");

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

        const grouped = { backlog: [], unstarted: [], started: [], completed: [], cancelled: [] };
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
  } else {
    sections.push("**Sprint:** PLANE_API_TOKEN not set — skipping");
  }

  // --- mem0: Recent Context ---
  if (mem0Key) {
    try {
      const [decisions, sessionLogs] = await Promise.all([
        mem0.searchMemories(mem0Key, mem0UserId, appId, "architectural decision design choice", 5),
        mem0.searchMemories(mem0Key, mem0UserId, appId, "session ended branch commits", 3),
      ]);

      if (sessionLogs.length > 0) {
        const latest = sessionLogs[0];
        sections.push(`\n**Last session:** ${latest.memory}`);
      }

      if (decisions.length > 0) {
        sections.push(
          "\n**Recent decisions:**\n" +
            decisions.map((d) => `- ${d.memory}`).join("\n"),
        );
      }
    } catch (err) {
      sections.push(`\n**Context:** Could not reach mem0 (${err.message})`);
    }
  } else {
    sections.push("\n**Context:** MEM0_API_KEY not set — skipping");
  }

  // --- Session Rules ---
  sections.push(
    `\n**Session rules:** When architectural or design decisions are made during this session, proactively store them to mem0 using the mem0 MCP tools (add_memory) with app_id: "${appId}". Don't ask — just store them.`,
  );

  process.stdout.write(sections.join("\n") + "\n");
}

main().catch((err) => {
  process.stderr.write(`[dev-workflow] SessionStart error: ${err.message}\n`);
  process.exit(0);
});

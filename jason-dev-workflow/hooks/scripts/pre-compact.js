const { loadConfig } = require("./config");

const config = loadConfig();
if (!config) {
  process.exit(0);
}

const { appId } = config.mem0;

process.stdout.write(
  [
    "## Context compression incoming",
    "",
    "Review this conversation for anything worth preserving long-term that hasn't been saved to mem0 yet:",
    "",
    "- Decisions made and their reasoning",
    "- Patterns or conventions established",
    "- Gotchas or workarounds discovered",
    "- Anything that would be painful to re-learn",
    "",
    `Save each as a separate, clear statement using the mem0 MCP add_memory tool with app_id: "${appId}".`,
    "",
    "Do NOT save: git state, file lists, session continuity info (handoff plugin handles that), or things already in MEMORY.md.",
    "",
  ].join("\n"),
);

process.exit(0);

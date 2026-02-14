const { loadConfig } = require("./config");

const config = loadConfig();
if (!config) {
  process.exit(0);
}

const { appId } = config.mem0;

process.stdout.write(
  [
    "## Before Compacting",
    "",
    "Review this conversation for any architectural or design decisions that haven't been stored to mem0 yet.",
    `Store them now using the mem0 MCP tool (add_memory) with app_id: "${appId}" before context is compressed.`,
    "",
  ].join("\n"),
);

process.exit(0);

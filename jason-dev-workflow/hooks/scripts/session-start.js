const { loadConfig } = require("./config");

async function main() {
  const config = loadConfig();
  if (!config) {
    process.exit(0);
  }

  const { appId } = config.mem0;

  const sections = [];

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

#!/usr/bin/env node

const { execFileSync } = require("child_process");
const path = require("path");

function getProjectName() {
  try {
    const toplevel = execFileSync("git", ["rev-parse", "--show-toplevel"], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
    return path.basename(toplevel);
  } catch {
    return path.basename(process.cwd());
  }
}

function runCli(...args) {
  const cli = path.join(__dirname, "memory-cli.js");
  try {
    const out = execFileSync("node", [cli, ...args], {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    return JSON.parse(out.trim());
  } catch {
    return null;
  }
}

function main() {
  const cliPath = path.join(__dirname, "memory-cli.js");
  const project = getProjectName();
  const stats = runCli("stats");
  const recent = runCli("recent", "--limit", "5");

  const sections = [];

  sections.push(`---`);
  sections.push(`**jason-memory — local project memory (auto-active)**`);
  sections.push(``);
  sections.push(`Memory CLI: node "${cliPath}"`);
  sections.push(`Project: ${project}`);

  // Stats summary
  if (stats && stats.total > 0) {
    const typeParts = Object.entries(stats.byType)
      .map(([t, c]) => `${c} ${t}s`)
      .join(", ");
    sections.push(`Memories: ${stats.total} (${typeParts})`);
  } else {
    sections.push(`Memories: 0`);
  }

  // Recent memories
  if (recent && recent.memories && recent.memories.length > 0) {
    sections.push(``);
    sections.push(`**Recent memories:**`);
    for (const m of recent.memories) {
      const tags = m.tags.length > 0 ? ` [${m.tags.join(", ")}]` : "";
      sections.push(`- (${m.type}) ${m.content}${tags}`);
    }
  }

  // Autonomous behavioral instructions
  sections.push(``);
  sections.push(`**AUTO-STORE — capture silently as you work:**`);
  sections.push(`You MUST store memories autonomously when you encounter:`);
  sections.push(`- Architectural or design decisions and their reasoning`);
  sections.push(`- Patterns, conventions, or rules established during development`);
  sections.push(`- Non-obvious gotchas, workarounds, or things that broke unexpectedly`);
  sections.push(`- Error resolutions that took significant debugging`);
  sections.push(`- User preferences or workflow choices`);
  sections.push(`Do not announce that you are storing a memory — just do it silently via Bash.`);
  sections.push(``);
  sections.push(`**AUTO-RECALL — search silently when context would help:**`);
  sections.push(`You MUST search memories (via the memory-researcher agent) when:`);
  sections.push(`- Starting work on a feature or area you haven't touched this session`);
  sections.push(`- The user asks about past decisions or conventions`);
  sections.push(`- You're unsure about a pattern that may have been established`);
  sections.push(`Do not announce that you are searching memory — just do it silently.`);
  sections.push(``);
  sections.push(`**DEDUP WORKFLOW — always check before storing:**`);
  sections.push(`Before storing any new memory, run find-similar to check for duplicates:`);
  sections.push(`\`node "${cliPath}" find-similar --content "proposed text" --threshold 0.5\``);
  sections.push(`- If a similar memory exists and the new info supersedes it: use \`update --id <id> --content "evolved statement"\``);
  sections.push(`- If a similar memory exists and says the same thing: skip storing`);
  sections.push(`- If no similar memory exists: store as new`);
  sections.push(``);
  sections.push(`**QUALITY GUARD:**`);
  sections.push(`- 5 high-quality memories per session > 20 noise entries`);
  sections.push(`- One clear statement per memory, present tense`);
  sections.push(`- Classify type: decision / learning / error / pattern / observation`);
  sections.push(`- 1-3 lowercase tags per memory`);
  sections.push(``);
  sections.push(`**DO NOT store:**`);
  sections.push(`- Session continuity info (handoff plugin handles that)`);
  sections.push(`- Git state, commit hashes, file lists (visible from git)`);
  sections.push(`- Things already in CLAUDE.md or MEMORY.md`);
  sections.push(`- Trivial or obvious details that don't need long-term recall`);
  sections.push(``);
  sections.push(`**Explicit overrides:** /remember forces a store, /recall forces a search. These still work as before.`);

  process.stdout.write(sections.join("\n") + "\n");
}

main();

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
  sections.push(`**jason-memory — local project memory**`);
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
    sections.push(`Memories: 0 — use /remember to start storing decisions and patterns.`);
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

  // Behavioral instructions
  sections.push(``);
  sections.push(`**When to STORE** (use /remember or call the CLI directly):`);
  sections.push(`- Architectural or design decisions and their reasoning`);
  sections.push(`- Patterns, conventions, or rules established during development`);
  sections.push(`- Non-obvious gotchas, workarounds, or things that broke unexpectedly`);
  sections.push(`- Error resolutions that took significant debugging`);
  sections.push(`- User preferences or workflow choices`);
  sections.push(``);
  sections.push(`**When to SEARCH** (use /recall — runs via memory-researcher agent):`);
  sections.push(`- When the user asks "what did we decide about X?"`);
  sections.push(`- When starting work on a feature — check for prior decisions`);
  sections.push(`- When unsure about a convention or pattern that may have been established`);
  sections.push(``);
  sections.push(`**When NOT to use memory:**`);
  sections.push(`- Session-to-session continuity (handoff plugin handles that)`);
  sections.push(`- Git state, commit hashes, file lists (visible from git)`);
  sections.push(`- Things already in CLAUDE.md or MEMORY.md (loaded every session)`);
  sections.push(``);
  sections.push(`**Rules:** One clear statement per memory. Present tense. Classify type (decision/learning/error/pattern/observation). Always use the memory-researcher agent for searching (protects context window).`);

  process.stdout.write(sections.join("\n") + "\n");
}

main();

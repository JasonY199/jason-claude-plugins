#!/usr/bin/env node

const { execFileSync } = require("child_process");
const path = require("path");

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
  const digest = runCli("digest", "--limit", "5");

  if (!digest) {
    process.stdout.write(
      `---\n**Memory** — no memories yet\nStore: \`node "${cliPath}" store --content "..." --type <type> --tags "t1,t2"\`\n---\n`,
    );
    return;
  }

  const lines = ["---"];

  // Summary line: **Memory** [project] N active (X decisions, Y patterns, ...)
  const parts = Object.entries(digest.type_counts)
    .map(([t, c]) => `${c} ${t}s`)
    .join(", ");
  lines.push(`**Memory** [${digest.project}] ${digest.total_active} active (${parts})`);

  // Top memories from digest
  for (const m of digest.memories) {
    const tags = m.tags.length > 0 ? ` [${m.tags.join(", ")}]` : "";
    lines.push(`  ${m.type}: ${m.content}${tags}`);
  }

  // Command reference
  lines.push(`Store: \`node "${cliPath}" store --content "..." --type <type> --tags "t1,t2"\``);
  lines.push(`Search: \`node "${cliPath}" search --query "..." --limit 5\``);
  lines.push("---");

  process.stdout.write(lines.join("\n") + "\n");
}

main();

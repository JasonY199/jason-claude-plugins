#!/usr/bin/env node

const path = require("path");

const cliPath = path.join(__dirname, "memory-cli.js");

process.stdout.write(
  [
    "---",
    "**Memory checkpoint** — capture undocumented decisions/patterns/errors before compaction.",
    `\`node "${cliPath}" store --content "..." --type <type> --tags "t1,t2"\``,
    "---",
    "",
  ].join("\n"),
);

process.exit(0);

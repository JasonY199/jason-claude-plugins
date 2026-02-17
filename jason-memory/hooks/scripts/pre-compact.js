#!/usr/bin/env node

const path = require("path");

const cliPath = path.join(__dirname, "memory-cli.js");

process.stdout.write(
  [
    "## Context compression incoming",
    "",
    "Review this conversation for anything worth preserving long-term that hasn't been saved to memory yet:",
    "",
    "- Decisions made and their reasoning",
    "- Patterns or conventions established",
    "- Gotchas or workarounds discovered",
    "- Error resolutions that took significant debugging",
    "- Anything that would be painful to re-learn",
    "",
    `Save each as a separate, clear statement using:`,
    `\`node "${cliPath}" store --content "..." --type <decision|learning|error|pattern|observation> --tags "tag1,tag2"\``,
    "",
    "Do NOT save: git state, file lists, session continuity info (handoff plugin handles that), or things already in CLAUDE.md / MEMORY.md.",
    "",
  ].join("\n"),
);

process.exit(0);

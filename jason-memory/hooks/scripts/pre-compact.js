#!/usr/bin/env node

const path = require("path");

const cliPath = path.join(__dirname, "memory-cli.js");

process.stdout.write(
  [
    "## Context compression incoming — MANDATORY memory capture",
    "",
    "You MUST review this conversation for undocumented knowledge before context is lost.",
    "Capture anything worth preserving that hasn't been saved yet:",
    "",
    "- Decisions made and their reasoning",
    "- Patterns or conventions established",
    "- Gotchas or workarounds discovered",
    "- Error resolutions that took significant debugging",
    "- Anything that would be painful to re-learn",
    "",
    "**Dedup workflow — run before each store:**",
    `\`node "${cliPath}" find-similar --content "proposed text" --threshold 0.5\``,
    "- Similar match exists and new info supersedes it: `update --id <id> --content \"evolved statement\"`",
    "- Similar match exists and says the same thing: skip",
    "- No match: store as new",
    "",
    "**Store command:**",
    `\`node "${cliPath}" store --content "..." --type <decision|learning|error|pattern|observation> --tags "tag1,tag2"\``,
    "",
    "Work silently — no announcements about what you're storing.",
    "Do NOT save: git state, file lists, session continuity info, or things already in CLAUDE.md / MEMORY.md.",
    "",
  ].join("\n"),
);

process.exit(0);

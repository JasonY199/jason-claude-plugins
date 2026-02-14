const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const { loadConfig, getEnvVar } = require("./config");
const mem0 = require("./mem0-client");

const DEBUG_LOG = path.join(
  process.env.HOME || "/tmp",
  ".claude",
  "dev-workflow-debug.log",
);

function debugLog(message) {
  try {
    const ts = new Date().toISOString();
    fs.appendFileSync(DEBUG_LOG, `[${ts}] SessionEnd: ${message}\n`);
  } catch {
    // best-effort
  }
}

function readStdin() {
  try {
    const data = fs.readFileSync(0, "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

function git(cwd, ...args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

async function main() {
  const input = readStdin();
  const cwd = input.cwd || process.cwd();
  const sessionId = input.session_id || "unknown";
  const reason = input.reason || "unknown";

  debugLog(`fired (reason=${reason}, session=${sessionId}, cwd=${cwd})`);

  const config = loadConfig(cwd);
  if (!config) {
    debugLog("no .dev-workflow.json found — skipping");
    process.exit(0);
  }

  const mem0Key = getEnvVar("MEM0_API_KEY");
  if (!mem0Key) {
    debugLog("MEM0_API_KEY not set — skipping");
    process.exit(0);
  }

  const mem0UserId = process.env.MEM0_DEFAULT_USER_ID || "jason";
  const { appId } = config.mem0;

  const branch = git(cwd, "branch", "--show-current") || "detached";
  const recentCommits =
    git(cwd, "log", "--oneline", "-5") || "no commits";

  // Use git status --porcelain to capture ALL changes:
  // untracked, modified, deleted, staged — everything
  const statusRaw = git(cwd, "status", "--porcelain");
  const changes = statusRaw
    ? statusRaw
        .split("\n")
        .filter(Boolean)
        .map((line) => {
          const code = line.slice(0, 2).trim();
          const file = line.slice(3);
          const labels = {
            "??": "new",
            M: "modified",
            A: "added",
            D: "deleted",
            R: "renamed",
            MM: "modified",
            AM: "added+modified",
          };
          return `${file} (${labels[code] || code})`;
        })
    : [];

  const now = new Date();
  const timestamp = now.toISOString().slice(0, 16).replace("T", " ");

  // Build a descriptive session summary
  const parts = [
    `Session ended ${timestamp} using branch ${branch} (exit: ${reason}, id: ${sessionId.slice(0, 8)}).`,
  ];

  if (recentCommits !== "no commits") {
    parts.push(
      `Recent commits: ${recentCommits.split("\n").join("; ")}.`,
    );
  }

  if (changes.length > 0) {
    // Cap at 30 files to avoid huge messages
    const shown = changes.slice(0, 30);
    parts.push(`Uncommitted changes (${changes.length} files): ${shown.join(", ")}.`);
    if (changes.length > 30) {
      parts.push(`...and ${changes.length - 30} more files.`);
    }
  } else {
    parts.push("Working tree clean — no uncommitted changes.");
  }

  const text = parts.join(" ");

  debugLog(`sending to mem0: ${text.slice(0, 200)}...`);

  try {
    await mem0.addMemory(mem0Key, mem0UserId, appId, text, {
      type: "session_log",
      session_id: sessionId,
      reason,
    }, { infer: false });
    debugLog("saved to mem0 successfully");
    process.stderr.write("[dev-workflow] Session log saved to mem0\n");
  } catch (err) {
    debugLog(`mem0 error: ${err.message}`);
    process.stderr.write(
      `[dev-workflow] Could not save session log: ${err.message}\n`,
    );
  }
}

main().catch((err) => {
  debugLog(`fatal error: ${err.message}`);
  process.stderr.write(`[dev-workflow] SessionEnd error: ${err.message}\n`);
  process.exit(0);
});

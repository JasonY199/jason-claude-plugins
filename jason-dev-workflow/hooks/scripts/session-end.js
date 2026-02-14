const { execFileSync } = require("child_process");
const { loadConfig, getEnvVar } = require("./config");
const mem0 = require("./mem0-client");

function git(...args) {
  try {
    return execFileSync("git", args, {
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

async function main() {
  const config = loadConfig();
  if (!config) {
    process.exit(0);
  }

  const mem0Key = getEnvVar("MEM0_API_KEY");
  if (!mem0Key) {
    process.exit(0);
  }

  const mem0UserId = process.env.MEM0_DEFAULT_USER_ID || "jason";
  const { appId } = config.mem0;

  const branch = git("branch", "--show-current") || "detached";
  const recentCommits = git("log", "--oneline", "-5") || "no commits";
  const modifiedFiles = git("diff", "--name-only", "HEAD") || "none";

  const now = new Date();
  const timestamp = now.toISOString().slice(0, 16).replace("T", " ");

  const text = [
    `Session ended ${timestamp}.`,
    `Branch: ${branch}.`,
    `Recent commits: ${recentCommits.split("\n").join("; ")}.`,
    `Modified files: ${modifiedFiles.split("\n").filter(Boolean).join(", ") || "none"}.`,
  ].join(" ");

  try {
    await mem0.addMemory(mem0Key, mem0UserId, appId, text, {
      type: "session_log",
    });
    process.stderr.write("[dev-workflow] Session log saved to mem0\n");
  } catch (err) {
    process.stderr.write(
      `[dev-workflow] Could not save session log: ${err.message}\n`,
    );
  }
}

main().catch((err) => {
  process.stderr.write(`[dev-workflow] SessionEnd error: ${err.message}\n`);
  process.exit(0);
});

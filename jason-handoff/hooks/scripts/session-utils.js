const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const HOME = process.env.HOME || process.env.USERPROFILE;

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

function getGitState() {
  const run = (...args) => {
    try {
      return execFileSync("git", args, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
    } catch {
      return "";
    }
  };

  return {
    branch: run("branch", "--show-current") || "detached",
    status: run("status", "--short") || "Clean working tree",
    recentCommits: run("log", "--oneline", "-5") || "No commits",
    modifiedFiles: run("diff", "--name-only", "HEAD") || "None",
  };
}

function getSessionDir() {
  const projectName = getProjectName();
  const dir = path.join(HOME, ".claude", "sessions", projectName);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function writeSessionFile(trigger) {
  const dir = getSessionDir();
  const projectName = getProjectName();
  const git = getGitState();

  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  const time = now.toTimeString().slice(0, 5).replace(":", "");
  const filename = `${date}-${time}.md`;

  const content = `# Session: ${projectName}

**Saved:** ${date} ${now.toTimeString().slice(0, 5)}
**Branch:** ${git.branch}
**Trigger:** ${trigger}

## Git Status

${git.status}

## Recent Commits

${git.recentCommits}

## Modified Files

${git.modifiedFiles}
`;

  const filepath = path.join(dir, filename);
  fs.writeFileSync(filepath, content, "utf8");
  return filepath;
}

function getLatestSessionFile() {
  const dir = getSessionDir();

  let files;
  try {
    files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".md"))
      .sort()
      .reverse();
  } catch {
    return null;
  }

  if (files.length === 0) return null;

  return path.join(dir, files[0]);
}

function cleanOldSessions(maxAgeDays = 7) {
  const dir = getSessionDir();
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;

  let files;
  try {
    files = fs.readdirSync(dir).filter((f) => f.endsWith(".md"));
  } catch {
    return;
  }

  for (const file of files) {
    const filepath = path.join(dir, file);
    try {
      const stat = fs.statSync(filepath);
      if (stat.mtimeMs < cutoff) {
        fs.unlinkSync(filepath);
      }
    } catch {
      // skip files we can't stat/delete
    }
  }
}

module.exports = {
  getProjectName,
  getGitState,
  getSessionDir,
  writeSessionFile,
  getLatestSessionFile,
  cleanOldSessions,
};

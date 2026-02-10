const fs = require("fs");
const { getLatestSessionFile, cleanOldSessions } = require("./session-utils");

try {
  const latest = getLatestSessionFile();
  if (latest) {
    const content = fs.readFileSync(latest, "utf8");
    process.stdout.write(content);
  }
  cleanOldSessions(7);
} catch (err) {
  process.stderr.write(
    `[Session] Warning: could not load state: ${err.message}\n`,
  );
}

process.exit(0);

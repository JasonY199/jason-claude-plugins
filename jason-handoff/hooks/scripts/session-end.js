const { writeSessionFile, cleanOldSessions } = require("./session-utils");

try {
  writeSessionFile("session-end");
  cleanOldSessions(7);
  process.stderr.write("[Session] State saved on session end\n");
} catch (err) {
  process.stderr.write(
    `[Session] Warning: could not save state: ${err.message}\n`,
  );
}

process.exit(0);

const { writeSessionFile } = require("./session-utils");

try {
  writeSessionFile("pre-compact");
  process.stderr.write("[Session] State saved before compaction\n");
} catch (err) {
  process.stderr.write(
    `[Session] Warning: could not save state: ${err.message}\n`,
  );
}

process.exit(0);

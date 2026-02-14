const fs = require("fs");
const path = require("path");

const CONFIG_FILENAME = ".dev-workflow.json";

/**
 * Load project config from .dev-workflow.json in the current working directory.
 * Returns null if no config file exists (plugin is not active for this project).
 */
function loadConfig() {
  const configPath = path.join(process.cwd(), CONFIG_FILENAME);
  if (!fs.existsSync(configPath)) {
    return null;
  }
  try {
    const raw = fs.readFileSync(configPath, "utf8");
    const config = JSON.parse(raw);
    if (!config.plane || !config.mem0) {
      process.stderr.write(
        `[dev-workflow] ${CONFIG_FILENAME} missing required "plane" or "mem0" section\n`,
      );
      return null;
    }
    return config;
  } catch (err) {
    process.stderr.write(
      `[dev-workflow] Invalid ${CONFIG_FILENAME}: ${err.message}\n`,
    );
    return null;
  }
}

/**
 * Get an environment variable. Logs a warning if missing.
 * Returns null if not set.
 */
function getEnvVar(name) {
  const value = process.env[name];
  if (!value) {
    process.stderr.write(`[dev-workflow] Warning: ${name} not set\n`);
  }
  return value || null;
}

module.exports = { loadConfig, getEnvVar, CONFIG_FILENAME };

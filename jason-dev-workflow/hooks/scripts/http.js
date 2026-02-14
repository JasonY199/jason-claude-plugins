const https = require("https");

const DEFAULT_TIMEOUT = 5000;

/**
 * Make an HTTPS request. Returns parsed JSON or raw text.
 * Rejects on timeout, HTTP errors, or network errors.
 */
function request(method, url, headers = {}, body = null, timeout = DEFAULT_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const options = {
      method,
      hostname: parsed.hostname,
      port: parsed.port || 443,
      path: parsed.pathname + parsed.search,
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...headers,
      },
      timeout,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch {
            resolve(data);
          }
        } else {
          reject(
            new Error(
              `HTTP ${res.statusCode} ${method} ${parsed.pathname}: ${data.slice(0, 200)}`,
            ),
          );
        }
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout (${timeout}ms) ${method} ${parsed.pathname}`));
    });

    req.on("error", (err) => {
      reject(new Error(`Network error ${method} ${parsed.pathname}: ${err.message}`));
    });

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

module.exports = { request };

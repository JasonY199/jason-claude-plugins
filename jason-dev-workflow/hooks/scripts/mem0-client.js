const { request } = require("./http");

const BASE_URL = "https://api.mem0.ai";

function headers(apiKey) {
  return { Authorization: `Token ${apiKey}` };
}

/**
 * Search memories by query string, scoped to user_id and app_id.
 * Returns array of memory objects sorted by relevance score.
 */
async function searchMemories(apiKey, userId, appId, query, topK = 10) {
  const body = {
    query,
    filters: {
      AND: [{ user_id: userId }, { app_id: appId }],
    },
    top_k: topK,
  };
  const res = await request(
    "POST",
    `${BASE_URL}/v2/memories/search/`,
    headers(apiKey),
    body,
  );
  return res.results || res || [];
}

/**
 * Add a memory, scoped to user_id and app_id.
 * Metadata can include { type: "session_log" } or { type: "decision" } for filtering.
 * Set infer=false to bypass mem0's extraction/deduplication pipeline (for raw logs).
 */
async function addMemory(apiKey, userId, appId, text, metadata = {}, { infer = true } = {}) {
  const body = {
    messages: [{ role: "user", content: text }],
    user_id: userId,
    app_id: appId,
    metadata,
    infer,
  };
  const res = await request(
    "POST",
    `${BASE_URL}/v1/memories/`,
    headers(apiKey),
    body,
  );
  return res;
}

module.exports = { searchMemories, addMemory };

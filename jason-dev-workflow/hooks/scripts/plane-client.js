const { request } = require("./http");

const BASE_URL = "https://api.plane.so/api/v1";

function headers(token) {
  return { "X-API-Key": token };
}

function url(workspace, projectId, ...parts) {
  return `${BASE_URL}/workspaces/${workspace}/projects/${projectId}/${parts.join("/")}`;
}

/**
 * Fetch all cycles for a project.
 * Returns array of cycle objects.
 */
async function getCycles(token, workspace, projectId) {
  const res = await request(
    "GET",
    url(workspace, projectId, "cycles") + "/",
    headers(token),
  );
  return res.results || res || [];
}

/**
 * Find the active cycle (current date falls within start_date..end_date).
 * Returns null if no active cycle.
 */
async function getActiveCycle(token, workspace, projectId) {
  const cycles = await getCycles(token, workspace, projectId);
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  return (
    cycles.find((c) => c.start_date && c.end_date && c.start_date <= today && today <= c.end_date) ||
    null
  );
}

/**
 * Fetch work items in a specific cycle.
 * Returns array of work item objects.
 */
async function getCycleWorkItems(token, workspace, projectId, cycleId) {
  const res = await request(
    "GET",
    url(workspace, projectId, "cycles", cycleId, "cycle-issues") + "/",
    headers(token),
  );
  return res.results || res || [];
}

/**
 * Fetch all project states.
 * Returns array of state objects with group field.
 */
async function getStates(token, workspace, projectId) {
  const res = await request(
    "GET",
    url(workspace, projectId, "states") + "/",
    headers(token),
  );
  return res.results || res || [];
}

/**
 * Fetch all work items (for backlog/sprint planning).
 * Returns array of work item objects.
 */
async function getWorkItems(token, workspace, projectId) {
  const res = await request(
    "GET",
    url(workspace, projectId, "work-items") + "/",
    headers(token),
  );
  return res.results || res || [];
}

module.exports = {
  getCycles,
  getActiveCycle,
  getCycleWorkItems,
  getStates,
  getWorkItems,
};

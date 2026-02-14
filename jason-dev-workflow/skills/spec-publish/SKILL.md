---
name: spec-publish
description: Use when the user wants to publish a design document or spec to Plane Wiki, create work items from a plan, or push decisions from a brainstorming session to Plane and mem0
---

# Publish Spec to Plane + mem0

Publish a design document to Plane Wiki, create work items, and store key decisions to mem0.

**Requires:** `.dev-workflow.json` in project root. If not found, tell the user this skill only works in dev-workflow configured projects.

## Process

### 1. Identify the Document

Ask which document to publish. Check `docs/plans/` for recent files (sorted by date). If the user just finished brainstorming, the most recent file in `docs/plans/` is likely the one.

Show the user the candidates and let them confirm.

### 2. Read and Analyze the Document

Read the full document. Identify:
- **Key decisions** — statements of "we chose X because Y" or "X will use Y"
- **Task breakdowns** — numbered steps, phases, or work items
- **The summary** — what was built/designed/planned

### 3. Create Plane Work Items

Read `.dev-workflow.json` to get `plane.workspace` and `plane.projectId`.

For each task/phase/step identified in the document:
- Create a Plane work item using the Plane MCP tool `create_work_item`
- Set the title, description (include acceptance criteria if present)
- Set state to "Backlog" or "Todo" as appropriate
- Add labels if the document mentions categories

Report back: "Created N work items in Plane."

### 4. Store Decisions to mem0

For each key decision identified:
- Store as a separate memory using mem0 MCP tool `add_memory`
- Use `app_id` from `.dev-workflow.json`
- Keep each memory concise — one clear statement per decision

Report back: "Stored N decisions to mem0."

### 5. Push to Plane Wiki (if possible)

The Plane MCP server does NOT expose Wiki/Pages. To push the doc content to Plane Wiki, use Bash with curl:

```bash
curl -s -X POST \
  "https://api.plane.so/api/v1/workspaces/{workspace}/projects/{projectId}/pages/" \
  -H "X-API-Key: $PLANE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Document Title",
    "description_html": "<p>Document content as HTML</p>"
  }'
```

Replace `{workspace}` and `{projectId}` from `.dev-workflow.json`. Convert the markdown to basic HTML for the `description_html` field.

If `PLANE_API_TOKEN` is not set as an environment variable, skip this step and tell the user: "Couldn't push to Plane Wiki — PLANE_API_TOKEN not available in shell environment. The work items and mem0 memories were created successfully."

### 6. Summary

Report what was done:
- Work items created (with identifiers if available)
- Decisions stored to mem0
- Wiki page created (with URL if available) or skipped

## Notes

- This skill works with any markdown document, not just ones from superpowers brainstorming
- The document doesn't need a specific format — the skill extracts what it can
- If the document has no task breakdown, skip step 3 and just store decisions + push to wiki

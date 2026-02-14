---
name: sprint-plan
description: Use when the user wants to plan a sprint, create a cycle, prioritize backlog items, or organize upcoming work in Plane
---

# Sprint Planning

Plan a sprint by reviewing the Plane backlog and creating a cycle with selected work items.

**Requires:** `.dev-workflow.json` in project root. If not found, tell the user this skill only works in dev-workflow configured projects.

## Process

### 1. Load Current State

Read `.dev-workflow.json` to get `plane.workspace` and `plane.projectId`.

Using Plane MCP tools:
- Fetch all work items (`list_work_items` with the project_id)
- Fetch all cycles (`list_cycles` with the project_id) to see what's been done
- Fetch project states to understand the workflow

### 2. Present the Backlog

Organize work items by state group:
- **In Progress** — currently being worked on (carry these forward)
- **Todo** — planned but not started
- **Backlog** — unscheduled items

For each item, show: identifier, title, priority (if set), any labels.

Present a summary: "You have N items in backlog, M in todo, K in progress."

### 3. Discuss Priorities

Have a conversation with the user about:
- What's the focus for this sprint?
- Any items to pull from backlog into the sprint?
- Any items to deprioritize or move out?
- Sprint duration (default: 2 weeks)
- Sprint name (suggest based on focus area)

Lead with a recommendation based on what's in progress and the logical next steps.

### 4. Create the Cycle

Once the user confirms the sprint contents:
- Create a new cycle using Plane MCP tool `create_cycle` with:
  - name, start_date, end_date
- Add selected work items to the cycle using `add_work_items_to_cycle`
- Update any work item states if needed (e.g., moving from Backlog to Todo)

### 5. Summary

Report:
- Cycle name, date range
- Number of items added
- List of items with identifiers
- Any items that were reprioritized

## Notes

- If there's already an active cycle, show its status first and ask if the user wants to plan the NEXT cycle or modify the current one
- Carry forward in-progress items from the previous cycle automatically
- Don't create empty cycles — require at least one work item

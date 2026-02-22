---
name: whatsnext
description: Strategic project advisor — analyzes GitHub Issues, Projects, git history, docs, OpenSpec, and deployments to recommend what to work on next. Use when the user asks "what should I work on?", "what's the priority?", "where should we start?", or needs guidance on next steps.
---

# What's Next — Project Advisory

Orchestrate three specialized agents to gather comprehensive project state, then synthesize their findings into a strategic recommendation.

**Announce at start:** "Analyzing project state — dispatching research agents."

## Step 1: Dispatch All Three Agents in Parallel

Launch all three agents simultaneously using the Task tool. Each runs in its own context window.

**Agent 1: docs-researcher**
```
Task tool:
  subagent_type: jason-advisor:docs-researcher
  prompt: "Research the current project roadmap, phase structure, and priorities. What is the current phase? What are the goals? What key decisions or constraints affect what should be worked on next? Check CLAUDE.md, docs/ folder, memory files, and any roadmap documents."
```

**Agent 2: github-researcher**
```
Task tool:
  subagent_type: jason-advisor:github-researcher
  prompt: "Analyze the full GitHub project tracking state. What issues are open? What phase are we in? What was recently completed? What's blocked? What PRs are open? Give me the ranked list of what's next by priority, and flag any blockers or health concerns."
```

**Agent 3: project-state**
```
Task tool:
  subagent_type: jason-advisor:project-state
  prompt: "Gather the full local project state. What branch are we on? What was recently committed? Are there any in-flight OpenSpec changes? What does the memory say about current work? What's the deployment status? What recent activity trajectory exists?"
```

**All three MUST be dispatched in a single message (parallel).** Do not wait for one before launching the next.

## Step 2: Synthesize Advisory

After all three agents return, analyze their combined findings and present the advisory in the main conversation.

**Use these recommendation heuristics (in priority order):**

1. **Unblocked issues in the current phase**, ordered by Priority field (P0 > P1 > P2 > P3)
2. **Within same priority:** smaller issues first (build momentum), unless a larger issue is a prerequisite for others
3. **Momentum continuity:** issues in the same area as recent work, when priorities are equal
4. **Unblocking value:** issues that unblock other downstream issues
5. **Phase boundary:** if all current-phase issues are done or blocked, recommend investigating blockers or advancing to the next phase

**Output format:**

```
## Recommendation

**Work on [#N: title] next.**
[1-2 sentence explanation: why this is the top priority right now]

## Current State
- **Phase [N]:** [name] — [X of Y issues complete]
- **Last completed:** [issue/PR with date]
- **In-flight:** [open branches, draft PRs, active OpenSpec changes]
- **Deployment:** [healthy / issue noted]

## What's Next (ranked)
1. **#[N] [title]** — [why it's #1: priority, unblocked, logical next step]
2. **#[N] [title]** — [why it's #2]
3. **#[N] [title]** — [why it's #3]

## Blockers & Flags
- [Issue blocked by reason]
- [Phase progress concern]
- [Stale issue or approaching deadline]
(or: No blockers detected)

## Context
- [Relevant gotchas or learnings that affect the recommendation]
- [Recent decisions that inform priority]
- [Memory items worth keeping in mind]
```

## Important Notes

- **Lead with the recommendation.** The user wants to know what to do, not read a data dump.
- **Be opinionated.** Don't hedge with "you could do X or Y." Pick one and explain why.
- **Flag disagreements.** If the data sources conflict (e.g., roadmap says X but GitHub shows Y), call it out.
- **Acknowledge gaps.** If an agent couldn't gather some data (e.g., no Vercel configured), note what's missing from the analysis.

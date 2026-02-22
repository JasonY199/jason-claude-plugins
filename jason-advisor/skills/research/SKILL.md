---
name: research
description: Research project docs, architecture, and source code without polluting the main context. Use when the user asks to look up architecture decisions, understand a subsystem, or gather context before starting work. Also available for cross-plugin use (e.g., OpenSpec planning phases).
---

# Research

Dispatch the `docs-researcher` agent to research the requested topic. The agent runs in its own context window and returns a focused, cited summary — the main conversation stays clean.

## How to Invoke

Launch the `docs-researcher` agent via the Task tool:

```
Task tool:
  subagent_type: jason-advisor:docs-researcher
  prompt: "Research [topic]. [any specific questions or focus areas the user mentioned]"
```

**Prompt construction:** Include the user's question verbatim, plus any context about why they're asking (e.g., "before implementing feature X" or "to understand how Y works"). The agent scales its response depth based on the request complexity.

## After the Agent Returns

1. **Present the summary to the user as-is** — it's already structured with citations
2. **If the summary flags gaps**, let the user know what couldn't be found and suggest where it might live
3. **Don't re-read the same docs in the main conversation** — that defeats the purpose of using an agent

## When This Skill Fires

- User says "research X", "look up X", "what does the architecture say about X"
- User asks about a subsystem, pattern, or decision that likely lives in docs
- Before starting feature work when architecture context is needed
- CLAUDE.md says to use this skill for certain topics
- Other plugins need project context (e.g., OpenSpec during proposal/design phases)

## Cross-Plugin Composability

This agent is designed to be dispatched by other plugins. If another skill (e.g., OpenSpec planning) needs project context, it can dispatch `docs-researcher` directly without going through this skill.

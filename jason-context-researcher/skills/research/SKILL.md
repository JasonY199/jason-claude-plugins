---
name: research
description: Research project docs and architecture without polluting the main context. Use when the user asks to look up architecture decisions, understand a subsystem, or gather context before starting work.
---

# Research

Use the `context-researcher` agent to research the requested topic. The agent runs in its own context window and returns a focused summary — the main conversation stays clean.

## How to Invoke

Launch the `context-researcher` agent via the Task tool:

```
Task tool:
  subagent_type: general-purpose  (do NOT use — use the context-researcher agent instead)
```

**Use the agent directly.** The context-researcher agent is defined in this plugin. Invoke it with:

```
Task tool with name: "context-researcher"
prompt: "Research [topic]. [any specific questions or focus areas the user mentioned]"
```

## What to Tell the User

After the agent returns its summary:

1. Present the summary to the user as-is (it's already structured and concise)
2. If the summary flags missing context, let the user know what couldn't be found
3. Don't re-read the same docs in the main conversation — that defeats the purpose

## When This Skill Fires

- User says "research X", "look up X in docs", "what does the architecture say about X"
- User asks about a subsystem, pattern, or decision that likely lives in docs
- Before starting feature work when architecture context is needed
- CLAUDE.md says "use the context-researcher agent" for certain topics

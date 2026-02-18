# jason-context-researcher

Context researcher agent for Claude Code. Searches project docs in its own context window and returns focused summaries — protects the main conversation from doc-reading bloat.

## What It Does

- `/research [topic]` — launches an agent that reads your `docs/`, `CLAUDE.md`, and README, then returns a structured summary
- Zero dependencies, zero hooks, zero config
- Uses Sonnet for strong synthesis and reasoning over unstructured docs

## Why a Separate Agent?

Reading architecture docs directly pollutes the main context window with thousands of lines of content you only need a summary of. The context-researcher agent runs in its own window, does all the reading, and returns just what's relevant.

## Install

Available from the `jason-claude-plugins` marketplace.

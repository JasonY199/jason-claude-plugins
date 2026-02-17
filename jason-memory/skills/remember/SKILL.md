---
name: remember
description: Use when the user wants to remember something, store a decision, save a note, capture a pattern, or persist any information to the project's local memory. Triggers on "remember this", "store this", "save to memory", "note that".
---

# Remember — Store to Local Memory

> **Auto-memory is active.** Memories are captured automatically during normal work. Use `/remember` when you want to explicitly force a store or override the automatic behavior.

Store whatever the user wants to remember using the local memory CLI.

## Process

1. **Summarize** what the user wants to remember as a clear, concise statement in present tense.

2. **Classify** the memory type:
   - `decision` — architectural or design choices and their reasoning
   - `learning` — something learned during development
   - `error` — an error resolution or debugging insight
   - `pattern` — a convention or pattern to follow
   - `observation` — general note or preference

3. **Pick 1-3 tags** — lowercase, hyphen-separated, descriptive (e.g., `auth`, `api`, `styling`, `database`).

4. **Dedup check** — before storing, check for similar existing memories:
   ```
   node "<cli-path>" find-similar --content "proposed text" --threshold 0.5
   ```
   - If a similar memory exists and the new info supersedes it: use `update --id <id> --content "evolved statement"`
   - If a similar memory exists and says the same thing: tell the user it's already stored
   - If no match: store as new

5. **Store via Bash:**
   ```
   node "<cli-path>" store --content "The concise statement" --type <type> --tags "tag1,tag2"
   ```
   The CLI path is provided by the session-start hook — look for `Memory CLI: node "..."` in your session context.

6. **Confirm** what was stored: the statement, type, and tags.

## Rules

- **One statement per memory** — don't dump paragraphs
- **Present tense** — "Uses Drizzle ORM" not "Decided to use Drizzle"
- **Separate memories** for multiple items — if the user says "remember these 3 things", make 3 separate CLI calls
- **Be concise** — trim filler words, keep the essence

## Examples

**Single decision:**
> User: "Remember that we're using Tailwind instead of styled-components"
> → `find-similar --content "Uses Tailwind CSS instead of styled-components for styling"`
> → (no match) → `store --content "Uses Tailwind CSS instead of styled-components for styling" --type decision --tags "styling,ui"`

**Updating a decision:**
> User: "Actually, we switched back to styled-components"
> → `find-similar --content "Uses styled-components for styling"`
> → (match found: "Uses Tailwind CSS...") → `update --id <id> --content "Uses styled-components instead of Tailwind for styling"`

**Multiple items:**
> User: "Store the key decisions from this session"
> → Summarize each as a separate memory, dedup-check and store each individually

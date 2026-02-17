---
name: remember
description: Use when the user wants to remember something, store a decision, save a note, capture a pattern, or persist any information to the project's local memory. Triggers on "remember this", "store this", "save to memory", "note that".
---

# Remember — Store to Local Memory

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

4. **Store via Bash:**
   ```
   node "<cli-path>" store --content "The concise statement" --type <type> --tags "tag1,tag2"
   ```
   The CLI path is provided by the session-start hook — look for `Memory CLI: node "..."` in your session context.

5. **Confirm** what was stored: the statement, type, and tags.

## Rules

- **One statement per memory** — don't dump paragraphs
- **Present tense** — "Uses Drizzle ORM" not "Decided to use Drizzle"
- **Separate memories** for multiple items — if the user says "remember these 3 things", make 3 separate CLI calls
- **Be concise** — trim filler words, keep the essence

## Examples

**Single decision:**
> User: "Remember that we're using Tailwind instead of styled-components"
> → `store --content "Uses Tailwind CSS instead of styled-components for styling" --type decision --tags "styling,ui"`

**Pattern:**
> User: "Note that all API routes use zod validation"
> → `store --content "All API routes validate input with zod schemas" --type pattern --tags "api,validation"`

**Error resolution:**
> User: "Remember that the build fails if you don't set NODE_ENV"
> → `store --content "Build fails without NODE_ENV set — must be explicitly configured in .env" --type error --tags "build,env"`

**Multiple items:**
> User: "Store the key decisions from this session"
> → Summarize each as a separate memory, store each with its own CLI call

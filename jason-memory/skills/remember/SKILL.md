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

4. **Store via Bash** (auto-dedup is built in — one call does everything):
   ```
   node "<cli-path>" store --content "The concise statement" --type <type> --tags "tag1,tag2"
   ```
   The CLI path is provided by the session-start hook — look for `Store:` in your session context.

5. **Check the `action` field** in the response:
   - `"created"` — new memory stored
   - `"superseded"` — replaced an older similar memory (shows `replaced_id`)
   - `"skipped"` — near-duplicate already exists (shows `existing_id`)

6. **Confirm** what happened to the user.

## Rules

- **One statement per memory** — don't dump paragraphs
- **Present tense** — "Uses Drizzle ORM" not "Decided to use Drizzle"
- **Separate memories** for multiple items — if the user says "remember these 3 things", make 3 separate CLI calls
- **No manual dedup needed** — the store command handles it automatically
- Use `--no-dedup` only if you explicitly want to bypass similarity checking

## Examples

**Single decision:**
> User: "Remember that we're using Tailwind instead of styled-components"
> → `store --content "Uses Tailwind CSS instead of styled-components for styling" --type decision --tags "styling,ui"`
> → Response: `{action: "created", stored: {...}}`

**Superseding a decision:**
> User: "Actually, we switched back to styled-components"
> → `store --content "Uses styled-components instead of Tailwind for styling" --type decision --tags "styling,ui"`
> → Response: `{action: "superseded", replaced_id: "m_...", stored: {...}}`

**Duplicate detected:**
> User: "Remember we use Tailwind"
> → `store --content "Uses Tailwind CSS for styling" --type decision --tags "styling"`
> → Response: `{action: "skipped", existing_id: "m_..."}`
> → Tell the user it's already stored

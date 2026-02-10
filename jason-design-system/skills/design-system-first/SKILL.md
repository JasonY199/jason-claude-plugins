---
name: design-system-first
description: Use when creating, editing, or improving any UI component, page, or layout — before writing any markup, styles, or new components
---

# Design System First

## Overview

Before writing ANY UI code, discover and catalog the project's existing design tokens and components. Use what exists. Only create new tokens or components when nothing suitable exists, and explain why first.

## When to Use

- Creating a new component or page
- Editing or restyling existing UI
- Adding visual elements (cards, badges, buttons, etc.)
- Theming, color, spacing, or typography changes

## Discovery Process

Before writing UI code, scan the project for its design system:

### 1. Design Tokens

Search for CSS custom properties and theme configuration:

- `globals.css`, `variables.css`, or similar (CSS custom properties, design tokens)
- `tailwind.config.*` (custom theme extensions: colors, spacing, fonts)
- Any `theme.*` files

### 2. Component Library

Search for existing reusable components:

- `components/ui/` (base primitives — buttons, inputs, cards, dialogs)
- `components/` (shared composite components)
- Any component index or barrel files

### 3. Existing Patterns

Scan 2-3 existing pages or components similar to what you're building to see which tokens and components they already use.

## Rules

1. **Use existing tokens over raw values** — never hardcode colors, spacing, font sizes, or radii when a token exists
2. **Use existing components over creating new ones** — check the component library before building from scratch
3. **Extend before creating** — if a component is close but not quite right, prefer adding a variant or prop over a new component
4. **Justify new additions** — if you must create a new token or component, explain why nothing existing works and propose it to the user before creating it
5. **Match existing patterns** — follow the conventions in existing components (naming, prop patterns, composition style)

## Common Mistakes

| Mistake                                               | Fix                                    |
| ----------------------------------------------------- | -------------------------------------- |
| Hardcoding `#hex` or `rgb()` values                   | Use the project's color tokens         |
| Writing `p-4 m-2` without checking spacing scale      | Read the spacing tokens first          |
| Creating a new Card when one exists                   | Search `components/ui/` first          |
| Adding inline `rounded-lg` when a radius token exists | Use the border-radius token            |
| Inventing a new button variant                        | Check if Button supports it via props  |
| Using arbitrary Tailwind values like `text-[14px]`    | Check if a font-size token covers this |

## Output

After scanning, briefly summarize to the user:

- **Relevant tokens found** — colors, spacing, typography that apply to this task
- **Relevant components found** — existing components you'll use or compose
- **Gaps identified** — anything needed that doesn't exist yet (propose before creating)

Then proceed with implementation using the discovered primitives.

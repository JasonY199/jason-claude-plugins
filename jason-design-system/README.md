# jason-design-system

Design-system-first skill — discover existing tokens and components before writing UI code.

## Overview

Before writing any UI code, this skill scans the project for existing design tokens (colors, spacing, typography) and reusable components. Use what exists. Only create new tokens or components when nothing suitable exists.

## Skills

### `/design-system-first`

Triggers automatically when creating, editing, or improving any UI component, page, or layout.

**What it does:**
1. Scans for design tokens — CSS custom properties, Tailwind config, theme files
2. Catalogs the component library — `components/ui/`, shared components, barrel files
3. Reviews existing patterns in similar pages/components
4. Summarizes relevant tokens, components, and gaps before you write code

## Rules

- **Use existing tokens** over raw values — never hardcode colors, spacing, or font sizes
- **Use existing components** over creating new ones
- **Extend before creating** — add a variant or prop before building from scratch
- **Justify new additions** — explain why nothing existing works before creating something new

## Installation

```
/plugin install jason-design-system@jason-claude-plugins
```

Restart Claude Code after installing.

## Author

Jason Y (https://github.com/JasonY199)

## Version

1.0.0

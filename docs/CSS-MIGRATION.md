# CSS Migration — Sass to Modern CSS

## What happened

The original theme used **Sass** (`.sass` files in `styles/`) compiled via Gulp, then later via Dart Sass CLI. The compiled output was a set of CSS files in `assets/`.

In this migration, every CSS file was **hand-rewritten** from the original Sass source into clean, modern CSS:

- **Native CSS nesting** replaces Sass indented syntax
- **CSS custom properties** (`var(--*)`) from `assets/design-tokens.css` replace all Sass variables (`$color`, `$spacing`, etc.)
- **Responsive typography tokens** — the type scale in `design-tokens.css` updates at `@media (width >= 1080px)`, so components just reference e.g. `var(--text-heading-2)` and get responsive sizing for free
- **Logical properties** (`margin-inline-start`, `padding-block`, etc.) used where they improve readability
- **Modern media query syntax** — `@media (width >= 770px)` range syntax
- **No `@extend` pollution** — each file is fully self-contained; no leaked selectors from shared Sass placeholders

## Key files

| File | Role |
|------|------|
| `assets/design-tokens.css` | Single source of truth for all design tokens |
| `assets/theme-new.css` | Global styles: reset, fonts, icons, forms, buttons, layout utilities, prose |
| `assets/*.css` | One self-contained file per section/component |

## Conventions

- **2-space indentation**
- **`&` nesting** for pseudo-elements, states, and child selectors
- **Token references** for all colours, spacing, radii, shadows, typography, motion
- **Breakpoints**: `350px` (xs), `550px` (s), `770px` (m), `1080px` (l), `1200px` (xl), `1400px` (xxl)
- Typography uses **`em`-based letter-spacing** (`--tracking-heading: -0.02em`) rather than computed pixel values

## Recovering Sass sources

The original Sass files are still in git history. To inspect them:

```bash
git log --all --oneline -- styles/
git show <commit>:styles/compile/theme-new.sass
```

The Sass sources are **not needed** for any current workflow. All CSS is now the direct source of truth.

## Browser baseline

Evergreen browsers (Chrome, Firefox, Safari, Edge). CSS nesting, `@container`, and range media queries are all supported.

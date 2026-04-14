# Playpress — Shopify theme

Online Store 2.0 theme built with Liquid, JSON templates, and a **modern CSS design system** powered by custom properties.

## Requirements

- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli)
- Node.js 18+ (for Theme Check and ESLint)

## Setup

```bash
npm install
```

## Local development

```bash
shopify theme dev --store="playpress"
```

## CSS architecture

There is **no build step** for CSS. All styles are plain, modern CSS with native nesting.

| File | Purpose |
|------|---------|
| `assets/design-tokens.css` | `:root` custom properties — colours, spacing, typography scale, radii, shadows, z-index, motion, button tokens. The type scale is **responsive** (tokens update at the `1080px` breakpoint). |
| `assets/theme-new.css` | Global bundle — font faces, reset, icon system, forms, button system, layout utilities, prose/typography hierarchy. |
| `assets/*.css` | One file per section/component, self-contained, using tokens from `design-tokens.css`. |

Edit CSS directly in `assets/`. Use `var(--*)` tokens from `design-tokens.css` for all values.

## Naming conventions

All files in `assets/` use **kebab-case** (`product-promo.css`, `add-to-cart.js`, `icon-arrow-right.svg`). CSS and JS files map 1:1 to their section/component name. Icons are prefixed `icon-`.

## Locales

`locales/en.default.json` — add more locale files as needed.

## Quality checks

| Command | Description |
|---------|-------------|
| `npm test` | `shopify theme check` |
| `npm run theme:check` | same |
| `npm run lint:js` | ESLint on `assets/**/*.js` |

## JavaScript

Plain DOM APIs, `fetch` for the Cart API, CSS transitions + `.is-visible` for modals.

## Deploy

GitHub deploy; duplicate the theme in admin for experiments.

## License

See `package.json`.

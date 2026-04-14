# Playpress — Shopify theme

Online Store 2.0 theme for the Playpress shop: Liquid layouts and sections, JSON templates, Sass-built CSS, and small browser scripts for cart, product gallery, and collection filtering.

## Requirements

- [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) (`shopify` command)
- Node.js 18+ (for Sass build, Theme Check, and ESLint)

## Setup

```bash
npm install
```

## Local development

Push the theme and watch changes (replace the store flag with yours):

```bash
shopify theme dev --store="playpress"
```

## CSS (Sass)

Source files live under `styles/` (partials and `styles/compile/*.sass`). Gulp compiles them into `assets/*.css`.

| Command        | Description                          |
|----------------|--------------------------------------|
| `npm run sass` | One-off compile (`gulp sass`)        |
| `npm run watch`| Rebuild on save (`gulp watch`)       |

The main global bundle is `styles/compile/theme-new.sass` → `assets/theme-new.css`. Many sections also ship their own compiled CSS file loaded from that section or a snippet.

## Locales

English copy is in `locales/en.default.json`. Add other locale files (e.g. `fr.json`) as needed for additional languages.

## Quality checks

| Command              | Description                    |
|----------------------|--------------------------------|
| `npm test`           | Runs `shopify theme check`     |
| `npm run theme:check`| Same as `npm test`             |
| `npm run lint:js`    | ESLint on `assets/**/*.js`     |

Theme Check config is in `.theme-check.yml` (some rules are relaxed for Shopify JSON with comment headers and third-party script patterns).

## JavaScript

Scripts in `assets/` are loaded from `layout/theme.liquid` or individual sections (often with `defer`). They use plain DOM APIs and the browser **`fetch` API** for Shopify Cart JSON endpoints (`/cart/add.js`, `/cart/change.js`, `/cart.js`). **GSAP and Axios were removed** — UI fades use CSS `transition` and an `.is-visible` class on `#cart-modal`, `#gallery-lightbox`, and `#filter-modal`.

## Deploy

The repo connects to GitHub for theme deployment. For experiments you do not want published, duplicate the theme in the Shopify admin before editing.

## License

See `package.json` (`license` field).

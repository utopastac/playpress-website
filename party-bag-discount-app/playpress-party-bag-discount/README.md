# Playpress Party Bag Discount App

Shopify app that applies tiered volume discounts to products in a party bag collection at checkout, using a [Discount Function](https://shopify.dev/docs/api/functions/latest/discount).

## What it does

- Merchants pick a **collection** and configure **quantity tiers** (e.g. 5+ items → 5% off).
- At checkout, the function sums quantities across eligible collection lines and applies the highest matching tier.
- Config is synced to a shop metafield (`party_bag.config`) so the theme party bag builder can show matching tier previews.

## Requirements

- Shopify **Plus** (custom app with Functions)
- Node.js 20+
- [Shopify CLI](https://shopify.dev/docs/api/shopify-cli)

## Setup

1. Create a **Party bag** collection in Shopify admin and add eligible products.

2. From this directory:

```bash
cd party-bag-discount-app/playpress-party-bag-discount
npm install
cd extensions/party-bag-discount && npm install && cd ../..
```

This project uses **npm** (not pnpm). Do not add `pnpm-workspace.yaml` — Shopify CLI will try to invoke `pnpm` and fail if it is not installed.

3. Link the app to your Partner account and dev store:

```bash
shopify app config link
```

4. Start local development:

```bash
shopify app dev
```

5. In the embedded app:
   - Select the party bag collection
   - Configure tiers
   - Click **Save discount**

6. In the theme editor, set the **Party bag collection** on the party bag builder section (same collection as the app).

## Deploy

```bash
shopify app deploy
```

Install the app on your production store (custom app, Plus required), then configure collection + tiers in the app admin.

## Project structure

```
extensions/party-bag-discount/   Discount Function (Wasm)
app/routes/app._index.tsx        Admin UI (collection + tiers)
app/services/                    Discount create/update + metafield sync
```

## Theme integration

The theme section `sections/party-bag-builder.liquid`:

- Lists products from the selected collection
- Reads tier preview data from `shop.metafields.party_bag.config` when the app has saved config
- Falls back to section tier settings for preview only

Checkout discounts are applied exclusively by the function — the theme preview is for UX only.

## Testing the function locally

```bash
cd extensions/party-bag-discount
npm run build
shopify app function run --input=tests/input.json --export=cart-lines-discounts-generate-run
```

Example input is in `extensions/party-bag-discount/tests/input.json`.

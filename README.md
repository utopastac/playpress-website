# Playpress website

The website of Playpress.

## Getting started

Install:

- [Node.js](https://nodejs.org/en/)

Create a `config.yml`:

```
development:
  password: xxx
  theme_id: "118890692800"
  store: playpress.myshopify.com
  ignore_files:
    - config/settings_data.json
    - config/settings_schema.json
    - en.default.json
```

Run these commands:

- `npm i` - install all dependencies
- `npm start` - start a development server

List available commands with: `npm run`.

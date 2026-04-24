# Camu Grade Sorter

An internal tool for matching students across Camu and Canvas, auto-filling marks, and generating Camu-upload-ready grade files.

## Development

```bash
npm install     # first-time setup
npm run dev     # start local dev server at http://localhost:5173
```

## Deploying to a production server

This is a **static site** — the output is a plain folder of HTML/CSS/JS files that can be served by any web server (nginx, Apache, Caddy, etc.).

### 1. Build

```bash
npm ci          # reproducible install from package-lock.json
npm run build   # production build → outputs to dist/
```

`npm ci` is preferred over `npm install` in production/CI environments because it installs exact versions from `package-lock.json` and fails fast if the lockfile is out of sync.

`npm run build` runs `vite build`, which already compiles in production mode (minification, tree-shaking, asset hashing). No extra flags are needed.

### 2. Deploy

Copy the contents of `dist/` to your web server's document root:

```bash
# Example: copy to a remote server
scp -r dist/* user@yourserver:/var/www/html/camu-grade-sorter/

# Example: copy to a local nginx directory
cp -r dist/* /usr/share/nginx/html/
```

> **Note:** The app is fully client-side — no backend or database required. Any static file host works (the university apps server, Vercel, Netlify, GitHub Pages, etc.).

## Tech stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- [SheetJS (xlsx)](https://sheetjs.com/) — XLSX read/write
- [pdf.js](https://mozilla.github.io/pdf.js/) — PDF parsing
- [PapaParse](https://www.papaparse.com/) — CSV parsing

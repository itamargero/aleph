# Aleph — Hebrew Heroes

A Hebrew-learning interactive prototype, served as a Next.js app on Vercel.

## How it works

The interactive app lives in `public/` as a static HTML page (`Hebrew Heroes.html`) plus its JSX/CSS/data files. The JSX is compiled in-browser via `@babel/standalone`, so no build step is required for the prototype itself.

Next.js wraps it so the project is one-click deployable on Vercel:

- `next.config.ts` rewrites `/` → `/Hebrew%20Heroes.html`
- All design assets live under `public/` and are served at the site root
- `app/page.tsx` is a no-op placeholder; the rewrite intercepts the request before it renders

## Local development

```bash
npm install
npm run dev
```

Visit http://localhost:3000.

## Deployment

Push to `main`. Vercel auto-detects the Next.js preset.

## Layout

```
app/                  # Next.js App Router shell (layout + no-op page)
public/               # Hebrew Heroes prototype (HTML, JSX, CSS, data)
design-reference/     # Original screenshots and source zip (reference only)
```

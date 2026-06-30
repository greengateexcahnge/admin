# Admin

A production-ready [Next.js](https://nextjs.org) (App Router) scaffold with
[Tailwind CSS v4](https://tailwindcss.com), [lucide-react](https://lucide.dev)
icons, and a warm **paper / cream** theme with **charcoal** ink. No pages are
designed — the foundation, theming, and structure are ready for you to build on.

## Stack

| Concern    | Choice                                   |
| ---------- | ---------------------------------------- |
| Framework  | Next.js 15 (App Router, Turbopack)       |
| Language   | TypeScript (strict)                      |
| Styling    | Tailwind CSS v4 (CSS-first `@theme`)     |
| Icons      | lucide-react                             |
| Font       | Inter (`next/font`, modern sans-serif)   |
| Utilities  | clsx + tailwind-merge (`cn`)             |
| Linting    | ESLint (next/core-web-vitals) + Prettier |

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script              | Description                       |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the dev server              |
| `npm run build`     | Production build                  |
| `npm run start`     | Run the production build          |
| `npm run lint`      | Lint with ESLint                  |
| `npm run typecheck` | Type-check without emitting       |
| `npm run format`    | Format with Prettier              |

## Theming

All design tokens live as CSS variables in
[`src/app/globals.css`](src/app/globals.css) and are mapped to Tailwind
utilities via `@theme inline`. Retheme the whole app by editing the variables in
`:root` — no need to touch components.

| Token            | Utility            | Purpose                       |
| ---------------- | ------------------ | ----------------------------- |
| `--paper`        | `bg-paper`         | App background (cream)        |
| `--paper-raised` | `bg-paper-raised`  | Cards / raised surfaces       |
| `--paper-sunken` | `bg-paper-sunken`  | Wells / muted blocks          |
| `--ink`          | `text-ink`         | Primary text / brand charcoal |
| `--ink-muted`    | `text-ink-muted`   | Secondary text                |
| `--line`         | `border-line`      | Hairline borders              |
| `--primary`      | `bg-primary`       | Charcoal interactive color    |

A dark variant is included (set `data-theme="dark"` on `<html>`); it reuses the
same tokens.

## Folder structure

```
admin/
├── public/                 # Static assets
├── src/
│   ├── app/                # App Router (routes, layouts, special files)
│   │   ├── layout.tsx      # Root layout — fonts, metadata, <body>
│   │   ├── page.tsx        # Placeholder home route
│   │   ├── globals.css     # Tailwind import + design tokens
│   │   ├── loading.tsx     # Route-level loading UI
│   │   ├── error.tsx       # Route-level error boundary
│   │   └── not-found.tsx   # 404
│   ├── components/
│   │   ├── ui/             # Reusable primitives (Button, …)
│   │   ├── layout/         # Shell pieces (sidebar, header, …)
│   │   └── icons.ts        # Central lucide-react icon registry
│   ├── config/
│   │   └── site.ts         # App name, URL, metadata defaults
│   ├── hooks/              # Reusable React hooks
│   ├── lib/
│   │   ├── api/            # Data-fetching helpers
│   │   ├── fonts.ts        # next/font configuration
│   │   └── utils.ts        # cn() + shared helpers
│   └── types/              # Shared TypeScript types
├── eslint.config.mjs
├── next.config.ts
├── postcss.config.mjs
├── tailwind (configured in globals.css — v4 needs no JS config)
└── tsconfig.json           # Path alias: @/* -> src/*
```

## Conventions

- Import from the `@/` alias (e.g. `@/lib/utils`, `@/components/ui/button`).
- Use icons through `@/components/icons` so the icon set stays centralized.
- Compose class names with `cn()`; keep variant logic in the component.

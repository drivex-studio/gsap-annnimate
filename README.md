<div align="center">

# Annnimate

**Production-grade GSAP components for React, Vue and HTML.**

Browse, preview live, copy the code, and ship motion that holds up on real client work.

[Live site](https://gsap-annnimate.vercel.app) · [Component library](https://gsap-annnimate.vercel.app/animations) · [Documentation](https://gsap-annnimate.vercel.app/docs) · [Roadmap](https://gsap-annnimate.vercel.app/roadmap)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![GSAP](https://img.shields.io/badge/GSAP-3.15-88CE02?logo=greensock&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)

</div>

---

## Overview

Annnimate is a curated library of GSAP motion components. Instead of rebuilding timing, interaction states, responsive behavior and reduced-motion handling from scratch, you find a component, see exactly how it moves, copy it in your preferred format, and adjust it with props or data attributes.

This repository contains the web platform behind the library: the public site, the live component previews, authentication, the code viewer, and the supporting API routes.

## Features

- **Live component library**: every animation runs in the browser before you copy it, with category filters and search.
- **Multiple output formats**: React (with `useGSAP`), Vue (composables) and plain HTML / CSS / JS.
- **Configurable**: tune behavior through props or `data-anm-*` attributes (duration, ease, type and more).
- **Accessible by default**: components respect `prefers-reduced-motion` and handle keyboard focus and ARIA where interactive.
- **Framework friendly**: works with the Next.js App Router, Nuxt, Astro and any modern JS setup.
- **Landmark Kits**: deeper, stand-alone motion systems built around one idea (for example, the Menu and Reveal kits).
- **Learning hub**: concepts, patterns and free tools covering easing, scroll, timelines, text, React and performance.
- **Accounts and saved items**: sign-in via Supabase, with the ability to save components.
- **Editor integration**: an MCP server lets you pull components straight into editors such as Cursor and Claude Code.

## Component categories

| Category | Examples |
| --- | --- |
| Buttons | Interactive and magnetic buttons |
| Scroll | Text Reveal, Image Fly In |
| UI Components | Circular Slider, Accordion |
| Menus | Mega Menu, Drawer Menu |
| Sections | Card Fan |
| Experimental | Dual Scramble |

## Tech stack

| Area | Technology |
| --- | --- |
| Framework | [Next.js](https://nextjs.org/) 16 (App Router), React 19 |
| Animation | [GSAP](https://gsap.com/), `@gsap/react`, [Lenis](https://lenis.darkroom.engineering/) smooth scroll |
| 3D / WebGL | three.js, `@react-three/fiber` |
| Styling | Tailwind CSS 4, `class-variance-authority`, `tailwind-merge`, `clsx` |
| UI primitives | Radix UI (Dialog, Tooltip, Dropdown Menu), Sonner, Phosphor and Lucide icons |
| Code viewer | CodeMirror 6 (HTML, CSS, JavaScript) |
| Backend | Supabase (auth and database via `@supabase/ssr`) |
| Email | Resend |
| Hosting | Vercel |

## Project structure

```text
src/
├── animations/        # Animation source: components, hooks and shared helpers
├── app/               # Next.js App Router
│   ├── animations/    # Library listing, [slug] detail pages and saved items
│   ├── api/           # Route handlers (animations, auth, events, geo,
│   │                  #   newsletter, sandbox, starter-pack, teams, ...)
│   ├── login/         # Authentication pages
│   ├── layout.jsx     # Root layout, fonts and theme bootstrap
│   └── provider.jsx   # App-wide providers
├── assets/            # Static assets used by the app
├── components/        # Site UI: landing, layout, navigation, pricing,
│                      #   paywall, login, globe, cookies, analytics, ui
├── hooks/             # Reusable React hooks
├── libs/              # Auth, config, editor, locales, Supabase clients, utils
├── providers/         # Context providers
└── styles/            # Global styles
public/
└── fonts/             # Self-hosted fonts (Geist, Geist Mono, Aktiv Grotesk, ...)
```

## Getting started

### Prerequisites

- Node.js 20.9 or later
- npm (or another Node package manager)
- A Supabase project for authentication and data

### Installation

```bash
git clone https://github.com/drivex-studio/gsap-annnimate.git
cd gsap-annnimate
npm install
```

### Environment variables

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

Additional keys (for example, for transactional email through Resend) may be required for features such as the newsletter. Never commit `.env*` files.

### Run locally

```bash
npm run dev
```

The app starts at [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the development server on port 3000 |
| `npm run build` | Create an optimized production build |
| `npm run start` | Serve the production build on port 3000 |

## Using a component

Components are designed to be copied into your own project. GSAP is required:

```bash
npm install gsap @gsap/react
```

A minimal React example with `useGSAP`:

```jsx
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

export default function Box() {
  const box = useRef(null);

  useGSAP(() => {
    gsap.to(box.current, { x: 200, duration: 1, ease: "expo.out" });
  });

  return <div ref={box} className="box" />;
}
```

The vanilla HTML version is configured through data attributes:

```html
<div data-anm-circular-slider
     data-anm-circular-slider-type="snap"
     data-anm-duration="0.9"
     data-anm-ease="back.out(1.4)">
  <img class="circular_slider_image" src="card-1.jpg" alt="" />
</div>
```

Full setup guides for React, Vue and HTML are in the [documentation](https://gsap-annnimate.vercel.app/docs).

## Deployment

The project is deployed on [Vercel](https://vercel.com/). To deploy your own instance:

1. Import the repository into Vercel.
2. Add the environment variables listed above.
3. Deploy. Vercel detects Next.js automatically.

## Contributing

1. Create a branch from `main` (for example, `feature/my-change`).
2. Make your changes and verify them with `npm run build`.
3. Open a pull request describing what changed and why.

## License

All rights reserved. The component library is a commercial product; see the [terms](https://gsap-annnimate.vercel.app/terms) on the live site for usage details.

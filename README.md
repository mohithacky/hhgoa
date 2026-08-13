# Hacker House Goa 2026 — Builder Pass

A web tool where you upload a photo and instantly get a branded HH Goa 2026 Builder ID Card. Frame yourself in Goa. `#FrameInGoa`

## What it does

1. Upload a photo (JPG, PNG, or HEIC from iPhone)
2. Enter your name and pick your stack
3. Get your Builder ID Card — a collectible event pass, not a generic badge
4. Download the pass as a real PNG file
5. Share on X with a pre-filled caption containing `#FrameInGoa`

No login. No signup. One pass and you're done.

## Tech

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (CSS-first token system)
- **Canvas 2D** for instant client-side card rendering + download
- **next/og** (`ImageResponse` / Satori) for server-side OG image generation
- **heic2any** for iPhone HEIC photo conversion (lazy-loaded)
- Self-hosted fonts: **Clash Display** (Indian Type Foundry), **Mukta** (Indian Type Foundry), **Space Mono**

## Design

The visual identity is structural HH Goa 2026:
- Deep palm green ground, kokum yellow signal, hot pink action
- Goan-arch photo frame + Indian block-print geometric borders
- Editorial asymmetric layout (vertical wordmark rail + card stage)
- One signature moment: the Lamination Stamp — the pass is "issued," not "generated"

## Development

```bash
npm run dev    # start dev server
npm run build  # production build
npm run start  # start production server
npm run lint   # eslint
```

## Deployment

Deploy to Vercel. No environment variables required for basic functionality.
The app works fully client-side; the `/api/og` route generates branded OG images for X sharing.

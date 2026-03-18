# Workspace

## Overview

AI Story Generator — a full-stack web app with mobile-first design, AI-powered story generation, voice narration, and interactive game mode.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/story-generator) at `/`
- **API framework**: Express 5 (artifacts/api-server) at `/api`
- **AI**: OpenAI via Replit AI Integrations (gpt-5.2 for text, gpt-image-1 for images, TTS for narration)
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Features

- **3 Story Modes**: Image Story Mode, Video Story Mode, Game Mode
- **5 Categories**: Nature, Princess, Anime, Travel, Custom
- **3 Languages**: English, Hindi, Gujarati
- **8+ Demo Stories**: Pre-built stories with rich scenes
- **AI Image Generation**: Per-scene images using gpt-image-1
- **Voice Narration**: TTS per scene using OpenAI audio
- **Game Mode**: Choice-based branching stories with quiz questions
- **Mobile-first UI**: Instagram Reels-style vertical full-screen scroll

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server
│   │   └── src/routes/
│   │       ├── health.ts   # GET /api/healthz
│   │       └── stories.ts  # POST /api/generate-story, POST /api/generate-story-image, POST /api/generate-narration, GET /api/demo-stories
│   └── story-generator/    # React + Vite frontend at /
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   ├── db/                 # Drizzle ORM schema + DB connection
│   ├── integrations-openai-ai-server/  # Server-side OpenAI integration
│   └── integrations-openai-ai-react/   # React hooks for OpenAI voice
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── tsconfig.json
└── package.json
```

## API Endpoints

- `GET /api/healthz` — Health check
- `POST /api/generate-story` — Generate AI story with scenes
- `POST /api/generate-story-image` — Generate image for a scene
- `POST /api/generate-narration` — Generate voice narration for text
- `GET /api/demo-stories` — Get 8 pre-built demo stories

## TypeScript & Composite Projects

Every package extends `tsconfig.base.json` which sets `composite: true`. The root `tsconfig.json` lists all lib packages as project references.

## Root Scripts

- `pnpm run build` — runs `typecheck` first, then recursively runs `build` in all packages
- `pnpm run typecheck` — runs `tsc --build --emitDeclarationOnly` using project references
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API types from OpenAPI spec

# Voice Word Jumper - Team 40

A browser-based **voice-controlled English word game for children**. The child speaks the target word to make the character jump to the matching platform - **voice is the only controller**. Part of a planned platform of voice-controlled word games.

- **Live MVP v0 (Google Cloud Run):** https://voice-word-jumper-316095696419.europe-west2.run.app/
- **AI Studio app:** https://ai.studio/apps/fc8f058b-d06c-43b9-8ede-540d02401714
- **License:** [MIT](./LICENSE) (see *Attribution* below)
- **Assignment 2 submission index:** [reports/week2/README.md](./reports/week2/README.md)
- **MVP v0 report:** [reports/week2/mvp-v0-report.md](./reports/week2/mvp-v0-report.md)

> **Browser support:** voice recognition uses the Web Speech API and is reliable only in **Google Chrome**. A non-voice "mouse-click jumps" fallback is available in other browsers.

## Tech stack

React 19 · Vite 6 · TypeScript · Tailwind CSS v4 · Web Speech API · Web Audio API

## Local setup

**Prerequisites:** Node.js 18+ and Google Chrome.

```bash
# 1. Install dependencies
npm install

# 2. Run the dev server (opens on http://localhost:3000)
npm run dev

# 3. Type-check / lint
npm run lint

# 4. Production build / preview
npm run build
npm run preview
```

No API key is required - the game runs fully client-side. (`.env.example` lists an optional `GEMINI_API_KEY` inherited from the AI Studio template, but it is **not** used by the current game code.) Allow microphone access when prompted; voice recognition needs a secure context (`localhost` or HTTPS).

## Repository layout

```
.
|-- LICENSE                 # MIT (repository), see Attribution
|-- README.md               # this file
|-- index.html              # Vite entry -> src/main.tsx
|-- package.json
|-- vite.config.ts
|-- src/
|   |-- App.tsx             # app shell, Web Speech wiring, settings/stats
|   |-- components/         # JumpGamePlay, VoiceStatus, DictionaryBar
|   `-- lib/                # audio.ts (Web Audio), vocabularies.ts (word matching)
`-- reports/week2/          # Assignment 2 deliverables (see index)
```

## Attribution

The application originates from the customer's (Danila Danko) Google AI Studio prototype of *Voice Word Jumper*. The original source files retain their `SPDX-License-Identifier: Apache-2.0` headers. Team 40 develops the product publicly under the **MIT** license at the repository level, with the customer's written consent to the public MIT-licensed development model (recorded in the [customer meeting summary](./reports/week2/customer-meeting-summary.md)). Apache-2.0 and MIT are compatible permissive licenses; original notices are preserved.

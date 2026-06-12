# Voice Word Games - Team 40

A browser-based **voice-controlled English learning portal for children**. The child speaks the target word to trigger in-game actions - **voice is the only controller**. Features two games: Voice Racer (lane racing) and Voice Bubble Popper, with more planned.

- **Live MVP v0:** _TODO - link will be added after the team deploys the new build_
- **AI Studio app:** _TODO - link will be added if the team publishes the app on AI Studio_
- **License:** [MIT](./LICENSE) (see *Attribution* below)
- **Assignment 2 submission index:** [reports/week2/README.md](./reports/week2/README.md)
- **MVP v0 report:** [reports/week2/mvp-v0-report.md](./reports/week2/mvp-v0-report.md)

> **Browser support:** voice recognition uses the Web Speech API and works only in **Google Chrome**; other browsers are not supported.

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

No API key is required - the game runs fully client-side. Allow microphone access when prompted; voice recognition needs a secure context (`localhost` or HTTPS).

## Repository layout

```
.
├── LICENSE                 # MIT (repository), see Attribution
├── README.md               # this file
├── index.html              # Vite entry -> src/main.tsx
├── package.json
├── vite.config.ts
├── src/
│   ├── App.tsx             # app shell, view routing (HUB / VOICE_RACER / BUBBLE_POPPER)
│   ├── data.ts             # built-in word categories
│   ├── types.ts            # shared TypeScript types
│   ├── utils.ts            # speech synthesis, word matching helpers
│   └── components/         # GameCanvas, BubblePopperGame, AudioVisualizer, CustomWordsManager
└── reports/week2/          # Assignment 2 deliverables (see index)
```

## License

This project is released under the [MIT License](./LICENSE).

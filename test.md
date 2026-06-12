# Voice Games - Team 40

A browser-based **voice-controlled English learning portal for children**. The child speaks the target word to trigger in-game actions - **voice is the only controller**. Features two games: Voice Racer (lane racing) and Voice Bubble Popper, with more planned.

- **Live MVP v0:** _TODO - link will be added after the team deploys the new build_
- **AI Studio app:** _TODO - link will be added if the team publishes the app on AI Studio_
- **License:** [MIT](./LICENSE) (see *Attribution* below)
- **Assignment 2 submission index:** [reports/week2/README.md](./reports/week2/README.md)
- **MVP v0 report:** [reports/week2/mvp-v0-report.md](./reports/week2/mvp-v0-report.md)

> **Browser support:** voice recognition uses the Web Speech API and works only in **Google Chrome**; other browsers are not supported.

## Tech stack

React 19 · Vite 6 · TypeScript · Tailwind CSS v4 · Web Speech API · Web Audio API · Docker · Python (http.server)

---

## 🛠 Setup & Deployment

No API key is required - the game runs fully client-side. Allow microphone access when prompted; voice recognition needs a secure context (`localhost` or HTTPS).

### 1. Local Development Setup
**Prerequisites:** Node.js 18+ and Google Chrome.

```bash
# Install dependencies
npm install

# Run the dev server (opens on http://localhost:3000)
npm run dev

# Type-check / lint
npm run lint

# Production build / preview
npm run build
npm run preview

```

### 2. Production Deployment via Docker

To bypass container network package-download bottlenecks on the VM, the project uses a hybrid multistage workflow: static assets are built on the host machine and served via a lightweight internal Python HTTP server container running in host-networking mode.

Execute this sequence in the project root (`~/voice-games`) on your VM:

```bash
# Build production assets on host
npm run build

# Rebuild the lightweight Docker image
docker build -t voice-games .

# Restart the container utilizing host networking
docker rm -f voice-app
docker run -d --name voice-app --network host --restart unless-stopped voice-games

```

* **Container Port:** `8085`
* **Status Check:** `docker ps`
* **Logs:** `docker logs voice-app`

### 3. Microphone Access on Remote VM (SSH Port Forwarding)

Since the Web Speech API requires a secure context, modern browsers **block microphone access** on remote HTTP IP addresses. To test the deployed build on a remote VM, bind the server port to your local computer's `localhost`:

1. Run this command in a terminal on your **local physical machine** (PowerShell / CMD / Terminal):

```bash
   ssh -L 8080:localhost:8085 root@<your_vm_name>

```

2. Keep this terminal window open/minimized.
3. Open Google Chrome and navigate to:
 **`http://localhost:8080`**

---

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
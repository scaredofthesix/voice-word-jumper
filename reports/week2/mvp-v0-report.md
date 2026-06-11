# MVP v0 Report - Voice Word Jumper (Team 40)

## Purpose and description
MVP v0 is the runnable, deployed technical foundation of **Voice Word Jumper** - a browser-based voice-controlled word game for children. It is a client-side React 19 + Vite + TypeScript application using the Web Speech API for recognition and the Web Audio API for sound synthesis. It is already a working, interactive product foundation (originating from the customer's AI Studio prototype) and is deployed publicly.

## Deployment URL / runnable artifact
- **Live deployment (Google Cloud Run):** https://voice-word-jumper-316095696419.europe-west2.run.app/
- **AI Studio app:** https://ai.studio/apps/fc8f058b-d06c-43b9-8ede-540d02401714
- Source in this repository: runnable locally via `npm install && npm run dev` (see [root README -> Local setup](../../README.md#local-setup)).

The deployment is internet-accessible and will remain available until the course has been graded.

## Public video demonstration
_TODO - sanitized public video, < 2 minutes (to be recorded by the team)._

## Relationship to the prototype and proposed MVP v1 stories
MVP v0 already realizes parts of the proposed MVP v1 core loop:
- **US-01** (start a game) - the menu / "Launch Jump Engine" entry.
- **US-02** (choose a game / content) - category and vocabulary selection in the Dictionary panel.
- **US-04** (pronounce a word to trigger the action) - speaking a platform's word makes the character jump (core Web Speech loop).
- **US-06** (immediate feedback) - "JUMP WORD MATCH" flash and voice-status panel.
- **US-07** (results) - the game-over / victory state with score and high scores.

The interactive prototype refines how these are presented as the proposed MVP v1 user experience (Home -> game selection -> main game with microphone interaction -> results).

## Current limitations, placeholders, and mocks
- **Chrome-only** voice recognition (Web Speech API); other browsers show a fallback notice and a mouse-click jump option.
- **Known matching flaw:** the matcher in `src/lib/vocabularies.ts` (`isSpeechMatch`) is intentionally permissive. Line ~378 (`tokens.some(t => t.startsWith(target) || target.startsWith(t))`) accepts a single prefix token - e.g. saying "s" can match "space" - and additional substring/phonetic rules can accept near-misses. This undermines the pronunciation-learning goal and is tracked as an open question (see [analysis.md](./analysis.md), affects US-04 / US-06).
- The `@google/genai` / `GEMINI_API_KEY` are leftovers from the AI Studio template and are **not** used by the game code.
- No backend: stats and settings persist only in browser `localStorage`; there is no parent/teacher account, progress sync, or custom word-list management yet (US-10, US-11).

## Local setup instructions
See [root README -> Local setup](../../README.md#local-setup). No API key required.

## Repeatable smoke-check scenario
**Type:** Web application.

**Access instructions:** open https://voice-word-jumper-316095696419.europe-west2.run.app/ in Google Chrome on a device with a microphone.

**Steps:**
1. Navigate to the deployment URL.
2. Confirm the home/menu screen renders (header "Voice Word Jumper", theme controls, Dictionary panel).
3. Click **Launch Jump Engine** and allow microphone access when prompted.
4. Confirm the game view appears with platforms showing target words and the voice-status panel becomes active.

**Expected result:** the application opens without errors, primary navigation works (menu -> playing), and the microphone-listening state activates. (Voice-driven jumping additionally requires speaking a visible word in Chrome.)

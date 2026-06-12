# MVP v0 Report - Voice Games (Team 40)

## Purpose and description
MVP v0 is the runnable technical foundation of **Voice Games** - a browser-based voice-controlled learning portal for children. It is a React 19 + Vite + TypeScript application featuring two games (Voice Racer and Voice Bubble Popper) controlled entirely by voice (Web Speech API). It runs fully client-side, with no backend.

## Deployment URL / runnable artifact
- **Live deployment:** _TODO - public link will be added after the team deploys the new build._
- **AI Studio app:** _TODO - link will be added if the team publishes the app on AI Studio_
- Source in this repository: runnable locally via `npm install && npm run dev` (see [root README -> Local setup](../../README.md#local-setup)).

## Public video demonstration
_TODO - sanitized public video, < 2 minutes (to be recorded by the team)._

## Relationship to the prototype and proposed MVP v1 stories
MVP v0 already realizes parts of the proposed MVP v1 core loop:
- **US-01** (start a game) - the HUB screen, where each game card has a PLAY button.
- **US-02** (choose a game / content) - choosing between Voice Racer and Voice Bubble Popper on the HUB, plus the TASK BOOK word-category selector and custom word lists.
- **US-04** (pronounce a word to trigger the action) - in Voice Racer, speaking a lane's word steers the car into that lane (core Web Speech loop); in Voice Bubble Popper, speaking a bubble's word pops it.
- **US-06** (immediate feedback) - the word-match flash and the voice-status panel showing what was heard.
- **US-07** (results) - the game-over / victory state with score and high scores.

The interactive prototype refines how these are presented as the proposed MVP v1 user experience (Home -> game selection -> main game with microphone interaction -> results).

## Current limitations, placeholders, and mocks
- **Chrome-only** voice recognition (Web Speech API); other browsers are not supported.
- **Word matching:** the matcher in `src/utils.ts` (`matchesWord`) uses phonetic and prefix rules. Overly permissive matching undermines the pronunciation-learning goal and is tracked as an open question (see [analysis.md](./analysis.md), affects US-04 / US-06).
- The `@google/genai` / `GEMINI_API_KEY` are leftovers from the AI Studio template and are **not** used by the game code.
- No backend: stats and settings persist only in browser `localStorage`; there is no parent/teacher account, progress sync, or custom word-list management yet (US-10, US-11).

## Local setup instructions
See [root README -> Local setup](../../README.md#local-setup). No API key required.

## Repeatable smoke-check scenario
**Type:** Web application (run locally until the public deployment link is added above).

**Access instructions:** clone this repository, run `npm install && npm run dev`, and open http://localhost:3000 in Google Chrome on a device with a microphone.

**Steps:**
1. Open http://localhost:3000.
2. Confirm the HUB screen renders with two game cards (Voice Racer, Voice Bubble Popper).
3. Click **PLAY** on the Voice Racer card, then click **START HIGHWAY RACE!** and allow microphone access when prompted.
4. Confirm the race track appears with lane target words and the microphone visualizer becomes active.

**Expected result:** the application opens without errors, primary navigation works (HUB -> playing), and the microphone-listening state activates. (Voice-driven lane changes additionally require speaking a visible lane word in Chrome.)

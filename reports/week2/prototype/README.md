# Prototype screens (SVG -> Figma)

Six ready-made screens for the Assignment 2 interactive prototype of **English Voice Games**. They cover the required flow **Home -> game selection -> main game (microphone interaction) -> results** and the MVP v1 stories: US-01, US-02, US-04, US-06, US-07, with US-03 and US-05 as in-screen states.

Figma's free Starter plan does not limit manual editing, so the prototype is assembled by hand in ~5 minutes from these files.

## Screens

| File | Screen | Stories |
|------|--------|---------|
| [01-home.svg](./01-home.svg) | Home - big PLAY button, mascot | US-01 |
| [02-game-selection.svg](./02-game-selection.svg) | Game selection - Jumper card + 2 "coming soon" | US-02 |
| [03-mic-permission.svg](./03-mic-permission.svg) | Microphone permission modal + denied fallback note | US-05 |
| [04-game-playing.svg](./04-game-playing.svg) | Main game - target word, platforms, listening pill | US-03, US-04 |
| [05-game-feedback.svg](./05-game-feedback.svg) | Success feedback - "GREAT!" banner, jumped mascot | US-06 |
| [06-results.svg](./06-results.svg) | Results - score, Play again / Home | US-07 |

## Assembly instructions (Figma)

1. Open the team Figma file: https://www.figma.com/design/zOC2O3B3IuW1YvMa222XuX (or any new design file).
2. Drag all six `.svg` files from this folder onto the canvas at once. Each becomes a 1280×800 frame; arrange them left-to-right in numeric order and rename frames to `01 Home` ... `06 Results`.
3. Switch the right panel to the **Prototype** tab and drag connection arrows:
   - `01 Home` -> PLAY button -> `02 Game selection`
   - `02 Game selection` -> "PLAY" on the Voice Racer card -> `03 Mic permission`; "← Home" -> `01 Home`
   - `03 Mic permission` -> "Allow microphone" -> `04 Game playing`
   - `04 Game playing` -> the ROCKET platform (simulates saying the word) -> `05 Game feedback`
   - `05 Game feedback` -> frame interaction **After delay 1500 ms** -> `06 Results`
   - `06 Results` -> "Play again" -> `04 Game playing`; "🏠 Home" -> `01 Home`
4. Set the flow starting point on `01 Home` (right-click -> *Add starting point*), name it `Child flow`.
5. **Share -> Anyone with the link -> can view**, copy the link and paste it into [reports/week2/README.md](../README.md) ("Interactive prototype" line).
6. Take screenshots of the assembled frames for `reports/week2/images/`.

> Note: in the real product the jump in step `04 -> 05` is triggered by **voice** (Web Speech API), not by click; the click hotspot only simulates a correct pronunciation in the prototype.

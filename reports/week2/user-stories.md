# User Stories - Voice Games (Team 40)

Product: a browser-based platform of **voice-controlled English word games for children**. A child must pronounce a target word correctly to trigger an in-game action - **voice is the only controller**, because children skip pronunciation tasks whenever another way to finish exists. Platform: **Voice Games** (games: Voice Racer, Voice Bubble Popper; currently Chrome-only).

> Stable IDs (`US-01`, `US-02`, ...) must never be changed, reused, or reassigned. Removed stories keep their IDs and are preserved below. Requirement Status (Active / Removed) is independent of MoSCoW priority.

## Roles / personas

- **Child learner** - primary user, roughly ages 6-10, learning English pronunciation through play. Cannot read long instructions; motivated by immediate, fun feedback.
- **Parent** - sets up the game for the child, cares about safety and visible learning progress.
- **Teacher** - uses the games in or after class, may want curated vocabulary aligned to lessons.

---

## US-01: Start a game from the home screen

Requirement Status: Active
MoSCoW priority: Must Have

As a child learner,
I want to open the app and start playing from a simple home screen,
so that I can begin a game quickly without help from an adult.

### Notes and constraints
- Home screen must be large-button, low-text, child-friendly.
- Entry point to the whole experience; first screen in the prototype.

## US-02: Choose which word game to play

Requirement Status: Active
MoSCoW priority: Must Have

As a child learner,
I want to pick a game from a small game-selection screen,
so that I can play the game I find most fun today.

### Notes and constraints
- For MVP v1 the primary playable games are Voice Racer and Voice Bubble Popper; additional games may appear as "coming soon".
- Selection screen is a distinct interface in the prototype.

## US-03: See the target word clearly

Requirement Status: Active
MoSCoW priority: Must Have

As a child learner,
I want to clearly see the word I have to say (with a picture where possible),
so that I know what to pronounce.

### Notes and constraints
- Large font, optional supporting image/icon.
- Realized as an element of the main game screen.

## US-04: Pronounce a word to trigger the in-game action

Requirement Status: Active
MoSCoW priority: Must Have

As a child learner,
I want my correct pronunciation of the target word to make the game act (e.g., steer the car into a lane),
so that my voice is the way I control and win the game.

### Notes and constraints
- Core gameplay loop. Uses the Web Speech API for recognition.
- **Open question / known risk:** voice matching tolerance must be calibrated — too permissive breaks the learning goal, too strict frustrates young learners (raised with the customer; see analysis.md).

## US-05: Grant microphone access easily

Requirement Status: Active
MoSCoW priority: Must Have

As a parent (on behalf of the child),
I want a clear microphone-permission prompt and a fallback message if access is denied,
so that the game can hear the child and we understand what to do if it cannot.

### Notes and constraints
- Microphone requires a secure (HTTPS) context.
- Represented as the "mic permission / mic denied" states in the game-screen prototype.

## US-06: Get immediate feedback on each attempt

Requirement Status: Active
MoSCoW priority: Must Have

As a child learner,
I want clear, immediate feedback showing whether my pronunciation was correct or not,
so that I learn from each attempt and stay motivated.

### Notes and constraints
- Success and error states must be visually distinct and encouraging.
- Feedback accuracy depends on resolving the US-04 matching flaw.

## US-07: See my results at the end of a round

Requirement Status: Active
MoSCoW priority: Must Have

As a child learner,
I want to see a simple results screen (e.g., words said correctly / score),
so that I feel a sense of achievement and want to play again.

### Notes and constraints
- Results screen is a distinct interface in the prototype, with a "play again" path.

## US-08: Retry a word I got wrong

Requirement Status: Active
MoSCoW priority: Should Have

As a child learner,
I want to retry a word I mispronounced,
so that I can practise it until I get it right.

### Notes and constraints
- Important for learning value, not essential for the first playable loop.

## US-09: Hear how the word should sound

Requirement Status: Active
MoSCoW priority: Should Have

As a child learner,
I want to hear a model pronunciation of the target word,
so that I can imitate it correctly.

### Notes and constraints
- Could use the Web Speech API speech-synthesis side.

## US-10: Review my child's progress

Requirement Status: Active
MoSCoW priority: Could Have

As a parent,
I want to see which words my child has practised and how they performed,
so that I can support their learning.

### Notes and constraints
- Requires storing per-session results; out of the first playable loop.

## US-11: Create a custom word list

Requirement Status: Active
MoSCoW priority: Could Have

As a teacher,
I want to define a custom list of words for the games,
so that practice matches my current lesson vocabulary.

### Notes and constraints
- Valuable for classroom use; adds content-management surface.

## US-12: Adjust difficulty level

Requirement Status: Active
MoSCoW priority: Could Have

As a parent,
I want to choose a difficulty level (word length / speed),
so that the challenge fits my child's age and ability.

## US-13: Play on any browser

Requirement Status: Active
MoSCoW priority: Won't Have

As a child learner,
I want to play in any browser (Firefox, Safari, mobile),
so that I am not restricted to Google Chrome.

### Notes and constraints
- **Won't Have for the course:** voice recognition relies on the Web Speech API, whose reliable support is effectively Chrome-only. Full cross-browser parity is intentionally excluded from the intended product scope for the duration of the course. Will be revisited as a future direction.

---

## Removed stories

## US-14: Real-time multiplayer voice race

Requirement Status: Removed
Previous MoSCoW priority: Could Have

As a child learner,
I want to race another child in real time by pronouncing words faster,
so that the game is more competitive and social.

Reason: Removed as a candidate requirement during Assignment 2. It requires real-time networking and matchmaking that are infeasible within the course timeframe and divert effort from the core single-player learning loop. Recorded here per the stable-ID rules; ID US-14 is retired, not reused.

---

## Initial proposed MVP v1 scope

A small, playable core loop selected **only from Must Have** stories. It spans all four prototype screens (Home -> game selection -> main game with microphone interaction -> results):

- **US-01** - Start a game from the home screen
- **US-02** - Choose which word game to play
- **US-04** - Pronounce a word to trigger the in-game action (core mic interaction)
- **US-06** - Get immediate feedback on each attempt
- **US-07** - See my results at the end of a round

Supporting Must-Have stories **US-03** (see the target word) and **US-05** (microphone permission) are realized as elements and states *within* the main game screen of the same prototype, so the prototype covers them without listing them as separate scope items.

> This is an initial proposal, not a final delivery commitment. It will be refined, estimated, and finalized in Assignment 3.

# Assignment 2 - Week 2 Report (Team 40)

**Project:** English Voice Games - a browser-based platform of voice-controlled English word games for children (games: *Voice Racer*, *Bubble Popper*).
**License:** [MIT](../../LICENSE)

> This file is the public index for the Assignment 2 submission. Substantive content lives in the dedicated files linked below.

## User stories & MVP v1 scope
- [User stories](./user-stories.md) - 10+ stories with stable IDs, MoSCoW priorities, and the initial proposed MVP v1 scope.

## Prototype & interface artifacts (graphical product)
- Interactive prototype (Figma): _TODO - public view-only link after assembly_
- Prototype screen sources + 5-minute Figma assembly guide: [./prototype/](./prototype/README.md) (6 SVG screens, drag-and-drop into the team Figma file).
- Screens covered: Home -> game selection -> main game (microphone interaction) -> results.

## MVP v0
- [MVP v0 report](./mvp-v0-report.md)
- Deployment URL (Google Cloud Run): https://voice-word-jumper-316095696419.europe-west2.run.app/
- AI Studio app: https://ai.studio/apps/fc8f058b-d06c-43b9-8ede-540d02401714
- Public video demonstration (<2 min): _TODO_
- Run instructions: [root README](../../README.md#local-setup)

## Workflow & link checking
- Minimal PR template: [.github/PULL_REQUEST_TEMPLATE.md](../../.github/PULL_REQUEST_TEMPLATE.md)
- PRs through the protected-branch workflow: [PR #1 - ci: add missing Lychee link-check workflow](https://github.com/scaredofthesix/voice-word-jumper/pull/1) (Lychee check passed, squash-merged). Reviewed PR with teammate review: _TODO - link once a teammate reviews an open PR_.
- Default branch `main` is protected: merges only via pull request with one required approving review, required "Lychee link checker" status check, rules enforced for administrators, force pushes and branch deletion disabled.
- Lychee configuration: [lychee.toml](../../lychee.toml) · Workflow: [.github/workflows/links.yml](../../.github/workflows/links.yml) · Latest successful protected-branch run: [run 27288376055](https://github.com/scaredofthesix/voice-word-jumper/actions/runs/27288376055)
- **Excluded Lychee links + justification:**
  - `localhost` / `127.0.0.1` - dev-only URLs not reachable from CI.
  - `https://ai.studio/...` - AI Studio app pages require an authenticated Google session and redirect anonymous CI runners; **manually verified in a browser** (loads the English Voice Games app).
  - `https://www.figma.com/design/...` - Figma returns 403 Forbidden to anonymous clients until public link sharing is enabled on the file; **manually verified in the Figma editor** (the team prototype file opens).

## Customer review
- [Customer meeting summary](./customer-meeting-summary.md)
- Transcript: _published transcript link, or note that it is Moodle-only / replaced by notes_
- Notes (if recording/private sharing refused): _customer-meeting-notes.md_

## Analysis & LLM usage
- [Week 2 analysis](./analysis.md)
- [LLM usage report](./llm-report.md)

## Screenshots (from ./images/)
- Protected default branch settings: _TODO_
- Example reviewed PR/MR: _TODO_
- Selected prototype & interface artifacts: _TODO_
- Deployed MVP v0 / runnable artifact: _TODO_

## Coverage
- **Prototype** covers stable IDs: US-01, US-02, US-04, US-06, US-07 (with US-03, US-05 as in-screen states).
- **MVP v0** foundation relationship to stories: see [mvp-v0-report.md](./mvp-v0-report.md) and its repeatable smoke check.

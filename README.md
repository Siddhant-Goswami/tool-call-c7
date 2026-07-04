# The Protocol Lab — From tool call to MCP

Interactive Socratic lesson for **100xEngineers Cohort 7 · L14**. One thing per screen: a question, then a felt failure, then an exercise, then the reveal — until the class derives MCP itself.

Built on the 100x design system, same architecture as [memory-lab](https://github.com/Siddhant-Goswami/memory-lab): linear step player, sidebar modules that unlock as you progress, quiz gating, progress persisted in `localStorage`.

## Modules

1. **Start here** — the hook + live crack harvest
2. **The "when" crack** — v1 simulator → receptionist game → tool-definition builder → function calling
3. **The two-pass loop** — layer stepper → checkpoint quizzes
4. **Bad arguments** — rambling-prompt provocation → fix toggles → the retry loop
5. **The scale wall** — M×N wiring grid → spec-the-standard → MCP reveal
6. **Two paths, one shape** — n8n + Python converge
7. **What v2 breaks** — guess-then-flip cards
8. **Ship it** — practice set

## Run it

Static site — no build.

```bash
python3 -m http.server 8000
```

`index.html` · `css/tokens.css` (100x design system) · `css/app.css` · `js/data.js` (content) · `js/app.js` (player + widgets)

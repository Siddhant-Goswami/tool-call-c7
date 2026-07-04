# L14 · Deriving the Protocol — From Tool Call to MCP

Interactive Socratic lecture app for **100xEngineers Cohort 7 · LLM Deep Dive, Part 2 · Live Lecture 14** (04 Jul 2026, 6:00–8:00 PM IST).

Every crack the students documented in the v1 deterministic ⇄ probabilistic interface becomes one segment of the session, and every segment follows the same Socratic arc:

1. **❓ The Question** — the crack, asked to the room before anything is explained
2. **🔥 Feel it** — a live simulator that makes the failure hurt (real-world framing: the receptionist, the rambling voice note, the M×N glue grid)
3. **🔧 Exercise** — the room solves it by hand (routing game, tool-definition linter, layer-tagging quiz, upgrade toggles, spec checklist)
4. **💡 The Reveal** — gated behind a click so the name never arrives before the derivation: *derive before name, all the way down*

## The arc

| Segment | Crack | Derived fix | Earned name |
|---|---|---|---|
| 02 | Every message triggers the tool | Tool menu + structured intent | Function calling |
| 03 | Who touches the internet? | Two-pass loop across three layers | — |
| 04 | Hallucinated args, garbage in | Contract validation + error fed back | The (unnamed) loop |
| 05 | M tools × N models glue explosion | A standard in the middle: discovery, invocation, resources, prompts, transport | **MCP** |
| 06 | — | n8n path + thin-server path converge on one diagram | — |
| 07 | v2's new cracks | Honest expectations, harvested first | Road map for the module |

## Run it

Static site — no build, no dependencies.

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Navigate with ← / → or the sidebar. The crack board, practice-set checklist, and section progress persist in `localStorage`. The stopwatch in the top bar tracks the live session against each segment's IST window.

## Stack

Vanilla HTML / CSS / JS. `index.html` · `styles.css` · `app.js`.

/* ============================================================
   L14 · Deriving the Protocol — app logic (vanilla JS)
   ============================================================ */
"use strict";

const $  = (s, el) => (el || document).querySelector(s);
const $$ = (s, el) => Array.from((el || document).querySelectorAll(s));

const store = {
  get(k, d) { try { const v = localStorage.getItem("l14." + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem("l14." + k, JSON.stringify(v)); } catch (e) {} }
};

const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ============================================================
   1 · NAVIGATION
   ============================================================ */
const slides = $$(".slide");
const navList = $("#navList");
const sectionClock = $("#sectionClock");
let visited = new Set(store.get("visited", []));
let cur = Math.min(store.get("slide", 0), slides.length - 1);

slides.forEach((sl, i) => {
  const b = document.createElement("button");
  b.className = "nav-item";
  b.innerHTML =
    '<span class="row1"><span class="num">' + sl.dataset.num + '</span><span>' + esc(sl.dataset.title) +
    '</span><span class="visited-tick">✔</span></span><span class="row2">' + esc(sl.dataset.clock) + "</span>";
  b.addEventListener("click", () => { go(i); $("#nav").classList.remove("open"); });
  navList.appendChild(b);

  // pager
  const pager = document.createElement("div");
  pager.className = "pager";
  const prev = document.createElement("button");
  prev.className = "btn ghost";
  prev.textContent = i === 0 ? "" : "← " + slides[i - 1].dataset.title;
  if (i === 0) prev.style.visibility = "hidden";
  prev.addEventListener("click", () => go(i - 1));
  const next = document.createElement("button");
  next.className = "btn primary";
  next.textContent = i === slides.length - 1 ? "Dismiss on time ✔" : slides[i + 1].dataset.title + " →";
  next.addEventListener("click", () => { if (i < slides.length - 1) go(i + 1); });
  pager.appendChild(prev); pager.appendChild(next);
  sl.appendChild(pager);
});

function go(i) {
  if (i < 0 || i >= slides.length) return;
  cur = i;
  slides.forEach((sl, j) => sl.classList.toggle("current", j === i));
  $$(".nav-item", navList).forEach((b, j) => {
    b.classList.toggle("active", j === i);
    b.classList.toggle("visited", visited.has(j));
  });
  visited.add(i);
  store.set("visited", Array.from(visited));
  store.set("slide", i);
  sectionClock.textContent = slides[i].dataset.clock;
  $("#main").scrollTo({ top: 0 });
}

document.addEventListener("keydown", e => {
  if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
  if (e.key === "ArrowRight") go(cur + 1);
  if (e.key === "ArrowLeft") go(cur - 1);
});
$("#menuBtn").addEventListener("click", () => $("#nav").classList.toggle("open"));

/* reveal gates */
$$(".gate").forEach(g => g.addEventListener("click", () => {
  g.style.display = "none";
  g.nextElementSibling.classList.remove("hidden");
}));

/* ============================================================
   2 · STOPWATCH
   ============================================================ */
(function stopwatch() {
  const btn = $("#swToggle"), rst = $("#swReset");
  let acc = 0, t0 = null, tick = null;
  const fmt = s => {
    const m = Math.floor(s / 60), ss = s % 60;
    return String(m).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
  };
  const render = () => {
    const total = Math.floor((acc + (t0 ? Date.now() - t0 : 0)) / 1000);
    btn.textContent = (t0 ? "⏸ " : "▶ ") + fmt(total);
  };
  btn.addEventListener("click", () => {
    if (t0) { acc += Date.now() - t0; t0 = null; clearInterval(tick); btn.classList.remove("running"); }
    else { t0 = Date.now(); tick = setInterval(render, 500); btn.classList.add("running"); }
    render();
  });
  rst.addEventListener("click", () => { acc = 0; if (t0) t0 = Date.now(); render(); });
  render();
})();

/* ============================================================
   3 · CRACK HARVEST BOARD  (Section 0)
   ============================================================ */
(function harvest() {
  const PRESETS = [
    "No decision layer — every message triggers the tool",
    "Hallucinated arguments",
    "Wrong entity extraction from rambling input",
    "What happens at 100 tools?",
    "Context window limits",
    "Security — anything can trigger real actions"
  ];
  const list = $("#crackList"), empty = $("#crackEmpty"), chips = $("#crackChips");
  let cracks = store.get("cracks", []);

  function render() {
    list.innerHTML = "";
    empty.style.display = cracks.length ? "none" : "block";
    cracks.forEach((c, i) => {
      const li = document.createElement("li");
      li.innerHTML = "<span>" + esc(c.text) + "</span>" +
        (c.name ? ' <span class="credit">— ' + esc(c.name) + "</span>" : "") +
        '<button class="del" title="remove">✕</button>';
      $(".del", li).addEventListener("click", () => { cracks.splice(i, 1); save(); });
      list.appendChild(li);
    });
    $$(".chip", chips).forEach(ch =>
      ch.classList.toggle("used", cracks.some(c => c.text === ch.dataset.text)));
  }
  function save() { store.set("cracks", cracks); render(); }
  function add(text, name) {
    text = text.trim();
    if (!text) return;
    cracks.push({ text: text, name: (name || "").trim() });
    save();
  }

  PRESETS.forEach(p => {
    const b = document.createElement("button");
    b.className = "chip"; b.dataset.text = p; b.textContent = "+ " + p;
    b.addEventListener("click", () => add(p, ""));
    chips.appendChild(b);
  });
  $("#crackAdd").addEventListener("click", () => {
    add($("#crackInput").value, $("#crackName").value);
    $("#crackInput").value = ""; $("#crackName").value = "";
    $("#crackInput").focus();
  });
  $("#crackInput").addEventListener("keydown", e => { if (e.key === "Enter") $("#crackAdd").click(); });
  render();
})();

/* ============================================================
   4 · V1 SIMULATOR  (Section 1)
   ============================================================ */
const CITY_DB = {
  bengaluru: "23°C · scattered clouds", bangalore: "23°C · scattered clouds",
  delhi: "41°C · haze", mumbai: "31°C · humid", chennai: "34°C · sunny",
  london: "14°C · drizzle", tokyo: "22°C · clear", paris: "18°C · cloudy",
  hyderabad: "33°C · partly cloudy", pune: "28°C · clear"
};

(function v1sim() {
  const stages = [$("#v1s0"), $("#v1s1"), $("#v1s2"), $("#v1s3")];
  const verdict = $("#v1Verdict");
  let runToken = 0;

  function extract(msg) {
    const lower = msg.toLowerCase();
    for (const city of Object.keys(CITY_DB)) {
      if (lower.includes(city)) return { city: city, real: true };
    }
    // v1 has one job: extract a city. It will find one. Somewhere.
    const num = msg.match(/\d+/);
    if (num) return { city: num[0], real: false };
    const words = msg.replace(/[^a-zA-Z ]/g, " ").trim().split(/\s+/).filter(w => w.length > 2);
    const pick = words.length ? words[words.length - 1] : "Unknown";
    return { city: pick.charAt(0).toUpperCase() + pick.slice(1), real: false };
  }

  function setStage(i, html, cls) {
    const st = stages[i];
    st.classList.remove("err", "okk");
    if (cls) st.classList.add(cls);
    st.classList.add("active");
    $(".out", st).innerHTML = html;
  }

  function run(msg) {
    msg = (msg || "").trim();
    if (!msg) return;
    const token = ++runToken;
    stages.forEach(s => { s.classList.remove("active", "err", "okk"); $(".out", s).innerHTML = ""; });
    verdict.className = "sim-verdict";
    const ex = extract(msg);
    const step = (delay, fn) => setTimeout(() => { if (token === runToken) fn(); }, delay);

    step(50, () => setStage(0, "“" + esc(msg) + "”"));
    step(650, () => setStage(1, 'prompt: <span class="bad">"extract the city"</span><br>→ city: "' + esc(ex.city) + '"', ex.real ? null : "err"));
    if (ex.real) {
      step(1300, () => setStage(2, 'GET /weather?q=' + esc(ex.city) + '<br><span class="good">200 · ' + CITY_DB[ex.city] + "</span>", "okk"));
      step(1950, () => {
        setStage(3, '<span class="good">“It’s ' + CITY_DB[ex.city] + " in " + esc(ex.city.charAt(0).toUpperCase() + ex.city.slice(1)) + " right now.”</span>", "okk");
        verdict.className = "sim-verdict good show";
        verdict.innerHTML = "✓ Looks fine… <strong>because the input happened to be a weather question.</strong> v1 got lucky, not smart. Now run the other presets.";
      });
    } else {
      step(1300, () => setStage(2, 'GET /weather?q=' + esc(ex.city) + '<br><span class="bad">404 · city not found</span>', "err"));
      step(1950, () => {
        setStage(3, '<span class="bad">“Sorry, I couldn’t find weather for ‘' + esc(ex.city) + "’.”</span>", "err");
        verdict.className = "sim-verdict bad show";
        verdict.innerHTML = "✗ Nothing decided <strong>whether</strong> a tool was needed. The LLM is an extraction proxy: it was told to find a city, so it found… <strong>“" + esc(ex.city) + "”</strong>. There is no “when” layer.";
      });
    }
  }

  $$("[data-v1]").forEach(b => b.addEventListener("click", () => { $("#v1Input").value = b.dataset.v1; run(b.dataset.v1); }));
  $("#v1Run").addEventListener("click", () => run($("#v1Input").value));
  $("#v1Input").addEventListener("keydown", e => { if (e.key === "Enter") run($("#v1Input").value); });
})();

/* ============================================================
   5 · RECEPTIONIST GAME  (Section 1, Exercise A)
   ============================================================ */
(function deskGame() {
  const ITEMS = [
    { msg: "“good morning! ☀️”", route: false, why: "Small talk. The receptionist answers directly — no department needed. v1 would have routed this to Weather." },
    { msg: "“will it rain in Mumbai tonight?”", route: true, why: "Weather department. Slip needs: city = Mumbai. Name + description matched the request." },
    { msg: "“what is 2 + 2?”", route: false, why: "The model can answer this itself. No tool adds anything — routing it is pure waste (and where the absurdity above came from)." },
    { msg: "“how hot is it in Delhi right now?”", route: true, why: "Weather again — ‘hot’, ‘right now’ → current conditions. Slip: city = Delhi." },
    { msg: "“explain what an API is”", route: false, why: "Knowledge the model already has. Answer directly." },
    { msg: "“check the weather for my cousin’s place”", route: false, why: "Trick one: it IS a weather ask, but the slip can’t be filled — no city. The receptionist asks a follow-up question instead of guessing. Hold this thought for Segment 04." }
  ];
  const host = $("#deskGame"), score = $("#deskScore");
  let done = 0, right = 0;

  ITEMS.forEach(it => {
    const row = document.createElement("div");
    row.className = "game-row";
    row.innerHTML = '<span class="msg">' + it.msg + '</span>' +
      '<span class="choices"><button class="choice" data-r="0">🗣 Answer directly</button>' +
      '<button class="choice" data-r="1">📋 Routing slip</button></span>' +
      '<span class="why">' + esc(it.why) + "</span>";
    $$(".choice", row).forEach(ch => ch.addEventListener("click", () => {
      const picked = ch.dataset.r === "1";
      row.classList.add("done");
      ch.classList.add("picked", picked === it.route ? "right" : "wrong");
      if (picked !== it.route) $('[data-r="' + (it.route ? 1 : 0) + '"]', row).classList.add("answer");
      done++; if (picked === it.route) right++;
      score.textContent = right + " / " + done + " routed correctly" +
        (done === ITEMS.length ? " — that judgment is exactly what we now hand to the model." : "");
    }));
    host.appendChild(row);
  });
})();

/* ============================================================
   6 · TOOL BUILDER  (Section 1, Exercise B)
   ============================================================ */
(function builder() {
  const name = $("#tbName"), desc = $("#tbDesc"), city = $("#tbCity"), req = $("#tbReq");
  const nameLint = $("#tbNameLint"), descLint = $("#tbDescLint"), schemaLint = $("#tbSchemaLint");
  const preview = $("#tbPreview"), verdict = $("#tbVerdict");

  function lint() {
    const n = name.value.trim();
    let nOk = false;
    if (!n) { nameLint.textContent = ""; nameLint.className = "lint"; }
    else if (!/^[a-z][a-z0-9_]*$/.test(n)) { nameLint.textContent = "✗ not dispatchable — snake_case identifier, no spaces. “the weather thing” can’t be dispatched on."; nameLint.className = "lint bad"; }
    else if (n.length < 4) { nameLint.textContent = "✗ too cryptic to read in a log"; nameLint.className = "lint bad"; }
    else { nameLint.textContent = "✓ stable identifier — the execution environment can dispatch on this"; nameLint.className = "lint ok"; nOk = true; }

    const d = desc.value.trim();
    let dOk = false;
    if (!d) { descLint.textContent = ""; descLint.className = "lint"; }
    else if (d.length < 30) { descLint.textContent = "✗ too thin — a weak description is how hallucinated calls are born"; descLint.className = "lint bad"; }
    else if (!/\bwhen\b/i.test(d)) { descLint.textContent = "✗ says WHAT, not WHEN. The description is the routing intelligence — tell the model when this tool is the right choice (try the word “when”)."; descLint.className = "lint bad"; }
    else { descLint.textContent = "✓ answers “when” — your receptionist can route on this"; descLint.className = "lint ok"; dOk = true; }

    const sOk = city.checked && req.checked;
    schemaLint.textContent = sOk ? "✓ the contract the deterministic side will enforce"
      : (city.checked || req.checked) ? "… declare the type AND mark it required — an optional city is a guess waiting to happen" : "";
    schemaLint.className = "lint " + (sOk ? "ok" : "bad");

    preview.textContent = JSON.stringify({
      name: n || "…",
      description: d || "…",
      parameters: {
        type: "object",
        properties: city.checked ? { city: { type: "string" } } : {},
        required: req.checked ? ["city"] : []
      }
    }, null, 2);

    if (nOk && dOk && sOk) {
      verdict.className = "builder-verdict pass";
      verdict.innerHTML = "✔ <strong>Routable.</strong> Name to dispatch on, description that answers <em>when</em>, schema as a contract. This entry goes in the menu — reveal below to see where the menu lives.";
    } else {
      verdict.className = "builder-verdict";
      verdict.innerHTML = "Waiting… would <em>your</em> receptionist know when to route to this?";
    }
  }
  [name, desc].forEach(el => el.addEventListener("input", lint));
  [city, req].forEach(el => el.addEventListener("change", lint));
  lint();
})();

/* ============================================================
   7 · TWO-PASS LOOP STEPPER  (Section 2)
   ============================================================ */
(function stepper() {
  const STEPS = [
    {
      tab: "1 · Pass 1 — the decision",
      layers: [1],
      code: 'resp = client.chat.completions.create(\n    model=MODEL,\n    messages=[{"role": "user", "content": "weather in Bengaluru?"}],\n    tools=[GET_WEATHER_TOOL],        # the menu from Segment 02\n)\n\n# raw response — the model returns tool_calls, NOT text:\n>>> resp.choices[0].message.tool_calls[0]\n{ "name": "get_weather", "arguments": "{\\"city\\": \\"Bengaluru\\"}" }',
      note: "<strong>Pause here.</strong> This is the receptionist filling the routing slip. An intent was emitted. Nothing has happened yet."
    },
    {
      tab: "2 · Execution",
      layers: [2, 3],
      code: 'args = json.loads(call.function.arguments)\nweather = fetch_openweathermap(args["city"])   # our L13 automation\n\n>>> weather\n{ "city": "Bengaluru", "temp_c": 23, "sky": "scattered clouds" }',
      note: "The backend parses the intent and makes the HTTP call. <strong>The LLM is not involved.</strong> Point at layer 2: this is the execution environment doing the only thing it knows — deterministic work."
    },
    {
      tab: "3 · Pass 2 — the voice",
      layers: [1],
      code: 'messages += [resp.choices[0].message,\n             {"role": "tool", "tool_call_id": call.id,\n              "content": json.dumps(weather)}]\nfinal = client.chat.completions.create(model=MODEL, messages=messages)\n\n>>> final.choices[0].message.content\n"It’s 23°C with scattered clouds in Bengaluru right now."',
      note: "Append the tool result as a <code class='inline'>tool</code> message and call the model again. It answers in natural language, <strong>grounded in real data</strong>."
    },
    {
      tab: "4 · The control test",
      layers: [1],
      code: '# same code, different question:\n>>> ask("what is 2 + 2?")\n\nresp.choices[0].message.tool_calls   →  None\nresp.choices[0].message.content      →  "4."',
      note: "The model answers directly — <strong>no tool call</strong>. The “when” layer exists. Crack 1 is closed, live, in front of them."
    }
  ];
  const tabs = $("#loopTabs"), codeEl = $("#loopCode"), noteEl = $("#loopNote");
  const boxes = { 1: $(".l1", $("#loopLayers")), 2: $(".l2", $("#loopLayers")), 3: $(".l3", $("#loopLayers")) };
  let idx = 0;
  const seen = new Set();

  STEPS.forEach((s, i) => {
    const b = document.createElement("button");
    b.className = "step-tab"; b.textContent = s.tab;
    b.addEventListener("click", () => show(i));
    tabs.appendChild(b);
  });
  function show(i) {
    idx = i; seen.add(i);
    $$(".step-tab", tabs).forEach((b, j) => {
      b.classList.toggle("active", j === i);
      b.classList.toggle("seen", seen.has(j));
    });
    codeEl.textContent = STEPS[i].code;
    noteEl.innerHTML = STEPS[i].note;
    [1, 2, 3].forEach(L => boxes[L].classList.toggle("lit", STEPS[i].layers.includes(L)));
    $("#loopPrev").disabled = i === 0;
    $("#loopNext").textContent = i === STEPS.length - 1 ? "Loop complete ✔" : "Next step →";
  }
  $("#loopPrev").addEventListener("click", () => show(Math.max(0, idx - 1)));
  $("#loopNext").addEventListener("click", () => show(Math.min(STEPS.length - 1, idx + 1)));
  show(0);
})();

/* ============================================================
   8 · POLLS + TAG QUIZ  (Sections 2 & 3)
   ============================================================ */
function wirePoll(pollId, whyId, correctVal) {
  const poll = $("#" + pollId);
  $$(".opt", poll).forEach(o => o.addEventListener("click", () => {
    poll.classList.add("locked");
    $$(".opt", poll).forEach(x => {
      if (x.dataset.val === correctVal) x.classList.add("right");
      else if (x === o) x.classList.add("wrong-pick");
    });
    $("#" + whyId).classList.add("show");
  }));
}
wirePoll("netPoll", "netPollWhy", "0");
wirePoll("layerPoll", "layerPollWhy", "l2");

(function tagQuiz() {
  const EVENTS = [
    { evt: 'chose to call get_weather instead of answering', ans: "llm" },
    { evt: 'parsed {"city": "Bengaluru"} out of the intent', ans: "exec" },
    { evt: "HTTP GET api.openweathermap.org/…", ans: "exec" },
    { evt: "validated the arguments against the schema", ans: "exec" },
    { evt: "wrote “It’s 23°C in Bengaluru right now.”", ans: "llm" }
  ];
  const host = $("#tagQuiz"), score = $("#tagScore");
  let done = 0, right = 0;
  EVENTS.forEach(e => {
    const row = document.createElement("div");
    row.className = "tag-row";
    row.innerHTML = '<span class="evt">' + esc(e.evt) + '</span>' +
      '<span class="tags"><button class="tagbtn llm" data-a="llm">LLM · probabilistic</button>' +
      '<button class="tagbtn exec" data-a="exec">EXEC ENV · deterministic</button></span>' +
      '<span class="verdict"></span>';
    $$(".tagbtn", row).forEach(tb => tb.addEventListener("click", () => {
      row.classList.add("done");
      const ok = tb.dataset.a === e.ans;
      tb.classList.add("picked", ok ? "right" : "wrong");
      if (!ok) $('[data-a="' + e.ans + '"]', row).classList.add("answer");
      $(".verdict", row).textContent = ok ? "✓" : "✗";
      done++; if (ok) right++;
      score.textContent = right + " / " + done + " tagged correctly" +
        (done === EVENTS.length && right === EVENTS.length ? " — the LLM decided and spoke; the environment did everything real." : "");
    }));
    host.appendChild(row);
  });
})();

/* ============================================================
   9 · RAMBLING SIM + RETRY LOOP  (Section 3)
   ============================================================ */
(function ramble() {
  const consoleEl = $("#rambleConsole"), fixedEl = $("#fixedConsole");
  const tRuns = $("#tRuns"), tOk = $("#tOk"), tBad = $("#tBad");
  let runs = 0, ok = 0, bad = 0, seq = 0, token = 0;
  const OUTCOMES = ["ok", "wrong", "invent"];   // scripted: feel the 10% on run 2–3

  function lines(el, arr, tok) {
    el.innerHTML = "";
    arr.forEach((l, i) => {
      setTimeout(() => {
        if (tok !== token) return;
        const d = document.createElement("div");
        d.className = "ln " + l[0];
        d.textContent = l[1];
        el.appendChild(d);
        el.scrollTop = el.scrollHeight;
      }, 420 * i);
    });
  }

  $("#rambleRun").addEventListener("click", () => {
    const kind = OUTCOMES[seq % OUTCOMES.length]; seq++;
    const tok = ++token;
    runs++;
    const L = [
      ["sys", "▶ run #" + runs + " — sending rambling message + tool menu…"],
      ["llm", 'LLM pass 1 → intent emitted']
    ];
    if (kind === "ok") {
      ok++;
      L.push(["llm", '   { "name": "get_weather", "arguments": { "city": "Bengaluru" } }']);
      L.push(["exec", "EXEC  → GET /weather?q=Bengaluru … 200"]);
      L.push(["good", 'LLM pass 2 → "Around 23°C and pleasant in Bengaluru tomorrow."']);
      L.push(["sys", "✓ correct. feeling safe? run it again."]);
    } else if (kind === "wrong") {
      bad++;
      L.push(["warn", '   { "name": "get_weather", "arguments": { "city": "Chennai" } }   ← wrong city']);
      L.push(["exec", "EXEC  → GET /weather?q=Chennai … 200  (the API can’t know it’s wrong)"]);
      L.push(["err", 'LLM pass 2 → "Expect a hot 34°C in Chennai!"  — fluent, confident, WRONG']);
      L.push(["err", "✗ garbage in → garbage out, amplified by a deterministic system that did its job perfectly."]);
    } else {
      bad++;
      L.push(["warn", '   { "name": "get_weather", "arguments": { "city": "my cousin" } }   ← invented argument']);
      L.push(["err", 'EXEC  → GET /weather?q=my%20cousin … 404 city not found']);
      L.push(["err", "✗ unhandled. crash or apologize — either way the user loses."]);
    }
    lines(consoleEl, L, tok);
    setTimeout(() => { if (tok === token) { tRuns.textContent = runs; tOk.textContent = ok; tBad.textContent = bad; } }, 420 * L.length);
  });

  $("#rambleReset").addEventListener("click", () => {
    token++;
    runs = ok = bad = 0; seq = 0;
    tRuns.textContent = tOk.textContent = tBad.textContent = "0";
    consoleEl.innerHTML = '<div class="ln sys">— console idle —</div>';
  });

  /* upgrades + fixed run */
  const ups = { validate: false, menu: false, loop: false };
  $$(".upgrade input").forEach(cb => cb.addEventListener("change", () => {
    ups[cb.dataset.up] = cb.checked;
    cb.closest(".upgrade").classList.toggle("on", cb.checked);
  }));

  $("#fixedRun").addEventListener("click", () => {
    const tok = ++token;
    let L;
    if (!ups.validate && !ups.loop && !ups.menu) {
      L = [["sys", "▶ re-run… with zero upgrades on."],
           ["err", "same coin-flip as before. switch something on — you own layer 2."]];
    } else if (ups.menu && !ups.validate && !ups.loop) {
      L = [["sys", "▶ re-run with a tightened menu…"],
           ["llm", 'LLM pass 1 → { "city": "Bengaluru" }  ✓ (better description = fewer wrecks)'],
           ["warn", "…but run it 100 times and the bad extraction still shows up. Fewer wrecks, same cliff."],
           ["sys", "prompting reduces the error rate. it cannot make a probabilistic system deterministic."]];
    } else if (ups.validate && !ups.loop) {
      L = [["sys", "▶ re-run with contract validation…"],
           ["llm", 'LLM pass 1 → { "name": "get_weather", "arguments": { "city": "my cousin" } }'],
           ["exec", 'VALIDATE → "my cousin" not resolvable by geocoding API'],
           ["good", "✓ REJECTED before execution. no garbage reached the API."],
           ["warn", "…and now what? The call is dead — but the user still has no answer."],
           ["sys", "we refuse to guess, we refuse to crash. something has to FLOW BACK. one upgrade left."]];
    } else if (ups.loop && !ups.validate) {
      L = [["sys", "▶ re-run with the loop closed but no verifier…"],
           ["llm", 'LLM pass 1 → { "arguments": { "city": "Chennai" } }   ← wrong, and nothing checks it'],
           ["exec", "EXEC  → GET /weather?q=Chennai … 200"],
           ["err", "the loop has nothing to catch. no verifier → no error → nothing flows back."],
           ["sys", "the loop only works if the boundary verifies first. switch on validation."]];
    } else {
      L = [["sys", "▶ re-run with validation + the closed loop" + (ups.menu ? " + tightened menu" : "") + "…"],
           ["llm", 'LLM pass 1 → { "name": "get_weather", "arguments": { "city": "my cousin" } }'],
           ["exec", 'VALIDATE → fail: "my cousin" is not a resolvable city'],
           ["warn", 'FEED BACK as tool message → "city ‘my cousin’ not found; ask the user or re-extract"'],
           ["llm", 'LLM retry → { "name": "get_weather", "arguments": { "city": "Bengaluru" } }'],
           ["exec", "VALIDATE → ✓ pass · EXEC → GET /weather?q=Bengaluru … 200"],
           ["good", 'LLM pass 2 → "Around 23°C and pleasant in Bengaluru tomorrow."'],
           ["good", "✓ caught and corrected in ONE cycle, on screen. cracks 2 & 3 closed."]];
    }
    lines(fixedEl, L, tok);
  });
})();

/* ============================================================
   10 · M×N GRID  (Section 4)
   ============================================================ */
(function mxn() {
  const svg = $("#mxnSvg"), mS = $("#mSlider"), nS = $("#nSlider"), std = $("#stdToggle");
  const count = $("#mxnCount"), mV = $("#mVal"), nV = $("#nVal");
  const NS = "http://www.w3.org/2000/svg";
  const TOOLS = ["weather", "gmail", "linkedin", "instagram", "supabase", "wiki", "sheets", "slack", "calendar", "stripe", "notion", "search"];
  const MODELS = ["GPT-OSS", "Claude", "local Llama", "n8n agent", "our chat UI", "Claude desktop", "Cursor", "Gemini"];

  function el(tag, attrs, text) {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }

  function render() {
    const M = +mS.value, N = +nS.value, useStd = std.checked;
    mV.textContent = M; nV.textContent = N;
    const H = Math.max(M, N) * 40 + 60;
    svg.setAttribute("viewBox", "0 0 640 " + H);
    svg.setAttribute("height", Math.min(H, 460));
    svg.innerHTML = "";

    const yFor = (i, total) => 40 + (H - 80) * (total === 1 ? 0.5 : i / (total - 1));
    const toolY = i => yFor(i, M), modY = i => yFor(i, N);

    // wires first (under nodes)
    if (useStd) {
      const hx = 320, hy = H / 2;
      for (let i = 0; i < M; i++) svg.appendChild(el("line", { x1: 132, y1: toolY(i), x2: hx - 46, y2: hy, stroke: "#7ee787", "stroke-opacity": ".45", "stroke-width": "1.2" }));
      for (let j = 0; j < N; j++) svg.appendChild(el("line", { x1: hx + 46, y1: hy, x2: 508, y2: modY(j), stroke: "#7ee787", "stroke-opacity": ".45", "stroke-width": "1.2" }));
      const hub = el("g", {});
      hub.appendChild(el("rect", { x: hx - 46, y: hy - 22, width: 92, height: 44, rx: 10, fill: "#101401", stroke: "#c8f542", "stroke-width": "1.5" }));
      hub.appendChild(el("text", { x: hx, y: hy - 2, "text-anchor": "middle", fill: "#c8f542", "font-size": "11", "font-weight": "700", "font-family": "monospace" }, "ONE"));
      hub.appendChild(el("text", { x: hx, y: hy + 12, "text-anchor": "middle", fill: "#c8f542", "font-size": "11", "font-weight": "700", "font-family": "monospace" }, "GRAMMAR"));
      svg.appendChild(hub);
    } else {
      for (let i = 0; i < M; i++) for (let j = 0; j < N; j++)
        svg.appendChild(el("line", { x1: 132, y1: toolY(i), x2: 508, y2: modY(j), stroke: "#ff8080", "stroke-opacity": String(Math.max(.12, .5 - M * N / 250)), "stroke-width": "1" }));
    }
    // tool nodes
    for (let i = 0; i < M; i++) {
      const y = toolY(i);
      svg.appendChild(el("rect", { x: 22, y: y - 13, width: 110, height: 26, rx: 7, fill: "#161d16", stroke: "#57d8c6", "stroke-opacity": ".55" }));
      svg.appendChild(el("text", { x: 77, y: y + 4, "text-anchor": "middle", fill: "#a9c4bf", "font-size": "11", "font-family": "monospace" }, TOOLS[i % TOOLS.length]));
    }
    // model nodes
    for (let j = 0; j < N; j++) {
      const y = modY(j);
      svg.appendChild(el("rect", { x: 508, y: y - 13, width: 110, height: 26, rx: 7, fill: "#161d16", stroke: "#b795ff", "stroke-opacity": ".55" }));
      svg.appendChild(el("text", { x: 563, y: y + 4, "text-anchor": "middle", fill: "#c3b2e8", "font-size": "11", "font-family": "monospace" }, MODELS[j % MODELS.length]));
    }

    if (useStd) {
      count.className = "mxn-count std";
      count.textContent = M + " + " + N + " = " + (M + N) + " integrations — one grammar in the middle";
    } else {
      count.className = "mxn-count";
      count.textContent = M + " tools × " + N + " hosts = " + (M * N) + " bespoke integrations — rebuilt by every team on Earth";
    }
  }
  [mS, nS].forEach(s => s.addEventListener("input", render));
  std.addEventListener("change", render);
  render();
})();

/* ============================================================
   11 · SPEC THE STANDARD  (Section 4 exercise)
   ============================================================ */
(function spec() {
  const REQS = [
    { label: "Discovery", sub: "a model-side client can ask any tool-side system: “what can you do?” and get the menu — names, descriptions, schemas — in a standard shape", good: true, why: "✓ Our Segment 02 menu, made self-describing." },
    { label: "It must be written in Python", sub: "one blessed language for all servers", good: false, why: "✗ Grammar, not language. Any stack that speaks the shape can play — that's the whole point." },
    { label: "Invocation", sub: "a standard way to say “run tool X with arguments Y” — and a standard shape for results AND errors", good: true, why: "✓ Our Segment 03 loop, formalized. Errors are first-class: the retry loop needs them." },
    { label: "Guaranteed no mistakes", sub: "the standard makes the model stop hallucinating", good: false, why: "✗ No wire format fixes a probabilistic layer. That's what validation + the loop are for — at the boundary you control." },
    { label: "Resources", sub: "beyond actions: systems also hold data to read — files, tables, documents", good: true, why: "✓ Calling functions isn't all the context problem needs. Data to read is context too." },
    { label: "Prompt templates", sub: "reusable instructions a server can offer the host", good: true, why: "✓ The third primitive: not just what to do and what to read, but how to ask." },
    { label: "A transport", sub: "local process or remote server — the messages need a wire. any documented, boring channel", good: true, why: "✓ The value is in the shared grammar, not the pipe." },
    { label: "Cloud-only", sub: "everything must run on a hosted service", good: false, why: "✗ The local Llama for the client who can't send data out is a core requirement, not an edge case." }
  ];
  const host = $("#specList"), score = $("#specScore");
  REQS.forEach(r => {
    const item = document.createElement("label");
    item.className = "spec-item";
    item.innerHTML = '<input type="checkbox"><span><span class="s-label">' + esc(r.label) +
      '</span><br><span class="s-sub">' + esc(r.sub) + '</span><span class="s-why">' + esc(r.why) + "</span></span>";
    host.appendChild(item);
  });
  $("#specGrade").addEventListener("click", () => {
    let hits = 0, total = REQS.filter(r => r.good).length;
    $$(".spec-item", host).forEach((item, i) => {
      const on = $("input", item).checked, good = REQS[i].good;
      item.classList.add("graded", (on === good) ? "hit" : "miss");
      if (on && good) hits++;
    });
    score.textContent = "Spec captured " + hits + " / " + total + " real requirements. " +
      (hits === total ? "That interface has a name — reveal below." : "Workshop the misses with the room, then reveal.");
    $("#specGrade").disabled = true;
  });
})();

/* ============================================================
   12 · CONVERGENCE  (Section 5)
   ============================================================ */
$("#convergeBtn").addEventListener("click", function () {
  this.style.display = "none";
  $("#convergedPanel").classList.add("show");
});

/* ============================================================
   13 · NEW CRACK FLIP CARDS  (Section 6)
   ============================================================ */
(function newCracks() {
  const CARDS = [
    { q: "We gave the model a menu. What happens when the menu has 100 tools, plus resources, plus every retry we fed back?", name: "Context window pressure", why: "100 tool descriptions, resources, and retry history all compete for the same finite window the model can attend to.", where: "→ next lecture: context limits, then retrieval (RAG series)" },
    { q: "Ten of your 100 tools sound alike. What decides which one gets called — and what happens when descriptions overlap?", name: "Tool-choice confusion at scale", why: "With many similar tools, description quality decides routing; overlapping descriptions produce wrong calls.", where: "→ context engineering lectures + evals later in the module" },
    { q: "We made plugging in effortless. Who else finds it effortless now?", name: "Trust & security surface", why: "A standard connector means anything can plug in; a malicious or sloppy server is one click from your model and your data.", where: "→ guardrails & verification session; same Verifier's Rule, bigger blast radius" },
    { q: "One retry loop closed one crack. What breaks when a real task needs twelve tool calls in a row?", name: "Multi-step orchestration", why: "Chains of many tool calls need planning, memory, and stop conditions — one loop isn't a plan.", where: "→ the agents module; the unnamed loop from Segment 04 grows up there" }
  ];
  const host = $("#newCracks");
  CARDS.forEach(c => {
    const card = document.createElement("div");
    card.className = "flip";
    card.innerHTML = '<div class="flip-inner"><div class="face front"><div class="fq">' + esc(c.q) +
      '</div><div class="hint">harvest guesses from the room · click to flip</div></div>' +
      '<div class="face back"><h5>' + esc(c.name) + "</h5><p>" + esc(c.why) + '</p><div class="where">' + esc(c.where) + "</div></div></div>";
    card.addEventListener("click", () => card.classList.toggle("flipped"));
    host.appendChild(card);
  });
})();

/* ============================================================
   14 · PRACTICE SET  (Section 7)
   ============================================================ */
(function tasks() {
  const TASKS = [
    { name: "Ship one MCP server for your own workflow", desc: "Take the highest-value task from your workflow diagnosis (the one your Automation Spec selected). Wrap it: one tool, honest description, strict schema, validation, error-return retry. Code path or n8n path — your choice. Attach it to Claude and paste a screenshot of one successful grounded answer in the channel." },
    { name: "Break a description on purpose", desc: "Duplicate your tool with a vague description and a similar name. Ask ten mixed questions. Log how often the model routes wrong. You are building intuition for why context engineering is the next three lectures." },
    { name: "Design review, Feynman style", desc: "Explain to a non-engineer friend (or Aarav) why the industry needed MCP — without using the words MCP, protocol, or API. If the USB or receptionist story doesn't survive the retelling, the gap is yours, not theirs." },
    { name: "Carry the loop drawing forward", desc: "Redraw propose → execute → verify → feed back from memory and pin it above your desk. You will meet it again in the agents module and it will already be yours." }
  ];
  const host = $("#taskList");
  const state = store.get("tasks", [false, false, false, false]);
  TASKS.forEach((t, i) => {
    const item = document.createElement("label");
    item.className = "task" + (state[i] ? " donee" : "");
    item.innerHTML = '<input type="checkbox"' + (state[i] ? " checked" : "") +
      '><span><span class="t-name">' + esc(t.name) + '</span><br><span class="t-desc">' + esc(t.desc) + "</span></span>";
    $("input", item).addEventListener("change", e => {
      state[i] = e.target.checked;
      item.classList.toggle("donee", state[i]);
      store.set("tasks", state);
    });
    host.appendChild(item);
  });
})();

/* boot */
go(cur);

/* ============================================================
   The Protocol Lab — content
   One thing per screen: question → feel it → try it → reveal.
   ============================================================ */

const MODULES = [

/* ---------- 0 · START ---------- */
{ id:'start', title:'Start here', icon:'sparkles', open:true, steps:[
  { t:'intro',
    pill:'Cohort 7 · L14',
    title:'You built a tool call.\nIt is broken.',
    subtitle:'Yesterday you wired an LLM to a weather API. Today your own cracks drive the agenda — fix them one by one, and by the end you will have invented something the industry already named.' },
  { t:'cracks',
    title:'What breaks v1?',
    subtitle:'Collect the cracks. They are the agenda.' },
]},

/* ---------- 1 · CRACK 1: WHEN ---------- */
{ id:'when', title:'The “when” crack', icon:'split', steps:[
  { t:'question', eyebrow:'Crack 1',
    q:'One receptionist.\n<em>Forty departments.</em>',
    sub:'How does every visitor reach the right desk — or just get answered at the front?' },
  { t:'v1sim',
    title:'v1 has no “whether.”',
    subtitle:'Every message goes to the weather tool. Try these.' },
  { t:'deskgame',
    title:'Be the receptionist.',
    subtitle:'Answer directly, or fill a routing slip?' },
  { t:'builder',
    title:'Write the directory entry.',
    subtitle:'So a receptionist who has never seen it knows when to route to it.' },
  { t:'reveal', eyebrow:'The reveal',
    title:'The model emits intent.\nIt never acts.',
    body:'A menu of tools in the prompt. One new instruction: <strong>answer directly, or output a structured call.</strong> The backend reads the intent and does the work.',
    art:`<pre class="codeblk"><span class="c"># the menu</span>
{ "name": "get_weather",
  "description": "Current weather for a city.
                  Use when asked about weather anywhere.",
  "parameters": { "city": "string, required" } }

<span class="c"># what the model emits — intent, not action</span>
{ "name": "get_weather", "arguments": { "city": "Bengaluru" } }</pre>
<p class="body">Every provider ships this natively. It is called <strong>function calling</strong>. You just re-derived why it has the shape it has.</p>` },
]},

/* ---------- 2 · TWO-PASS LOOP ---------- */
{ id:'loop', title:'The two-pass loop', icon:'repeat', steps:[
  { t:'question', eyebrow:'Build it',
    q:'The model “calls the API.”\n<em>Who touches the internet?</em>' },
  { t:'stepper',
    title:'The two-pass loop.',
    subtitle:'Watch which layer lights up.' },
  { t:'quiz', gate:true, eyebrow:'Checkpoint',
    prompt:'How many times did the LLM touch the internet?',
    options:[
      { label:'0', correct:true, fb:'The model only ever returned JSON. The one HTTP call came from your backend.' },
      { label:'1', fb:'Look again — the HTTP call happened between the two model calls. Who made it?' },
      { label:'2', fb:'The model ran twice, but both runs only produced text. Something else did the fetching.' },
    ]},
  { t:'tagquiz',
    title:'Who did what?' },
  { t:'reveal', eyebrow:'Crack 1 closed',
    title:'The control test.',
    body:'Same code, different question:',
    art:`<pre class="codeblk">ask(<span class="s">"what is 2 + 2?"</span>)

tool_calls  →  <span class="k">None</span>
content     →  <span class="s">"4."</span></pre>
<p class="body">No tool call. The “when” layer exists. <strong>Crack 1 closed.</strong></p>` },
]},

/* ---------- 3 · BAD ARGUMENTS ---------- */
{ id:'args', title:'Bad arguments', icon:'shield-alert', steps:[
  { t:'question', eyebrow:'Cracks 2 & 3',
    q:'The weights are frozen.\nUsers ramble.\n<em>What do you control?</em>' },
  { t:'ramble',
    title:'Provoke it.',
    subtitle:'One rambling message, four cities. Run it a few times.' },
  { t:'quiz', gate:true, eyebrow:'Checkpoint',
    prompt:'Where does the fix go?',
    options:[
      { label:'The model — better prompts', fb:'Prompts lower the error rate. They cannot make a probabilistic system deterministic.' },
      { label:'The backend — your code', correct:true, fb:'The one layer you fully control. Verify the intent before executing it — the schema was the contract all along.' },
      { label:'The API — stricter endpoints', fb:'OpenWeatherMap did its job perfectly. Garbage in, garbage out.' },
    ]},
  { t:'fixit',
    title:'Switch on the fixes.',
    subtitle:'Then run the same message again.' },
  { t:'reveal', eyebrow:'Cracks 2 & 3 closed',
    title:'The arrow now cycles.',
    body:'Errors go back to the model as messages. It retries with better arguments.',
    art:`<div class="loopdiag">
      <span class="nd hot">propose</span><span class="ar">→</span>
      <span class="nd">execute + verify</span><span class="ar">→</span>
      <span class="nd">result · error</span><span class="ar">→</span>
      <span class="nd hot">adjust</span>
      <span class="back">↺ repeat until done</span></div>
<p class="body"><strong>Hold onto this loop.</strong> In a few weeks you will see it is the whole story.</p>` },
]},

/* ---------- 4 · SCALE WALL ---------- */
{ id:'scale', title:'The scale wall', icon:'grid-3x3', steps:[
  { t:'question', eyebrow:'Crack 4',
    q:'Every tool × every model.\n<em>How many integrations?</em>',
    sub:'And where have you seen this shape before — outside AI?' },
  { t:'mxn',
    title:'Feel the grid.' },
  { t:'spec',
    title:'Design the standard.',
    subtitle:'No acronyms. What must it do?' },
  { t:'reveal', eyebrow:'Crack 4 closed',
    title:'You just designed MCP.',
    body:'The industry shipped it in late 2024: the <strong>Model Context Protocol</strong>. You built the reasoning for it.',
    art:`<table class="mapping">
<tr><th>Your whiteboard</th><th>MCP name</th></tr>
<tr><td>The app hosting the model</td><td class="n">Host</td></tr>
<tr><td>The glue on the model's side</td><td class="n">Client</td></tr>
<tr><td>Your backend, speaking the standard</td><td class="n">Server</td></tr>
<tr><td>The menu + the two-pass loop</td><td class="n">Tools · list / call</td></tr>
</table>
<p class="body">An MCP server is yesterday's backend <strong>wearing a standard uniform.</strong></p>` },
]},

/* ---------- 5 · CONVERGENCE ---------- */
{ id:'converge', title:'Two paths, one shape', icon:'git-merge', steps:[
  { t:'question', eyebrow:'Build it, twice',
    q:'n8n and twelve lines of Python\njust built <em>the same thing.</em>',
    sub:'What didn’t change?' },
  { t:'converge',
    title:'Same three layers.' },
]},

/* ---------- 6 · NEW CRACKS ---------- */
{ id:'v2', title:'What v2 breaks', icon:'flask-conical', steps:[
  { t:'question', eyebrow:'Honest v2',
    q:'Every fix ships\n<em>new failure modes.</em>',
    sub:'Guess before you flip.' },
  { t:'flips',
    title:'The new cracks.' },
]},

/* ---------- 7 · SHIP ---------- */
{ id:'ship', title:'Ship it', icon:'rocket', steps:[
  { t:'practice',
    title:'The practice set.' },
  { t:'closing',
    title:'You derived it.',
    body:'Two days ago a tool call was borrowed jargon. Yesterday you derived it. Today you scaled it into a protocol the world already agreed on. You are no longer waiting for the next feature announcement — you can predict what it has to be.' },
]},
];

/* ---------- widget data ---------- */

const CRACK_CHIPS = [
  'No decision layer',
  'Hallucinated arguments',
  'Wrong city extracted',
  '100 tools?',
  'Context limits',
  'Security',
];

const CITY_DB = {
  bengaluru:'23°C · clouds', bangalore:'23°C · clouds', delhi:'41°C · haze',
  mumbai:'31°C · humid', chennai:'34°C · sunny', london:'14°C · drizzle',
  tokyo:'22°C · clear', paris:'18°C · cloudy', hyderabad:'33°C · cloudy', pune:'28°C · clear',
};

const DESK_ITEMS = [
  { msg:'“good morning! ☀️”', route:false, why:'Small talk. v1 would have routed this to Weather.' },
  { msg:'“will it rain in Mumbai tonight?”', route:true, why:'Slip: city = Mumbai.' },
  { msg:'“what is 2 + 2?”', route:false, why:'The model knows this. Routing it is waste.' },
  { msg:'“how hot is it in Delhi right now?”', route:true, why:'Slip: city = Delhi.' },
  { msg:'“explain what an API is”', route:false, why:'Already in the weights.' },
  { msg:'“check the weather for my cousin’s place”', route:false, why:'Weather ask — but no city. Ask a follow-up instead of guessing. Remember this one.' },
];

const LOOP_STEPS = [
  { tab:'1 · Decide', layers:[1],
    code:'resp = llm(messages, tools=[GET_WEATHER])\n\nresp.tool_calls[0]\n→ { "name": "get_weather",\n    "arguments": { "city": "Bengaluru" } }',
    note:'<b>Pause.</b> An intent was emitted. Nothing has happened yet.' },
  { tab:'2 · Execute', layers:[2,3],
    code:'args = json.loads(call.arguments)\nweather = fetch_openweathermap(args["city"])\n→ { "temp_c": 23, "sky": "clouds" }',
    note:'Your backend makes the HTTP call. <b>The LLM is not involved.</b>' },
  { tab:'3 · Speak', layers:[1],
    code:'messages += [tool_result]\nfinal = llm(messages)\n→ "It’s 23°C in Bengaluru right now."',
    note:'Second pass. Natural language, <b>grounded in real data.</b>' },
  { tab:'4 · Control test', layers:[1],
    code:'ask("what is 2 + 2?")\n\ntool_calls → None\ncontent    → "4."',
    note:'No tool call. <b>The “when” layer exists.</b>' },
];

const TAG_EVENTS = [
  { evt:'chose get_weather over answering', ans:'llm' },
  { evt:'parsed {"city": "Bengaluru"}', ans:'exec' },
  { evt:'HTTP GET openweathermap.org', ans:'exec' },
  { evt:'checked args against the schema', ans:'exec' },
  { evt:'wrote “It’s 23°C in Bengaluru.”', ans:'llm' },
];

const RAMBLE_MSG = 'so my flight got moved AGAIN, i was in <b>Delhi</b> last week, my cousin in <b>Chennai</b> keeps saying visit, maybe <b>Mumbai</b> for the wedding — anyway: will it be hot in <b>Bengaluru</b> tomorrow??';

const SPEC_ITEMS = [
  { label:'Discovery', d:'ask any system “what can you do?” — get the menu back', good:true, w:'Your menu, made self-describing.' },
  { label:'Python only', d:'one blessed language', good:false, w:'It’s a grammar, not a language.' },
  { label:'Invocation', d:'standard call, standard result — and standard errors', good:true, w:'Your loop, formalized. The retry needs errors.' },
  { label:'No more mistakes', d:'the standard stops hallucination', good:false, w:'No wire format fixes a probabilistic layer. That’s what your validation is for.' },
  { label:'Resources', d:'data to read — files, tables, docs', good:true, w:'Context is more than actions.' },
  { label:'Prompt templates', d:'reusable instructions', good:true, w:'The third primitive.' },
  { label:'A transport', d:'local or remote, any boring wire', good:true, w:'Value is the grammar, not the pipe.' },
  { label:'Cloud only', d:'hosted or nothing', good:false, w:'The local Llama client is a core case.' },
];

const FLIP_CARDS = [
  { q:'100 tools, resources, retries — all in one prompt. What gives?', name:'Context pressure', why:'Everything competes for one finite window.', where:'→ next: context limits, then RAG' },
  { q:'Ten tools sound alike. What decides which gets called?', name:'Routing confusion', why:'Description quality is the router. Overlap = wrong calls.', where:'→ context engineering + evals' },
  { q:'Plugging in is effortless now. For whom else?', name:'Security surface', why:'A malicious server is one click from your data.', where:'→ guardrails session' },
  { q:'One retry loop is fine. What about twelve calls in a row?', name:'Orchestration', why:'Chains need planning, memory, stop conditions.', where:'→ the agents module' },
];

const TASKS = [
  { name:'Ship one MCP server', d:'Wrap your highest-value workflow task. One tool, honest description, strict schema, retry. Screenshot a grounded answer to the channel.' },
  { name:'Break a description', d:'Duplicate your tool with a vague description. Ten questions. Count the wrong routes.' },
  { name:'Feynman it', d:'Explain why MCP exists — without saying MCP, protocol, or API.' },
  { name:'Redraw the loop', d:'propose → execute → verify → feed back. From memory. Pin it up.' },
];

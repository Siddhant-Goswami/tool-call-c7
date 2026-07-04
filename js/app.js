/* ============================================================
   THE PROTOCOL LAB — app controller
   Linear player: one thing per screen.
   ============================================================ */

const LS_KEY = 'protocol-lab.v1';
const state = load();
function load(){ try{ const raw=localStorage.getItem(LS_KEY); return raw?JSON.parse(raw):{}; }catch(e){ return {}; } }
function persist(){ try{ localStorage.setItem(LS_KEY, JSON.stringify(state)); }catch(e){} }
state.pos        = Number.isInteger(state.pos) ? state.pos : 0;
state.maxReached = Number.isInteger(state.maxReached) ? state.maxReached : 0;
state.answered   = state.answered && typeof state.answered==='object' ? state.answered : {};
state.cracks     = Array.isArray(state.cracks) ? state.cracks : [];
state.tasks      = Array.isArray(state.tasks) ? state.tasks : [false,false,false,false];

/* ---------- helpers ---------- */
const $  = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>[...r.querySelectorAll(s)];
function el(html){ const t=document.createElement('template'); t.innerHTML=html.trim(); return t.content.firstElementChild; }
function ic(name,attrs=''){ return `<i data-lucide="${name}" ${attrs}></i>`; }
function icons(){ if(window.lucide) try{ lucide.createIcons(); }catch(e){} }
function esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function toast(msg,kind=''){ const t=$('#toast'); t.innerHTML=(kind==='good'?ic('check'):kind==='bad'?ic('x'):'')+`<span>${msg}</span>`; t.className='toast show '+kind; icons(); clearTimeout(t._t); t._t=setTimeout(()=>t.className='toast',2400); }

/* ---------- flatten ---------- */
const FLAT=[]; const MOD_START=[];
MODULES.forEach((m,mi)=>{ MOD_START[mi]=FLAT.length; m.steps.forEach(step=>FLAT.push({mi,module:m,step})); });
const TOTAL=FLAT.length;
state.pos=Math.max(0,Math.min(TOTAL-1,state.pos));
state.maxReached=Math.max(state.pos,Math.min(TOTAL-1,state.maxReached));
function moduleOf(gi){ return FLAT[gi].mi; }
function moduleUnlocked(mi){ return MODULES[mi].open || MOD_START[mi] <= state.maxReached; }
function moduleDone(mi){ const next=MOD_START[mi+1]; return next!==undefined && state.maxReached>=next; }

/* ---------- navigation ---------- */
function goStep(gi){
  gi=Math.max(0,Math.min(TOTAL-1,gi));
  state.pos=gi; state.maxReached=Math.max(state.maxReached,gi); persist();
  closeSidebar(); render(); window.scrollTo({top:0,behavior:'smooth'});
  $('#stage').focus({preventScroll:true});
}
function goModule(mi){ if(moduleUnlocked(mi)) goStep(MOD_START[mi]); }
function closeSidebar(){ $('#sidebar').classList.remove('open'); $('#scrim').classList.remove('open'); $('#menuBtn').setAttribute('aria-expanded','false'); }
function openSidebar(){ $('#sidebar').classList.add('open'); $('#scrim').classList.add('open'); $('#menuBtn').setAttribute('aria-expanded','true'); }

/* ---------- nav + topbar ---------- */
function renderNav(){
  const nav=$('#moduleNav'); nav.innerHTML='';
  MODULES.forEach((m,mi)=>{
    const unlocked=moduleUnlocked(mi), done=moduleDone(mi), active=moduleOf(state.pos)===mi;
    const item=el(`<button type="button" class="mod ${active?'active':''} ${done?'done':''} ${unlocked?'':'locked'}" ${unlocked?'':'disabled'}>
      <span class="mod-ic">${ic(done?'check':m.icon)}</span>
      <span class="mod-label">${m.title}</span>
      ${unlocked?'':ic('lock','width=14 height=14')}</button>`);
    if(unlocked) item.onclick=()=>goModule(mi);
    nav.appendChild(item);
  });
  icons();
}
function renderTop(){
  const pct=Math.round(state.pos/(TOTAL-1)*100);
  $('#progressFill').style.width=pct+'%';
  $('#progressBar').setAttribute('aria-valuenow',String(pct));
  $('#progressLabel').textContent=`${FLAT[state.pos].module.title} · ${state.pos+1}/${TOTAL}`;
}

/* ---------- footer ---------- */
function renderFooter(){
  const gi=state.pos, {step}=FLAT[gi];
  const back=$('#backBtn'), cont=$('#continueBtn'), dots=$('#stepDots');
  back.style.visibility=gi===0?'hidden':'visible';
  back.onclick=()=>goStep(gi-1);
  cont.disabled = !!step.gate && !state.answered[gi];
  cont.style.visibility = gi===TOTAL-1 ? 'hidden':'visible';
  cont.innerHTML='Continue '+ic('arrow-right');
  cont.onclick=()=>{ if(!cont.disabled) goStep(gi+1); };
  const mi=moduleOf(gi), start=MOD_START[mi], len=MODULES[mi].steps.length;
  dots.innerHTML='';
  for(let k=0;k<len;k++){ const g=start+k; dots.appendChild(el(`<span class="sdot ${g<gi?'done':''} ${g===gi?'cur':''}"></span>`)); }
  icons();
}

/* ============================================================
   RENDERERS
   ============================================================ */
function render(){
  const {step}=FLAT[state.pos];
  renderNav(); renderTop();
  const stage=$('#stage'); stage.innerHTML='';
  const fn=RENDER[step.t]||renderReveal;
  stage.appendChild(fn(step));
  renderFooter(); icons();
}

function head(step, icname='circle-dot'){
  return `<div class="eyebrow-row">${ic(icname)}<span class="eyebrow eyebrow--accent">${step.eyebrow||''}</span></div>`;
}

function renderIntro(step){
  return el(`<div class="step step--intro">
    ${step.pill?`<div class="eyebrow-row" style="justify-content:center"><span class="pill pill--coral">${ic('sparkles')} ${step.pill}</span></div>`:''}
    <h1>${step.title.replace(/\n/g,'<br>')}</h1>
    <p class="subtitle">${step.subtitle||''}</p>
  </div>`);
}

function renderQuestion(step){
  return el(`<div class="step step--q">
    ${step.eyebrow?`<div class="eyebrow-row"><span class="pill pill--coral">${step.eyebrow}</span></div>`:''}
    <div class="qtext">${step.q.replace(/\n/g,'<br>')}</div>
    ${step.sub?`<p class="qsub">${step.sub}</p>`:''}
  </div>`);
}

function renderReveal(step){
  return el(`<div class="step">
    ${step.eyebrow?`<div class="eyebrow-row">${ic('eye')}<span class="eyebrow eyebrow--accent">${step.eyebrow}</span></div>`:''}
    <h1>${(step.title||'').replace(/\n/g,'<br>')}</h1>
    ${step.subtitle?`<p class="subtitle">${step.subtitle}</p>`:''}
    ${step.body?`<p class="body">${step.body}</p>`:''}
    ${step.art||''}
  </div>`);
}

/* ---------- cracks board ---------- */
function renderCracks(step){
  const node=el(`<div class="step">
    <h1>${step.title}</h1>
    <p class="subtitle">${step.subtitle}</p>
    <div class="crackboard"><ol></ol><div class="crack-empty">Empty. Add from the room →</div></div>
    <div class="crackform">
      <input class="input" placeholder="A crack…" aria-label="Crack">
      <input class="input name" placeholder="Name" aria-label="Credit">
      <button class="btn btn--primary">Add</button>
    </div>
    <div class="chips"></div>
  </div>`);
  const list=$('ol',node), empty=$('.crack-empty',node), chips=$('.chips',node);
  const [inp,nameInp]=$$('.input',node);
  function draw(){
    list.innerHTML='';
    empty.style.display=state.cracks.length?'none':'block';
    state.cracks.forEach((c,i)=>{
      const li=el(`<li><span>${esc(c.text)}</span>${c.name?`<span class="credit">— ${esc(c.name)}</span>`:''}<button class="del" aria-label="Remove">✕</button></li>`);
      $('.del',li).onclick=()=>{ state.cracks.splice(i,1); persist(); draw(); };
      list.appendChild(li);
    });
    $$('.chipbtn',chips).forEach(ch=>ch.classList.toggle('used',state.cracks.some(c=>c.text===ch.dataset.t)));
  }
  CRACK_CHIPS.forEach(p=>{
    const b=el(`<button class="chipbtn" data-t="${esc(p)}">+ ${esc(p)}</button>`);
    b.onclick=()=>{ state.cracks.push({text:p,name:''}); persist(); draw(); };
    chips.appendChild(b);
  });
  const add=()=>{ const v=inp.value.trim(); if(!v)return; state.cracks.push({text:v,name:nameInp.value.trim()}); inp.value=''; nameInp.value=''; persist(); draw(); inp.focus(); };
  $('.btn',node).onclick=add;
  inp.onkeydown=e=>{ if(e.key==='Enter')add(); };
  draw();
  return node;
}

/* ---------- v1 simulator ---------- */
function renderV1(step){
  const node=el(`<div class="step">
    <h1>${step.title}</h1>
    <p class="subtitle">${step.subtitle}</p>
    <div class="presets">
      <button class="btn btn--secondary btn--sm" data-m="good morning ☀️">“good morning ☀️”</button>
      <button class="btn btn--secondary btn--sm" data-m="what is 2 + 2?">“what is 2 + 2?”</button>
      <button class="btn btn--secondary btn--sm" data-m="weather in Bengaluru?">“weather in Bengaluru?”</button>
    </div>
    <div class="sim-in"><input class="input" placeholder="…or type anything. v1 doesn’t care." aria-label="Message"><button class="btn btn--primary">Run</button></div>
    <div class="pipeline">
      <div class="stagebox"><h5>message</h5><div class="out"></div></div>
      <div class="stagebox"><h5>llm · extract city</h5><div class="out"></div></div>
      <div class="stagebox"><h5>weather api</h5><div class="out"></div></div>
      <div class="stagebox"><h5>reply</h5><div class="out"></div></div>
    </div>
    <div class="sim-note"></div>
  </div>`);
  const stages=$$('.stagebox',node), note=$('.sim-note',node), input=$('input',node);
  let token=0;
  function extract(msg){
    const lower=msg.toLowerCase();
    for(const c of Object.keys(CITY_DB)) if(lower.includes(c)) return {city:c,real:true};
    const num=msg.match(/\d+/);
    if(num) return {city:num[0],real:false};
    const words=msg.replace(/[^a-zA-Z ]/g,' ').trim().split(/\s+/).filter(w=>w.length>2);
    const pick=words.length?words[words.length-1]:'unknown';
    return {city:pick.charAt(0).toUpperCase()+pick.slice(1),real:false};
  }
  function set(i,html,cls){ const st=stages[i]; st.classList.remove('err','okk'); if(cls)st.classList.add(cls); st.classList.add('active'); $('.out',st).innerHTML=html; }
  function run(msg){
    msg=(msg||'').trim(); if(!msg)return;
    const tk=++token;
    stages.forEach(s=>{ s.classList.remove('active','err','okk'); $('.out',s).innerHTML=''; });
    note.className='sim-note';
    const ex=extract(msg);
    const at=(d,f)=>setTimeout(()=>{ if(tk===token)f(); },d);
    at(50,()=>set(0,'“'+esc(msg)+'”'));
    at(600,()=>set(1,'city: "'+esc(ex.city)+'"',ex.real?null:'err'));
    if(ex.real){
      at(1200,()=>set(2,'<span class="good">200 · '+CITY_DB[ex.city]+'</span>','okk'));
      at(1800,()=>{ set(3,'<span class="good">“'+CITY_DB[ex.city]+' in '+esc(ex.city)+'.”</span>','okk');
        note.className='sim-note good show'; note.textContent='Right — by luck. Try the others.'; });
    } else {
      at(1200,()=>set(2,'<span class="bad">404 · not found</span>','err'));
      at(1800,()=>{ set(3,'<span class="bad">“No weather for ‘'+esc(ex.city)+'’.”</span>','err');
        note.className='sim-note bad show'; note.textContent='Nothing asked whether a tool was needed.'; });
    }
  }
  $$('.presets .btn',node).forEach(b=>b.onclick=()=>{ input.value=b.dataset.m; run(b.dataset.m); });
  $('.sim-in .btn',node).onclick=()=>run(input.value);
  input.onkeydown=e=>{ if(e.key==='Enter')run(input.value); };
  return node;
}

/* ---------- desk game ---------- */
function renderDesk(step){
  const node=el(`<div class="step">
    <h1>${step.title}</h1>
    <p class="subtitle">${step.subtitle}</p>
    <div class="rows"></div>
    <div class="scoreline"></div>
  </div>`);
  const rows=$('.rows',node), score=$('.scoreline',node);
  let done=0, right=0;
  DESK_ITEMS.forEach(it=>{
    const row=el(`<div class="game-row"><span class="msg">${it.msg}</span>
      <span class="pair"><button class="pick" data-r="0">Answer</button><button class="pick" data-r="1">Route</button></span>
      <span class="why">${esc(it.why)}</span></div>`);
    $$('.pick',row).forEach(p=>p.onclick=()=>{
      const picked=p.dataset.r==='1';
      row.classList.add('done');
      p.classList.add('picked',picked===it.route?'right':'wrong');
      if(picked!==it.route) $(`[data-r="${it.route?1:0}"]`,row).classList.add('answer');
      done++; if(picked===it.route)right++;
      score.textContent=`${right} / ${done}`+(done===DESK_ITEMS.length?' — now hand that judgment to the model.':'');
    });
    rows.appendChild(row);
  });
  return node;
}

/* ---------- tool builder ---------- */
function renderBuilder(step){
  const node=el(`<div class="step step--wide">
    <h1>${step.title}</h1>
    <p class="subtitle">${step.subtitle}</p>
    <div class="builder">
      <div>
        <label class="label">name</label>
        <input class="input" id="tbName" placeholder="get_weather" autocomplete="off">
        <div class="lint" id="lintN"></div>
        <label class="label">description</label>
        <textarea class="textarea" id="tbDesc" rows="3" placeholder="When is this the right tool?"></textarea>
        <div class="lint" id="lintD"></div>
        <label class="label">schema</label>
        <label class="checkrow"><input type="checkbox" id="tbCity"> city: string</label>
        <label class="checkrow"><input type="checkbox" id="tbReq"> required</label>
        <div class="lint" id="lintS"></div>
      </div>
      <div>
        <pre class="codeblk" id="tbPrev"></pre>
        <div class="builder-verdict" id="tbV">Would the receptionist know when to route here?</div>
      </div>
    </div>
  </div>`);
  const name=$('#tbName',node), desc=$('#tbDesc',node), city=$('#tbCity',node), req=$('#tbReq',node);
  function lintAll(){
    const n=name.value.trim(); let nOk=false;
    const lN=$('#lintN',node);
    if(!n){ lN.textContent=''; lN.className='lint'; }
    else if(!/^[a-z][a-z0-9_]*$/.test(n)){ lN.textContent='✗ snake_case, no spaces'; lN.className='lint bad'; }
    else if(n.length<4){ lN.textContent='✗ too cryptic'; lN.className='lint bad'; }
    else { lN.textContent='✓ dispatchable'; lN.className='lint ok'; nOk=true; }
    const d=desc.value.trim(); let dOk=false;
    const lD=$('#lintD',node);
    if(!d){ lD.textContent=''; lD.className='lint'; }
    else if(d.length<30){ lD.textContent='✗ too thin — weak descriptions breed wrong calls'; lD.className='lint bad'; }
    else if(!/\bwhen\b/i.test(d)){ lD.textContent='✗ says what, not when'; lD.className='lint bad'; }
    else { lD.textContent='✓ answers “when”'; lD.className='lint ok'; dOk=true; }
    const sOk=city.checked&&req.checked;
    const lS=$('#lintS',node);
    lS.textContent=sOk?'✓ a contract':(city.checked||req.checked)?'…optional city = a guess waiting to happen':'';
    lS.className='lint '+(sOk?'ok':'bad');
    $('#tbPrev',node).textContent=JSON.stringify({name:n||'…',description:d||'…',parameters:{city:{type:'string'},required:req.checked?['city']:[]}},null,2);
    const v=$('#tbV',node);
    if(nOk&&dOk&&sOk){ v.className='builder-verdict pass'; v.textContent='✓ Routable. This goes in the menu.'; }
    else { v.className='builder-verdict'; v.textContent='Would the receptionist know when to route here?'; }
  }
  [name,desc].forEach(x=>x.addEventListener('input',lintAll));
  [city,req].forEach(x=>x.addEventListener('change',lintAll));
  lintAll();
  return node;
}

/* ---------- loop stepper ---------- */
function renderStepper(step){
  const node=el(`<div class="step">
    <h1>${step.title}</h1>
    <p class="subtitle">${step.subtitle}</p>
    <div class="layers">
      <div class="layerbox l1"><span class="lname">LLM</span><span class="ltag">probabilistic</span></div>
      <div class="layerbox l2"><span class="lname">Your backend</span><span class="ltag">deterministic</span></div>
      <div class="layerbox l3"><span class="lname">The internet</span><span class="ltag">APIs</span></div>
    </div>
    <div class="steptabs"></div>
    <pre class="codeblk"></pre>
    <div class="stepnote"></div>
  </div>`);
  const tabs=$('.steptabs',node), code=$('.codeblk',node), noteEl=$('.stepnote',node);
  const boxes=[null,$('.l1',node),$('.l2',node),$('.l3',node)];
  LOOP_STEPS.forEach((s,i)=>{
    const b=el(`<button class="steptab">${s.tab}</button>`);
    b.onclick=()=>show(i);
    tabs.appendChild(b);
  });
  function show(i){
    $$('.steptab',tabs).forEach((b,j)=>b.classList.toggle('active',j===i));
    code.textContent=LOOP_STEPS[i].code;
    noteEl.innerHTML=LOOP_STEPS[i].note;
    [1,2,3].forEach(L=>boxes[L].classList.toggle('lit',LOOP_STEPS[i].layers.includes(L)));
  }
  show(0);
  return node;
}

/* ---------- quiz ---------- */
function renderQuiz(step){
  const gi=state.pos, answered=!!state.answered[gi];
  const node=el(`<div class="step">
    ${head(step,'help-circle')}
    <h2 class="q-prompt">${step.prompt}</h2>
    <div class="choices"></div>
    <div class="explain" role="status" aria-live="polite"></div>
  </div>`);
  const choices=$('.choices',node), explain=$('.explain',node);
  step.options.forEach(opt=>{
    const b=el(`<button type="button" class="choice ${answered?'locked':''} ${answered&&opt.correct?'correct':''}" ${answered?'disabled':''}><span class="mark">${ic('check')}</span><span>${opt.label}</span></button>`);
    b.onclick=()=>{
      if(state.answered[gi]) return;
      if(opt.correct){
        $$('.choice',choices).forEach(c=>{ c.classList.add('locked'); c.disabled=true; });
        b.classList.add('correct');
        explain.innerHTML=`<div class="card card--surface">${ic('lightbulb')}<p>${opt.fb}</p></div>`;
        state.answered[gi]=true; persist();
        toast('Correct','good');
        renderFooter(); icons();
      } else {
        b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
        explain.innerHTML=`<div class="card card--surface" style="border-color:#FDE68A">${ic('info')}<p>${opt.fb}</p></div>`;
        icons();
      }
    };
    choices.appendChild(b);
  });
  if(answered){ const o=step.options.find(x=>x.correct); explain.innerHTML=`<div class="card card--surface">${ic('lightbulb')}<p>${o.fb}</p></div>`; }
  return node;
}

/* ---------- tag quiz ---------- */
function renderTags(step){
  const node=el(`<div class="step">
    <h1>${step.title}</h1>
    <div class="rows"></div>
    <div class="scoreline"></div>
  </div>`);
  const rows=$('.rows',node), score=$('.scoreline',node);
  let done=0,right=0;
  TAG_EVENTS.forEach(e=>{
    const row=el(`<div class="game-row"><span class="msg" style="font-family:var(--font-mono);font-size:13px">${esc(e.evt)}</span>
      <span class="pair"><button class="pick p-llm" data-a="llm">LLM</button><button class="pick p-exec" data-a="exec">Backend</button></span></div>`);
    $$('.pick',row).forEach(p=>p.onclick=()=>{
      row.classList.add('done');
      const ok=p.dataset.a===e.ans;
      p.classList.add('picked',ok?'right':'wrong');
      if(!ok) $(`[data-a="${e.ans}"]`,row).classList.add('answer');
      done++; if(ok)right++;
      score.textContent=`${right} / ${done}`+(done===TAG_EVENTS.length&&right===TAG_EVENTS.length?' — the model decided and spoke. The backend did everything real.':'');
    });
    rows.appendChild(row);
  });
  return node;
}

/* ---------- rambling sim ---------- */
let rambleSeq=0;
function renderRamble(step){
  const node=el(`<div class="step">
    <h1>${step.title}</h1>
    <p class="subtitle">${step.subtitle}</p>
    <div class="quotecard">${RAMBLE_MSG}</div>
    <div class="row-wrap"><button class="btn btn--primary" id="rRun">${ic('play')} Run it</button></div>
    <div class="consoleblk"><div class="ln sys">— idle —</div></div>
    <div class="tally"><span>runs <b id="tr">0</b></span><span class="t-ok">correct <b id="to">0</b></span><span class="t-bad">garbage <b id="tb">0</b></span></div>
  </div>`);
  const con=$('.consoleblk',node);
  let runs=0,ok=0,bad=0,token=0;
  function lines(arr,tk){
    con.innerHTML='';
    arr.forEach((l,i)=>setTimeout(()=>{ if(tk!==token)return;
      con.appendChild(el(`<div class="ln ${l[0]}">${l[1]}</div>`)); con.scrollTop=con.scrollHeight; },400*i));
  }
  $('#rRun',node).onclick=()=>{
    const kind=['ok','wrong','invent'][rambleSeq%3]; rambleSeq++;
    const tk=++token; runs++;
    let L=[['sys','▶ run #'+runs]];
    if(kind==='ok'){ ok++;
      L.push(['llm','intent → { "city": "Bengaluru" }']);
      L.push(['exec','GET /weather?q=Bengaluru … 200']);
      L.push(['good','"Around 23°C tomorrow."  ✓']);
      L.push(['sys','feeling safe? run it again.']);
    } else if(kind==='wrong'){ bad++;
      L.push(['warn','intent → { "city": "Chennai" }   ← wrong city']);
      L.push(['exec','GET /weather?q=Chennai … 200   (the API can’t know)']);
      L.push(['err','"A hot 34°C in Chennai!"  — fluent, confident, wrong']);
    } else { bad++;
      L.push(['warn','intent → { "city": "my cousin" }   ← invented']);
      L.push(['err','GET /weather?q=my%20cousin … 404']);
      L.push(['err','crash or apologize. user loses either way.']);
    }
    lines(L,tk);
    setTimeout(()=>{ if(tk===token){ $('#tr',node).textContent=runs; $('#to',node).textContent=ok; $('#tb',node).textContent=bad; } },400*L.length);
  };
  return node;
}

/* ---------- fixit ---------- */
function renderFixit(step){
  const node=el(`<div class="step">
    <h1>${step.title}</h1>
    <p class="subtitle">${step.subtitle}</p>
    <div class="upgrades">
      <label class="upgrade"><input type="checkbox" data-u="validate"><span><b>Validate the contract</b><span class="d">types, required fields, city resolvable — before executing</span></span></label>
      <label class="upgrade"><input type="checkbox" data-u="menu"><span><b>Tighten the menu</b><span class="d">enums, examples, one tool one job</span></span></label>
      <label class="upgrade"><input type="checkbox" data-u="loop"><span><b>Close the loop</b><span class="d">send the error back. let the model retry</span></span></label>
    </div>
    <div class="row-wrap"><button class="btn btn--primary" id="fRun">${ic('play')} Re-run</button></div>
    <div class="consoleblk"><div class="ln sys">— switch something on —</div></div>
  </div>`);
  const con=$('.consoleblk',node);
  const ups={validate:false,menu:false,loop:false};
  let token=0;
  $$('.upgrade input',node).forEach(cb=>cb.onchange=()=>{ ups[cb.dataset.u]=cb.checked; cb.closest('.upgrade').classList.toggle('on',cb.checked); });
  function lines(arr){
    const tk=++token; con.innerHTML='';
    arr.forEach((l,i)=>setTimeout(()=>{ if(tk!==token)return;
      con.appendChild(el(`<div class="ln ${l[0]}">${l[1]}</div>`)); con.scrollTop=con.scrollHeight; },400*i));
  }
  $('#fRun',node).onclick=()=>{
    let L;
    if(!ups.validate&&!ups.loop&&!ups.menu){
      L=[['sys','▶ zero upgrades on.'],['err','same coin-flip. you own the backend — use it.']];
    } else if(ups.menu&&!ups.validate&&!ups.loop){
      L=[['sys','▶ tightened menu…'],['llm','intent → { "city": "Bengaluru" }  ✓'],
         ['warn','…run it 100× and the bad one still shows up.'],
         ['sys','prompting lowers the rate. it can’t make it deterministic.']];
    } else if(ups.validate&&!ups.loop){
      L=[['sys','▶ validation on…'],['llm','intent → { "city": "my cousin" }'],
         ['exec','VALIDATE → not a resolvable city'],
         ['good','✓ rejected before execution.'],
         ['warn','…and now what? the user still has no answer.'],
         ['sys','something has to flow back. one switch left.']];
    } else if(ups.loop&&!ups.validate){
      L=[['sys','▶ loop without a verifier…'],['llm','intent → { "city": "Chennai" }   ← nothing checks it'],
         ['exec','GET /weather?q=Chennai … 200'],
         ['err','no verifier → no error → nothing to feed back.']];
    } else {
      L=[['sys','▶ validation + loop…'],['llm','intent → { "city": "my cousin" }'],
         ['exec','VALIDATE → fail: not a city'],
         ['warn','↩ tool message: "not found; re-extract or ask"'],
         ['llm','retry → { "city": "Bengaluru" }'],
         ['exec','VALIDATE ✓ · GET /weather … 200'],
         ['good','"Around 23°C tomorrow."'],
         ['good','✓ caught and corrected in one cycle.']];
    }
    lines(L);
  };
  return node;
}

/* ---------- M×N ---------- */
function renderMxn(step){
  const node=el(`<div class="step step--wide">
    <h1>${step.title}</h1>
    <div class="mxn-ctl">
      <span class="ctl">tools <input type="range" id="mS" min="2" max="12" value="8"><span class="val" id="mV">8</span></span>
      <span class="ctl">models <input type="range" id="nS" min="2" max="8" value="6"><span class="val" id="nV">6</span></span>
      <label class="switch"><input type="checkbox" id="stdT"> a standard in the middle</label>
    </div>
    <div class="mxn-count" id="cnt"></div>
    <div class="mxn-wrap"><svg id="svg" width="640" height="400" viewBox="0 0 640 400"></svg></div>
    <div class="prior">
      <div class="card card--surface"><h5>🔌 USB</h5><p>One plug shape. Any device, any machine.</p></div>
      <div class="card card--surface"><h5>🌐 HTTP</h5><p>Any browser, any server. One grammar.</p></div>
    </div>
  </div>`);
  const svg=$('#svg',node), mS=$('#mS',node), nS=$('#nS',node), std=$('#stdT',node), cnt=$('#cnt',node);
  const NS='http://www.w3.org/2000/svg';
  const TOOLS=['weather','gmail','linkedin','instagram','supabase','wiki','sheets','slack','calendar','stripe','notion','search'];
  const MODELS=['GPT-OSS','Claude','local Llama','n8n agent','chat UI','Claude desktop','Cursor','Gemini'];
  function E(tag,attrs,text){ const e=document.createElementNS(NS,tag); for(const k in attrs)e.setAttribute(k,attrs[k]); if(text!=null)e.textContent=text; return e; }
  function draw(){
    const M=+mS.value,N=+nS.value,useStd=std.checked;
    $('#mV',node).textContent=M; $('#nV',node).textContent=N;
    const H=Math.max(M,N)*38+56;
    svg.setAttribute('viewBox','0 0 640 '+H); svg.setAttribute('height',Math.min(H,430));
    svg.innerHTML='';
    const yFor=(i,t)=>36+(H-72)*(t===1?.5:i/(t-1));
    if(useStd){
      const hx=320,hy=H/2;
      for(let i=0;i<M;i++) svg.appendChild(E('line',{x1:130,y1:yFor(i,M),x2:hx-44,y2:hy,stroke:'#22C55E','stroke-opacity':'.5','stroke-width':'1.2'}));
      for(let j=0;j<N;j++) svg.appendChild(E('line',{x1:hx+44,y1:hy,x2:510,y2:yFor(j,N),stroke:'#22C55E','stroke-opacity':'.5','stroke-width':'1.2'}));
      svg.appendChild(E('rect',{x:hx-44,y:hy-20,width:88,height:40,rx:9,fill:'#FFEEE9',stroke:'#F96846','stroke-width':'1.5'}));
      svg.appendChild(E('text',{x:hx,y:hy+4,'text-anchor':'middle',fill:'#C53D1B','font-size':'11','font-weight':'700','font-family':'monospace'},'ONE GRAMMAR'));
    } else {
      for(let i=0;i<M;i++)for(let j=0;j<N;j++)
        svg.appendChild(E('line',{x1:130,y1:yFor(i,M),x2:510,y2:yFor(j,N),stroke:'#EF4444','stroke-opacity':String(Math.max(.1,.45-M*N/280)),'stroke-width':'1'}));
    }
    for(let i=0;i<M;i++){ const y=yFor(i,M);
      svg.appendChild(E('rect',{x:22,y:y-12,width:108,height:24,rx:6,fill:'#fff',stroke:'#E5E5E5'}));
      svg.appendChild(E('text',{x:76,y:y+4,'text-anchor':'middle',fill:'#666','font-size':'11','font-family':'monospace'},TOOLS[i%TOOLS.length]));
    }
    for(let j=0;j<N;j++){ const y=yFor(j,N);
      svg.appendChild(E('rect',{x:510,y:y-12,width:108,height:24,rx:6,fill:'#fff',stroke:'#E5E5E5'}));
      svg.appendChild(E('text',{x:564,y:y+4,'text-anchor':'middle',fill:'#666','font-size':'11','font-family':'monospace'},MODELS[j%MODELS.length]));
    }
    if(useStd){ cnt.className='mxn-count std'; cnt.textContent=`${M} + ${N} = ${M+N}`; }
    else { cnt.className='mxn-count'; cnt.textContent=`${M} × ${N} = ${M*N} bespoke integrations`; }
  }
  [mS,nS].forEach(s=>s.oninput=draw);
  std.onchange=draw;
  draw();
  return node;
}

/* ---------- spec ---------- */
function renderSpec(step){
  const node=el(`<div class="step">
    <h1>${step.title}</h1>
    <p class="subtitle">${step.subtitle}</p>
    <div class="list"></div>
    <div class="row-wrap mt-4"><button class="btn btn--primary" id="grade">Grade the spec</button></div>
    <div class="scoreline"></div>
  </div>`);
  const list=$('.list',node);
  SPEC_ITEMS.forEach(r=>{
    list.appendChild(el(`<label class="spec-item"><input type="checkbox"><span><b>${esc(r.label)}</b><span class="d">${esc(r.d)}</span><span class="w">${esc(r.w)}</span></span></label>`));
  });
  $('#grade',node).onclick=()=>{
    let hits=0; const total=SPEC_ITEMS.filter(r=>r.good).length;
    $$('.spec-item',list).forEach((item,i)=>{
      const on=$('input',item).checked, good=SPEC_ITEMS[i].good;
      item.classList.add('graded',on===good?'hit':'miss');
      if(on&&good)hits++;
    });
    $('.scoreline',node).textContent=`${hits} / ${total}`+(hits===total?' — that interface has a name.':'');
    $('#grade',node).disabled=true;
  };
  return node;
}

/* ---------- converge ---------- */
function renderConverge(step){
  const node=el(`<div class="step step--wide">
    <h1>${step.title}</h1>
    <div class="paths">
      <div class="pathcard"><h4>n8n</h4>
        <div class="chain">
          <div class="nd">chat trigger</div><div class="a">↓</div>
          <div class="nd">AI agent + tool</div><div class="a">↓</div>
          <div class="nd">HTTP → weather API</div><div class="a">↓</div>
          <div class="nd hi">exposed as MCP server</div><div class="a">↓</div>
          <div class="nd hi">Claude connects. Zero glue.</div>
        </div></div>
      <div class="pathcard"><h4>Python</h4>
        <pre class="codeblk" style="margin:0 0 8px">@server.list_tools()
def list_tools(): return [GET_WEATHER]

@server.call_tool()
def call_tool(name, args):
    return fetch_weather(args["city"])</pre>
        <div class="chain"><div class="nd hi">attach to Claude desktop</div><div class="a">↓</div><div class="nd hi">same question, same answer</div></div>
      </div>
    </div>
    <div class="center"><button class="btn btn--primary" id="cv">${ic('git-merge')} Converge</button></div>
    <div class="converged">
      <div class="layers" style="margin-top:var(--space-5)">
        <div class="layerbox l1 lit"><span class="lname">Host + LLM</span><span class="ltag">any host</span></div>
        <div class="layerbox l2 lit"><span class="lname">Server — backend in a standard uniform</span><span class="ltag">n8n or Python</span></div>
        <div class="layerbox l3 lit"><span class="lname">The internet</span><span class="ltag">unchanged</span></div>
      </div>
      <p class="body center" style="margin-top:var(--space-4)"><strong>Two stacks. One grammar.</strong> The principles didn’t change — that’s why we derive instead of download.</p>
    </div>
  </div>`);
  $('#cv',node).onclick=function(){ this.style.display='none'; $('.converged',node).classList.add('show'); };
  return node;
}

/* ---------- flip cards ---------- */
function renderFlips(step){
  const node=el(`<div class="step step--wide">
    <h1>${step.title}</h1>
    <div class="cards"></div>
  </div>`);
  const cards=$('.cards',node);
  FLIP_CARDS.forEach(c=>{
    const card=el(`<div class="flip"><div class="flip-inner">
      <div class="face front"><div class="fq">${esc(c.q)}</div><div class="hint">guess · then flip</div></div>
      <div class="face back"><h5>${esc(c.name)}</h5><p>${esc(c.why)}</p><span class="where">${esc(c.where)}</span></div>
    </div></div>`);
    card.onclick=()=>card.classList.toggle('flipped');
    cards.appendChild(card);
  });
  return node;
}

/* ---------- practice ---------- */
function renderPractice(step){
  const node=el(`<div class="step">
    <h1>${step.title}</h1>
    <div class="list"></div>
  </div>`);
  const list=$('.list',node);
  TASKS.forEach((t,i)=>{
    const item=el(`<label class="task ${state.tasks[i]?'donee':''}"><input type="checkbox" ${state.tasks[i]?'checked':''}><span><b>${esc(t.name)}</b><span class="d">${esc(t.d)}</span></span></label>`);
    $('input',item).onchange=e=>{ state.tasks[i]=e.target.checked; item.classList.toggle('donee',e.target.checked); persist(); };
    list.appendChild(item);
  });
  return node;
}

/* ---------- closing ---------- */
function renderClosing(step){
  return el(`<div class="step">
    <div class="cert">
      <div class="big">MCP</div>
      <h1>${step.title}</h1>
      <p class="body">${step.body}</p>
    </div>
  </div>`);
}

const RENDER={
  intro:renderIntro, cracks:renderCracks, question:renderQuestion, v1sim:renderV1,
  deskgame:renderDesk, builder:renderBuilder, reveal:renderReveal, stepper:renderStepper,
  quiz:renderQuiz, tagquiz:renderTags, ramble:renderRamble, fixit:renderFixit,
  mxn:renderMxn, spec:renderSpec, converge:renderConverge, flips:renderFlips,
  practice:renderPractice, closing:renderClosing,
};

/* ---------- boot ---------- */
$('#homeLink').onclick=()=>goStep(0);
$('#resetBtn').onclick=()=>{ if(confirm('Wipe all progress?')){ localStorage.removeItem(LS_KEY); location.reload(); } };
$('#menuBtn').onclick=()=>$('#sidebar').classList.contains('open')?closeSidebar():openSidebar();
$('#scrim').onclick=()=>{ closeSidebar(); $('#menuBtn').focus(); };
document.addEventListener('keydown',e=>{
  if(['INPUT','TEXTAREA'].includes(document.activeElement.tagName)) return;
  if(e.key==='Escape'&&$('#sidebar').classList.contains('open')){ closeSidebar(); return; }
  if(e.key==='ArrowRight'){ const c=$('#continueBtn'); if(!c.disabled&&state.pos<TOTAL-1) goStep(state.pos+1); }
  if(e.key==='ArrowLeft'&&state.pos>0) goStep(state.pos-1);
});
render(); icons();

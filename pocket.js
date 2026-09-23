/* pocket.js — MCAT Pocket: reference sheets, drill cards, and a linkable term notebook.
   Built to be usable one-handed, standing in a line, with no setup. */

function pesc(s){return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function pkUid(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}

function P(){
  if(!D.pocket) D.pocket={};
  const p=D.pocket;
  if(!p.mode) p.mode='sheets';
  if(!('open' in p)) p.open=null;
  if(!p.terms) p.terms=[];
  if(!p.drill) p.drill={};
  if(!p.pin) p.pin={};
  if(!p.deck) p.deck='all';
  if(!p.seeded){
    p.terms=(typeof POCKET_SEED_TERMS!=='undefined'?POCKET_SEED_TERMS:[]).map(t=>({id:pkUid(),term:t.term,def:t.def,ex:t.ex||'',tag:t.tag||'Other',conf:t.conf||2,added:todayStr()}));
    p.seeded=true;
  }
  return p;
}

let _pq='';      // sheet search
let _ptq='';     // term search
let _ptag='';    // term tag filter
let _pflip=false;
let _pcard=null;
let _pedit=null; // term id being edited, or 'new'

/* ===== linkify: [[term]] becomes a tappable chip ===== */
function pkLink(text){
  return pesc(text).replace(/\[\[([^\]]+)\]\]/g,(m,name)=>
    `<span class="pk-link" onclick="pocketJump('${pesc(name).replace(/'/g,"\\'")}')">${pesc(name)}</span>`);
}
function pocketJump(name){
  const n=name.toLowerCase();
  const sheet=POCKET_SHEETS.find(s=>s.title.toLowerCase().includes(n)||s.id===n);
  const p=P();
  const term=p.terms.find(t=>t.term.toLowerCase()===n)||p.terms.find(t=>t.term.toLowerCase().includes(n));
  if(term){p.mode='terms';_ptq=term.term;_ptag='';save();renderPocket();
    setTimeout(()=>{const el=document.getElementById('pkt-'+term.id);if(el){el.scrollIntoView({block:'center',behavior:'smooth'});el.classList.add('pk-flash');}},60);
    return;}
  if(sheet){p.mode='sheets';p.open=sheet.id;save();renderPocket();return;}
  p.mode='terms';_ptq=name;_ptag='';save();renderPocket();
}

/* ===== main ===== */
function renderPocket(){
  const root=document.getElementById('pocketRoot');
  if(!root||typeof POCKET_SHEETS==='undefined')return;
  const p=P();
  const tabs=[['sheets','menu_book','Sheets'],['drill','bolt','Drill'],['terms','edit_note','My Terms']];
  root.innerHTML=`
    <div class="pk-head">
      <div class="pk-title"><span class="mi">bookmark</span> Pocket</div>
      <div class="pk-tabs">
        ${tabs.map(([m,i,l])=>`<button class="pk-tab${p.mode===m?' on':''}" onclick="pocketMode('${m}')"><span class="mi">${i}</span>${l}</button>`).join('')}
      </div>
    </div>
    <div class="pk-body" id="pkBody"></div>`;
  renderPocketBody();
}
function pocketMode(m){const p=P();p.mode=m;p.open=null;_pedit=null;save();renderPocket();}
function renderPocketBody(){
  const p=P(),b=document.getElementById('pkBody');
  if(!b)return;
  if(p.mode==='sheets')return p.open?pkSheetDetail(b):pkSheetsHome(b);
  if(p.mode==='drill')return pkDrill(b);
  return pkTerms(b);
}

/* ===== SHEETS ===== */
function pkSheetsHome(b){
  b.innerHTML=`
    <div class="pk-search">
      <span class="mi">search</span>
      <input id="pkQ" placeholder="Search every sheet…" value="${pesc(_pq)}" oninput="pkSearch(this.value)">
      <span class="mi pk-x" id="pkClear" style="${_pq?'':'display:none;'}" onclick="pkSearch('')">close</span>
    </div>
    <div id="pkList"></div>`;
  pkList();
}
function pkSearch(v){
  _pq=v;
  const box=document.getElementById('pkQ');
  if(box&&box.value!==v)box.value=v;
  const x=document.getElementById('pkClear');
  if(x)x.style.display=v?'':'none';
  pkList();
}
function pkBlockText(bl){
  if(bl.t==='tbl')return [(bl.head||[]).join(' '),...(bl.rows||[]).map(r=>r.join(' '))].join(' ');
  return (bl.k||'')+' '+(bl.v||'');
}
function pkList(){
  const el=document.getElementById('pkList');if(!el)return;
  const p=P(),q=_pq.trim().toLowerCase();
  if(q){
    let hits=[];
    POCKET_SHEETS.forEach(s=>{
      s.blocks.forEach((bl,i)=>{
        const txt=pkBlockText(bl);
        if(txt.toLowerCase().includes(q)||s.title.toLowerCase().includes(q))hits.push({s,bl,i});
      });
    });
    if(!hits.length){
      el.innerHTML=`<div class="pk-empty"><span class="mi">search_off</span><div>Nothing for "${pesc(_pq)}" in the sheets.</div>
        <button class="pk-btn" onclick="pocketMode('terms');pkTermSearch('${pesc(_pq).replace(/'/g,"\\'")}')">Search my terms instead</button></div>`;
      return;
    }
    el.innerHTML=`<div class="pk-hint">${hits.length} match${hits.length===1?'':'es'}</div>`+
      hits.slice(0,40).map(h=>`
        <div class="pk-hit" onclick="pocketOpen('${h.s.id}')">
          <div class="pk-hit-src" style="color:var(--${h.s.color});">${pesc(h.s.title)}</div>
          ${pkBlock(h.bl,h.s)}
        </div>`).join('');
    return;
  }
  const pinned=POCKET_SHEETS.filter(s=>p.pin[s.id]);
  const rest=POCKET_SHEETS.filter(s=>!p.pin[s.id]);
  const card=s=>`
    <div class="pk-card" onclick="pocketOpen('${s.id}')">
      <div class="pk-ico" style="background:color-mix(in srgb,var(--${s.color}) 16%,transparent);color:var(--${s.color});"><span class="mi">${s.icon}</span></div>
      <div class="pk-card-txt">
        <div class="pk-card-t">${pesc(s.title)}</div>
        <div class="pk-card-s">${pesc(s.sub)} · ${(s.cards||[]).length} cards</div>
      </div>
      <span class="mi pk-pin${p.pin[s.id]?' on':''}" onclick="event.stopPropagation();pocketPin('${s.id}')">${p.pin[s.id]?'push_pin':'push_pin'}</span>
    </div>`;
  el.innerHTML=(pinned.length?`<div class="pk-hint">Pinned</div>`+pinned.map(card).join('')+`<div class="pk-hint">All sheets</div>`:'')+rest.map(card).join('');
}
function pocketPin(id){const p=P();p.pin[id]?delete p.pin[id]:p.pin[id]=1;save();pkList();}
function pocketOpen(id){const p=P();p.mode='sheets';p.open=id;save();renderPocket();window.scrollTo({top:0,behavior:'smooth'});}
function pocketBack(){const p=P();p.open=null;save();renderPocket();}

function pkBlock(bl,s){
  const c=s?s.color:'indigo';
  if(bl.t==='h')return `<div class="pk-bh">${pkLink(bl.v)}</div>`;
  if(bl.t==='f')return `<div class="pk-bf" style="border-color:color-mix(in srgb,var(--${c}) 40%,transparent);">
      ${bl.k?`<div class="pk-bf-k">${pkLink(bl.k)}</div>`:''}
      <div class="pk-bf-v">${pkLink(bl.v)}</div></div>`;
  if(bl.t==='tip')return `<div class="pk-btip"><span class="mi">bolt</span><div>${pkLink(bl.v)}</div></div>`;
  if(bl.t==='warn')return `<div class="pk-bwarn"><span class="mi">warning</span><div>${pkLink(bl.v)}</div></div>`;
  if(bl.t==='tbl')return `<div class="pk-btbl">
      <div class="pk-tr pk-th">${(bl.head||[]).map(h=>`<div>${pkLink(h)}</div>`).join('')}</div>
      ${(bl.rows||[]).map(r=>`<div class="pk-tr">${r.map((c2,i)=>`<div>${i===0?'<b>'+pkLink(c2)+'</b>':pkLink(c2)}</div>`).join('')}</div>`).join('')}
    </div>`;
  return `<div class="pk-bn">${pkLink(bl.v)}</div>`;
}
function pkSheetDetail(b){
  const p=P(),s=POCKET_SHEETS.find(x=>x.id===p.open);
  if(!s){p.open=null;return renderPocketBody();}
  b.innerHTML=`
    <div class="pk-detail-head" style="border-color:color-mix(in srgb,var(--${s.color}) 35%,transparent);">
      <button class="pk-back" onclick="pocketBack()"><span class="mi">arrow_back</span></button>
      <div>
        <div class="pk-detail-t" style="color:var(--${s.color});">${pesc(s.title)}</div>
        <div class="pk-card-s">${pesc(s.sub)}</div>
      </div>
      <span class="mi pk-pin${p.pin[s.id]?' on':''}" onclick="pocketPin('${s.id}');renderPocketBody();">push_pin</span>
    </div>
    <div class="pk-sheet">${s.blocks.map(bl=>pkBlock(bl,s)).join('')}</div>
    ${(s.cards||[]).length?`<button class="pk-btn pk-btn-lg" onclick="pocketDeck('${s.id}')"><span class="mi">bolt</span> Drill these ${(s.cards||[]).length} cards</button>`:''}`;
}

/* ===== DRILL ===== */
function pkDeckCards(){
  const p=P(),d=p.deck;
  let out=[];
  if(d==='terms'){
    p.terms.forEach(t=>out.push({id:'t:'+t.id,q:t.term,a:t.def+(t.ex?'\n\n'+t.ex:''),src:t.tag}));
  }else{
    POCKET_SHEETS.filter(s=>d==='all'||s.id===d).forEach(s=>{
      (s.cards||[]).forEach((c,i)=>out.push({id:s.id+':'+i,q:c.q,a:c.a,src:s.title,color:s.color}));
    });
    if(d==='all')p.terms.forEach(t=>out.push({id:'t:'+t.id,q:t.term,a:t.def+(t.ex?'\n\n'+t.ex:''),src:t.tag}));
  }
  return out;
}
function pocketDeck(id){const p=P();p.deck=id;p.mode='drill';p.open=null;_pcard=null;_pflip=false;save();renderPocket();window.scrollTo({top:0,behavior:'smooth'});}
function pkPickCard(){
  const p=P(),cards=pkDeckCards();
  if(!cards.length)return null;
  const score=c=>{const st=p.drill[c.id];if(!st)return 0;return (st.got||0)-(st.miss||0)*2+(st.last===todayStr()?4:0);};
  let min=Infinity;cards.forEach(c=>{const s=score(c);if(s<min)min=s;});
  const pool=cards.filter(c=>score(c)<=min+0.001).filter(c=>!_pcard||c.id!==_pcard.id);
  const use=pool.length?pool:cards;
  return use[Math.floor(Math.random()*use.length)];
}
function pkDrill(b){
  const p=P(),cards=pkDeckCards();
  if(!_pcard||!cards.some(c=>c.id===_pcard.id)){_pcard=pkPickCard();_pflip=false;}
  const seen=cards.filter(c=>p.drill[c.id]&&p.drill[c.id].last===todayStr()).length;
  const solid=cards.filter(c=>p.drill[c.id]&&(p.drill[c.id].got||0)-(p.drill[c.id].miss||0)>=2).length;
  const deckName=p.deck==='all'?'Everything':(p.deck==='terms'?'My terms':(POCKET_SHEETS.find(s=>s.id===p.deck)||{}).title||'Deck');
  const opts=[`<option value="all"${p.deck==='all'?' selected':''}>Everything (${pkCount('all')})</option>`,
    `<option value="terms"${p.deck==='terms'?' selected':''}>My terms (${p.terms.length})</option>`]
    .concat(POCKET_SHEETS.filter(s=>(s.cards||[]).length).map(s=>`<option value="${s.id}"${p.deck===s.id?' selected':''}>${pesc(s.title)} (${s.cards.length})</option>`)).join('');
  if(!_pcard){
    b.innerHTML=`<div class="pk-empty"><span class="mi">inbox</span><div>No cards in this deck yet.</div></div>`;return;
  }
  const st=p.drill[_pcard.id]||{};
  const col=_pcard.color||'indigo';
  b.innerHTML=`
    <div class="pk-drill-bar">
      <select class="pk-sel" onchange="pocketDeck(this.value)">${opts}</select>
      <div class="pk-drill-stat">${seen} today · ${solid} solid / ${cards.length}</div>
    </div>
    <div class="pk-flash-card${_pflip?' flipped':''}" onclick="pocketFlip()">
      <div class="pk-fc-src" style="color:var(--${col});">${pesc(_pcard.src||'')}</div>
      <div class="pk-fc-q">${pkLink(_pcard.q)}</div>
      ${_pflip?`<div class="pk-fc-a">${pkLink(_pcard.a)}</div>`:`<div class="pk-fc-tap"><span class="mi">touch_app</span> tap to reveal</div>`}
      ${(st.miss||st.got)?`<div class="pk-fc-hist">✓ ${st.got||0} · ✗ ${st.miss||0}</div>`:''}
    </div>
    ${_pflip?`<div class="pk-grade">
      <button class="pk-g pk-g-again" onclick="pocketGrade(0)"><span class="mi">replay</span> Again</button>
      <button class="pk-g pk-g-got" onclick="pocketGrade(1)"><span class="mi">check</span> Got it</button>
    </div>`:`<button class="pk-btn pk-btn-lg" onclick="pocketFlip()">Show answer</button>`}
    <button class="pk-skip" onclick="pocketSkip()">Skip this one</button>`;
}
function pkCount(d){let n=0;POCKET_SHEETS.forEach(s=>n+=(s.cards||[]).length);return n+P().terms.length;}
function pocketFlip(){_pflip=!_pflip;renderPocketBody();}
function pocketSkip(){_pcard=pkPickCard();_pflip=false;renderPocketBody();}
function pocketGrade(ok){
  const p=P();if(!_pcard)return;
  const st=p.drill[_pcard.id]||{got:0,miss:0};
  ok?st.got=(st.got||0)+1:st.miss=(st.miss||0)+1;
  st.last=todayStr();
  p.drill[_pcard.id]=st;save();
  _pcard=pkPickCard();_pflip=false;renderPocketBody();
}

/* ===== MY TERMS ===== */
function pkTermSearch(v){
  _ptq=v;
  const box=document.getElementById('pkTQ');
  if(box&&box.value!==v)box.value=v;
  pkTermList();
}
function pkTagFilter(t){_ptag=_ptag===t?'':t;renderPocketBody();}
function pkTerms(b){
  const p=P();
  const counts={};p.terms.forEach(t=>counts[t.tag]=(counts[t.tag]||0)+1);
  b.innerHTML=`
    <div class="pk-search">
      <span class="mi">search</span>
      <input id="pkTQ" placeholder="Search my terms…" value="${pesc(_ptq)}" oninput="pkTermSearch(this.value)">
      <span class="mi pk-add" onclick="pocketNewTerm()">add</span>
    </div>
    <div class="pk-tagrow">
      ${POCKET_TAGS.filter(t=>counts[t]).map(t=>`<button class="pk-tagchip${_ptag===t?' on':''}" onclick="pkTagFilter('${t.replace(/'/g,"\\'")}')">${pesc(t)} ${counts[t]}</button>`).join('')}
    </div>
    <div id="pkEditor"></div>
    <div id="pkTermList"></div>`;
  if(_pedit)pkEditor();
  pkTermList();
}
function pocketNewTerm(){_pedit='new';renderPocketBody();setTimeout(()=>{const f=document.getElementById('pkfTerm');if(f)f.focus();},50);}
function pocketEditTerm(id){_pedit=id;renderPocketBody();}
function pocketCancelTerm(){_pedit=null;renderPocketBody();}
function pkEditor(){
  const el=document.getElementById('pkEditor');if(!el)return;
  const p=P();
  const t=_pedit==='new'?{term:'',def:'',ex:'',tag:'Psych/Soc',conf:1}:p.terms.find(x=>x.id===_pedit);
  if(!t){_pedit=null;return;}
  el.innerHTML=`
    <div class="pk-editor">
      <input id="pkfTerm" class="pk-in" placeholder="Term or idea" value="${pesc(t.term)}">
      <textarea id="pkfDef" class="pk-in pk-ta" placeholder="What it means, in your words. Use [[double brackets]] to link another term.">${pesc(t.def)}</textarea>
      <textarea id="pkfEx" class="pk-in pk-ta pk-ta-sm" placeholder="Example, mnemonic, or where it tripped you up (optional)">${pesc(t.ex||'')}</textarea>
      <select id="pkfTag" class="pk-in">${POCKET_TAGS.map(x=>`<option${x===t.tag?' selected':''}>${pesc(x)}</option>`).join('')}</select>
      <div class="pk-editor-btns">
        <button class="pk-btn pk-btn-ghost" onclick="pocketCancelTerm()">Cancel</button>
        ${_pedit!=='new'?`<button class="pk-btn pk-btn-del" onclick="pocketDelTerm('${t.id}')"><span class="mi">delete</span></button>`:''}
        <button class="pk-btn pk-btn-go" onclick="pocketSaveTerm()">Save</button>
      </div>
    </div>`;
}
function pocketSaveTerm(){
  const p=P();
  const term=(document.getElementById('pkfTerm')||{}).value||'';
  const def=(document.getElementById('pkfDef')||{}).value||'';
  const ex=(document.getElementById('pkfEx')||{}).value||'';
  const tag=(document.getElementById('pkfTag')||{}).value||'Other';
  if(!term.trim()){_pedit=null;return renderPocketBody();}
  if(_pedit==='new'){
    p.terms.unshift({id:pkUid(),term:term.trim(),def:def.trim(),ex:ex.trim(),tag,conf:1,added:todayStr()});
  }else{
    const t=p.terms.find(x=>x.id===_pedit);
    if(t){t.term=term.trim();t.def=def.trim();t.ex=ex.trim();t.tag=tag;}
  }
  _pedit=null;save();renderPocketBody();
}
function pocketDelTerm(id){
  const p=P();p.terms=p.terms.filter(t=>t.id!==id);_pedit=null;save();renderPocketBody();
}
function pocketConf(id){
  const p=P(),t=p.terms.find(x=>x.id===id);if(!t)return;
  t.conf=(t.conf||1)%3+1;save();pkTermList();
}
const PK_CONF=[null,{l:'Shaky',c:'red'},{l:'Getting it',c:'amber'},{l:'Solid',c:'green'}];
function pkTermList(){
  const el=document.getElementById('pkTermList');if(!el)return;
  const p=P(),q=_ptq.trim().toLowerCase();
  let list=p.terms.filter(t=>(!_ptag||t.tag===_ptag)&&(!q||t.term.toLowerCase().includes(q)||(t.def||'').toLowerCase().includes(q)||(t.ex||'').toLowerCase().includes(q)));
  list=list.slice().sort((a,b)=>(a.conf||1)-(b.conf||1));
  if(!list.length){
    el.innerHTML=`<div class="pk-empty"><span class="mi">edit_note</span>
      <div>${q?`No term matching "${pesc(_ptq)}".`:'Nothing here yet.'}</div>
      <button class="pk-btn" onclick="pocketNewTerm()">＋ Add ${q?`"${pesc(_ptq)}"`:'a term'}</button></div>`;
    return;
  }
  el.innerHTML=list.map(t=>{
    const cf=PK_CONF[t.conf||1];
    return `<div class="pk-term" id="pkt-${t.id}">
      <div class="pk-term-top">
        <div class="pk-term-name">${pesc(t.term)}</div>
        <button class="pk-conf" style="color:var(--${cf.c});border-color:color-mix(in srgb,var(--${cf.c}) 45%,transparent);" onclick="pocketConf('${t.id}')">${cf.l}</button>
      </div>
      <div class="pk-term-def">${pkLink(t.def)}</div>
      ${t.ex?`<div class="pk-term-ex">${pkLink(t.ex)}</div>`:''}
      <div class="pk-term-foot">
        <span class="pk-term-tag">${pesc(t.tag)}</span>
        <span class="mi pk-term-edit" onclick="pocketEditTerm('${t.id}')">edit</span>
      </div>
    </div>`;
  }).join('');
}

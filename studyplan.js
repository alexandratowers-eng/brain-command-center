// Native study-plan view (replaces the broken file:// spreadsheet link).
// Reference content: window.STUDY_PLAN (studyplan-data.js). Personal data: localStorage only.
let _spTab = localStorage.getItem('spTab') || 'daily';

function setStudyTab(t){ _spTab=t; localStorage.setItem('spTab',t); renderStudyPlan(); }

function esc(s){return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function nl2br(s){return esc(s).replace(/\n/g,'<br>');}

function renderStudyPlan(){
  const el=document.getElementById('studyPlanView');
  if(!el) return;
  const SP=window.STUDY_PLAN;
  if(!SP){ el.innerHTML='<p style="font-size:11px;color:var(--dim);">Study plan data not loaded.</p>'; return; }

  const tabs=[['daily','Daily'],['weekly','Weekly'],['sessions','Kaplan 515+'],['resources','Resources'],['scores','Scores'],['journal','Journal']];
  let h='<div class="sp-tabs">'+tabs.map(([k,label])=>
    `<button class="sp-tab${_spTab===k?' active':''}" onclick="setStudyTab('${k}')">${label}</button>`
  ).join('')+'</div><div class="sp-body">';

  if(_spTab==='daily')       h+=spDaily(SP.daily);
  else if(_spTab==='weekly') h+=spWeekly(SP.weekly);
  else if(_spTab==='sessions')h+=spSessions(SP.sessions);
  else if(_spTab==='resources')h+=spResources(SP.resources);
  else if(_spTab==='scores') h+=spScores();
  else if(_spTab==='journal')h+=spJournal();

  h+='</div>';
  el.innerHTML=h;
}

// ---- Daily plan: checkable rows, progress persisted in D.mcatPlanDone ----
function spDaily(daily){
  if(!D.mcatPlanDone) D.mcatPlanDone={};
  const doneCount=daily.filter((_,i)=>D.mcatPlanDone[i]).length;
  const pct=daily.length?Math.round(doneCount/daily.length*100):0;
  let h=`<div class="sp-progress"><div class="sp-bar"><div class="sp-bar-fill" style="width:${pct}%"></div></div>
    <span>${doneCount}/${daily.length} days done (${pct}%)</span></div>`;
  h+=daily.map((d,i)=>{
    const done=!!D.mcatPlanDone[i];
    const secColor=d.section&&d.section.indexOf('CARS')>=0?'var(--purple)':d.section&&d.section.indexOf('FL')>=0?'var(--rose)':'var(--blue)';
    return `<div class="sp-day${done?' sp-day-done':''}">
      <div class="sp-day-head" onclick="toggleSpDay(${i})">
        <span class="sp-check">${done?'✓':''}</span>
        <span class="sp-date">${esc(d.date)} · ${esc(d.day)}</span>
        <span class="sp-week">${esc(d.week)}</span>
        <span class="sp-sec" style="background:${secColor}1a;color:${secColor};">${esc(d.section)}</span>
        <span class="sp-time">${esc(d.time)}</span>
      </div>
      <div class="sp-day-body">
        ${d.step1?`<div class="sp-step"><b>Open:</b> ${nl2br(d.step1)}</div>`:''}
        ${d.step2?`<div class="sp-step"><b>Do:</b> ${nl2br(d.step2)}</div>`:''}
        ${d.step3?`<div class="sp-step"><b>Practice:</b> ${nl2br(d.step3)}</div>`:''}
        ${d.boosters?`<div class="sp-boost">${nl2br(d.boosters)}</div>`:''}
      </div>
    </div>`;
  }).join('');
  return h;
}
function toggleSpDay(i){
  if(!D.mcatPlanDone) D.mcatPlanDone={};
  D.mcatPlanDone[i]=!D.mcatPlanDone[i];
  save(); renderStudyPlan();
}

// ---- Weekly overview ----
function spWeekly(weekly){
  return weekly.map(w=>`<div class="sp-card">
    <div class="sp-card-head"><b>${esc(w.week)}</b> <span class="sp-muted">${esc(w.dates)}</span> ${w.fl&&w.fl!=='No'&&w.fl!=='—'?`<span class="sp-fl">${esc(w.fl)}</span>`:''}</div>
    <div class="sp-card-focus">${nl2br(w.focus)}</div>
    <div class="sp-goal">🎯 ${nl2br(w.goal)}</div>
    <details class="sp-details"><summary>Kaplan sessions</summary><div class="sp-muted-block">${nl2br(w.sessions)}</div></details>
  </div>`).join('');
}

// ---- Kaplan session guide ----
function spSessions(sessions){
  return sessions.map(s=>`<div class="sp-card">
    <div class="sp-card-head"><b>${esc(s.title)}</b></div>
    ${s.topics?`<div class="sp-muted-block">${nl2br(s.topics)}</div>`:''}
    ${s.desc?`<div class="sp-desc">${nl2br(s.desc)}</div>`:''}
    ${s.boosters?`<details class="sp-details"><summary>⭐ Score boosters</summary><div class="sp-boost">${nl2br(s.boosters)}</div></details>`:''}
  </div>`).join('');
}

// ---- Resources ----
function spResources(res){
  return `<table class="sp-table"><thead><tr><th>Resource</th><th>When to use</th><th>Best for</th></tr></thead><tbody>`+
    res.map(r=>`<tr><td><b>${nl2br(r.name)}</b></td><td>${nl2br(r.when)}</td><td>${nl2br(r.best)}</td></tr>`).join('')+
    `</tbody></table>`;
}

// ---- Scores (personal, localStorage only) ----
function spScores(){
  if(!D.mcatScores) D.mcatScores=[
    {exam:'Baseline (prior)',cp:'',cars:'',bb:'',ps:'',total:'496',weak:'',action:''},
    {exam:'FL 1 — Apr 11',cp:'',cars:'',bb:'',ps:'',total:'',weak:'',action:''},
    {exam:'FL 2 — Apr 25',cp:'',cars:'',bb:'',ps:'',total:'',weak:'',action:''},
    {exam:'FL 3 — May 2',cp:'',cars:'',bb:'',ps:'',total:'',weak:'',action:''},
    {exam:'🎯 TARGET May 9',cp:'130',cars:'130',bb:'130',ps:'130',total:'515+',weak:'',action:''}
  ];
  const cols=[['exam','Exam'],['cp','C/P'],['cars','CARS'],['bb','B/B'],['ps','P/S'],['total','Total'],['weak','Weak topics'],['action','Action items']];
  let h='<p class="sp-note">🔒 Private — saved only in this browser, never uploaded.</p>';
  h+='<table class="sp-table sp-edit"><thead><tr>'+cols.map(c=>`<th>${c[1]}</th>`).join('')+'</tr></thead><tbody>';
  D.mcatScores.forEach((row,ri)=>{
    h+='<tr>'+cols.map(c=>`<td contenteditable="true" onblur="spScoreEdit(${ri},'${c[0]}',this.innerText)">${esc(row[c[0]]||'')}</td>`).join('')+'</tr>';
  });
  h+='</tbody></table>';
  return h;
}
function spScoreEdit(ri,key,val){
  if(!D.mcatScores||!D.mcatScores[ri]) return;
  D.mcatScores[ri][key]=val.trim();
  save();
}

// ---- Journal (personal, localStorage only) ----
function spJournal(){
  if(!D.mcatJournal) D.mcatJournal=[];
  let h='<p class="sp-note">🔒 Private — saved only in this browser, never uploaded.</p>';
  h+=`<button class="sp-add" onclick="spJournalAdd()">+ New entry</button>`;
  if(!D.mcatJournal.length) h+='<p class="sp-muted" style="padding:8px 0;">No entries yet. Log a win, a topic, or a reflection.</p>';
  h+=D.mcatJournal.map((e,i)=>`<div class="sp-jrow">
    <div class="sp-jhead"><input class="sp-jdate" type="date" value="${esc(e.date||'')}" onchange="spJournalEdit(${i},'date',this.value)">
      <input class="sp-jtopic" placeholder="Topic / section" value="${esc(e.topic||'')}" onchange="spJournalEdit(${i},'topic',this.value)">
      <button class="sp-del" onclick="spJournalDel(${i})" title="Delete">✕</button></div>
    <textarea class="sp-jnotes" placeholder="What I completed, mood, reflections…" onchange="spJournalEdit(${i},'notes',this.value)">${esc(e.notes||'')}</textarea>
  </div>`).join('');
  return h;
}
function spJournalAdd(){
  if(!D.mcatJournal) D.mcatJournal=[];
  const d=new Date();const pad=n=>String(n).padStart(2,'0');
  D.mcatJournal.unshift({date:d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()),topic:'',notes:''});
  save(); renderStudyPlan();
}
function spJournalEdit(i,key,val){
  if(!D.mcatJournal||!D.mcatJournal[i]) return;
  D.mcatJournal[i][key]=val;
  save();
}
function spJournalDel(i){
  if(!D.mcatJournal) return;
  if(!confirm('Delete this journal entry?')) return;
  D.mcatJournal.splice(i,1);
  save(); renderStudyPlan();
}

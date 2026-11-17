// Native study-plan view (replaces the broken file:// spreadsheet link).
// Reference content: window.STUDY_PLAN (studyplan-data.js). Personal data: localStorage only.
let _spTab = localStorage.getItem('spTab') || 'tracker';
// Kaplan plan removed — migrate stale saved tabs
if(['daily','weekly','sessions'].includes(_spTab)) _spTab='tracker';

function setStudyTab(t){ _spTab=t; localStorage.setItem('spTab',t); renderStudyPlan(); }

function esc(s){return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}
function nl2br(s){return esc(s).replace(/\n/g,'<br>');}

function renderStudyPlan(){
  const el=document.getElementById('studyPlanView');
  if(!el) return;
  const SP=window.STUDY_PLAN;
  if(!SP){ el.innerHTML='<p style="font-size:11px;color:var(--dim);">Study plan data not loaded.</p>'; return; }

  const tabs=[['progress','Progress'],['classes','Classes'],['tracker','Tracker'],['resources','Resources'],['scores','Scores'],['journal','Journal']];
  let h='<div class="sp-tabs">'+tabs.map(([k,label])=>
    `<button class="sp-tab${_spTab===k?' active':''}" onclick="setStudyTab('${k}')">${label}</button>`
  ).join('')+'</div><div class="sp-body">';

  if(_spTab==='progress')h+=spProgress();
  else if(_spTab==='classes')h+=spClasses();
  else if(_spTab==='tracker')h+=spTracker();
  else if(_spTab==='resources')h+=spResources(SP.resources);
  else if(_spTab==='scores') h+=spScores();
  else if(_spTab==='journal')h+=spJournal();

  h+='</div>';
  el.innerHTML=h;
  if(typeof renderMcatProgressCard==='function')renderMcatProgressCard();
}

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

// ---- Classes (Brem course log; schedule from classes-data.js, status in D.classLog) ----
// D.classLog[id] = {st:'done'|'missed'|'', rev:bool, pre:bool, post:bool, uw:bool, note:'', logId:number}
// Marking a class Attended also drops one row into D.mcatLog so the Tracker's weekly hours stay honest.
let _clCourse=localStorage.getItem('clCourse')||'';
let _clOnlyOpen=false;
function clSetCourse(c){_clCourse=c;localStorage.setItem('clCourse',c);renderStudyPlan();}
function clToggleOpen(){_clOnlyOpen=!_clOnlyOpen;renderStudyPlan();}
function clEntry(id){if(!D.classLog)D.classLog={};if(!D.classLog[id])D.classLog[id]={st:'',rev:false,pre:false,post:false,uw:false,note:''};return D.classLog[id];}
function clMinutes(c){const m=/(\d+)(?::(\d+))?\s*[–-]\s*(\d+)(?::(\d+))?/.exec(c.time||'');if(!m)return 90;const a=(+m[1])*60+(+(m[2]||0)),b=(+m[3])*60+(+(m[4]||0));return b>a?b-a:90;}
function clFmtDate(s){const d=new Date(s+'T12:00:00');return d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});}
function clDefaultCourse(){
  if(_clCourse&&window.BREM_COURSES[_clCourse])return _clCourse;
  const t=todayStr();return t<='2026-10-29'?'found':'c1';
}
function clSetStatus(id,st){
  const e=clEntry(id);const c=window.BREM_CLASSES.find(x=>x.id===id);
  e.st=(e.st===st)?'':st;
  if(!D.mcatLog)D.mcatLog=[];
  if(e.st==='done'&&c&&!e.logId){
    e.logId=Date.now();
    D.mcatLog.unshift({id:e.logId,date:c.date,subj:c.subj,what:'Brem class: '+c.topic,min:clMinutes(c)});
  } else if(e.st!=='done'&&e.logId){
    const i=D.mcatLog.findIndex(r=>r.id===e.logId);if(i>=0)D.mcatLog.splice(i,1);e.logId=0;
  }
  save();renderStudyPlan();
}
function clToggle(id,key){const e=clEntry(id);e[key]=!e[key];save();renderStudyPlan();}
function clNote(id){const e=clEntry(id);bccPrompt('Note for this class (what to review, what you missed):',e.note||'',v=>{if(v==null)return;e.note=v;save();renderStudyPlan();});}
function clMarkPastDone(course){
  const t=todayStr();let n=0;
  window.BREM_CLASSES.filter(c=>c.course===course&&c.date<t).forEach(c=>{const e=clEntry(c.id);if(!e.st){e.st='done';if(!e.logId){e.logId=Date.now()+n;if(!D.mcatLog)D.mcatLog=[];D.mcatLog.push({id:e.logId,date:c.date,subj:c.subj,what:'Brem class: '+c.topic,min:clMinutes(c)});}n++;}});
  if(!n){alert('Every past class already has a status.');return;}
  save();renderStudyPlan();
}
function spClasses(){
  const ALL=window.BREM_CLASSES||[],CO=window.BREM_COURSES||{};
  if(!ALL.length)return '<p class="sp-muted">Class schedule not loaded.</p>';
  if(!D.classLog)D.classLog={};
  const course=clDefaultCourse();const t=todayStr();
  const list=ALL.filter(c=>c.course===course);
  const done=list.filter(c=>(D.classLog[c.id]||{}).st==='done').length;
  const missed=list.filter(c=>(D.classLog[c.id]||{}).st==='missed').length;
  const rev=ALL.filter(c=>(D.classLog[c.id]||{}).rev).length;
  const unmarked=list.filter(c=>c.date<t&&!(D.classLog[c.id]||{}).st).length;
  const next=ALL.filter(c=>c.date>=t).sort((a,b)=>a.date<b.date?-1:1)[0];
  const pct=Math.round(done/list.length*100);
  let h='<p class="sp-note">Tap <b>✓</b> when a class is done. It logs itself to the Tracker. Flag <b>↻</b> for anything to rewatch.</p>';
  // course switch + progress
  h+='<div class="cl-head"><div class="cl-courses">'+Object.keys(CO).map(k=>'<button class="sp-chip'+(k===course?' active':'')+'" onclick="clSetCourse(\''+k+'\')">'+CO[k].label+'</button>').join('')+
     '<button class="sp-chip'+(_clOnlyOpen?' active':'')+'" onclick="clToggleOpen()" title="Only unmarked, missed, or flagged">Open items'+(rev?' · ↻'+rev:'')+'</button></div>'+
     '<div class="cl-prog"><div class="cl-bar"><i style="width:'+pct+'%"></i></div><span>'+done+' / '+list.length+' attended'+(missed?' · <b class="cl-miss">'+missed+' missed</b>':'')+'</span></div>'+
     '<div class="sp-muted">'+(CO[course]?CO[course].sub:'')+'</div></div>';
  if(unmarked>0)h+='<div class="cl-nudge">'+unmarked+' past class'+(unmarked>1?'es have':' has')+' no status yet. <button class="sp-add" style="margin:0 0 0 6px;padding:3px 9px;" onclick="clMarkPastDone(\''+course+'\')">Mark all past as attended</button> <span class="sp-muted">then switch the few you missed.</span></div>';
  // next up
  if(next){
    const e=D.classLog[next.id]||{};const isToday=next.date===t;
    h+='<div class="cl-next"><div class="cl-next-k">'+(isToday?'TODAY':'NEXT UP')+' · '+clFmtDate(next.date)+' · '+esc(next.time)+' ET</div><div class="cl-next-t"><span class="cl-dot s-'+next.subj+'"></span>'+esc(next.topic)+' <span class="sp-muted">('+(CO[next.course]||{}).label+(typeof next.num==='number'?' · Class '+next.num:'')+')</span></div>';
    const due=[];if(next.pre)due.push(['pre','Pre-class: '+next.pre]);if(next.post)due.push(['post','Post-class: '+next.post]);if(next.uw)due.push(['uw','UWorld: '+next.uw]);
    if(due.length)h+='<div class="cl-due">'+due.map(d=>'<label class="cl-chk'+(e[d[0]]?' on':'')+'"><input type="checkbox" '+(e[d[0]]?'checked':'')+' onchange="clToggle(\''+next.id+'\',\''+d[0]+'\')"> '+esc(d[1])+'</label>').join('')+'</div>';
    else h+='<div class="sp-muted" style="margin-top:4px;">Nothing listed as due before this one.</div>';
    h+='</div>';
  }
  // rows grouped by week
  let lastWk=null;
  const rows=list.filter(c=>{if(!_clOnlyOpen)return true;const e=D.classLog[c.id]||{};return e.rev||e.st==='missed'||(c.date<t&&!e.st);});
  if(!rows.length)h+='<p class="sp-muted" style="padding:8px 0;">Nothing open. 🎉</p>';
  rows.forEach(c=>{
    const e=D.classLog[c.id]||{};
    if(c.wk!==lastWk){lastWk=c.wk;h+='<div class="cl-wk">'+(c.wk==='Pre'?'Pre-course':'Week '+c.wk)+'</div>';}
    const past=c.date<t,today=c.date===t;
    const cls='cl-row'+(e.st==='done'?' done':'')+(e.st==='missed'?' missed':'')+(e.rev?' rev':'')+(today?' today':'')+(past&&!e.st?' open':'');
    h+='<div class="'+cls+'">';
    h+='<div class="cl-when"><b>'+clFmtDate(c.date)+'</b><span>'+esc(c.time)+'</span></div>';
    h+='<div class="cl-main"><div class="cl-topic"><span class="cl-dot s-'+c.subj+'"></span>'+(typeof c.num==='number'?'<span class="cl-num">'+c.num+'</span>':'<span class="cl-num">'+esc(String(c.num))+'</span>')+esc(c.topic)+'</div>';
    const chips=[];if(c.pre)chips.push(['pre','Pre',c.pre]);if(c.post)chips.push(['post','Post',c.post]);if(c.uw)chips.push(['uw','UWorld',c.uw]);
    if(chips.length||e.note)h+='<div class="cl-chips">'+chips.map(ch=>'<span class="cl-pill'+(e[ch[0]]?' on':'')+'" title="'+esc(ch[2])+'" onclick="clToggle(\''+c.id+'\',\''+ch[0]+'\')">'+(e[ch[0]]?'✓ ':'')+ch[1]+'</span>').join('')+(e.note?'<span class="cl-notetxt" onclick="clNote(\''+c.id+'\')">📝 '+esc(e.note)+'</span>':'')+'</div>';
    h+='</div>';
    h+='<div class="cl-acts">'+
      '<button class="cl-st'+(e.st==='done'?' on-done':'')+'" title="Attended" onclick="clSetStatus(\''+c.id+'\',\'done\')">✓</button>'+
      '<button class="cl-st'+(e.st==='missed'?' on-miss':'')+'" title="Missed" onclick="clSetStatus(\''+c.id+'\',\'missed\')">✗</button>'+
      '<button class="cl-st'+(e.rev?' on-rev':'')+'" title="Flag to review / rewatch" onclick="clToggle(\''+c.id+'\',\'rev\')">↻</button>'+
      '<button class="cl-st" title="Note" onclick="clNote(\''+c.id+'\')">📝</button></div>';
    h+='</div>';
  });
  h+='<p class="sp-muted" style="margin-top:10px;">Schedule source: Brem Fall Foundations 2026 PDF + Cohort 1 full schedule. Subject dot: <span class="cl-dot s-cp"></span>C/P <span class="cl-dot s-cars"></span>CARS <span class="cl-dot s-bb"></span>B/B <span class="cl-dot s-ps"></span>P/S</p>';
  return h;
}

// ---- Tracker (personal, localStorage only) ----
// Replaces the external tracking spreadsheet: one line per study session, filterable by section.
const SP_SUBJ=[['cp','C/P'],['cars','CARS'],['bb','B/B'],['ps','P/S'],['other','Other']];
let _spFilter='all';
function spSetFilter(f){_spFilter=f;renderStudyPlan();}
function spSubjName(k){const m=SP_SUBJ.find(s=>s[0]===k);return m?m[1]:'Other';}

function spTracker(){
  if(!D.mcatLog)D.mcatLog=[];
  const rows=_spFilter==='all'?D.mcatLog:D.mcatLog.filter(e=>e.subj===_spFilter);
  const now=new Date();const wkStart=new Date(now);wkStart.setDate(now.getDate()-((now.getDay()+6)%7));wkStart.setHours(0,0,0,0);
  const wkMin=D.mcatLog.filter(e=>new Date(e.date+'T12:00:00')>=wkStart).reduce((a,e)=>a+(+e.min||0),0);
  let h='<p class="sp-note">🔒 Private — saved only in this browser. One line per study session: what, which section, how long.</p>';
  h+=`<div class="sp-quicklog">
    <input id="spqWhat" type="text" placeholder="What did you study? (e.g. Amino acids — flashcards)" onkeydown="if(event.key==='Enter')spLogAdd()">
    <select id="spqSubj">${SP_SUBJ.map(s=>`<option value="${s[0]}">${s[1]}</option>`).join('')}</select>
    <input id="spqMin" type="number" min="0" placeholder="min" style="width:58px;">
    <button class="sp-add" style="margin:0;" onclick="spLogAdd()">+ Log</button>
  </div>`;
  h+='<div class="sp-filterbar"><span class="sp-chip'+(_spFilter==='all'?' active':'')+'" onclick="spSetFilter(\'all\')">All ('+D.mcatLog.length+')</span>'+
    SP_SUBJ.map(s=>{const n=D.mcatLog.filter(e=>e.subj===s[0]).length;return '<span class="sp-chip'+(_spFilter===s[0]?' active':'')+'" onclick="spSetFilter(\''+s[0]+'\')">'+s[1]+' ('+n+')</span>';}).join('')+
    '<span class="sp-wktotal">This week: <b>'+(Math.round(wkMin/6)/10)+'h</b></span></div>';
  if(!rows.length){
    h+='<p class="sp-muted" style="padding:8px 0;">Nothing logged'+(_spFilter!=='all'?' for '+spSubjName(_spFilter):'')+' yet. Add a session above, or import your spreadsheet below.</p>';
  } else {
    h+='<table class="sp-table sp-edit"><thead><tr><th style="width:88px;">Date</th><th style="width:60px;">Section</th><th>What</th><th style="width:46px;">Min</th><th style="width:26px;"></th></tr></thead><tbody>';
    rows.forEach(e=>{
      const i=D.mcatLog.indexOf(e);
      h+='<tr><td contenteditable="true" onblur="spLogEdit('+i+',\'date\',this.innerText)">'+esc(e.date)+'</td>'+
        '<td><span class="sp-subj sp-subj-'+esc(e.subj||'other')+'" onclick="spLogCycleSubj('+i+')" title="Click to change section">'+spSubjName(e.subj)+'</span></td>'+
        '<td contenteditable="true" onblur="spLogEdit('+i+',\'what\',this.innerText)">'+esc(e.what||'')+'</td>'+
        '<td contenteditable="true" onblur="spLogEdit('+i+',\'min\',this.innerText)">'+esc(e.min||'')+'</td>'+
        '<td><button class="sp-del" onclick="spLogDel('+i+')" title="Delete">✕</button></td></tr>';
    });
    h+='</tbody></table>';
  }
  h+='<div style="margin-top:12px;"><button class="sp-add" onclick="spImportCsv()">⬆ Import spreadsheet (.csv)</button>'+
    '<span class="sp-note" style="display:inline;margin-left:6px;">Export your sheet as CSV — date / section / what / minutes columns are picked up automatically.</span></div>';
  return h;
}
// ---- Progress (Nov 2026): makes D.mcatLog visible again. Everything derives from the Tracker rows;
// nothing new to maintain. Subject colours are shared by the chart, heatmap, balance bars and sidebar card.
const SP_COL={cp:'var(--blue)',cars:'var(--amber)',bb:'var(--green)',ps:'var(--purple)',other:'var(--dim)'};
const MCAT_TEST_DATE='2027-02-12';
function spD(str){return new Date(str+'T12:00:00');}
function spKey(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function spMonday(d){const m=new Date(d);m.setDate(d.getDate()-((d.getDay()+6)%7));m.setHours(0,0,0,0);return m;}
function spHrs(min){const h=min/60;return (h>=10?Math.round(h):Math.round(h*10)/10)+'h';}
function spGoal(){return +D.mcatWeekGoal||10;}
function spSetGoal(v){const n=parseFloat(v);if(!isNaN(n)&&n>0){D.mcatWeekGoal=n;save();renderStudyPlan();}}
// Aggregate once: minutes per day, per ISO week (Monday key), per subject.
function spStats(){
  const log=(D.mcatLog||[]).filter(e=>e&&e.date&&/^\d{4}-\d{2}-\d{2}$/.test(e.date));
  const byDay={},byWeek={},bySubj={};
  log.forEach(e=>{
    const m=+e.min||0;
    byDay[e.date]=(byDay[e.date]||0)+m;
    const wk=spKey(spMonday(spD(e.date)));
    byWeek[wk]=byWeek[wk]||{total:0,cp:0,cars:0,bb:0,ps:0,other:0,n:0};
    byWeek[wk].total+=m;byWeek[wk][SP_COL[e.subj]?e.subj:'other']+=m;byWeek[wk].n++;
    const sk=SP_COL[e.subj]?e.subj:'other';bySubj[sk]=(bySubj[sk]||0)+m;
  });
  // Streak: consecutive days ending today or yesterday with at least one logged row.
  const today=todayStr();let streak=0;const cur=new Date();cur.setHours(12,0,0,0);
  if(!byDay[today])cur.setDate(cur.getDate()-1);
  while(byDay[spKey(cur)]){streak++;cur.setDate(cur.getDate()-1);}
  const total=log.reduce((a,e)=>a+(+e.min||0),0);
  const thisWk=spKey(spMonday(new Date()));
  const lastMon=spMonday(new Date());lastMon.setDate(lastMon.getDate()-7);const lastWk=spKey(lastMon);
  const daysLeft=Math.ceil((spD(MCAT_TEST_DATE)-new Date())/86400000);
  return {log,byDay,byWeek,bySubj,streak,total,thisWk,lastWk,daysLeft,sessions:log.length};
}
function spProgress(){
  const S=spStats();
  if(!S.log.length)return '<p class="sp-note">Nothing logged yet. Add a line in the Tracker tab (or mark a Brem class Attended) and this page fills in on its own.</p>';
  const goal=spGoal();const goalMin=goal*60;
  const tw=S.byWeek[S.thisWk]||{total:0,n:0};const lw=S.byWeek[S.lastWk]||{total:0,n:0};
  const pct=Math.min(100,Math.round(tw.total/goalMin*100));
  const delta=tw.total-lw.total;
  const dow=(new Date().getDay()+6)%7; // 0=Mon
  const pace=dow>0?Math.round(tw.total/(dow+1)*7):tw.total*7;
  let h='<p class="sp-note">🔒 Private. Built from your Tracker rows: log a session there and this page updates.</p>';

  // Headline tiles
  h+='<div class="spp-tiles">';
  h+=`<div class="spp-tile spp-main"><div class="spp-k">This week</div><div class="spp-v">${spHrs(tw.total)}<span class="spp-of"> / <input class="spp-goal" type="number" min="1" step="1" value="${goal}" onchange="spSetGoal(this.value)" title="Weekly goal (hours)">h</span></div>
    <div class="spp-bar"><i style="width:${pct}%"></i></div>
    <div class="spp-sub">${tw.n||0} session${tw.n===1?'':'s'} · ${delta>=0?'▲':'▼'} ${spHrs(Math.abs(delta))} vs last week${dow<6?' · on pace for '+spHrs(pace):''}</div></div>`;
  h+=`<div class="spp-tile"><div class="spp-k">Streak</div><div class="spp-v">${S.streak}<span class="spp-of"> day${S.streak===1?'':'s'}</span></div><div class="spp-sub">${S.byDay[todayStr()]?'Logged today ✓':'Nothing logged today yet'}</div></div>`;
  h+=`<div class="spp-tile"><div class="spp-k">All time</div><div class="spp-v">${spHrs(S.total)}</div><div class="spp-sub">${S.sessions} sessions logged</div></div>`;
  h+=`<div class="spp-tile"><div class="spp-k">Test day</div><div class="spp-v">${S.daysLeft>0?S.daysLeft:0}<span class="spp-of"> days</span></div><div class="spp-sub">Feb 12, 2027 · ${Math.max(0,Math.floor(S.daysLeft/7))} weeks</div></div>`;
  h+='</div>';

  // 12-week stacked bar chart
  const weeks=[];const m0=spMonday(new Date());
  for(let i=11;i>=0;i--){const d=new Date(m0);d.setDate(m0.getDate()-7*i);weeks.push(spKey(d));}
  const maxMin=Math.max(goalMin,...weeks.map(k=>(S.byWeek[k]||{total:0}).total));
  h+='<div class="spp-sec"><div class="spp-h">Hours per week <span>last 12 weeks · dashed line = goal</span></div>';
  h+='<div class="spp-chart"><div class="spp-goal-line" style="bottom:calc(18px + (100% - 32px) * '+(goalMin/maxMin).toFixed(3)+')"><b>goal '+goal+'h</b></div>';
  weeks.forEach(k=>{
    const w=S.byWeek[k];const t=w?w.total:0;const d=spD(k);
    const lbl=(d.getMonth()+1)+'/'+d.getDate();
    let stack='';
    if(w)Object.keys(SP_COL).forEach(s=>{if(w[s])stack+=`<i style="height:${w[s]/maxMin*100}%;background:${SP_COL[s]}" title="${spSubjName(s)}: ${spHrs(w[s])}"></i>`;});
    h+=`<div class="spp-col${k===S.thisWk?' now':''}" title="Week of ${lbl}: ${spHrs(t)}"><div class="spp-colval">${t?spHrs(t):''}</div><div class="spp-stack">${stack}</div><div class="spp-collbl">${lbl}</div></div>`;
  });
  h+='</div></div>';

  // 8-week daily heatmap (rows = weeks, columns Mon..Sun)
  h+='<div class="spp-sec"><div class="spp-h">Daily heatmap <span>last 8 weeks · darker = more minutes</span></div><div class="spp-heat">';
  h+='<div class="spp-heatrow spp-heathead"><span></span>'+['M','T','W','T','F','S','S'].map(x=>'<b>'+x+'</b>').join('')+'</div>';
  const dayMax=Math.max(60,...Object.values(S.byDay));
  for(let i=7;i>=0;i--){
    const mon=new Date(m0);mon.setDate(m0.getDate()-7*i);
    h+='<div class="spp-heatrow"><span>'+(mon.getMonth()+1)+'/'+mon.getDate()+'</span>';
    for(let j=0;j<7;j++){
      const d=new Date(mon);d.setDate(mon.getDate()+j);const k=spKey(d);const v=S.byDay[k]||0;
      const fut=k>todayStr();const a=v?0.2+0.8*Math.min(1,v/dayMax):0;
      h+=`<div class="spp-cell${k===todayStr()?' today':''}${fut?' fut':''}" style="${v?'background:rgba(129,140,248,'+a.toFixed(2)+');':''}" title="${k}: ${v?v+' min':'—'}"></div>`;
    }
    h+='</div>';
  }
  h+='</div></div>';

  // Subject balance, last 4 weeks
  const since=new Date(m0);since.setDate(m0.getDate()-21);const sinceK=spKey(since);
  const rec={};let recTot=0;S.log.forEach(e=>{if(e.date>=sinceK){const k=SP_COL[e.subj]?e.subj:'other';rec[k]=(rec[k]||0)+(+e.min||0);recTot+=(+e.min||0);}});
  h+='<div class="spp-sec"><div class="spp-h">Section balance <span>last 4 weeks</span></div>';
  if(!recTot)h+='<p class="sp-note">No sessions in the last 4 weeks.</p>';
  else{
    h+='<div class="spp-balbar">'+Object.keys(SP_COL).filter(s=>rec[s]).map(s=>`<i style="width:${rec[s]/recTot*100}%;background:${SP_COL[s]}" title="${spSubjName(s)} ${Math.round(rec[s]/recTot*100)}%"></i>`).join('')+'</div>';
    h+='<div class="spp-legend">'+Object.keys(SP_COL).filter(s=>s!=='other'||rec[s]).map(s=>`<span><i style="background:${SP_COL[s]}"></i>${spSubjName(s)} <b>${Math.round((rec[s]||0)/recTot*100)}%</b> · ${spHrs(rec[s]||0)}</span>`).join('')+'</div>';
    const low=Object.keys(SP_COL).filter(s=>s!=='other').sort((a,b)=>(rec[a]||0)-(rec[b]||0))[0];
    if(low&&(rec[low]||0)/recTot<0.15)h+=`<p class="sp-note" style="margin-top:6px;">👀 ${spSubjName(low)} is getting the least time (${Math.round((rec[low]||0)/recTot*100)}%). Worth a slot this week?</p>`;
  }
  h+='</div>';

  // Last 7 days recap: the actual words you wrote
  h+='<div class="spp-sec"><div class="spp-h">What you did this week <span>last 7 days, your own notes</span></div>';
  const cut=new Date();cut.setDate(cut.getDate()-6);const cutK=spKey(cut);
  const recent=S.log.filter(e=>e.date>=cutK).sort((a,b)=>b.date.localeCompare(a.date));
  if(!recent.length)h+='<p class="sp-note">Nothing in the last 7 days.</p>';
  else{
    let lastD='';
    h+='<div class="spp-recap">';
    recent.forEach(e=>{
      if(e.date!==lastD){lastD=e.date;const d=spD(e.date);const name=e.date===todayStr()?'Today':d.toLocaleDateString(undefined,{weekday:'long',month:'short',day:'numeric'});
        h+=`<div class="spp-day">${name} <span>${spHrs(S.byDay[e.date]||0)}</span></div>`;}
      h+=`<div class="spp-row"><i style="background:${SP_COL[e.subj]||SP_COL.other}"></i><span class="spp-what">${esc(e.what||'')}</span><span class="spp-min">${e.min?e.min+'m':''}</span></div>`;
    });
    h+='</div>';
  }
  h+='</div>';

  // Look back: resurface older rows so writing them down was not the last time you saw them
  const older=S.log.filter(e=>e.date<cutK);
  if(older.length){
    const seed=parseInt(todayStr().replace(/-/g,''),10);
    const picks=[];const used=new Set();
    for(let i=0;i<Math.min(3,older.length);i++){let idx=(seed*(i+7)*31+i*101)%older.length;while(used.has(idx))idx=(idx+1)%older.length;used.add(idx);picks.push(older[idx]);}
    h+='<div class="spp-sec"><div class="spp-h">Look back <span>3 older entries, rotates daily</span></div><div class="spp-recap">';
    picks.sort((a,b)=>b.date.localeCompare(a.date)).forEach(e=>{
      const d=spD(e.date);const ago=Math.round((new Date()-d)/86400000);
      h+=`<div class="spp-row"><i style="background:${SP_COL[e.subj]||SP_COL.other}"></i><span class="spp-what">${esc(e.what||'')}</span><span class="spp-min">${d.toLocaleDateString(undefined,{month:'short',day:'numeric'})} · ${ago}d ago</span></div>`;
    });
    h+='</div></div>';
  }
  return h;
}
// Sidebar card (dashboard). Tiny version of the above so progress is visible without opening the MCAT tab.
function renderMcatProgressCard(){
  const card=document.getElementById('mcatProgressCard');const body=document.getElementById('mcatProgressBody');
  if(!card||!body)return;
  const S=spStats();
  if(!S.log.length){card.style.display='none';return;}
  card.style.display='';
  const goalMin=spGoal()*60;const tw=S.byWeek[S.thisWk]||{total:0,n:0};
  const pct=Math.min(100,Math.round(tw.total/goalMin*100));
  const m0=spMonday(new Date());let dots='';
  for(let j=0;j<7;j++){const d=new Date(m0);d.setDate(m0.getDate()+j);const k=spKey(d);const v=S.byDay[k]||0;
    dots+=`<i class="${v?'on':''}${k===todayStr()?' today':''}${k>todayStr()?' fut':''}" title="${k}: ${v?v+' min':'—'}" style="${v?'opacity:'+(0.35+0.65*Math.min(1,v/120)).toFixed(2):''}"></i>`;}
  // One line from the log: today's latest, else yesterday's, else a rotating older one
  const sorted=S.log.slice().sort((a,b)=>b.date.localeCompare(a.date));
  const seed=parseInt(todayStr().replace(/-/g,''),10);
  const pick=sorted.find(e=>e.date===todayStr())||sorted[seed%sorted.length];
  const pd=pick?spD(pick.date):null;const ago=pd?Math.round((new Date()-pd)/86400000):0;
  let h=`<div class="mpc-top"><div class="mpc-big">${spHrs(tw.total)}<span> / ${spGoal()}h this week</span></div><div class="mpc-streak" title="Consecutive days with a logged session">🔥 ${S.streak}</div></div>`;
  h+=`<div class="spp-bar"><i style="width:${pct}%"></i></div>`;
  h+=`<div class="mpc-dots">${dots}<span>${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][(new Date().getDay()+6)%7]}</span></div>`;
  if(pick)h+=`<div class="mpc-line"><i style="background:${SP_COL[pick.subj]||SP_COL.other}"></i><span>${esc(pick.what||'')}</span><em>${ago===0?'today':ago+'d ago'}</em></div>`;
  h+=`<div class="mpc-foot"><span>${S.daysLeft>0?S.daysLeft+' days to test':'Test day!'}</span><a href="#" onclick="event.preventDefault();_spTab='progress';localStorage.setItem('spTab','progress');switchTab('mcat',document.querySelector('.tab-btn[onclick*=\\'mcat\\']'));">Open progress →</a></div>`;
  body.innerHTML=h;
}

function spLogAdd(){
  const w=document.getElementById('spqWhat');
  const what=w.value.trim();
  if(!what){w.focus();return;}
  const subj=document.getElementById('spqSubj').value;
  const min=parseInt(document.getElementById('spqMin').value,10)||0;
  if(!D.mcatLog)D.mcatLog=[];
  D.mcatLog.unshift({id:Date.now(),date:todayStr(),subj,what,min});
  save();renderStudyPlan();
  const nw=document.getElementById('spqWhat');if(nw)nw.focus();
}
function spLogEdit(i,key,val){
  if(!D.mcatLog||!D.mcatLog[i])return;
  val=String(val).trim();
  if(key==='min')val=parseInt(val.replace(/[^0-9]/g,''),10)||0;
  D.mcatLog[i][key]=val;
  save();
}
function spLogCycleSubj(i){
  if(!D.mcatLog||!D.mcatLog[i])return;
  const order=SP_SUBJ.map(s=>s[0]);
  const cur=order.indexOf(D.mcatLog[i].subj);
  D.mcatLog[i].subj=order[(cur+1)%order.length];
  save();renderStudyPlan();
}
function spLogDel(i){
  if(!D.mcatLog)return;
  if(!confirm('Delete this log entry?'))return;
  D.mcatLog.splice(i,1);
  save();renderStudyPlan();
}

// ---- CSV import (pull the old tracking spreadsheet in) ----
function spParseCsv(text){
  const rows=[];let row=[],cur='',q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(q){if(ch==='"'){if(text[i+1]==='"'){cur+='"';i++;}else q=false;}else cur+=ch;}
    else if(ch==='"')q=true;
    else if(ch===','){row.push(cur);cur='';}
    else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cur);cur='';if(row.some(c=>c.trim()!==''))rows.push(row);row=[];}
    else cur+=ch;
  }
  if(cur!==''||row.length){row.push(cur);if(row.some(c=>c.trim()!==''))rows.push(row);}
  return rows;
}
function spImportCsv(){
  const inp=document.createElement('input');inp.type='file';inp.accept='.csv,text/csv';
  inp.onchange=()=>{
    const f=inp.files[0];if(!f)return;
    const r=new FileReader();
    r.onload=()=>{
      const rows=spParseCsv(String(r.result||''));
      if(!rows.length){alert('No rows found in that file.');return;}
      const hdr=rows[0].map(c=>String(c).toLowerCase().trim());
      const hi={
        date:hdr.findIndex(c=>/\bdate\b|\bday\b/.test(c)),
        subj:hdr.findIndex(c=>/subject|section|category/.test(c)),
        what:hdr.findIndex(c=>/what|task|activity|topic|descri|content|notes?/.test(c)),
        min:hdr.findIndex(c=>/min|time|duration|hours?|hrs/.test(c))
      };
      const hasHdr=Object.values(hi).some(i=>i>=0);
      const body=hasHdr?rows.slice(1):rows;
      const pick=(row,i,fb)=>String((i>=0?row[i]:row[fb])||'').trim();
      const subjOf=s=>{s=(s||'').toLowerCase();
        if(/c\s*\/?\s*p|chem|phys/.test(s))return 'cp';
        if(/cars|reading|critical/.test(s))return 'cars';
        if(/b\s*\/?\s*b|bio/.test(s))return 'bb';
        if(/p\s*\/?\s*s|psych|soc|behav/.test(s))return 'ps';
        return 'other';};
      if(!D.mcatLog)D.mcatLog=[];
      let n=0;
      body.forEach(row=>{
        const what=pick(row,hi.what,2)||pick(row,-1,1)||pick(row,-1,0);
        if(!what)return;
        let date=pick(row,hi.date,0);
        const d=new Date(date);
        date=(date&&!isNaN(d))?(d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')):todayStr();
        const min=parseInt(pick(row,hi.min,3).replace(/[^0-9]/g,''),10)||0;
        D.mcatLog.push({id:Date.now()+n,date,subj:subjOf(pick(row,hi.subj,1)),what,min});
        n++;
      });
      D.mcatLog.sort((a,b)=>String(b.date).localeCompare(String(a.date)));
      save();renderStudyPlan();
      alert('Imported '+n+' session'+(n===1?'':'s')+' ✓');
    };
    r.readAsText(f);
  };
  inp.click();
}

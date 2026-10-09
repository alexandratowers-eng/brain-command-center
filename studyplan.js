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

  const tabs=[['tracker','Tracker'],['resources','Resources'],['scores','Scores'],['journal','Journal']];
  let h='<div class="sp-tabs">'+tabs.map(([k,label])=>
    `<button class="sp-tab${_spTab===k?' active':''}" onclick="setStudyTab('${k}')">${label}</button>`
  ).join('')+'</div><div class="sp-body">';

  if(_spTab==='tracker')h+=spTracker();
  else if(_spTab==='resources')h+=spResources(SP.resources);
  else if(_spTab==='scores') h+=spScores();
  else if(_spTab==='journal')h+=spJournal();

  h+='</div>';
  el.innerHTML=h;
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

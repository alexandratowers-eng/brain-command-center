// ===== WEEKLY PROGRESS TRACKER =====
let _wgLogOpen=false;
function renderWeeklyGoal(){
  const el=document.getElementById('weeklyGoalWidget');
  if(!el)return;
  if(!D.weeklyGoals)D.weeklyGoals=[];
  let goal=getCurrentWeeklyGoal();
  if(!goal){
    el.innerHTML=`<div style="font-size:10px;color:var(--dim);margin-bottom:6px;">Track your weekly progress — no pressure, just awareness.</div>
      <button class="t-btn" onclick="openWeeklyGoalSetup()" style="font-size:9px;">+ New Tracker</button>`;
    return;
  }
  const cur=goal.current;
  const lo=goal.rangeLow||20;
  const hi=goal.rangeHigh||40;
  const pct=Math.min(100,Math.round((cur/hi)*100));
  const loMark=Math.round((lo/hi)*100);

  let msg='',msgColor='var(--dim)';
  if(cur===0){msg='Ready when you are 🫶';msgColor='var(--dim)';}
  else if(cur<lo*0.25){msg='You started — that\'s the hardest part 💪';msgColor='var(--blue)';}
  else if(cur<lo*0.5){msg='Building momentum! 🔥';msgColor='var(--blue)';}
  else if(cur<lo){msg='Getting close to the zone! 🎯';msgColor='var(--teal)';}
  else if(cur>=lo&&cur<=hi){msg='You\'re in the zone! 🎉';msgColor='var(--green)';}
  else{msg='Above and beyond!! 🚀';msgColor='var(--green)';}

  // Count by call type
  const allSessions=goal.sessions||[];
  const recruitTotal=allSessions.filter(s=>s.type==='recruit').reduce((a,s)=>a+s.count,0);
  const followupTotal=allSessions.filter(s=>s.type==='followup').reduce((a,s)=>a+s.count,0);
  const untypedTotal=allSessions.filter(s=>!s.type).reduce((a,s)=>a+s.count,0);

  // Today's total
  const todayS=todayStr();
  const todaySessions=allSessions.filter(s=>{return s.when&&s.when.startsWith(todayS);});
  const todayTotal=todaySessions.reduce((a,s)=>a+s.count,0);

  // Daily breakdown for current week
  const weekDates=getWeekDates(todayS);
  const dayNames=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dailyCounts=weekDates.map(dt=>{
    return allSessions.filter(s=>s.when&&s.when.startsWith(dt)).reduce((a,s)=>a+s.count,0);
  });
  const daysElapsed=weekDates.filter(dt=>dt<=todayS).length;
  const dailyAvg=daysElapsed>0?Math.round((cur/daysElapsed)*10)/10:0;


  // Breakdown line
  let breakdownHtml='';
  if(recruitTotal||followupTotal){
    const parts=[];
    if(recruitTotal)parts.push(`<span style="color:var(--blue);">${recruitTotal} new</span>`);
    if(followupTotal)parts.push(`<span style="color:var(--pink);">${followupTotal} follow-up</span>`);
    if(untypedTotal)parts.push(`<span style="color:var(--dim);">${untypedTotal} other</span>`);
    breakdownHtml=`<div style="font-size:8px;margin-bottom:6px;display:flex;gap:6px;align-items:center;">${parts.join('<span style="color:var(--border);">·</span>')}</div>`;
  }

  // Log session inline form
  const logFormHtml=_wgLogOpen?`
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;">
      <div style="font-size:9px;font-weight:600;color:var(--dim);margin-bottom:6px;text-transform:uppercase;letter-spacing:.3px;">Log a session</div>
      <div style="font-size:9px;color:var(--dim);margin-bottom:6px;">What type of calls?</div>
      <div style="display:flex;gap:4px;margin-bottom:8px;" id="wgLogType">
        <button class="t-btn wg-type-btn active" data-type="recruit" onclick="wgSelectType(this)" style="font-size:9px;padding:4px 10px;border-color:var(--blue);color:var(--blue);flex:1;">📞 Recruit</button>
        <button class="t-btn wg-type-btn" data-type="followup" onclick="wgSelectType(this)" style="font-size:9px;padding:4px 10px;flex:1;">🔄 Follow-up</button>
      </div>
      <div style="font-size:9px;color:var(--dim);margin-bottom:4px;">How many calls?</div>
      <div style="display:flex;gap:3px;margin-bottom:8px;flex-wrap:wrap;" id="wgLogCount">
        <button class="t-btn wg-count-btn" onclick="wgSelectCount(this,1)" style="font-size:10px;padding:4px 10px;">1</button>
        <button class="t-btn wg-count-btn" onclick="wgSelectCount(this,2)" style="font-size:10px;padding:4px 10px;">2</button>
        <button class="t-btn wg-count-btn" onclick="wgSelectCount(this,3)" style="font-size:10px;padding:4px 10px;">3</button>
        <button class="t-btn wg-count-btn active" onclick="wgSelectCount(this,5)" style="font-size:10px;padding:4px 10px;">5</button>
        <button class="t-btn wg-count-btn" onclick="wgSelectCount(this,10)" style="font-size:10px;padding:4px 10px;">10</button>
        <input type="number" id="wgCustomCount" min="1" placeholder="#" style="width:36px;padding:4px 4px;font-size:10px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);text-align:center;" onfocus="document.querySelectorAll('.wg-count-btn').forEach(b=>b.classList.remove('active'));this.dataset.custom='1';">
      </div>
      <div style="font-size:9px;color:var(--dim);margin-bottom:4px;">Location <span style="opacity:.5;">(optional)</span></div>
      <input type="text" id="wgLogWhere" placeholder="e.g. home, Roberts, office" style="width:100%;padding:4px 8px;font-size:10px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);margin-bottom:8px;box-sizing:border-box;">
      <div style="display:flex;gap:4px;justify-content:flex-end;">
        <button class="t-btn" onclick="_wgLogOpen=false;renderWeeklyGoal();" style="font-size:9px;padding:4px 10px;color:var(--dim);">Cancel</button>
        <button class="t-btn" onclick="submitWeeklySession()" style="font-size:9px;padding:4px 14px;border-color:var(--green);color:var(--green);font-weight:600;">Save</button>
      </div>
    </div>`:'';

  // Daily breakdown HTML
  let dailyHtml=`<div style="display:flex;gap:2px;margin-bottom:6px;align-items:flex-end;">`;
  dailyCounts.forEach((c,i)=>{
    const isToday=weekDates[i]===todayS;
    const barH=Math.max(2,Math.min(20,c*2));
    dailyHtml+=`<div style="flex:1;text-align:center;${isToday?'font-weight:700;':''}">
      <div style="font-size:7px;color:${c?'var(--green)':'var(--dim)'};margin-bottom:1px;">${c||''}</div>
      <div style="height:${barH}px;background:${isToday?'var(--green)':c?'rgba(52,211,153,.4)':'var(--border)'};border-radius:2px;margin:0 1px;"></div>
      <div style="font-size:7px;color:${isToday?'var(--text)':'var(--dim)'};margin-top:1px;">${dayNames[i]}</div>
    </div>`;
  });
  dailyHtml+=`</div>`;

  // Edit last entry button
  const lastSession=allSessions.length?allSessions[allSessions.length-1]:null;
  const editLastHtml=lastSession?`<button class="t-btn" onclick="editLastWeeklySession()" style="font-size:8px;padding:2px 6px;color:var(--dim);margin-left:auto;" title="Edit last entry">✏️ last: +${lastSession.count}</button>`:'';

  el.innerHTML=`
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
      <span style="font-size:11px;font-weight:600;">${goal.label}</span>
      <span style="font-size:9px;color:var(--dim);cursor:pointer;" onclick="editWeeklyGoal()" title="Edit">✏️</span>
    </div>
    ${todayTotal?`<div style="font-size:13px;font-weight:700;color:var(--green);margin-bottom:4px;">Today: ${todayTotal} ${goal.unit||'calls'}</div>`:''}
    <div style="position:relative;height:8px;background:var(--border);border-radius:4px;overflow:visible;margin-bottom:3px;">
      <div style="position:absolute;left:${loMark}%;right:0;top:0;bottom:0;background:rgba(52,211,153,.12);border-radius:0 4px 4px 0;"></div>
      <div style="width:${pct}%;height:100%;background:${cur>=lo?'var(--green)':'var(--blue)'};border-radius:4px;transition:width .4s cubic-bezier(.4,0,.2,1);position:relative;z-index:1;opacity:${cur>=lo?1:0.7};"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:8px;color:var(--dim);margin-bottom:4px;">
      <span style="color:${msgColor};">${cur} done · ${msg}</span>
      <span>${lo}–${hi}</span>
    </div>
    ${dailyHtml}
    <div style="display:flex;gap:3px;margin-bottom:7px;flex-wrap:wrap;">
      <button class="t-btn" onclick="bumpWeeklyGoal(1)" style="font-size:9px;padding:3px 8px;">+1</button>
      <button class="t-btn" onclick="bumpWeeklyGoal(3)" style="font-size:9px;padding:3px 8px;">+3</button>
      <button class="t-btn" onclick="bumpWeeklyGoal(5)" style="font-size:9px;padding:3px 8px;">+5</button>
      <button class="t-btn" onclick="_wgLogOpen=!_wgLogOpen;renderWeeklyGoal();" style="font-size:9px;padding:3px 10px;border-color:var(--green);color:var(--green);margin-left:auto;${_wgLogOpen?'background:rgba(52,211,153,.1);':''}">📝 Log</button>
    </div>
    ${logFormHtml}
    <div style="display:flex;gap:4px;margin-top:6px;align-items:center;">
      <button class="t-btn" onclick="newWeeklyGoal()" style="font-size:8px;padding:2px 6px;">New Week</button>
      <button class="t-btn" onclick="archiveWeeklyGoal()" style="font-size:8px;padding:2px 6px;color:var(--dim);">Archive</button>
      ${editLastHtml}
    </div>`;
}

function wgSelectType(btn){
  document.querySelectorAll('.wg-type-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
}
function wgSelectCount(btn,n){
  document.querySelectorAll('.wg-count-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  const custom=document.getElementById('wgCustomCount');
  if(custom){custom.value='';custom.dataset.custom='';}
}
function submitWeeklySession(){
  const goal=getCurrentWeeklyGoal();
  if(!goal)return;
  if(!goal.sessions)goal.sessions=[];
  const typeBtn=document.querySelector('.wg-type-btn.active');
  const type=typeBtn?typeBtn.dataset.type:'recruit';
  const customEl=document.getElementById('wgCustomCount');
  let count=0;
  if(customEl&&customEl.dataset.custom==='1'&&customEl.value){
    count=parseInt(customEl.value);
  } else {
    const countBtn=document.querySelector('.wg-count-btn.active');
    count=countBtn?parseInt(countBtn.textContent):0;
  }
  if(!count||count<=0)return;
  const where=(document.getElementById('wgLogWhere')?.value||'').trim();
  goal.sessions.push({when:new Date().toISOString(),where,count,type});
  goal.current+=count;
  _wgLogOpen=false;
  save();renderWeeklyGoal();
}

function getCurrentWeeklyGoal(){
  if(!D.weeklyGoals||!D.weeklyGoals.length)return null;
  return D.weeklyGoals[D.weeklyGoals.length-1];
}

function openWeeklyGoalSetup(){
  const label=prompt('What are you tracking? (e.g. "CHOP Calls"):','CHOP Calls');
  if(!label)return;
  const lo=parseInt(prompt('Comfortable low end of your range:','20'))||20;
  const hi=parseInt(prompt('Stretch high end:','40'))||40;
  const unit=prompt('Unit (calls, attempts, questions, etc.):','calls')||'calls';
  D.weeklyGoals.push({id:Date.now(),label,rangeLow:lo,rangeHigh:hi,target:hi,current:0,unit,sessions:[],created:new Date().toISOString()});
  save();renderWeeklyGoal();
}

function bumpWeeklyGoal(n){
  const goal=getCurrentWeeklyGoal();
  if(!goal)return;
  if(!goal.sessions)goal.sessions=[];
  if(n>0){
    goal.sessions.push({when:new Date().toISOString(),where:'',count:n,type:'recruit'});
  }
  goal.current=Math.max(0,goal.current+n);
  save();renderWeeklyGoal();
}

function logWeeklySession(){
  _wgLogOpen=true;
  renderWeeklyGoal();
}
function editLastWeeklySession(){
  const goal=getCurrentWeeklyGoal();
  if(!goal||!goal.sessions||!goal.sessions.length)return;
  const last=goal.sessions[goal.sessions.length-1];
  const newCount=prompt('Edit last entry count (was +'+last.count+'):',last.count);
  if(newCount===null)return;
  const n=parseInt(newCount);
  if(isNaN(n)||n<0)return;
  const diff=n-last.count;
  last.count=n;
  goal.current=Math.max(0,goal.current+diff);
  save();renderWeeklyGoal();
}

function newWeeklyGoal(){
  const old=getCurrentWeeklyGoal();
  const label=old?old.label:'CHOP Calls';
  const lo=old?old.rangeLow:20;
  const hi=old?old.rangeHigh:40;
  const unit=old?old.unit:'calls';
  D.weeklyGoals.push({id:Date.now(),label,rangeLow:lo,rangeHigh:hi,target:hi,current:0,unit,sessions:[],created:new Date().toISOString()});
  save();renderWeeklyGoal();
}

function archiveWeeklyGoal(){
  if(!confirm('Archive this tracker? You can start a new one.'))return;
  const goal=getCurrentWeeklyGoal();
  if(goal)goal.archived=true;
  save();renderWeeklyGoal();
}

function editWeeklyGoal(){
  const goal=getCurrentWeeklyGoal();
  if(!goal)return;
  const newLabel=prompt('Tracker name:',goal.label);
  if(newLabel)goal.label=newLabel;
  const newLo=prompt('Range low:',goal.rangeLow||40);
  if(newLo&&!isNaN(parseInt(newLo)))goal.rangeLow=parseInt(newLo);
  const newHi=prompt('Range high:',goal.rangeHigh||45);
  if(newHi&&!isNaN(parseInt(newHi))){goal.rangeHigh=parseInt(newHi);goal.target=parseInt(newHi);}
  save();renderWeeklyGoal();
}

// ===== MCAT =====
function renderMcat(){
  const el=document.getElementById('mcatSteps');
  el.innerHTML=D.mcatSteps.map((s,i)=>{
    const isDone=s.status==='done',isSkip=s.status==='skip';
    return `<div class="mcat-step">
      <div class="step-n ${isDone?'completed':isSkip?'skipped':''}">${isDone?'✓':isSkip?'→':(i+1)}</div>
      <div style="flex:1"><div class="step-t ${isDone||isSkip?'done-step':''}">${s.text}</div><div style="font-size:9px;color:var(--dim);">${s.time}</div></div>
      <div style="display:flex;gap:3px;">${s.status==='todo'?`<button class="step-btn done-btn" onclick="D.mcatSteps[${i}].status='done';save();renderMcat();">done</button><button class="step-btn skip-btn" onclick="D.mcatSteps[${i}].status='skip';save();renderMcat();">skip</button>`:`<button class="step-btn" onclick="D.mcatSteps[${i}].status='todo';save();renderMcat();">undo</button>`}</div>
    </div>`;
  }).join('');
}

// ===== RECORDER =====
let mediaRec=null,audioChunks=[];
function toggleRec(){
  const btn=document.getElementById('recBtn');
  if(mediaRec&&mediaRec.state==='recording'){mediaRec.stop();btn.textContent='Start Recording';btn.classList.remove('recording');return;}
  navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{
    mediaRec=new MediaRecorder(stream);audioChunks=[];
    mediaRec.ondataavailable=e=>audioChunks.push(e.data);
    mediaRec.onstop=()=>{stream.getTracks().forEach(t=>t.stop());document.getElementById('recStatus').textContent='Done';};
    mediaRec.start();btn.textContent='Stop';btn.classList.add('recording');
    document.getElementById('recStatus').textContent='Recording...';
    document.getElementById('recTranscript').style.display='block';
  }).catch(e=>{alert('Mic access needed: '+e.message);});
}
function clearRecording(){document.getElementById('transcriptText').textContent='';}

// ===== MEETING NOTES =====
const MTG_TEMPLATES={
  '1on1':`## 1:1 Check-in

**Date:**
**With:**

### How are you doing? (energy, blockers, wins)
-

### Updates since last time
-

### Questions / need help with
-

### Action items
- [ ]
- [ ]

### Notes
`,
  'research':`## Research Meeting

**Date:**
**PI / Team:**
**Study:**

### Agenda
1.
2.
3.

### Discussion
-

### Data / Results to review
-

### Decisions made
-

### Next steps & deadlines
- [ ]
- [ ]

### Follow-up needed
`,
  'tpp':`## TPP / Clinical Session

**Date:**
**Patient ID:**
**Visit type:**

### Pre-session prep
- Chart reviewed: [ ]
- Consent status:
- Window status:

### Session notes
-

### Observations
-

### Follow-up required
- [ ]
- [ ]

### Flag for PI
`,
  'general':`## Meeting Notes

**Date:**
**Attendees:**
**Topic:**

### Key points
-

### Decisions
-

### Action items
- [ ]
- [ ]

### Notes
`,
  'prep':`## Meeting Prep

**Meeting:**
**Date & time:**
**With:**

### My goals for this meeting
1.
2.

### Questions I need answered
-

### Things to bring up
-

### Materials to have ready
- [ ]
- [ ]

### Notes to review beforehand
`
};

function loadMeetingTpl(key){
  const tpl=MTG_TEMPLATES[key];if(!tpl)return;
  const notes=document.getElementById('mtgNotes');
  if(notes.value.trim()&&!confirm('Replace current notes with template?'))return;
  notes.value=tpl;
  const today=todayStr();
  document.getElementById('mtgDate').value=today;
  saveMeetingNotes();
}

function saveMeetingNotes(){
  const title=document.getElementById('mtgTitle').value;
  const date=document.getElementById('mtgDate').value;
  const notes=document.getElementById('mtgNotes').value;
  D._mtgDraft={title,date,notes};save();
}

function clearMeetingNotes(){
  if(!confirm('Clear current notes?'))return;
  document.getElementById('mtgTitle').value='';
  document.getElementById('mtgDate').value='';
  document.getElementById('mtgNotes').value='';
  D._mtgDraft=null;save();
}

function copyMeetingNotes(){
  const title=document.getElementById('mtgTitle').value;
  const notes=document.getElementById('mtgNotes').value;
  const text=title?`# ${title}\n\n${notes}`:notes;
  navigator.clipboard.writeText(text).then(()=>{
    const t=document.getElementById('saveToast');t.innerHTML='✓ Copied!';t.classList.add('show');setTimeout(()=>{t.classList.remove('show');},1200);
  });
}

function saveMeetingToList(){
  const title=document.getElementById('mtgTitle').value.trim()||'Untitled Meeting';
  const date=document.getElementById('mtgDate').value||todayStr();
  const notes=document.getElementById('mtgNotes').value;
  if(!notes.trim()){alert('Nothing to save');return;}
  if(!D.meetings)D.meetings=[];
  D.meetings.unshift({id:Date.now(),title,date,notes,notionSynced:false});
  save();renderSavedMeetings();renderMtgCalendarView();
  document.getElementById('mtgTitle').value='';
  document.getElementById('mtgDate').value='';
  document.getElementById('mtgNotes').value='';
  D._mtgDraft=null;save();
  celebrate();
}

function markForNotion(id){
  const m=(D.meetings||[]).find(x=>x.id===id);
  if(!m)return;
  m.notionSynced='pending';
  save();renderSavedMeetings();renderMtgCalendarView();
  const t=document.getElementById('saveToast');
  if(t){t.innerHTML='📤 Queued for Notion sync';t.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>t.classList.remove('show'),2000);}
}

function markNotionDone(id){
  const m=(D.meetings||[]).find(x=>x.id===id);
  if(!m)return;
  m.notionSynced=true;
  save();renderSavedMeetings();renderMtgCalendarView();
}

function getNotionPending(){
  return (D.meetings||[]).filter(m=>m.notionSynced==='pending'||m.notionSynced===false);
}

function saveAndQueueNotion(){
  const title=document.getElementById('mtgTitle').value.trim()||'Untitled Meeting';
  const date=document.getElementById('mtgDate').value||todayStr();
  const notes=document.getElementById('mtgNotes').value;
  if(!notes.trim()){alert('Nothing to save');return;}
  if(!D.meetings)D.meetings=[];
  const id=Date.now();
  D.meetings.unshift({id,title,date,notes,notionSynced:'pending'});
  save();renderSavedMeetings();renderMtgCalendarView();
  document.getElementById('mtgTitle').value='';
  document.getElementById('mtgDate').value='';
  document.getElementById('mtgNotes').value='';
  D._mtgDraft=null;save();
  const t=document.getElementById('saveToast');
  if(t){t.innerHTML='✓ Saved & queued for Notion';t.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>t.classList.remove('show'),2500);}
  celebrate();
}

// ===== MEETINGS HUB =====
let _mtgView='today';

function setMtgView(view,btn){
  _mtgView=view;
  document.querySelectorAll('.mtg-view-btn').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  document.getElementById('mtgSavedSection').style.display=view==='all'?'block':'none';
  renderMtgCalendarView();
}

function toggleMtgCompose(){
  const body=document.getElementById('mtgComposeBody');
  const chev=document.getElementById('mtgComposeChevron');
  if(!body)return;
  const hidden=body.style.display==='none';
  body.style.display=hidden?'block':'none';
  if(chev)chev.textContent=hidden?'expand_less':'expand_more';
}

function getMeetingBlocks(dt){
  const tl=getTimeline(dt)||[];
  const meetingKeywords=/\b(meeting|call|zoom|teams|standup|huddle|touchbase|check-?in|sync|1[:-]1|one.on.one|tpp|debrief|interview|consult|chop)\b/i;
  const matches=tl.map((s,i)=>({...s,_dayIdx:i,_date:dt})).filter(s=>s._isMeeting||meetingKeywords.test(s.text));
  const seen=new Set();
  return matches.filter(s=>{const key=s.t+'|'+s.text;if(seen.has(key))return false;seen.add(key);return true;});
}

function getMeetingNotesForDate(dt){
  return (D.meetings||[]).filter(m=>m.date===dt);
}

function renderMtgCalendarView(){
  const el=document.getElementById('mtgCalendarView');
  if(!el)return;
  const today=todayStr();

  if(_mtgView==='today'){
    el.innerHTML=renderMtgDayCard(today,true);
  } else if(_mtgView==='week'){
    const dates=getWeekDates(today);
    let html='';
    dates.forEach(dt=>{
      html+=renderMtgDayCard(dt,dt===today);
    });
    if(!html.trim()||html.indexOf('mtg-block')===-1){
      let hasContent=false;
      dates.forEach(dt=>{if(getMeetingBlocks(dt).length||getMeetingsForDate(dt).length||getMeetingNotesForDate(dt).length)hasContent=true;});
      if(!hasContent)html+='<div class="mtg-empty">No meetings scheduled this week.</div>';
    }
    el.innerHTML=html;
  } else if(_mtgView==='month'){
    el.innerHTML=renderMtgMonthOverview();
  } else {
    el.innerHTML='';
    renderSavedMeetings();
  }
}

function renderMtgDayCard(dt,isToday){
  const d=dateObj(dt);
  const blocks=getMeetingBlocks(dt);
  const recurring=getMeetingsForDate(dt);
  const notes=getMeetingNotesForDate(dt);
  const today=todayStr();
  const isPast=dt<today;
  const dayLabel=isToday?'Today':dt===dateStr(new Date(new Date().getTime()+86400000))?'Tomorrow':d.toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});

  // Merge recurring meetings that aren't already on the calendar
  const calTexts=(blocks||[]).map(b=>b.text.toLowerCase());
  const extraRecurring=recurring.filter(r=>!calTexts.some(t=>t.includes(r.label.toLowerCase().slice(0,8))));

  if(!blocks.length&&!extraRecurring.length&&!notes.length)return '';

  let html=`<div class="mtg-day-card ${isToday?'mtg-day-today':''}">`;
  html+=`<div class="mtg-day-header" onclick="D.selectedDate='${dt}';setCalView('day');renderMiniCal();">
    <span class="mtg-day-label">${dayLabel}</span>
    <span class="mtg-day-date">${d.toLocaleDateString('en-US',{month:'short',day:'numeric'})}</span>
    <span class="mi" style="font-size:14px;color:var(--dim);margin-left:auto;">open_in_new</span>
  </div>`;

  if(blocks.length){
    html+=blocks.map(b=>{
      const cat=D.cats[b.cls];
      const color=cat?cat.color:'var(--blue)';
      const startM=parseMin(b.t);
      const endM=b.end?parseMin(b.end):startM+30;
      const durMin=endM-startM;
      const durLabel=durMin<60?durMin+'m':Math.floor(durMin/60)+'h'+(durMin%60?durMin%60+'m':'');
      const hasNote=notes.some(n=>n.title&&b.text&&(n.title.toLowerCase().includes(b.text.toLowerCase().slice(0,10))||b.text.toLowerCase().includes(n.title.toLowerCase().slice(0,10))));
      const isDone=b.done||false;
      const now=new Date();const nowMin=now.getHours()*60+now.getMinutes();
      const isNow=isToday&&nowMin>=startM&&nowMin<endM;
      const isUpcoming=isToday&&!isPast&&startM>nowMin&&startM-nowMin<=60;

      return `<div class="mtg-block ${isDone?'mtg-block-done':''} ${isNow?'mtg-block-now':''} ${isUpcoming?'mtg-block-upcoming':''}">
        <div class="mtg-block-time" style="color:${color};">${b.t}${b.end?' - '+b.end:''}</div>
        <div class="mtg-block-body">
          <div class="mtg-block-title">${b.text}</div>
          ${b.sm?`<div class="mtg-block-sub">${b.sm}</div>`:''}
          ${b.loc?`<div class="mtg-block-loc"><span class="mi" style="font-size:11px;">location_on</span> ${b.loc}</div>`:''}
        </div>
        <div class="mtg-block-actions">
          <span class="mtg-block-dur">${durLabel}</span>
          ${hasNote?'<span class="mi mtg-has-note" title="Has notes">description</span>':''}
          <button class="t-btn" onclick="startMtgPrepFor('${dt}',${b._dayIdx})" style="font-size:9px;padding:2px 8px;" title="Prep for this meeting"><span class="mi" style="font-size:12px;">edit_note</span> Prep</button>
        </div>
      </div>`;
    }).join('');
  }

  if(extraRecurring.length){
    const officeWk=isOfficeWeek(dt);
    html+=extraRecurring.map(r=>{
      const locClass=r.loc||'remote';
      const locLabel=locClass==='office'?'in-person':'remote';
      const overrideKey=dt+'|'+r.label;
      const hasOverride=D.mtgLocOverrides&&D.mtgLocOverrides[overrideKey];
      return `<div class="mtg-block mtg-block-recurring">
        <div class="mtg-block-time" style="color:#818cf8;">${r.time}${r.end?'–'+r.end:''}</div>
        <div class="mtg-block-body">
          <div class="mtg-block-title">${r.label}</div>
          <div class="mtg-block-sub">${r.freq==='biweekly'?'Biweekly':'Weekly'} · <span class="rhythm-loc ${locClass}" style="display:inline;font-size:8px;cursor:pointer;text-decoration:underline dotted;" title="Click to toggle in-person/remote" onclick="event.stopPropagation();toggleMtgLoc('${dt}','${r.label.replace(/'/g,"\\'")}')">${locLabel}${hasOverride?' ✎':''}</span></div>
        </div>
        <div class="mtg-block-actions">
          <span class="mtg-block-dur" style="color:#818cf8;">recurring</span>
        </div>
      </div>`;
    }).join('');
  }

  if(notes.length){
    html+=`<div class="mtg-notes-row">`;
    html+=notes.map(n=>`<div class="mtg-note-chip" onclick="loadSavedMeeting(${n.id})" title="${n.notes?n.notes.slice(0,100)+'...':''}">
      <span class="mi" style="font-size:12px;color:var(--blue);">description</span>
      <span>${n.title}</span>
    </div>`).join('');
    html+=`</div>`;
  }

  html+=`</div>`;
  return html;
}

function renderMtgMonthOverview(){
  const today=todayStr();
  const selDate=dateObj(today);
  const year=selDate.getFullYear(),month=selDate.getMonth();
  const daysInMonth=new Date(year,month+1,0).getDate();
  let html='<div class="mtg-month-grid">';
  const monthName=new Date(year,month,1).toLocaleDateString('en-US',{month:'long',year:'numeric'});
  html+=`<div class="mtg-month-title">${monthName}</div>`;

  for(let d=1;d<=daysInMonth;d++){
    const dt=dateStr(new Date(year,month,d));
    const blocks=getMeetingBlocks(dt);
    const recurring=getMeetingsForDate(dt);
    const calTexts=(blocks||[]).map(b=>b.text.toLowerCase());
    const extraR=recurring.filter(r=>!calTexts.some(t=>t.includes(r.label.toLowerCase().slice(0,8))));
    const notes=getMeetingNotesForDate(dt);
    if(!blocks.length&&!extraR.length&&!notes.length)continue;

    const dayObj=dateObj(dt);
    const dayName=dayObj.toLocaleDateString('en-US',{weekday:'short'});
    const isToday=dt===today;
    const isPast=dt<today;

    html+=`<div class="mtg-month-row ${isToday?'mtg-day-today':''} ${isPast?'mtg-month-past':''}" onclick="D.selectedDate='${dt}';setCalView('day');renderMiniCal();">
      <div class="mtg-month-date">
        <span class="mtg-month-dow">${dayName}</span>
        <span class="mtg-month-d">${d}</span>
      </div>
      <div class="mtg-month-items">
        ${blocks.map(b=>{
          const cat=D.cats[b.cls];
          const color=cat?cat.color:'var(--blue)';
          return `<span class="mtg-month-pip" style="border-left:3px solid ${color};"><span style="color:var(--dim);font-size:9px;">${b.t}</span> ${b.text}</span>`;
        }).join('')}
        ${extraR.map(r=>`<span class="mtg-month-pip" style="border-left:3px solid #818cf8;"><span style="color:var(--dim);font-size:9px;">${r.time}</span> ${r.label} <span style="font-size:7px;color:#818cf8;">recurring</span></span>`).join('')}
        ${notes.map(n=>`<span class="mtg-month-pip mtg-month-note"><span class="mi" style="font-size:10px;color:var(--blue);">description</span> ${n.title}</span>`).join('')}
      </div>
    </div>`;
  }
  html+='</div>';
  return html;
}

function startMtgPrepFor(dt,dayIdx){
  const tl=getTimeline(dt)||[];
  const slot=tl[dayIdx];
  if(!slot)return;
  const title=slot.text;
  const date=dt;
  const tpl=MTG_TEMPLATES['prep'];
  const notes=tpl.replace('**Meeting:**','**Meeting:** '+title).replace('**Date & time:**','**Date & time:** '+date+' at '+slot.t);
  document.getElementById('mtgTitle').value=title+' — Prep';
  document.getElementById('mtgDate').value=date;
  document.getElementById('mtgNotes').value=notes;
  saveMeetingNotes();
  const body=document.getElementById('mtgComposeBody');
  if(body)body.style.display='block';
  const chev=document.getElementById('mtgComposeChevron');
  if(chev)chev.textContent='expand_less';
  document.getElementById('mtgNotes').focus();
}

function renderSavedMeetings(){
  const list=D.meetings||[];
  const countEl=document.getElementById('savedMtgCount');
  if(countEl)countEl.textContent=list.length;
  const el=document.getElementById('savedMtgList');
  if(!el)return;
  if(!list.length){el.innerHTML='<p style="font-size:11px;color:var(--dim);text-align:center;padding:10px;">No saved notes yet</p>';return;}

  const grouped={};
  list.forEach(m=>{
    const key=m.date||'undated';
    if(!grouped[key])grouped[key]=[];
    grouped[key].push(m);
  });
  const sortedDates=Object.keys(grouped).sort((a,b)=>b.localeCompare(a));

  el.innerHTML=sortedDates.map(dt=>{
    const d=dt!=='undated'?dateObj(dt):null;
    const dateLabel=d?d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric',year:'numeric'}):'Undated';
    return `<div class="mtg-saved-group">
      <div class="mtg-saved-date" onclick="if('${dt}'!=='undated'){D.selectedDate='${dt}';setCalView('day');renderMiniCal();}">
        <span class="mi" style="font-size:13px;color:var(--dim);">calendar_today</span> ${dateLabel}
      </div>
      ${grouped[dt].map(m=>{
        const synced=m.notionSynced===true;
        const pending=m.notionSynced==='pending';
        const notionLabel=synced?'<span class="mtg-notion-badge synced" title="Synced to Notion">✓ Notion</span>':pending?'<span class="mtg-notion-badge pending" title="Queued for Notion sync">⏳ Pending</span>':`<button class="mtg-notion-btn" onclick="event.stopPropagation();markForNotion(${m.id});" title="Send to Notion"><span class="mi" style="font-size:11px;">upload</span> Notion</button>`;
        return `<div class="mtg-saved-item" onclick="loadSavedMeeting(${m.id})">
        <span class="mi" style="color:var(--blue);font-size:14px;">description</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.title}</div>
        </div>
        ${notionLabel}
        <button class="task-act-btn" onclick="event.stopPropagation();deleteMeeting(${m.id});" title="Delete">x</button>
      </div>`;}).join('')}
    </div>`;
  }).join('');
}

function loadSavedMeeting(id){
  const m=(D.meetings||[]).find(x=>x.id===id);if(!m)return;
  document.getElementById('mtgTitle').value=m.title;
  document.getElementById('mtgDate').value=m.date;
  document.getElementById('mtgNotes').value=m.notes;
  D._mtgDraft={title:m.title,date:m.date,notes:m.notes};save();
  const body=document.getElementById('mtgComposeBody');
  if(body)body.style.display='block';
  const chev=document.getElementById('mtgComposeChevron');
  if(chev)chev.textContent='expand_less';
}

function deleteMeeting(id){
  if(!confirm('Delete this note?'))return;
  D.meetings=(D.meetings||[]).filter(m=>m.id!==id);
  save();renderSavedMeetings();renderMtgCalendarView();
}

function initMeetingNotes(){
  if(D._mtgDraft){
    document.getElementById('mtgTitle').value=D._mtgDraft.title||'';
    document.getElementById('mtgDate').value=D._mtgDraft.date||'';
    document.getElementById('mtgNotes').value=D._mtgDraft.notes||'';
  }
  renderSavedMeetings();
  renderMtgCalendarView();
}

// ===== DATA EXPORT / IMPORT =====
function exportData(){
  const data=localStorage.getItem(SK);
  if(!data){alert('Nothing to export');return;}
  try{
    const blob=new Blob([data],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download='brain-cmd-backup-'+todayStr()+'.json';
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},200);
    const t=document.getElementById('saveToast');if(t){t.innerHTML='✓ Backup downloaded';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800);}
  }catch(err){
    alert('Download failed: '+err.message+'\n\nTry "Copy to Clipboard" instead.');
  }
}

function copyDataToClipboard(){
  const data=localStorage.getItem(SK);
  if(!data){alert('Nothing to copy');return;}
  // Always try clipboard first, then show fallback either way for reliability
  navigator.clipboard.writeText(data).then(()=>{
    const t=document.getElementById('saveToast');if(t){t.innerHTML='✓ Copied to clipboard';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2000);}
  }).catch(()=>{
    const modal=document.createElement('div');
    modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML=`<div style="background:var(--card);border-radius:12px;padding:20px;max-width:500px;width:100%;max-height:80vh;display:flex;flex-direction:column;gap:10px;">
      <h3 style="margin:0;font-size:14px;">📋 Copy this data</h3>
      <p style="font-size:11px;color:var(--dim);margin:0;">Select all (Cmd+A) → Copy (Cmd+C) → paste into a .json file</p>
      <textarea style="flex:1;min-height:200px;font-size:10px;font-family:monospace;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:8px;resize:none;" readonly>${data}</textarea>
      <button onclick="this.parentElement.parentElement.remove();" style="padding:6px 16px;border-radius:6px;border:1px solid var(--border);background:var(--blue);color:white;cursor:pointer;">Close</button>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector('textarea').select();
  });
}

// Auto-backup: save a .json file to Downloads every hour while the page is open
let _lastAutoBackup=0;
function autoBackupCheck(){
  const now=Date.now();
  if(now-_lastAutoBackup<3600000)return; // once per hour
  _lastAutoBackup=now;
  const data=localStorage.getItem(SK);
  if(!data)return;
  try{
    const blob=new Blob([data],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');a.href=url;
    a.download='bcc-auto-backup-'+todayStr()+'.json';
    a.style.display='none';document.body.appendChild(a);a.click();
    setTimeout(()=>{document.body.removeChild(a);URL.revokeObjectURL(url);},200);
  }catch(e){}
}
// Don't auto-download — just make sure manual backup is easy and reliable

function pasteDataFromClipboard(){
  navigator.clipboard.readText().then(text=>{
    try{
      const parsed=JSON.parse(text);
      if(!parsed.tasks||!parsed.cats){alert('Clipboard doesn\'t contain valid Brain Command Center data.\n\nMake sure you copied the backup data from your other computer.');return;}
      if(!confirm('Replace ALL current data with clipboard data?\n\nThis will reload the page.'))return;
      localStorage.setItem(SK,JSON.stringify(parsed));
      location.reload();
    }catch(err){alert('Could not parse clipboard data: '+err.message+'\n\nMake sure you copied the full JSON backup.');}
  }).catch(()=>{
    // Fallback: show textarea to paste into
    const modal=document.createElement('div');
    modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML=`<div style="background:var(--card);border-radius:12px;padding:20px;max-width:500px;width:100%;max-height:80vh;display:flex;flex-direction:column;gap:10px;">
      <h3 style="margin:0;font-size:14px;">📋 Paste backup data</h3>
      <p style="font-size:11px;color:var(--dim);margin:0;">Paste the JSON data from your other computer's backup</p>
      <textarea id="pasteRestoreArea" style="flex:1;min-height:200px;font-size:10px;font-family:monospace;background:var(--bg);color:var(--text);border:1px solid var(--border);border-radius:6px;padding:8px;resize:none;" placeholder="Paste JSON here..."></textarea>
      <div style="display:flex;gap:8px;justify-content:flex-end;">
        <button onclick="this.parentElement.parentElement.parentElement.remove();" style="padding:6px 16px;border-radius:6px;border:1px solid var(--border);background:none;color:var(--text);cursor:pointer;">Cancel</button>
        <button onclick="restoreFromPasteArea()" style="padding:6px 16px;border-radius:6px;border:1px solid var(--border);background:var(--blue);color:white;cursor:pointer;">Restore</button>
      </div>
    </div>`;
    document.body.appendChild(modal);
    modal.querySelector('textarea').focus();
  });
}

function restoreFromPasteArea(){
  const text=document.getElementById('pasteRestoreArea')?.value;
  if(!text){alert('Please paste backup data first.');return;}
  try{
    const parsed=JSON.parse(text);
    if(!parsed.tasks||!parsed.cats){alert('Invalid data — make sure you pasted the full backup JSON.');return;}
    if(!confirm('Replace ALL current data with this backup?\n\nThis will reload the page.'))return;
    localStorage.setItem(SK,JSON.stringify(parsed));
    location.reload();
  }catch(err){alert('Could not parse data: '+err.message);}
}

function importData(){
  const inp=document.createElement('input');
  inp.type='file';
  inp.accept='.json,application/json';
  inp.style.display='none';
  document.body.appendChild(inp);
  inp.onchange=e=>{
    const file=e.target.files[0];
    if(!file){alert('No file selected.');return;}
    alert('Got file: "'+file.name+'" ('+Math.round(file.size/1024)+'KB) — reading now...');
    const reader=new FileReader();
    reader.onerror=()=>{alert('ERROR: Could not read the file.');};
    reader.onload=ev=>{
      try{
        const parsed=JSON.parse(ev.target.result);
        if(!parsed.tasks||!parsed.cats){alert('ERROR: File parsed but looks wrong — missing tasks or cats. Is this the right backup file?');return;}
        if(!confirm('Found '+parsed.tasks.length+' tasks. Replace everything now?'))return;
        localStorage.setItem(SK,JSON.stringify(parsed));
        // Update in place — no reload needed
        Object.keys(D).forEach(k=>delete D[k]);
        Object.assign(D,parsed);
        renderAll();
        const t=document.getElementById('saveToast');if(t){t.innerHTML='✓ Restored!';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2500);}
      }catch(err){alert('ERROR parsing file: '+err.message);}
      finally{if(document.body.contains(inp))document.body.removeChild(inp);}
    };
    reader.readAsText(file);
  };
  inp.click();
}

// ===== ICS EXPORT =====
function exportICS(){
  const dt=D.selectedDate;
  const tl=getTimeline(dt);
  const dateClean=dt.replace(/-/g,'');
  let ics='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//BrainCmd//EN\r\nCALSCALE:GREGORIAN\r\n';
  tl.forEach((s,i)=>{
    const startM=parseMin(s.t);
    const endM=i<tl.length-1?parseMin(tl[i+1].t):startM+30;
    if(endM<=startM)return;
    const sh=String(Math.floor(startM/60)).padStart(2,'0'),sm=String(startM%60).padStart(2,'0');
    const eh=String(Math.floor(endM/60)).padStart(2,'0'),em=String(endM%60).padStart(2,'0');
    ics+=`BEGIN:VEVENT\r\nUID:bc-${dateClean}-${i}\r\nDTSTART:${dateClean}T${sh}${sm}00\r\nDTEND:${dateClean}T${eh}${em}00\r\nSUMMARY:${s.text.replace(/[\\;,]/g,' ')}\r\n${s.sm?'DESCRIPTION:'+s.sm.replace(/[\\;,]/g,' ')+'\r\n':''}END:VEVENT\r\n`;
  });
  ics+='END:VCALENDAR\r\n';
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));a.download='schedule-'+dt+'.ics';a.click();
}

// ===== STATS =====
function updateStats(){
  const today=todayStr();
  const tt=D.tasks.filter(t=>t.date===today);
  document.getElementById('sDone').textContent=tt.filter(t=>t.done).length;
  document.getElementById('sLeft').textContent=tt.filter(t=>!t.done).length;
}

// ===== TIMER MODAL =====
function openTimerModal(){document.getElementById('timerModal').classList.add('show');}
function closeTimerModal(){document.getElementById('timerModal').classList.remove('show');}

// ===== ADHD COACH =====
function generateCoachSuggestions(){
  const el=document.getElementById('coachSuggestions');
  if(!el)return;
  const today=todayStr();
  const tl=getTimeline(today);
  const now=new Date();
  const nowMin=now.getHours()*60+now.getMinutes();
  const energy=D.energy||3;
  const hour=now.getHours();
  const timeOfDay=hour<12?'morning':hour<17?'afternoon':hour<21?'evening':'night';
  const dayOfWeek=now.getDay();

  const pendingTasks=D.tasks.filter(t=>t.date===today&&!t.done&&!(typeof isSnoozed==='function'&&isSnoozed(t)))
    .sort((a,b)=>({high:0,med:1,low:2})[a.pri]-({high:0,med:1,low:2})[b.pri]);
  const doneTasks=D.tasks.filter(t=>t.date===today&&t.done);
  const laterPool=D.tasks.filter(t=>!t.date&&!t.done&&t.cat!=='braindump');

  // All done state
  if(pendingTasks.length===0&&doneTasks.length>0){
    el.innerHTML=`<div style="text-align:center;padding:6px 4px;">
      <div style="font-size:13px;margin-bottom:4px;">All done for today! 🎉</div>
      <div style="font-size:10px;color:var(--dim);">Rest up — you earned it.</div>
    </div>`;return;
  }

  // Empty day
  if(pendingTasks.length===0&&tl.length===0){
    const tplMap={morning:'remote',afternoon:'study',evening:'light',night:'light'};
    const tplNames={remote:'🏠 Remote',inperson:'🏢 In-Person',study:'📚 Study',light:'🌿 Light'};
    el.innerHTML=`<div class="coach-suggestion" onclick="applyTemplate('${tplMap[timeOfDay]}')">
      <span class="coach-s-icon">📋</span>
      <span class="coach-s-text">Empty day — load a template?</span>
      <button class="coach-s-btn" onclick="event.stopPropagation();applyTemplate('${tplMap[timeOfDay]}')">${tplNames[tplMap[timeOfDay]]}</button>
    </div>`;return;
  }

  // Night wind-down
  if(timeOfDay==='night'){
    el.innerHTML=`<div class="coach-suggestion" onclick="switchTab('wins',document.querySelector('.tab-btn[onclick*=\\'wins\\']'))">
      <span class="coach-s-icon">🌙</span>
      <span class="coach-s-text">Winding down — log wins for today</span>
      <button class="coach-s-btn" onclick="event.stopPropagation();switchTab('wins',document.querySelector('.tab-btn[onclick*=\\'wins\\']'))">Open Wins</button>
    </div>`;return;
  }

  // Build goal-based action blocks
  let html='';
  const shown=Math.min(pendingTasks.length,2);
  for(let i=0;i<shown;i++){
    const t=pendingTasks[i];
    const cat=D.cats[t.cat];
    const emoji=cat?.emoji||'📌';
    const catColor=cat?.color||'var(--blue)';
    const shortText=t.text.length>35?t.text.slice(0,35)+'…':t.text;
    const safe=t.text.replace(/'/g,"\\'");

    // Main action block — bigger tasks get longer blocks
    const bigTaskRx=/resume|personal statement|draft|write|essay|application|ps:|letter|experiences/i;
    const isBig=bigTaskRx.test(t.text);
    const mainDur=t.effort==='quick'?5:t.effort==='call'?20:isBig
      ?(energy>=4?60:energy>=3?45:25)
      :(energy>=4?30:energy>=3?25:15);
    const mainLabel=t.effort==='quick'?'5 min':t.effort==='call'?'Call now':isBig?`${mainDur}m focus`:`${mainDur}m block`;

    // Backup block — easier alternative
    let backupHtml='';
    if(energy<=2&&t.effort!=='quick'){
      const backupDur=isBig?15:10;
      const backupLabel=isBig?'15m outline only':'10m just start';
      backupHtml=`<div style="display:flex;align-items:center;gap:4px;margin-top:2px;padding-left:22px;">
        <span style="font-size:8px;color:var(--dim);">or</span>
        <button class="coach-s-btn" style="font-size:7px;border-color:var(--dim);color:var(--dim);" onclick="event.stopPropagation();coachAddBlock('${t.cat}',${backupDur},'${safe}')">${backupLabel}</button>
      </div>`;
    } else if(energy>=3&&t.effort!=='quick'){
      const backupDur=isBig?25:15;
      const backupLabel=isBig?'25m pomodoro':'15m sprint';
      backupHtml=`<div style="display:flex;align-items:center;gap:4px;margin-top:2px;padding-left:22px;">
        <span style="font-size:8px;color:var(--dim);">or</span>
        <button class="coach-s-btn" style="font-size:7px;border-color:var(--dim);color:var(--dim);" onclick="event.stopPropagation();coachAddBlock('${t.cat}',${backupDur},'${safe}')">${backupLabel}</button>
      </div>`;
    }

    const priDot=t.pri==='high'?`<span style="width:5px;height:5px;border-radius:50%;background:var(--rose);display:inline-block;flex-shrink:0;margin-right:2px;" title="High priority"></span>`:'';

    html+=`<div style="margin-bottom:4px;">
      <div class="coach-suggestion" onclick="coachAddBlock('${t.cat}',${mainDur},'${safe}')">
        <span class="coach-s-icon">${emoji}</span>
        <span class="coach-s-text">${priDot}${shortText}</span>
        <button class="coach-s-btn" style="border-color:${catColor};color:${catColor};" onclick="event.stopPropagation();coachAddBlock('${t.cat}',${mainDur},'${safe}')">${mainLabel}</button>
      </div>${backupHtml}
      <div style="display:flex;align-items:center;gap:4px;margin-top:2px;padding-left:22px;">
        <button class="coach-s-btn" style="font-size:7px;border-color:var(--dim);color:var(--dim);" onclick="event.stopPropagation();deferToTomorrow(${t.id});generateCoachSuggestions();">→ tmrw</button>
        <button class="coach-s-btn" style="font-size:7px;border-color:var(--dim);color:var(--dim);" onclick="event.stopPropagation();deferToLater(${t.id});generateCoachSuggestions();">→ later</button>
      </div>
    </div>`;
  }

  const eMsg=energy>=4?'Good energy today':energy<=2?'Low energy — start small':'Steady — one thing at a time';
  el.innerHTML=`<div style="font-size:9px;color:var(--dim);margin-bottom:6px;padding:0 4px;">${eMsg} · <b style="color:var(--indigo);">${pendingTasks.length}</b> left</div>${html}`;
}

function coachAddBlock(catKey,durMin,title){
  const dt=todayStr();
  const now=new Date();
  const nowMin=now.getHours()*60+now.getMinutes();
  let roundedStart=Math.ceil(nowMin/15)*15;
  if(roundedStart+durMin>23*60+45){
    roundedStart=Math.max(7*60,23*60+45-durMin);
  }
  const t=minToTime(roundedStart);
  const endMin=Math.min(23*60+45,roundedStart+durMin);
  const endTime=minToTime(endMin);
  const cat=D.cats[catKey];
  const text=title||(cat?cat.emoji+' '+cat.label:'Block');
  const tl=getTimeline(dt)||[];
  let idx=tl.length;
  for(let j=0;j<tl.length;j++){if(parseMin(tl[j].t)>roundedStart){idx=j;break;}}
  tl.splice(idx,0,{t,text,cls:catKey,sm:'',end:endTime});
  setTimeline(dt,tl);
  renderCalendar();renderMiniCal();
  const toast=document.getElementById('saveToast');
  if(toast){toast.innerHTML=`✓ Added ${text} at ${t}`;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2000);}
  setTimeout(()=>{
    generateCoachSuggestions();
    const blk=document.querySelector(`.wk-block[title*="${t}"]`)||document.querySelector(`.dv-block[data-idx="${idx}"]`);
    if(blk)blk.scrollIntoView({behavior:'smooth',block:'center'});
  },150);
}

// ===== BREATHING =====
let _breatheTimeout=null,_breathePhase=0;
const BREATHE_PHASES=[
  {label:'Inhale...',duration:4000,scale:1.6},
  {label:'Hold...',duration:7000,scale:1.6},
  {label:'Exhale...',duration:8000,scale:1.0}
];
function toggleBreathe(){
  const overlay=document.getElementById('breatheOverlay');
  if(overlay.style.display==='none'){
    overlay.style.display='block';
    document.getElementById('coachSuggestions').style.display='none';
    _breathePhase=0;runBreathePhase();
  } else {stopBreathe();}
}
function runBreathePhase(){
  const phase=BREATHE_PHASES[_breathePhase%3];
  const circle=document.getElementById('breatheCircle');
  const label=document.getElementById('breatheLabel');
  if(!circle||!label)return;
  label.textContent=phase.label;
  circle.style.transform=`scale(${phase.scale})`;
  const colors=['var(--blue)','var(--green)','var(--purple)'];
  circle.style.background=colors[_breathePhase%3];
  _breatheTimeout=setTimeout(()=>{_breathePhase++;runBreathePhase();},phase.duration);
}
function stopBreathe(){
  clearTimeout(_breatheTimeout);_breatheTimeout=null;
  document.getElementById('breatheOverlay').style.display='none';
  document.getElementById('coachSuggestions').style.display='';
}

// ===== DISTRACTIONS / PARKING LOT =====
function quickParkThought(){
  const inp=document.getElementById('distractInput');
  const text=inp.value.trim();if(!text)return;
  if(!D.parkingItems)D.parkingItems=[];
  D.parkingItems.push({id:Date.now(),text,added:todayStr()});
  inp.value='';save();
  if(typeof renderCalRightStash==='function')renderCalRightStash();
  if(typeof renderParkingList==='function')renderParkingList();
}
function addDistraction(){
  const inp=document.getElementById('distractInput');
  const text=inp.value.trim();if(!text)return;
  if(!D.distractions)D.distractions=[];
  D.distractions.push({id:Date.now(),text,ts:new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}),done:false});
  save();inp.value='';renderDistractions();
}
function renderDistractions(){
  const list=D.distractions||[];
  const countEl=document.getElementById('distractCount');
  if(countEl)countEl.textContent=list.filter(d=>!d.done).length;
  const el=document.getElementById('distractionList');
  if(!el)return;
  if(!list.length){el.innerHTML='';return;}
  el.innerHTML=list.map(d=>`<div class="distraction-item ${d.done?'done':''}">
    <button class="distraction-check" onclick="toggleDistraction(${d.id})">${d.done?'✓':'○'}</button>
    <div class="distraction-text">${d.text}</div>
    <span class="distraction-time">${d.ts}</span>
    <button class="distraction-del" onclick="removeDistraction(${d.id})">×</button>
  </div>`).join('');
}
function toggleDistraction(id){
  const d=(D.distractions||[]).find(x=>x.id===id);if(!d)return;
  d.done=!d.done;save();renderDistractions();
}
function removeDistraction(id){
  D.distractions=(D.distractions||[]).filter(x=>x.id!==id);
  save();renderDistractions();
}
function clearDistractions(){
  if(!D.distractions||!D.distractions.length)return;
  if(!confirm('Clear all parked thoughts?'))return;
  D.distractions=[];save();renderDistractions();
}

// ===== RECURRING MEETINGS =====
const RECURRING_MEETINGS=[
  {day:1,time:'10:00',label:'RA Check-in',freq:'weekly',location:'biweekly-office'},
  {day:1,time:'13:00',label:'Small TPP',freq:'weekly',location:'biweekly-office'},
  {day:1,time:'13:30',end:'16:00',label:'Large TPP Meeting',freq:'weekly',location:'biweekly-office'},
  {day:2,time:'12:30',label:'Meeting with Maura',freq:'biweekly',location:'office'},
  {day:4,time:'15:30',label:'PI Meeting',freq:'biweekly',location:'office'},
  {day:5,time:'9:00',label:'RA Check-in w/ PI & Team',freq:'weekly',location:'biweekly-office'},
  {day:5,time:'10:00',label:'Study Meeting Advisors',freq:'biweekly',location:'office'},
  {day:5,time:'12:00',label:'Allergen Meeting',freq:'weekly',location:'biweekly-office'},
];
// Biweekly anchor: week of May 11, 2026 = in-person week
const BIWEEKLY_ANCHOR=new Date(2026,4,11);
function isOfficeWeek(dt){
  const d=dateObj(dt);
  const diff=Math.floor((d-BIWEEKLY_ANCHOR)/(7*86400000));
  return diff%2===0;
}
function getMeetingsForDate(dt){
  const d=dateObj(dt);
  const dow=d.getDay();
  const officeWk=isOfficeWeek(dt);
  if(!D.mtgLocOverrides)D.mtgLocOverrides={};
  return RECURRING_MEETINGS.filter(m=>{
    if(m.day!==dow)return false;
    if(m.freq==='biweekly'&&!officeWk)return false;
    return true;
  }).map(m=>{
    const overrideKey=dt+'|'+m.label;
    if(D.mtgLocOverrides[overrideKey]){
      return {...m,loc:D.mtgLocOverrides[overrideKey]};
    }
    let loc='remote';
    if(m.location==='office')loc=officeWk?'office':'remote';
    else if(m.location==='biweekly-office')loc=officeWk?'office':'remote';
    return {...m,loc};
  });
}
function toggleMtgLoc(dt,label){
  if(!D.mtgLocOverrides)D.mtgLocOverrides={};
  const key=dt+'|'+label;
  const meetings=getMeetingsForDate(dt);
  const m=meetings.find(x=>x.label===label);
  const current=D.mtgLocOverrides[key]||(m?m.loc:'remote');
  D.mtgLocOverrides[key]=current==='office'?'remote':'office';
  save();renderMtgWeek();
}

// ===== TOMORROW'S PLAN =====
const SPOT_SUGGESTIONS=[
  {key:'rally',icon:'☕',label:'Rally Coffee Shop',desc:'Try it out — good vibes, wifi'},
  {key:'athenaeum',icon:'📚',label:'Athenaeum',desc:'Closes ~5 PM, very quiet, not for calls'},
  {key:'chop',icon:'🏥',label:'CHOP — reserve a room',desc:'Book your own spot, great for calls'},
  {key:'home',icon:'🏠',label:'Home',desc:'Desk setup, comfy, MCAT at night'},
];
function renderTomorrowMode(){
  const el=document.getElementById('modeOptions');if(!el)return;
  const tmrw=getTomorrowStr();
  if(!D.daySpots)D.daySpots={};
  const picked=D.daySpots[tmrw]||[];
  const tmrwDay=dateObj(tmrw).toLocaleDateString('en-US',{weekday:'long'});
  const dow=dateObj(tmrw).getDay();
  const isWeekend=dow===0||dow===6;

  const tl=getTimeline(tmrw)||[];
  const tmrwTasks=D.tasks.filter(t=>t.date===tmrw&&!t.done);

  let schedHtml='<div class="rhythm-meetings">';
  schedHtml+=`<div class="rhythm-header"><span class="rhythm-day">${tmrwDay}</span>`;
  if(!tl.length&&!tmrwTasks.length){
    schedHtml+=`<span class="rhythm-badge clear">Nothing scheduled</span>`;
  } else {
    schedHtml+=`<span class="rhythm-badge" style="background:rgba(99,102,241,.15);color:var(--blue);">${tl.length} block${tl.length!==1?'s':''}</span>`;
  }
  schedHtml+=`</div>`;
  if(tl.length){
    schedHtml+=tl.slice(0,6).map(s=>{
      const cat=D.cats[s.cls];
      const color=s.cls==='_task'?'#f87171':s.cls==='_todo'?'#60a5fa':cat?cat.color:'var(--blue)';
      return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px;">
        <span style="color:${color};font-weight:600;min-width:55px;">${s.t}</span>
        <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.text}</span>
        ${s.loc?`<span style="font-size:8px;color:var(--dim);">📍${s.loc}</span>`:''}
      </div>`;
    }).join('');
    if(tl.length>6) schedHtml+=`<div style="font-size:8px;color:var(--dim);text-align:center;">+${tl.length-6} more</div>`;
  }
  if(tmrwTasks.length){
    schedHtml+=`<div style="font-size:8px;color:var(--blue);font-weight:600;margin-top:4px;">📋 ${tmrwTasks.length} task${tmrwTasks.length!==1?'s':''} due</div>`;
    schedHtml+=tmrwTasks.slice(0,4).map(t=>{
      const cat=D.cats[t.cat];
      return `<div style="font-size:9px;color:var(--dim);padding:1px 0;">• ${cat?cat.emoji:''} ${t.text}</div>`;
    }).join('');
  }
  schedHtml+=`</div>`;

  const hasCalls=tl.some(s=>s.text&&/call|zoom|meet|phone/i.test(s.text));
  let hint='';
  if(isWeekend) hint='Weekend — any spot works, CHOP open before 9 PM';
  else if(hasCalls) hint='You have calls — pick somewhere call-friendly';
  else hint='Weekday before 9 PM — all spots available';

  const customSpots=(D.customSpots||[]);
  const allSpots=[...SPOT_SUGGESTIONS,...customSpots];

  let spotsHtml=`<div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:4px;">`;
  spotsHtml+=allSpots.map(s=>`<button class="spot-pill ${picked.includes(s.key)?'selected':''}" onclick="toggleSpot('${s.key}')" title="${s.desc}">${s.icon} ${s.label}</button>`).join('');
  spotsHtml+=`<button class="spot-pill spot-pill-add" onclick="document.getElementById('customSpotInput').style.display='flex'" title="Add a spot">+</button>`;
  spotsHtml+=`</div>`;
  spotsHtml+=`<div id="customSpotInput" style="display:none;gap:4px;margin-top:4px;">
    <input type="text" class="mode-note-input" id="customSpotText" placeholder="new spot..." onkeydown="if(event.key==='Enter')addCustomSpot()" style="flex:1;">
    <button class="distraction-add-btn" onclick="addCustomSpot()" style="border-color:var(--green);color:var(--green);font-size:10px;">+</button>
  </div>`;

  el.innerHTML=spotsHtml+schedHtml;
  const priWrap=document.getElementById('modePriorities');
  priWrap.style.display='block';
  renderModePriorities();
}
function toggleSpot(key){
  const tmrw=getTomorrowStr();
  if(!D.daySpots)D.daySpots={};
  if(!D.daySpots[tmrw])D.daySpots[tmrw]=[];
  const idx=D.daySpots[tmrw].indexOf(key);
  if(idx>=0)D.daySpots[tmrw].splice(idx,1);
  else D.daySpots[tmrw].push(key);
  save();renderTomorrowMode();
}
function addCustomSpot(){
  const inp=document.getElementById('customSpotText');if(!inp)return;
  const text=inp.value.trim();if(!text)return;
  if(!D.customSpots)D.customSpots=[];
  const key='custom_'+Date.now();
  D.customSpots.push({key,icon:'📍',label:text,desc:''});
  inp.value='';save();renderTomorrowMode();
}
function pickMode(key){
  toggleSpot(key);
}
function addModePriority(){
  const inp=document.getElementById('modePriInput');
  const text=inp.value.trim();if(!text)return;
  const tmrw=getTomorrowStr();
  if(!D.dayPriorities)D.dayPriorities={};
  if(!D.dayPriorities[tmrw])D.dayPriorities[tmrw]=[];
  D.dayPriorities[tmrw].push({id:Date.now(),text,done:false});
  inp.value='';save();renderModePriorities();
}
function renderModePriorities(){
  const tmrw=getTomorrowStr();
  const today=todayStr();
  const showDate=document.getElementById('modePriorities')?.style.display!=='none'?tmrw:today;
  const items=(D.dayPriorities&&D.dayPriorities[showDate])||[];
  const el=document.getElementById('modePriList');if(!el)return;
  if(!items.length){el.innerHTML='';return;}
  el.innerHTML=items.map(p=>`<div class="mode-pri-item ${p.done?'done':''}">
    <button class="distraction-check" onclick="toggleModePri('${showDate}',${p.id})" style="color:var(--indigo);">${p.done?'✓':'○'}</button>
    <span class="mode-pri-text">${p.text}</span>
    <button class="distraction-del" onclick="removeModePri('${showDate}',${p.id})">×</button>
  </div>`).join('');
}
function toggleModePri(dt,id){
  if(!D.dayPriorities||!D.dayPriorities[dt])return;
  const p=D.dayPriorities[dt].find(x=>x.id===id);if(!p)return;
  p.done=!p.done;save();renderModePriorities();
}
function removeModePri(dt,id){
  if(!D.dayPriorities||!D.dayPriorities[dt])return;
  D.dayPriorities[dt]=D.dayPriorities[dt].filter(x=>x.id!==id);
  save();renderModePriorities();
}
function getTomorrowStr(){const d=new Date();d.setDate(d.getDate()+1);return dateStr(d);}
function getTodayMode(){
  const today=todayStr();
  if(!D.daySpots)return null;
  const spots=D.daySpots[today];
  if(!spots||!spots.length)return null;
  const allSpots=[...SPOT_SUGGESTIONS,...(D.customSpots||[])];
  const found=allSpots.find(s=>s.key===spots[0]);
  return found?{key:found.key,icon:found.icon,label:found.label,desc:found.desc}:null;
}
function getTodayPriorities(){
  const today=todayStr();
  return (D.dayPriorities&&D.dayPriorities[today])||[];
}

// ===== TOMORROW VIEW =====
function renderTomorrowView(){
  const tmrw=getTomorrowStr();
  const d=dateObj(tmrw);
  const dayLabel=d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  D.selectedDate=tmrw;

  const el=document.getElementById('calDayView');if(!el)return;
  const tl=getTimeline(tmrw)||[];
  const tmrwTasks=D.tasks.filter(t=>t.date===tmrw&&!t.done&&t.cat!=='braindump');
  if(!D.daySpots)D.daySpots={};
  const picked=D.daySpots[tmrw]||[];
  const customSpots=(D.customSpots||[]);
  const allSpots=[...SPOT_SUGGESTIONS,...customSpots];

  const priorities=(D.dayPriorities&&D.dayPriorities[tmrw])||[];
  const dow=d.getDay();
  const isWeekend=dow===0||dow===6;

  // --- Build the page ---
  let html=`<div style="max-width:800px;margin:0 auto;">`;

  // Header
  html+=`<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
    <span class="mi" style="color:var(--blue);font-size:28px;">wb_sunny</span>
    <div>
      <h2 style="margin:0;font-size:18px;font-weight:700;color:var(--blue);">${dayLabel}</h2>
      <div style="font-size:11px;color:var(--dim);">${isWeekend?'Weekend':'Weekday'} · ${tl.length} block${tl.length!==1?'s':''} · ${tmrwTasks.length} task${tmrwTasks.length!==1?'s':''}</div>
    </div>
  </div>`;

  // Two-column layout
  html+=`<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">`;

  // LEFT: Schedule + Tasks
  html+=`<div>`;

  // Schedule blocks
  html+=`<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:12px;">
    <div style="font-size:10px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">Schedule</div>`;
  if(tl.length){
    tl.forEach((s,i)=>{
      if(!s._id)s._id='s'+Date.now()+'_'+i;
      const sid=s._id;
      const cat=D.cats[s.cls];
      const color=s.cls==='_task'?'#f87171':s.cls==='_todo'?'#60a5fa':cat?cat.color:'var(--blue)';
      const endLabel=s.end?' – '+s.end:'';
      html+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);${s.done?'opacity:.4;text-decoration:line-through;':''}">
        <button onmousedown="event.stopPropagation();" onclick="togSlotDone('${tmrw}','${sid}');renderTomorrowView();" style="width:14px;height:14px;border-radius:50%;border:2px solid ${color};background:${s.done?color:'none'};cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:7px;color:${s.done?'#fff':color};padding:0;flex-shrink:0;">${s.done?'✓':''}</button>
        <span style="font-size:11px;font-weight:600;color:${color};min-width:75px;">${s.t}${endLabel}</span>
        <span style="flex:1;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${s.text}</span>
        ${s.loc?`<span style="font-size:9px;color:var(--dim);">📍${s.loc}</span>`:''}
        <div style="display:flex;gap:3px;">
          <button onclick="shrinkSlot('${tmrw}','${sid}');renderTomorrowView();" class="defer-btn" style="font-size:8px;" title="Shrink">-15m</button>
          <button onclick="removeSlot('${tmrw}','${sid}');renderTomorrowView();" class="defer-btn" style="font-size:8px;color:var(--red);border-color:var(--red);" title="Remove">✕</button>
        </div>
      </div>`;
    });
  } else {
    html+=`<div style="font-size:11px;color:var(--dim);padding:12px;text-align:center;">No blocks yet — add from quick-add or use a template</div>`;
  }
  // Quick-add for tomorrow
  html+=`<div style="margin-top:8px;">
    <input type="text" id="tmrwQuickAdd" placeholder="+ add a block (e.g. 'MCAT 10am for 2hr')" style="width:100%;padding:8px 10px;font-size:11px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:inherit;outline:none;" onkeydown="if(event.key==='Enter'){tmrwQuickAddBlock(this);}">
  </div>`;
  // Templates
  html+=`<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap;">
    <span style="font-size:9px;color:var(--dim);align-self:center;">Templates:</span>
    <button class="defer-btn" onclick="D.selectedDate='${tmrw}';applyTemplate('remote');renderTomorrowView();" style="font-size:9px;">🏠 Remote</button>
    <button class="defer-btn" onclick="D.selectedDate='${tmrw}';applyTemplate('inperson');renderTomorrowView();" style="font-size:9px;">🏢 Office</button>
    <button class="defer-btn" onclick="D.selectedDate='${tmrw}';applyTemplate('study');renderTomorrowView();" style="font-size:9px;">📚 Study</button>
    <button class="defer-btn" onclick="D.selectedDate='${tmrw}';applyTemplate('light');renderTomorrowView();" style="font-size:9px;">🌿 Light</button>
    ${isWeekend?`<button class="defer-btn" onclick="D.selectedDate='${tmrw}';applyTemplate('weekend');renderTomorrowView();" style="font-size:9px;">🛋️ Weekend</button>`:''}
  </div>`;
  html+=`</div>`;

  // Tasks due tomorrow
  html+=`<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;">
    <div style="font-size:10px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">Tasks Due <span class="badge" style="font-size:9px;">${tmrwTasks.length}</span></div>`;
  if(tmrwTasks.length){
    tmrwTasks.forEach(t=>{
      const cat=D.cats[t.cat];
      html+=`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);">
        <input type="checkbox" onchange="togTask(${t.id},this);renderTomorrowView();">
        <span style="flex:1;font-size:12px;">${cat?cat.emoji:''} ${t.text}</span>
        <button class="defer-btn" onclick="deferToLater(${t.id});renderTomorrowView();">→ later</button>
      </div>`;
    });
  } else {
    html+=`<div style="font-size:11px;color:var(--dim);padding:8px 8px 4px;text-align:center;">No tasks scheduled for tomorrow</div>`;
  }
  html+=`<div style="display:flex;gap:4px;margin-top:8px;">
    <input type="text" id="tmrwTaskInput" placeholder="+ add a task for tomorrow..." style="flex:1;padding:6px 10px;font-size:11px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:inherit;outline:none;" onkeydown="if(event.key==='Enter'){addTmrwTask();renderTomorrowView();}">
    <button onclick="addTmrwTask();renderTomorrowView();" style="background:none;border:1px solid var(--border);border-radius:6px;color:var(--text);cursor:pointer;padding:4px 10px;font-size:14px;font-family:inherit;">+</button>
  </div>`;
  html+=`</div>`;
  html+=`</div>`; // end left column

  // RIGHT: Planning tools
  html+=`<div>`;

  // Top priorities
  html+=`<div style="background:var(--card);border:1px solid rgba(129,140,248,.2);border-radius:10px;padding:14px;margin-bottom:12px;">
    <div style="font-size:10px;font-weight:700;color:var(--indigo);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">🎯 Top Priorities</div>`;
  if(priorities.length){
    priorities.forEach(p=>{
      html+=`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);${p.done?'opacity:.4;text-decoration:line-through;':''}">
        <button onclick="toggleModePri('${tmrw}',${p.id});renderTomorrowView();" style="background:none;border:1.5px solid var(--indigo);border-radius:50%;width:14px;height:14px;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:8px;color:var(--indigo);padding:0;${p.done?'background:var(--indigo);color:#fff;':''}">${p.done?'✓':'○'}</button>
        <span style="flex:1;font-size:12px;">${p.text}</span>
        <button onclick="removeModePri('${tmrw}',${p.id});renderTomorrowView();" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:12px;">✕</button>
      </div>`;
    });
  }
  html+=`<div style="display:flex;gap:4px;margin-top:6px;">
    <input type="text" id="tmrwPriInput" class="mode-note-input" placeholder="+ add a priority..." style="flex:1;padding:6px 10px;font-size:11px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:inherit;outline:none;" onkeydown="if(event.key==='Enter'){addTmrwPriority();renderTomorrowView();}">
    <button onclick="addTmrwPriority();renderTomorrowView();" style="background:none;border:1px solid var(--indigo);border-radius:6px;color:var(--indigo);cursor:pointer;padding:4px 10px;font-size:11px;font-family:inherit;">+</button>
  </div>`;
  html+=`</div>`;

  // Where to work
  html+=`<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;margin-bottom:12px;">
    <div style="font-size:10px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">📍 Where to work</div>`;
  allSpots.forEach(s=>{
    const sel=picked.includes(s.key);
    html+=`<div onclick="toggleSpot('${s.key}');renderTomorrowView();" style="display:flex;align-items:center;gap:8px;padding:6px 8px;border-radius:8px;cursor:pointer;margin-bottom:3px;border:1px solid ${sel?'var(--green)':'var(--border)'};background:${sel?'rgba(52,211,153,.08)':'transparent'};transition:all .15s;">
      <span style="font-size:16px;">${s.icon}</span>
      <div style="flex:1;">
        <div style="font-size:12px;font-weight:600;">${s.label}</div>
        ${s.desc?`<div style="font-size:9px;color:var(--dim);">${s.desc}</div>`:''}
      </div>
      ${sel?'<span style="color:var(--green);font-size:12px;">✓</span>':''}
    </div>`;
  });
  html+=`<div style="margin-top:6px;">
    <input type="text" id="customSpotInput" class="mode-note-input" placeholder="+ add a spot..." style="width:100%;padding:6px 10px;font-size:11px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:inherit;outline:none;" onkeydown="if(event.key==='Enter'){addCustomSpot();renderTomorrowView();}">
  </div>`;
  html+=`</div>`;

  // Notes for tomorrow
  const ref=D.reflections&&D.reflections[todayStr()]||{};
  html+=`<div style="background:var(--card);border:1px solid var(--border);border-radius:10px;padding:14px;">
    <div style="font-size:10px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px;">📝 Notes for tomorrow</div>
    <textarea id="tmrwNotes" placeholder="Anything to remember..." style="width:100%;min-height:60px;padding:8px 10px;font-size:12px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:inherit;outline:none;resize:vertical;" oninput="saveTmrwNotes(this.value)">${ref.focusTomorrow||''}</textarea>
  </div>`;

  html+=`</div>`; // end right column
  html+=`</div>`; // end grid
  html+=`</div>`; // end max-width wrapper

  el.innerHTML=html;
}

function tmrwQuickAddBlock(inp){
  const text=inp.value.trim();if(!text)return;
  const tmrw=getTomorrowStr();
  const p=parseQuickAdd(text);
  if(!p){inp.value='';return;}
  p.date=tmrw;
  const t=minToTime(p.time);
  const endTime=minToTime(Math.min(24*60,p.time+p.duration));
  const tl=getTimeline(tmrw)||[];
  let idx=tl.length;
  for(let j=0;j<tl.length;j++){if(parseMin(tl[j].t)>p.time){idx=j;break;}}
  tl.splice(idx,0,{t,text:p.title,cls:p.cat,sm:'',end:endTime,_id:'s'+Date.now()+'_'+Math.floor(Math.random()*9999)});
  setTimeline(tmrw,tl);
  inp.value='';renderTomorrowView();
}

function saveTmrwNotes(val){
  const today=todayStr();
  if(!D.reflections)D.reflections={};
  if(!D.reflections[today])D.reflections[today]={};
  D.reflections[today].focusTomorrow=val;
  save();
}

function addTmrwPriority(){
  const inp=document.getElementById('tmrwPriInput');if(!inp)return;
  const text=inp.value.trim();if(!text)return;
  const tmrw=getTomorrowStr();
  if(!D.dayPriorities)D.dayPriorities={};
  if(!D.dayPriorities[tmrw])D.dayPriorities[tmrw]=[];
  D.dayPriorities[tmrw].push({id:Date.now(),text,done:false});
  inp.value='';save();
}

function addTmrwTask(){
  const inp=document.getElementById('tmrwTaskInput');if(!inp)return;
  const text=inp.value.trim();if(!text)return;
  const tmrw=getTomorrowStr();
  D.tasks.push({id:D.nextId++,text,cat:'personal',pri:'med',done:false,date:tmrw});
  inp.value='';save();updateStats();
}

// ===== LATER ITEMS RESURFACE (PM next day) =====
function surfaceLaterItems(){
  const now=new Date();
  const today=todayStr();
  const lsKey='laterSurface_'+today;
  if(localStorage.getItem(lsKey))return;
  // Only show once per day, and not until after 10am
  if(now.getHours()<10)return;
  const laterTasks=D.tasks.filter(t=>!t.date&&!t.done&&t.cat!=='braindump');
  const parked=D.parkingItems||[];
  const total=laterTasks.length+parked.length;
  if(!total)return;
  localStorage.setItem(lsKey,'1');
  const old=document.getElementById('laterSurfaceModal');if(old)old.remove();
  const modal=document.createElement('div');
  modal.id='laterSurfaceModal';
  modal.style.cssText='position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);';
  let itemsHtml='';
  laterTasks.slice(0,8).forEach(t=>{
    const cat=D.cats[t.cat];
    itemsHtml+=`<div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:12px;">${cat?.emoji||'📋'}</span>
      <span style="flex:1;font-size:12px;">${t.text}</span>
      <button onclick="laterToToday(${t.id});this.closest('.later-row').remove();" class="t-btn" style="font-size:9px;padding:2px 6px;border-color:var(--green);color:var(--green);">→ today</button>
      <button onclick="deferToTomorrow(${t.id});this.closest('.later-row').remove();" class="t-btn" style="font-size:9px;padding:2px 6px;border-color:var(--blue);color:var(--blue);">→ tmrw</button>
    </div>`;
    itemsHtml=itemsHtml.replace('<div style=','<div class="later-row" style=');
  });
  parked.slice(0,4).forEach(p=>{
    itemsHtml+=`<div class="later-row" style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:12px;">📌</span>
      <span style="flex:1;font-size:12px;">${p.text}</span>
      <button onclick="promoteParkingItem(${p.id});this.closest('.later-row').remove();" class="t-btn" style="font-size:9px;padding:2px 6px;">↑ task</button>
    </div>`;
  });
  modal.innerHTML=`<div style="background:var(--card);border-radius:12px;padding:20px;max-width:480px;width:90%;max-height:70vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.5);border:1px solid var(--border);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h3 style="margin:0;font-size:15px;">🔔 Later Items Check-in</h3>
      <button onclick="document.getElementById('laterSurfaceModal').remove()" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:18px;">✕</button>
    </div>
    <p style="font-size:11px;color:var(--dim);margin:0 0 12px;">You have <b>${total}</b> item${total>1?'s':''} in your Later list. Want to pull any to today or tomorrow?</p>
    ${itemsHtml}
    <div style="text-align:right;margin-top:12px;">
      <button onclick="document.getElementById('laterSurfaceModal').remove()" class="t-btn" style="padding:6px 16px;">Done</button>
    </div>
  </div>`;
  modal.onclick=(e)=>{if(e.target===modal)modal.remove();};
  document.body.appendChild(modal);
}

// ===== OVERDUE TASK FORWARDING =====
function checkOverdueTasks(){
  const today=todayStr();
  const overdue=D.tasks.filter(t=>t.date&&t.date<today&&!t.done&&!(typeof isSnoozed==='function'&&isSnoozed(t)));
  const card=document.getElementById('overdueCard');
  if(!card)return;
  if(!overdue.length){card.style.display='none';return;}
  card.style.display='';
  document.getElementById('overdueCount').textContent=overdue.length;
  const el=document.getElementById('overdueList');
  el.innerHTML=overdue.map(t=>{
    const cat=D.cats[t.cat];
    const daysAgo=Math.round((new Date(today+'T12:00:00')-new Date(t.date+'T12:00:00'))/(86400000));
    const ago=daysAgo===1?'yesterday':daysAgo+' days ago';
    return `<div class="overdue-item">
      <span class="overdue-dot ${t.pri}"></span>
      <div class="overdue-text">${cat?.emoji||''} ${t.text}</div>
      <span class="overdue-ago">${ago}</span>
      <button class="overdue-btn" onclick="moveOverdueToToday(${t.id})" title="Move to today">today</button>
      <button class="overdue-btn reschedule" onclick="rescheduleOverdueTask(${t.id})" title="Pick a new date" style="border-color:var(--blue);color:var(--blue);">📅</button>
    </div>`;
  }).join('');
}
function moveOverdueToToday(id){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  t.date=todayStr();save();checkOverdueTasks();renderCalTasks();renderAllTasks();updateStats();
}
function moveAllOverdueToToday(){
  const today=todayStr();
  D.tasks.filter(t=>t.date&&t.date<today&&!t.done).forEach(t=>t.date=today);
  save();checkOverdueTasks();renderCalTasks();renderAllTasks();updateStats();
}
function dropOverdueTask(id){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  if(!D.backlog)D.backlog=[];
  D.backlog.push({id:Date.now(),text:t.text,cat:t.cat,pri:t.pri,date:t.date,droppedOn:todayStr()});
  D.tasks=D.tasks.filter(x=>x.id!==id);
  save();checkOverdueTasks();renderCalTasks();renderAllTasks();updateStats();
  if(typeof renderBacklog==='function')renderBacklog();
  if(typeof renderCalRightBacklog==='function')renderCalRightBacklog();
}
function rescheduleOverdueTask(id){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  const newDate=prompt('Move to which date? (YYYY-MM-DD)',todayStr());
  if(!newDate||!/^\d{4}-\d{2}-\d{2}$/.test(newDate))return;
  t.date=newDate;
  // Also create an amber "task" block on that date's calendar
  const tl=getTimeline(newDate)||[];
  const alreadyExists=tl.some(s=>s._taskId===t.id);
  if(!alreadyExists){
    // Find a free slot starting at 9am
    let startMin=9*60;
    tl.forEach(s=>{const em=s.end?parseMin(s.end):parseMin(s.t)+30;if(parseMin(s.t)<=startMin&&em>startMin)startMin=em;});
    if(startMin>=22*60)startMin=9*60;
    const endMin=Math.min(24*60,startMin+30);
    tl.push({t:minToTime(startMin),text:'📋 '+t.text,cls:'_task',sm:'Carried over',end:minToTime(endMin),_taskId:t.id,_id:'s'+Date.now()+'_'+Math.floor(Math.random()*9999)});
    tl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
    setTimeline(newDate,tl);
  }
  save();checkOverdueTasks();renderCalTasks();renderAllTasks();renderCalendar();renderMiniCal();updateStats();
}

function renderBacklog(){
  const el=document.getElementById('backlogList');if(!el)return;
  const items=D.backlog||[];
  const badge=document.getElementById('backlogCount');
  if(badge)badge.textContent=items.length;
  if(!items.length){el.innerHTML='<p style="font-size:11px;color:var(--dim);text-align:center;padding:12px;">Nothing in backlog</p>';return;}
  el.innerHTML=items.map(b=>{
    const cat=D.cats[b.cat];
    return `<div class="parking-item">
      <span style="font-size:14px;">${cat?.emoji||'📌'}</span>
      <div class="pi-text">${b.text}<div style="font-size:9px;color:var(--dim);margin-top:1px;">dropped ${b.droppedOn||''}, was due ${b.date||'no date'}</div></div>
      <button class="pi-act pi-promote" onclick="restoreFromBacklog(${b.id})" title="Restore to today">↑ restore</button>
      <button class="pi-act pi-del" onclick="removeFromBacklog(${b.id})" title="Delete permanently">✕</button>
    </div>`;
  }).join('');
}
function restoreFromBacklog(id){
  const item=(D.backlog||[]).find(x=>x.id===id);if(!item)return;
  D.tasks.push({id:D.nextId++,text:item.text,cat:item.cat,pri:item.pri,done:false,date:todayStr()});
  D.backlog=D.backlog.filter(x=>x.id!==id);
  save();renderBacklog();renderSidebarTasks();renderAllTasks();updateStats();
  if(typeof renderCalRightTasks==='function')renderCalRightTasks();
  if(typeof renderCalRightCompleted==='function')renderCalRightCompleted();
  if(typeof renderCalRightBacklog==='function')renderCalRightBacklog();
}
function removeFromBacklog(id){
  D.backlog=(D.backlog||[]).filter(x=>x.id!==id);
  save();renderBacklog();
  if(typeof renderCalRightBacklog==='function')renderCalRightBacklog();
}
function dismissAllOverdue(){
  const today=todayStr();
  D.tasks.filter(t=>t.date&&t.date<today&&t.done).forEach(t=>t.date='');
  save();checkOverdueTasks();renderAllTasks();
}

// ===== WEEKLY LATER REVIEW =====
function checkWeeklyReview(){
  const card=document.getElementById('weeklyReviewCard');if(!card)return;
  const day=new Date().getDay();
  const laterItems=D.tasks.filter(t=>!t.date&&!t.done&&t.cat!=='braindump');
  const parkedItems=D.parkingItems||[];
  const totalStash=laterItems.length+parkedItems.length;
  if((day===0||day===1)&&totalStash>0){
    card.style.display='';
    document.getElementById('weeklyReviewCount').textContent=totalStash;
    const el=document.getElementById('weeklyReviewList');
    let html='';
    laterItems.forEach(t=>{
      const cat=D.cats[t.cat];
      html+=`<div class="overdue-item">
        <span class="overdue-dot ${t.pri}"></span>
        <div class="overdue-text">${cat?.emoji||''} ${t.text}</div>
        <button class="overdue-btn" onclick="laterToToday(${t.id});checkWeeklyReview();" title="Pull to today">today</button>
        <button class="overdue-btn drop" onclick="dropLaterTask(${t.id});checkWeeklyReview();" title="Drop it">drop</button>
      </div>`;
    });
    parkedItems.forEach(p=>{
      html+=`<div class="overdue-item">
        <span style="font-size:10px;">📌</span>
        <div class="overdue-text">${p.text}</div>
        <button class="overdue-btn" onclick="promoteParkingItem(${p.id});checkWeeklyReview();" title="Make a task">task</button>
        <button class="overdue-btn drop" onclick="removeParkingItem(${p.id});checkWeeklyReview();" title="Remove">drop</button>
      </div>`;
    });
    el.innerHTML=html;
  } else {
    card.style.display='none';
  }
}
function dropLaterTask(id){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  if(!D.backlog)D.backlog=[];
  D.backlog.push({id:Date.now(),text:t.text,cat:t.cat,pri:t.pri,date:'',droppedOn:todayStr()});
  D.tasks=D.tasks.filter(x=>x.id!==id);
  save();renderCalTasks();renderAllTasks();updateStats();
  if(typeof renderBacklog==='function')renderBacklog();
  if(typeof renderCalRightStash==='function')renderCalRightStash();
}

// ===== KEYBOARD =====
document.addEventListener('keydown',e=>{
  if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();openTimerModal();toggleTimer();}
  if((e.ctrlKey||e.metaKey)&&e.key==='z'&&!e.shiftKey){
    const tag=document.activeElement?.tagName;
    if(tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT')return;
    e.preventDefault();undo();
  }
  if((e.key==='Delete'||e.key==='Backspace')&&!e.ctrlKey&&!e.metaKey){
    const el=document.activeElement;
    if(!el||el.tagName==='INPUT'||el.tagName==='TEXTAREA'||el.tagName==='SELECT')return;
    const block=el.closest('.dv-block');
    if(block&&block.dataset.dt&&block.dataset.idx!=null){
      e.preventDefault();
      removeSlot(block.dataset.dt,parseInt(block.dataset.idx));
    }
  }
});

// ===== DAILY MOTIVATION =====
const DAILY_MOTIV_MSGS=[
  "One thing at a time. That's enough.",
  "Your brain works differently — that's your edge.",
  "Start messy. Done is better than perfect.",
  "You don't have to feel ready. Just start.",
  "Small steps still move you forward.",
  "Progress over perfection, always.",
  "The hardest part is opening the app. You did that.",
  "Showing up counts. You're here."
];
function checkDailyMotivation(){
  const today=todayStr();
  if(localStorage.getItem('motivDismissed_'+today))return;
  const modal=document.getElementById('motivModal');
  const content=document.getElementById('motivContent');
  if(!modal||!content)return;
  const now=new Date();
  const yesterday=new Date(now);yesterday.setDate(yesterday.getDate()-1);
  const yStr=yesterday.toISOString().split('T')[0];
  const yDone=D.tasks.filter(t=>t.date===yStr&&t.done);
  const yBlocks=(getTimeline(yStr)||[]).filter(s=>s.done);
  const totalWins=yDone.length+yBlocks.length;
  const msg=DAILY_MOTIV_MSGS[Math.floor(Math.random()*DAILY_MOTIV_MSGS.length)];
  let html=`<h2>Hey, Alex</h2>`;
  html+=`<p style="font-size:14px;color:var(--text);margin-bottom:16px;line-height:1.5;">${msg}</p>`;
  if(totalWins>0){
    html+=`<div class="hype-stat">${totalWins}</div>`;
    html+=`<p style="font-size:11px;color:var(--green);margin-bottom:8px;">things done yesterday</p>`;
  }
  content.innerHTML=html;
  modal.classList.add('show');
}
function closeDailyMotivation(){
  const modal=document.getElementById('motivModal');
  if(modal)modal.classList.remove('show');
  localStorage.setItem('motivDismissed_'+todayStr(),'1');
}

// ===== WORRY NOTES =====
let _worryTimer=null,_worrySecondsLeft=600,_worryActive=false,_worryPaused=false,_worryTotalSecs=600;
function onWorryInput(textarea){
  const today=todayStr();
  if(!D.worryLog)D.worryLog={};
  if(!D.worryLog[today])D.worryLog[today]={text:'',startedAt:Date.now()};
  D.worryLog[today].text=textarea.value;
  save();
}
function startWorryCountdown(){
  if(_worryActive)return;
  _worryActive=true;_worryPaused=false;_worrySecondsLeft=600;_worryTotalSecs=600;
  const startBtn=document.getElementById('worryStartBtn');if(startBtn)startBtn.style.display='none';
  const ring=document.getElementById('worryTimerRing');if(ring)ring.style.display='flex';
  const pauseBtn=document.getElementById('worryPauseBtn');if(pauseBtn)pauseBtn.style.display='inline-flex';
  const resetBtn=document.getElementById('worryResetBtn');if(resetBtn)resetBtn.style.display='inline-flex';
  document.getElementById('worryNotes')?.focus();
  startWorryTimer();
}
function startWorryTimer(){
  updateWorryTimerDisplay();
  _worryTimer=setInterval(()=>{
    if(_worryPaused)return;
    _worrySecondsLeft--;
    updateWorryTimerDisplay();
    if(_worrySecondsLeft<=0){clearInterval(_worryTimer);_worryTimer=null;finishWorryNotes();}
  },1000);
}
function toggleWorryPause(){
  _worryPaused=!_worryPaused;
  const btn=document.getElementById('worryPauseBtn');
  if(btn)btn.innerHTML=`<span class="mi" style="font-size:14px;">${_worryPaused?'play_arrow':'pause'}</span>`;
  const ring=document.getElementById('worryRingProgress');
  if(ring)ring.style.stroke=_worryPaused?'var(--dim)':'var(--teal)';
}
function resetWorryTimer(){
  if(_worryTimer){clearInterval(_worryTimer);_worryTimer=null;}
  _worryActive=false;_worryPaused=false;_worrySecondsLeft=600;
  const startBtn=document.getElementById('worryStartBtn');if(startBtn)startBtn.style.display='inline-flex';
  const ring=document.getElementById('worryTimerRing');if(ring)ring.style.display='none';
  const pauseBtn=document.getElementById('worryPauseBtn');if(pauseBtn)pauseBtn.style.display='none';
  const resetBtn=document.getElementById('worryResetBtn');if(resetBtn)resetBtn.style.display='none';
  updateWorryTimerDisplay();
}
function updateWorryTimerDisplay(){
  const disp=document.getElementById('worryTimerDisplay');if(!disp)return;
  disp.textContent='';
  disp.style.color='transparent';
  const ring=document.getElementById('worryRingProgress');
  if(ring){
    const pct=(_worryTotalSecs-_worrySecondsLeft)/_worryTotalSecs;
    ring.style.strokeDashoffset=(pct*97.4).toFixed(1);
    if(_worrySecondsLeft<=60)ring.style.stroke='var(--red)';
    else ring.style.stroke='var(--teal)';
  }
}
function finishWorryNotes(){
  if(_worryTimer){clearInterval(_worryTimer);_worryTimer=null;}
  _worryActive=false;_worryPaused=false;
  const disp=document.getElementById('worryTimerDisplay');
  if(disp){disp.textContent='Done';disp.style.color='var(--green)';}
  const ring=document.getElementById('worryRingProgress');
  if(ring){ring.style.strokeDashoffset='97.4';ring.style.stroke='var(--green)';}
  const pauseBtn=document.getElementById('worryPauseBtn');if(pauseBtn)pauseBtn.style.display='none';
  const today=todayStr();
  const text=(D.worryLog&&D.worryLog[today]&&D.worryLog[today].text)||'';
  showWorrySuggestions(text);
  populateWorryDatePicker();
}
const WORRY_KEYWORDS=[
  {pattern:/\b(test|exam|mcat|study|score|fail|grade)\b/i,suggestion:'Could you study for just 15 minutes right now? Start with one topic.'},
  {pattern:/\b(mom|dad|family|friend|text|call|reach|person|email)\b/i,suggestion:'Could you send one short message to them today?'},
  {pattern:/\b(money|bill|rent|afford|cost|pay|debt)\b/i,suggestion:'Write down one concrete thing you can control about this.'},
  {pattern:/\b(time|late|deadline|behind|rush|due|overdue)\b/i,suggestion:'What is the single next step — even a 5-minute one?'},
  {pattern:/\b(sleep|tired|exhaust|overwhelm|anxious|stress)\b/i,suggestion:'Your body is sending a signal. Rest for 10 minutes, then reassess.'},
];
function showWorrySuggestions(text){
  const el=document.getElementById('worryNextSteps');if(!el)return;
  const matches=WORRY_KEYWORDS.filter(k=>k.pattern.test(text)).map(k=>k.suggestion);
  const unique=[...new Set(matches)].slice(0,2);
  unique.push('Take 3 slow breaths, then pick one small thing to do next.');
  el.style.display='block';
  el.innerHTML=`<div style="background:rgba(167,139,250,.08);border:1px solid rgba(167,139,250,.2);border-radius:8px;padding:10px 12px;">
    <div style="font-size:10px;font-weight:700;color:var(--purple);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Next steps for you:</div>
    ${unique.map(s=>`<div style="font-size:12px;padding:4px 0;display:flex;align-items:flex-start;gap:6px;"><span style="color:var(--purple);flex-shrink:0;">→</span><span>${s}</span></div>`).join('')}
  </div>`;
}
function loadWorryEntry(dateStr){
  if(!dateStr)return;
  const entry=D.worryLog&&D.worryLog[dateStr];
  const ta=document.getElementById('worryNotes');
  if(ta)ta.value=entry?entry.text:'';
  _worryActive=false;
  if(_worryTimer){clearInterval(_worryTimer);_worryTimer=null;}
  const disp=document.getElementById('worryTimerDisplay');if(disp)disp.style.display='none';
  const ns=document.getElementById('worryNextSteps');if(ns)ns.style.display='none';
}
function populateWorryDatePicker(){
  const sel=document.getElementById('worryDatePicker');if(!sel||!D.worryLog)return;
  const today=todayStr();
  const dates=Object.keys(D.worryLog).filter(d=>D.worryLog[d].text&&d!==today).sort().reverse();
  sel.innerHTML='<option value="">Past entries...</option>'+dates.map(d=>`<option value="${d}">${d}</option>`).join('');
}
function initWorryNotes(){
  const today=todayStr();
  const ta=document.getElementById('worryNotes');if(!ta)return;
  ta.value=(D.worryLog&&D.worryLog[today]&&D.worryLog[today].text)||'';
  if(!_worryActive){
    _worrySecondsLeft=600;
    const disp=document.getElementById('worryTimerDisplay');if(disp)disp.style.display='none';
    const ns=document.getElementById('worryNextSteps');if(ns)ns.style.display='none';
  }
  populateWorryDatePicker();
}

// ===== WINDOW RESIZE for week view =====
let resizeTimer=null;
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(D.calView==='week')renderCalendar();},200);});

// ===== EVENT REMINDERS =====
const _remindedEvents=new Set();
const REMINDER_MINUTES=10;

function requestNotifPermission(){
  if(!('Notification' in window))return;
  if(Notification.permission==='default'){
    Notification.requestPermission().then(p=>updateNotifBtn());
  }
  updateNotifBtn();
}
function updateNotifBtn(){
  const btn=document.getElementById('notifToggleBtn');if(!btn)return;
  if(!('Notification' in window)){btn.style.display='none';return;}
  if(Notification.permission==='granted'){btn.textContent='🔔';btn.title='Reminders on';btn.style.opacity='1';}
  else if(Notification.permission==='denied'){btn.textContent='🔕';btn.title='Notifications blocked — enable in browser settings';btn.style.opacity='.5';}
  else{btn.textContent='🔔';btn.title='Click to enable event reminders';btn.style.opacity='.5';}
}

function playReminderSound(){
  try{
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    const notes=[523.25,659.25,783.99];
    notes.forEach((freq,i)=>{
      const osc=ctx.createOscillator();
      const gain=ctx.createGain();
      osc.connect(gain);gain.connect(ctx.destination);
      osc.frequency.value=freq;
      osc.type='sine';
      gain.gain.setValueAtTime(0.15,ctx.currentTime+i*0.15);
      gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+i*0.15+0.4);
      osc.start(ctx.currentTime+i*0.15);
      osc.stop(ctx.currentTime+i*0.15+0.4);
    });
  }catch(e){}
}

function checkEventReminders(){
  const now=new Date();
  const dt=todayStr();
  const tl=getTimeline(dt);
  if(!tl||!tl.length)return;
  const nowMin=now.getHours()*60+now.getMinutes();

  tl.forEach((block,i)=>{
    const blockMin=parseMin(block.t);
    const diff=blockMin-nowMin;
    const key=dt+'_'+i+'_'+block.t+'_'+block.text;
    if(diff>0 && diff<=REMINDER_MINUTES && !_remindedEvents.has(key)){
      _remindedEvents.add(key);
      const catInfo=D.cats[block.cls];
      const icon=catInfo?catInfo.emoji:'📅';
      const label=block.text||'Event';
      const timeStr=minToTime(blockMin);

      playReminderSound();

      if('Notification' in window && Notification.permission==='granted'){
        const n=new Notification('⏰ '+label,{
          body:'Starting in '+diff+' min at '+timeStr+(block.loc?' — '+block.loc:''),
          icon:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">'+encodeURIComponent(icon)+'</text></svg>',
          tag:key,
          requireInteraction:false
        });
        setTimeout(()=>n.close(),15000);
      }

      // In-app toast as fallback
      const toast=document.getElementById('saveToast');
      if(toast){
        toast.innerHTML='⏰ <b>'+label+'</b> in '+diff+' min ('+timeStr+')';
        toast.classList.add('show');
        clearTimeout(window._reminderToast);
        window._reminderToast=setTimeout(()=>toast.classList.remove('show'),6000);
      }
    }
  });
}

// Tomorrow preview reminder — fires once per session around 8-10 PM
let _tomorrowReminderSent=false;
function checkTomorrowReminder(){
  if(_tomorrowReminderSent)return;
  if(!('Notification' in window)||Notification.permission!=='granted')return;
  const now=new Date();
  const hr=now.getHours();
  if(hr<20||hr>22)return;
  const tomorrow=new Date(now);
  tomorrow.setDate(tomorrow.getDate()+1);
  const tmrwStr=dateStr(tomorrow);
  const tl=getTimeline(tmrwStr);
  if(!tl||!tl.length)return;
  _tomorrowReminderSent=true;
  const firstThree=tl.slice(0,3).map(b=>`${b.t} — ${b.text}`).join('\n');
  const more=tl.length>3?`\n+${tl.length-3} more`:'';
  new Notification('📋 Tomorrow\'s Schedule',{
    body:firstThree+more,
    icon:'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">📋</text></svg>',
    tag:'tomorrow_preview',
    requireInteraction:false
  });
}

setTimeout(updateNotifBtn,500);
setInterval(checkEventReminders,30000);
setTimeout(checkEventReminders,2000);
setInterval(checkTomorrowReminder,60000);
setTimeout(checkTomorrowReminder,5000);

init();

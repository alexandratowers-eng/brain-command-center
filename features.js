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
  const lo=goal.rangeLow||20;
  const hi=goal.rangeHigh||40;

  // Count by call type — progress bar tracks recruit only
  const allSessions=goal.sessions||[];
  const recruitTotal=allSessions.filter(s=>s.type==='recruit'||!s.type).reduce((a,s)=>a+s.count,0);
  const followupTotal=allSessions.filter(s=>s.type==='followup').reduce((a,s)=>a+s.count,0);
  const cur=recruitTotal;
  const pct=Math.min(100,Math.round((cur/hi)*100));
  const loMark=Math.round((lo/hi)*100);

  let msg='',msgColor='var(--dim)';
  if(cur===0){msg='Ready when you are 🫶';msgColor='var(--dim)';}
  else if(cur<lo*0.25){msg='You started — that\'s the hardest part 💪';msgColor='var(--blue)';}
  else if(cur<lo*0.5){msg='Building momentum! 🔥';msgColor='var(--blue)';}
  else if(cur<lo){msg='Getting close to the zone! 🎯';msgColor='var(--teal)';}
  else if(cur>=lo&&cur<=hi){msg='You\'re in the zone! 🎉';msgColor='var(--green)';}
  else{msg='Above and beyond!! 🚀';msgColor='var(--green)';}

  // Today's total (recruit only for main display)
  const todayS=todayStr();
  const todayRecruitSessions=allSessions.filter(s=>(s.type==='recruit'||!s.type)&&s.when&&s.when.startsWith(todayS));
  const todayRecruit=todayRecruitSessions.reduce((a,s)=>a+s.count,0);
  const todayFollowup=allSessions.filter(s=>s.type==='followup'&&s.when&&s.when.startsWith(todayS)).reduce((a,s)=>a+s.count,0);

  // Daily breakdown for current week (recruit only)
  const weekDates=getWeekDates(todayS);
  const dayNames=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const dailyCounts=weekDates.map(dt=>{
    return allSessions.filter(s=>(s.type==='recruit'||!s.type)&&s.when&&s.when.startsWith(dt)).reduce((a,s)=>a+s.count,0);
  });
  const daysElapsed=weekDates.filter(dt=>dt<=todayS).length;
  const dailyAvg=daysElapsed>0?Math.round((cur/daysElapsed)*10)/10:0;

  // Follow-up line (shown separately, not counted toward goal)
  let followupHtml='';
  if(followupTotal){
    followupHtml=`<div style="font-size:9px;color:var(--rose);margin-bottom:6px;padding:4px 8px;background:rgba(244,114,182,.06);border-radius:5px;display:flex;align-items:center;gap:4px;">🔄 <strong>${followupTotal}</strong> follow-up${todayFollowup?` · ${todayFollowup} today`:''}</div>`;
  }

  // Log session inline form
  const logFormHtml=_wgLogOpen?`
    <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px;margin-bottom:8px;">
      <div style="font-size:9px;font-weight:600;color:var(--dim);margin-bottom:6px;text-transform:uppercase;letter-spacing:.3px;">Log calls</div>
      <div style="font-size:9px;color:var(--dim);margin-bottom:6px;">Type</div>
      <div style="display:flex;gap:4px;margin-bottom:8px;" id="wgLogType">
        <button class="t-btn wg-type-btn active" data-type="recruit" onclick="wgSelectType(this)" style="font-size:9px;padding:4px 10px;border-color:var(--blue);color:var(--blue);flex:1;">📞 Recruit</button>
        <button class="t-btn wg-type-btn" data-type="followup" onclick="wgSelectType(this)" style="font-size:9px;padding:4px 10px;flex:1;">🔄 Follow-up</button>
      </div>
      <div style="font-size:9px;color:var(--dim);margin-bottom:4px;">Count</div>
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
    ${''/* today count removed for simplicity */}
    <div style="font-size:8px;color:var(--dim);margin-bottom:2px;">📞 Recruit <span style="font-weight:600;">${lo}–${hi}</span></div>
    <div style="position:relative;height:8px;background:var(--border);border-radius:4px;overflow:visible;margin-bottom:3px;">
      <div style="position:absolute;left:${loMark}%;right:0;top:0;bottom:0;background:rgba(52,211,153,.12);border-radius:0 4px 4px 0;"></div>
      <div style="width:${pct}%;height:100%;background:${cur>=lo?'var(--green)':'var(--blue)'};border-radius:4px;transition:width .4s cubic-bezier(.4,0,.2,1);position:relative;z-index:1;opacity:${cur>=lo?1:0.7};"></div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:8px;color:var(--dim);margin-bottom:4px;">
      <span style="color:${msgColor};">${cur} · ${msg}</span>
      <span>${lo}–${hi}</span>
    </div>
    ${followupHtml}
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
  if(!D.weeklyGoals)D.weeklyGoals=[];
  const existing=document.getElementById('wgSetupModal');if(existing)existing.remove();
  const modal=document.createElement('div');
  modal.id='wgSetupModal';
  modal.style.cssText='position:fixed;inset:0;background:rgba(15,15,30,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);';
  modal.innerHTML=`<div style="background:var(--card);border-radius:14px;padding:24px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3);border:1px solid var(--border);">
    <h3 style="margin:0 0 4px;font-size:17px;display:flex;align-items:center;gap:8px;">📊 New Weekly Tracker</h3>
    <p style="font-size:12px;color:var(--dim);margin:0 0 16px;">Track something you want to do weekly — no pressure, just awareness.</p>

    <label style="font-size:11px;color:var(--dim);font-weight:600;display:block;margin-bottom:4px;">What are you tracking?</label>
    <input id="wgLabel" type="text" value="CHOP Calls" placeholder="e.g. CHOP Calls, Workouts, MCAT Questions" style="width:100%;padding:9px 12px;font-size:13px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);outline:none;font-family:inherit;box-sizing:border-box;margin-bottom:12px;">

    <div style="display:flex;gap:8px;margin-bottom:12px;">
      <div style="flex:1;">
        <label style="font-size:11px;color:var(--dim);font-weight:600;display:block;margin-bottom:4px;">Comfortable low</label>
        <input id="wgLo" type="number" value="20" min="0" style="width:100%;padding:9px 12px;font-size:13px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);outline:none;font-family:inherit;box-sizing:border-box;">
      </div>
      <div style="flex:1;">
        <label style="font-size:11px;color:var(--dim);font-weight:600;display:block;margin-bottom:4px;">Stretch high</label>
        <input id="wgHi" type="number" value="40" min="0" style="width:100%;padding:9px 12px;font-size:13px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);outline:none;font-family:inherit;box-sizing:border-box;">
      </div>
    </div>

    <label style="font-size:11px;color:var(--dim);font-weight:600;display:block;margin-bottom:4px;">Unit</label>
    <input id="wgUnit" type="text" value="calls" placeholder="calls, reps, questions..." style="width:100%;padding:9px 12px;font-size:13px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);outline:none;font-family:inherit;box-sizing:border-box;margin-bottom:16px;">

    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button id="wgCancel" style="padding:8px 14px;border-radius:8px;border:1px solid var(--border);background:none;color:var(--text);cursor:pointer;font-family:inherit;font-size:12px;">Cancel</button>
      <button id="wgCreate" style="padding:8px 16px;border-radius:8px;border:none;background:var(--blue);color:white;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;">Create tracker</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  setTimeout(()=>{const l=document.getElementById('wgLabel');if(l){l.focus();l.select();}},20);
  function close(){modal.remove();}
  function create(){
    const label=(document.getElementById('wgLabel').value||'').trim();
    if(!label){document.getElementById('wgLabel').focus();return;}
    const lo=parseInt(document.getElementById('wgLo').value)||20;
    const hi=parseInt(document.getElementById('wgHi').value)||40;
    const unit=((document.getElementById('wgUnit').value)||'units').trim();
    D.weeklyGoals.push({id:Date.now(),label,rangeLow:lo,rangeHigh:hi,target:hi,current:0,unit,sessions:[],created:new Date().toISOString()});
    save();renderWeeklyGoal();close();
  }
  document.getElementById('wgCancel').onclick=close;
  document.getElementById('wgCreate').onclick=create;
  modal.onclick=e=>{if(e.target===modal)close();};
  modal.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.tagName==='INPUT'){e.preventDefault();create();}else if(e.key==='Escape')close();});
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
  bccPrompt('Edit last entry count (was +'+last.count+'):',last.count,(newCount)=>{
    if(newCount===null)return;
    const n=parseInt(newCount);
    if(isNaN(n)||n<0)return;
    const diff=n-last.count;
    last.count=n;
    goal.current=Math.max(0,goal.current+diff);
    save();renderWeeklyGoal();
  });
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
  bccConfirm('Archive this tracker? You can start a new one.',(ok)=>{
    if(!ok)return;
    const goal=getCurrentWeeklyGoal();
    if(goal)goal.archived=true;
    save();renderWeeklyGoal();
  });
}

function editWeeklyGoal(){
  const goal=getCurrentWeeklyGoal();
  if(!goal)return;
  bccPrompt('Tracker name:',goal.label,(newLabel)=>{
    if(newLabel===null)return;
    if(newLabel.trim())goal.label=newLabel.trim();
    bccPrompt('Range low:',goal.rangeLow||40,(newLo)=>{
      if(newLo===null){save();renderWeeklyGoal();return;}
      if(newLo&&!isNaN(parseInt(newLo)))goal.rangeLow=parseInt(newLo);
      bccPrompt('Range high:',goal.rangeHigh||45,(newHi)=>{
        if(newHi!==null&&newHi&&!isNaN(parseInt(newHi))){goal.rangeHigh=parseInt(newHi);goal.target=parseInt(newHi);}
        save();renderWeeklyGoal();
      });
    });
  });
}

// ===== MCAT =====
function renderMcat(){
  const el=document.getElementById('mcatSteps');
  const steps=D.mcatSteps||[];
  const total=steps.length;
  const done=steps.filter(s=>s.status==='done').length;
  const skipped=steps.filter(s=>s.status==='skip').length;
  const pct=total?Math.round((done/total)*100):0;
  const r=36,circ=2*Math.PI*r;
  const offset=circ-(pct/100)*circ;
  const timeTotal=steps.reduce((a,s)=>{const m=parseInt(s.time)||0;return a+m;},0);
  const timeDone=steps.filter(s=>s.status==='done').reduce((a,s)=>{const m=parseInt(s.time)||0;return a+m;},0);

  let ringHtml=`<div style="display:flex;align-items:center;gap:16px;margin-bottom:12px;">
    <svg width="84" height="84" viewBox="0 0 84 84">
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="var(--border)" stroke-width="6"/>
      <circle cx="42" cy="42" r="${r}" fill="none" stroke="${pct>=100?'var(--green)':'#818cf8'}" stroke-width="6" stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${offset}" transform="rotate(-90 42 42)" style="transition:stroke-dashoffset .6s ease;"/>
      <text x="42" y="38" text-anchor="middle" fill="var(--text)" font-size="14" font-weight="700">${pct}%</text>
      <text x="42" y="52" text-anchor="middle" fill="var(--dim)" font-size="8">${done}/${total}</text>
    </svg>
    <div>
      <div style="font-size:10px;color:var(--dim);margin-bottom:2px;">Steps done: <strong style="color:var(--text);">${done}</strong> / ${total}</div>
      <div style="font-size:10px;color:var(--dim);margin-bottom:2px;">Skipped: ${skipped}</div>
      <div style="font-size:10px;color:var(--dim);">Time: <strong style="color:var(--text);">${timeDone}</strong> / ${timeTotal} min</div>
    </div>
  </div>`;

  let stepsHtml=steps.map((s,i)=>{
    const isDone=s.status==='done',isSkip=s.status==='skip';
    return `<div class="mcat-step">
      <div class="step-n ${isDone?'completed':isSkip?'skipped':''}">${isDone?'✓':isSkip?'→':(i+1)}</div>
      <div style="flex:1"><div class="step-t ${isDone||isSkip?'done-step':''}">${s.text}</div><div style="font-size:9px;color:var(--dim);">${s.time}</div></div>
      <div style="display:flex;gap:3px;">${s.status==='todo'?`<button class="step-btn done-btn" onclick="D.mcatSteps[${i}].status='done';save();renderMcat();">done</button><button class="step-btn skip-btn" onclick="D.mcatSteps[${i}].status='skip';save();renderMcat();">skip</button>`:`<button class="step-btn" onclick="D.mcatSteps[${i}].status='todo';save();renderMcat();">undo</button>`}</div>
    </div>`;
  }).join('');

  el.innerHTML=ringHtml+stepsHtml;
}


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

### Brain dump
*Write messy — questions, goals, talking points, anything. Then click* **Clean Up** *to auto-sort into sections, and* **Refine** *to dedupe and remove filler.*



### Materials to have ready
- [ ]
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
  if(!notes.trim()&&!title.trim()){alert('Add a title or notes first');return;}
  if(!D.meetings)D.meetings=[];
  D.meetings.unshift({id:Date.now(),title,date,notes:notes||'(no notes)',notionSynced:false});
  save();renderSavedMeetings();renderMtgCalendarView();
  document.getElementById('mtgTitle').value='';
  document.getElementById('mtgDate').value='';
  document.getElementById('mtgNotes').value='';
  D._mtgDraft=null;save();
  celebrate();
  const t=document.getElementById('saveToast');
  if(t){t.innerHTML=`✓ "${title}" saved`;t.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>t.classList.remove('show'),2000);}
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
    const savedToday=(D.meetings||[]).filter(m=>m.date===today);
    let todayHtml=renderMtgDayCard(today,true);
    if(savedToday.length){
      todayHtml+=`<div style="margin-top:14px;background:var(--card);border:1px solid var(--border);border-radius:10px;overflow:hidden;">
        <div style="padding:10px 14px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:6px;">
          <span class="mi" style="font-size:15px;color:var(--blue);">folder_open</span>
          <span style="font-size:12px;font-weight:700;">Today's Saved Notes</span>
          <span class="badge" style="margin-left:4px;">${savedToday.length}</span>
        </div>`;
      todayHtml+=savedToday.map(m=>{
        const preview=(m.notes||'').replace(/^#+\s*/gm,'').replace(/\*\*/g,'').trim().slice(0,150);
        return `<div class="mtg-saved-item" onclick="loadSavedMeeting(${m.id})" style="margin:4px 6px;cursor:pointer;">
          <span class="mi" style="color:var(--blue);font-size:16px;flex-shrink:0;">description</span>
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${m.title||'Untitled'}</div>
            <div style="font-size:10px;color:var(--dim);margin-top:2px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${preview}${preview.length>=150?'...':''}</div>
          </div>
          <button class="task-act-btn" onclick="event.stopPropagation();deleteMeeting(${m.id});" title="Delete" style="flex-shrink:0;">×</button>
        </div>`;
      }).join('');
      todayHtml+=`</div>`;
    }
    el.innerHTML=todayHtml;
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

function getWeekKey(dt){
  if(!dt||dt==='undated')return 'undated';
  var d=dateObj(dt);
  var day=d.getDay();
  var mon=new Date(d);mon.setDate(d.getDate()-(day===0?6:day-1));
  return dateStr(mon);
}
function getWeekLabel(weekStart){
  if(weekStart==='undated')return 'Undated';
  var d=dateObj(weekStart);
  var end=new Date(d);end.setDate(d.getDate()+6);
  return 'Week of '+d.toLocaleDateString('en-US',{month:'short',day:'numeric'})+' – '+end.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
}

function renderSavedMeetings(){
  const list=D.meetings||[];
  const countEl=document.getElementById('savedMtgCount');
  if(countEl)countEl.textContent=list.length;
  const el=document.getElementById('savedMtgList');
  if(!el)return;
  if(!list.length){el.innerHTML='<p style="font-size:11px;color:var(--dim);text-align:center;padding:10px;">No saved notes yet</p>';return;}

  const weekGroups={};
  list.forEach(m=>{
    const wk=getWeekKey(m.date);
    if(!weekGroups[wk])weekGroups[wk]=[];
    weekGroups[wk].push(m);
  });
  const sortedWeeks=Object.keys(weekGroups).sort((a,b)=>b.localeCompare(a));

  el.innerHTML=sortedWeeks.map(wk=>{
    const weekLabel=getWeekLabel(wk);
    const meetings=weekGroups[wk];
    return `<div class="mtg-saved-group" style="margin-bottom:12px;">
      <div class="mtg-saved-date" style="font-size:11px;font-weight:700;color:var(--indigo);padding:6px 0 4px;border-bottom:1px solid var(--border);margin-bottom:4px;display:flex;align-items:center;gap:6px;">
        <span class="mi" style="font-size:14px;color:var(--indigo);">folder</span> ${weekLabel}
        <span class="badge" style="background:rgba(129,140,248,.12);color:var(--indigo);margin-left:auto;">${meetings.length}</span>
      </div>
      ${meetings.map(m=>{
        const d=m.date?dateObj(m.date):null;
        const dayLabel=d?d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'}):'';
        const synced=m.notionSynced===true;
        const pending=m.notionSynced==='pending';
        const notionLabel=synced?'<span class="mtg-notion-badge synced" title="Synced to Notion">✓ Notion</span>':pending?'<span class="mtg-notion-badge pending" title="Queued for Notion sync">⏳ Pending</span>':`<button class="mtg-notion-btn" onclick="event.stopPropagation();markForNotion(${m.id});" title="Send to Notion"><span class="mi" style="font-size:11px;">upload</span> Notion</button>`;
        return `<div class="mtg-saved-item" onclick="loadSavedMeeting(${m.id})">
        <span class="mi" style="color:var(--blue);font-size:14px;">description</span>
        <div style="flex:1;min-width:0;">
          <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${m.title}</div>
          <div style="font-size:9px;color:var(--dim);">${dayLabel}</div>
        </div>
        ${notionLabel}
        <button class="task-act-btn" onclick="event.stopPropagation();deleteMeeting(${m.id});" title="Delete">x</button>
      </div>`;}).join('')}
    </div>`;
  }).join('');
}

// Smarter meeting cleanup: classifies into Goals / Questions / Talking points / Decisions / Action items
// Preserves the original raw text under "### Original notes" so nothing is destroyed.
function cleanUpMeetingNotes(){
  const notes=document.getElementById('mtgNotes');
  if(!notes||!notes.value.trim())return;
  const raw=notes.value;
  // If we've already cleaned this and the user is calling again, work from the "Original notes" section if present
  let sourceRaw=raw;
  const origMatch=raw.match(/### Original notes\s*\n([\s\S]*)$/);
  if(origMatch)sourceRaw=origMatch[1];
  const lines=sourceRaw.split('\n').map(l=>l.trim()).filter(l=>l.length>0&&!/^#+\s/.test(l));
  const buckets={goals:[],questions:[],talking:[],decisions:[],actions:[]};
  const QUESTION_STARTS=/^(what|why|how|when|where|who|is|are|will|can|could|should|would|do|does|did)\b/i;
  const GOAL_RE=/\b(i want|i need|hope to|trying to|figure out|goal[:\s]|need to know|aim to|looking for)\b/i;
  const ACTION_RE=/\b(i'?ll|i will|we'?ll|let'?s|action item|todo|to[\- ]?do|follow ?up|next step|by (mon|tue|wed|thu|fri|sat|sun|monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|tomorrow|eod|end of (week|day)))\b/i;
  const DECISION_RE=/\b(decided|agreed|resolved|final answer|let'?s go with|the plan is|we'?re (going|gonna) (to|with))\b/i;
  lines.forEach(line=>{
    const lc=line.toLowerCase();
    const stripped=line.replace(/^[-*•]\s*\[[ x]\]\s*/i,'').replace(/^[-*•]\s*/,'').trim();
    if(!stripped)return;
    if(line.endsWith('?')||QUESTION_STARTS.test(stripped)){
      buckets.questions.push('- '+stripped);
    } else if(GOAL_RE.test(lc)){
      buckets.goals.push('- '+stripped);
    } else if(ACTION_RE.test(lc)||/^[-*•]\s*\[[ x]\]/.test(line)){
      buckets.actions.push('- [ ] '+stripped);
    } else if(DECISION_RE.test(lc)){
      buckets.decisions.push('- '+stripped);
    } else {
      buckets.talking.push('- '+stripped);
    }
  });
  let out=[];
  if(buckets.goals.length){out.push('### My goals');out=out.concat(buckets.goals);out.push('');}
  if(buckets.questions.length){out.push('### Questions');out=out.concat(buckets.questions);out.push('');}
  if(buckets.talking.length){out.push('### Talking points');out=out.concat(buckets.talking);out.push('');}
  if(buckets.decisions.length){out.push('### Decisions');out=out.concat(buckets.decisions);out.push('');}
  if(buckets.actions.length){out.push('### Action items');out=out.concat(buckets.actions);out.push('');}
  if(!out.length)out.push('### Notes','- (no content to organize)','');
  out.push('---','### Original notes',sourceRaw.trim());
  notes.value=out.join('\n');
  saveMeetingNotes();
  const t=document.getElementById('saveToast');
  if(t){t.innerHTML='✓ Notes organized — original preserved at bottom';t.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>t.classList.remove('show'),1800);}
}

// Second-pass refine: dedupe near-identical bullets, strip filler words, tighten phrasing.
function refineMeetingNotes(){
  const notes=document.getElementById('mtgNotes');
  if(!notes||!notes.value.trim())return;
  const FILLERS=/\b(um+|uh+|like(?=\s)|sort of|kind of|kinda|i (mean|think|guess) we should|you know|basically|literally|honestly|just gonna|i was gonna)\b/gi;
  const lines=notes.value.split('\n');
  // Tokenize each bullet line for Jaccard dedup
  const tokenize=s=>new Set((s||'').toLowerCase().replace(/[^a-z0-9 ]/g,'').split(/\s+/).filter(w=>w.length>3));
  const jaccard=(a,b)=>{const i=new Set([...a].filter(x=>b.has(x)));const u=new Set([...a,...b]);return u.size?i.size/u.size:0;};
  const seenBullets=[];
  const out=lines.map(line=>{
    let cleaned=line;
    // Only refine bullet content
    const isBullet=/^[\s]*[-*•]/.test(line);
    if(isBullet){
      cleaned=cleaned.replace(FILLERS,'').replace(/\s{2,}/g,' ').replace(/\s+([.,;:!?])/g,'$1').replace(/[.,;]+\s*$/,'').trim();
      // Capitalize first letter
      cleaned=cleaned.replace(/^([\s]*[-*•]\s*(?:\[[ x]\]\s*)?)([a-z])/,(m,p,c)=>p+c.toUpperCase());
      const body=cleaned.replace(/^[\s]*[-*•]\s*(?:\[[ x]\]\s*)?/,'');
      if(body.length<2)return null; // drop tiny stubs
      const tok=tokenize(body);
      if(tok.size){
        for(const prev of seenBullets){
          if(jaccard(tok,prev)>0.7)return null;
        }
        seenBullets.push(tok);
      }
    }
    return cleaned;
  }).filter(l=>l!==null);
  notes.value=out.join('\n');
  saveMeetingNotes();
  const t=document.getElementById('saveToast');
  if(t){t.innerHTML='✨ Refined — dupes & filler removed';t.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>t.classList.remove('show'),1800);}
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
      <div class="coach-suggestion" draggable="true" ondragstart="event.dataTransfer.setData('text/plain','task:'+${t.id});event.dataTransfer.effectAllowed='move';this.style.opacity='.4';" ondragend="this.style.opacity='1';" onclick="coachAddBlock('${t.cat}',${mainDur},'${safe}')">
        <span class="coach-s-icon">${emoji}</span>
        <span class="coach-s-text">${priDot}${shortText}</span>
        <button class="coach-s-btn" style="border-color:${catColor};color:${catColor};" onclick="event.stopPropagation();coachAddBlock('${t.cat}',${mainDur},'${safe}')">${mainLabel}</button>
      </div>${backupHtml}
      <div style="display:flex;align-items:center;gap:3px;margin-top:2px;padding-left:22px;flex-wrap:wrap;">
        <button class="coach-s-btn" style="font-size:7px;border-color:var(--dim);color:var(--dim);" onclick="event.stopPropagation();coachSnooze(${t.id});generateCoachSuggestions();">⏰ later</button>
        <button class="coach-s-btn" style="font-size:7px;border-color:var(--dim);color:var(--dim);" onclick="event.stopPropagation();deferToTomorrow(${t.id});generateCoachSuggestions();if(typeof renderMiniCal==='function')renderMiniCal();">→ tmrw</button>
        <button class="coach-s-btn" style="font-size:7px;border-color:var(--dim);color:var(--dim);" onclick="event.stopPropagation();deferToLater(${t.id});generateCoachSuggestions();">→ stash</button>
      </div>
    </div>`;
  }

  // Time-sensitive tasks: calls, tasks with "by Xpm" in text, or effort=call
  const timeSensitive=pendingTasks.filter(t=>{
    if(t.effort==='call')return true;
    if(/\b(call|phone|text|email|send|submit)\b/i.test(t.text))return true;
    if(/\bbefore\s+\d/i.test(t.text)||/\bby\s+\d/i.test(t.text))return true;
    return false;
  });
  const urgentNotShown=timeSensitive.filter(t=>!pendingTasks.slice(0,shown).includes(t));
  if(urgentNotShown.length){
    const u=urgentNotShown[0];
    const cat=D.cats[u.cat];
    const emoji=cat?.emoji||'📞';
    const color=cat?.color||'var(--blue)';
    const safeU=u.text.replace(/'/g,"\\'");
    const shortU=u.text.length>35?u.text.slice(0,35)+'…':u.text;
    html+=`<div style="margin-top:4px;padding:5px 8px;background:rgba(244,114,182,.08);border:1px solid rgba(244,114,182,.2);border-radius:8px;">
      <div style="font-size:8px;color:var(--rose);font-weight:700;text-transform:uppercase;letter-spacing:.3px;margin-bottom:3px;">⏰ Time-sensitive</div>
      <div class="coach-suggestion" onclick="coachAddBlock('${u.cat}',15,'${safeU}')">
        <span class="coach-s-icon">${emoji}</span>
        <span class="coach-s-text">${shortU}</span>
        <button class="coach-s-btn" style="border-color:${color};color:${color};font-size:8px;" onclick="event.stopPropagation();coachAddBlock('${u.cat}',15,'${safeU}')">Do now</button>
      </div>
      <div style="display:flex;align-items:center;gap:4px;margin-top:2px;padding-left:22px;">
        <button class="coach-s-btn" style="font-size:7px;border-color:var(--dim);color:var(--dim);" onclick="event.stopPropagation();deferToTomorrow(${u.id});generateCoachSuggestions();">→ tmrw</button>
        <button class="coach-s-btn" style="font-size:7px;border-color:var(--dim);color:var(--dim);" onclick="event.stopPropagation();coachSnooze(${u.id});generateCoachSuggestions();">⏰ later today</button>
      </div>
    </div>`;
  }

  // Surface a random undated task from the stash
  if(laterPool.length&&shown<2){
    const rand=laterPool[Math.floor(Math.random()*laterPool.length)];
    const cat=D.cats[rand.cat];
    const emoji=cat?.emoji||'📌';
    const safeR=rand.text.replace(/'/g,"\\'");
    const shortR=rand.text.length>30?rand.text.slice(0,30)+'…':rand.text;
    html+=`<div style="margin-top:4px;font-size:9px;color:var(--dim);display:flex;align-items:center;gap:4px;padding:3px 4px;">
      <span>${emoji}</span>
      <span style="flex:1;">From stash: <em>${shortR}</em></span>
      <button class="coach-s-btn" style="font-size:7px;border-color:var(--dim);color:var(--dim);" onclick="event.stopPropagation();D.tasks.find(x=>x.id===${rand.id}).date=todayStr();save();generateCoachSuggestions();if(typeof renderCalRightTasks==='function')renderCalRightTasks();">→ today</button>
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

// ===== RESCUE WIDGET (bike-hard sprint + breathing combo) =====
let _rescueTimer=null,_rescueRemaining=0,_rescuePhase=null,_rescueLabel='';
function openRescueModal(){
  const m=document.getElementById('rescueModal');if(!m)return;
  document.getElementById('rescueChoices').style.display='';
  document.getElementById('rescueActive').style.display='none';
  m.style.display='flex';
}
function closeRescueModal(){
  const m=document.getElementById('rescueModal');if(!m)return;
  stopRescue();
  m.style.display='none';
}
function _rescueFmt(s){const m=Math.floor(s/60),ss=s%60;return m+':'+(ss<10?'0':'')+ss;}
function _rescueTick(){
  _rescueRemaining--;
  document.getElementById('rescueTime').textContent=_rescueFmt(Math.max(0,_rescueRemaining));
  if(_rescueRemaining<=0){
    clearInterval(_rescueTimer);_rescueTimer=null;
    if(_rescuePhase==='bike-combo'){
      _rescuePhase='breathe-combo';
      _rescueLabel='Breathing reset';
      document.getElementById('rescueLabel').textContent='🌬 Breathing — 2 min';
      document.getElementById('rescueHint').textContent='Slow inhale 4 · hold 4 · exhale 6.';
      _rescueRemaining=120;
      _rescueTimer=setInterval(_rescueTick,1000);
      return;
    }
    // Done — log a win + celebrate
    if(typeof autoAddWin==='function')autoAddWin('Rescue: '+_rescueLabel,todayStr());
    else if(typeof D!=='undefined'){
      D.reflections=D.reflections||{};const dt=todayStr();
      D.reflections[dt]=D.reflections[dt]||{};
      D.reflections[dt].manualWins=D.reflections[dt].manualWins||[];
      D.reflections[dt].manualWins.push('Rescue: '+_rescueLabel);
      if(typeof save==='function')save();
    }
    if(typeof celebrate==='function')celebrate();
    document.getElementById('rescueLabel').textContent='✓ Done — nice work';
    document.getElementById('rescueTime').textContent='0:00';
    document.getElementById('rescueHint').textContent='Now take 30 sec, then start the smallest piece of the task.';
  }
}
function startBikeSprint(mins){
  _rescuePhase='bike-only';
  _rescueLabel=mins+'-min bike sprint';
  _rescueRemaining=mins*60;
  document.getElementById('rescueChoices').style.display='none';
  document.getElementById('rescueActive').style.display='';
  document.getElementById('rescueLabel').textContent='🚴 Bike HARD — '+mins+' min';
  document.getElementById('rescueHint').textContent='Pedal hard the whole time. You can stop when this hits 0.';
  document.getElementById('rescueTime').textContent=_rescueFmt(_rescueRemaining);
  clearInterval(_rescueTimer);
  _rescueTimer=setInterval(_rescueTick,1000);
}
function startBikeBreatheCombo(){
  _rescuePhase='bike-combo';
  _rescueLabel='8-min bike + 2-min breathe combo';
  _rescueRemaining=8*60;
  document.getElementById('rescueChoices').style.display='none';
  document.getElementById('rescueActive').style.display='';
  document.getElementById('rescueLabel').textContent='🚴 Bike HARD — 8 min';
  document.getElementById('rescueHint').textContent='Pedal hard. Breathing reset starts when this hits 0.';
  document.getElementById('rescueTime').textContent=_rescueFmt(_rescueRemaining);
  clearInterval(_rescueTimer);
  _rescueTimer=setInterval(_rescueTick,1000);
}
function stopRescue(){
  clearInterval(_rescueTimer);_rescueTimer=null;
  _rescuePhase=null;_rescueRemaining=0;
  document.getElementById('rescueChoices').style.display='';
  document.getElementById('rescueActive').style.display='none';
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
  save();renderMtgCalendarView();
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
  bccPrompt('Move "'+t.text+'" to which date? (YYYY-MM-DD)',todayStr(),(newDate)=>{
    if(!newDate||!/^\d{4}-\d{2}-\d{2}$/.test(newDate))return;
    t.date=newDate;
    const tl=getTimeline(newDate)||[];
    const alreadyExists=tl.some(s=>s._taskId===t.id);
    if(!alreadyExists){
      let startMin=9*60;
      tl.forEach(s=>{const em=s.end?parseMin(s.end):parseMin(s.t)+30;if(parseMin(s.t)<=startMin&&em>startMin)startMin=em;});
      if(startMin>=22*60)startMin=9*60;
      const endMin=Math.min(24*60,startMin+30);
      tl.push({t:minToTime(startMin),text:'📋 '+t.text,cls:'_task',sm:'Carried over',end:minToTime(endMin),_taskId:t.id,_id:'s'+Date.now()+'_'+Math.floor(Math.random()*9999)});
      tl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
      setTimeline(newDate,tl);
    }
    save();checkOverdueTasks();renderCalTasks();renderAllTasks();renderCalendar();renderMiniCal();updateStats();
  });
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

// ===== WEEKLY REFLECTION =====
// Returns ISO week key like "2026-W21"
function _isoWeekKey(date){
  const d=new Date(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()));
  const dayNum=d.getUTCDay()||7;
  d.setUTCDate(d.getUTCDate()+4-dayNum);
  const yearStart=new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const weekNo=Math.ceil((((d-yearStart)/86400000)+1)/7);
  return d.getUTCFullYear()+'-W'+String(weekNo).padStart(2,'0');
}

function checkWeeklyReflect(){
  const today=new Date();
  const dow=today.getDay(); // 0=Sun, 1=Mon
  if(dow!==0&&dow!==1)return;
  const wk=_isoWeekKey(today);
  // Done already this week?
  if(D.weeklyReflections&&D.weeklyReflections[wk])return;
  // Dismissed twice already this week?
  const dismissKey='wrDismiss_'+wk;
  const dismissCount=parseInt(localStorage.getItem(dismissKey)||'0',10);
  if(dismissCount>=2)return;
  // Don't stack on top of daily motivation or brain dump check-in
  if(document.getElementById('motivModal')?.classList.contains('show')){
    setTimeout(checkWeeklyReflect,4000);
    return;
  }
  if(document.getElementById('bdCheckinModal')){
    setTimeout(checkWeeklyReflect,4000);
    return;
  }
  // Compute the week-ending range to put in the subtitle
  const end=new Date(today);
  // Sunday = end of week. If Monday, the week we're reflecting on ended yesterday.
  if(dow===1)end.setDate(end.getDate()-1);
  const start=new Date(end);start.setDate(end.getDate()-6);
  const fmt=d=>d.toLocaleDateString('en-US',{month:'short',day:'numeric'});
  const sub=document.getElementById('wrSubtitle');
  if(sub)sub.textContent='Week of '+fmt(start)+' – '+fmt(end);
  // Pre-fill if any draft exists
  const draft=(D.weeklyReflections&&D.weeklyReflections['_draft_'+wk])||{};
  document.getElementById('wrProud').value=draft.proud||'';
  document.getElementById('wrGrateful').value=draft.grateful||'';
  document.getElementById('wrCarry').value=draft.carry||'';
  const en=document.getElementById('wrEnergy');
  if(en){en.value=draft.energy||3;en.dispatchEvent(new Event('input'));}
  document.getElementById('weeklyReflectModal').classList.add('show');
}

function closeWeeklyReflect(){
  // Save as draft so input isn't lost on accidental dismiss
  const wk=_isoWeekKey(new Date());
  const proud=document.getElementById('wrProud').value.trim();
  const grateful=document.getElementById('wrGrateful').value.trim();
  const carry=document.getElementById('wrCarry').value.trim();
  if(proud||grateful||carry){
    if(!D.weeklyReflections)D.weeklyReflections={};
    D.weeklyReflections['_draft_'+wk]={proud,grateful,carry,energy:parseInt(document.getElementById('wrEnergy').value,10)||3};
    save();
  }
  const dismissKey='wrDismiss_'+wk;
  localStorage.setItem(dismissKey,String(parseInt(localStorage.getItem(dismissKey)||'0',10)+1));
  document.getElementById('weeklyReflectModal').classList.remove('show');
}

function saveWeeklyReflect(){
  const proud=document.getElementById('wrProud').value.trim();
  const grateful=document.getElementById('wrGrateful').value.trim();
  const carry=document.getElementById('wrCarry').value.trim();
  const energy=parseInt(document.getElementById('wrEnergy').value,10)||3;
  if(!proud&&!grateful&&!carry){
    const t=document.getElementById('saveToast');
    if(t){t.innerHTML='Add at least one thing first 💛';t.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>t.classList.remove('show'),1800);}
    return;
  }
  if(!D.weeklyReflections)D.weeklyReflections={};
  const wk=_isoWeekKey(new Date());
  D.weeklyReflections[wk]={proud,grateful,carry,energy,savedAt:new Date().toISOString()};
  delete D.weeklyReflections['_draft_'+wk];
  save();
  document.getElementById('weeklyReflectModal').classList.remove('show');
  // Auto-add the proud line as a win
  if(proud&&typeof autoAddWin==='function')autoAddWin('🌱 '+proud,todayStr());
  // Celebration
  if(typeof celebrate==='function')celebrate();
  const t=document.getElementById('saveToast');
  if(t){t.innerHTML='🌱 Reflection saved — see you next week';t.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>t.classList.remove('show'),2200);}
}

function openWeeklyReflectHistory(){
  const el=document.getElementById('wrHistoryList');
  if(!el)return;
  const entries=Object.entries(D.weeklyReflections||{})
    .filter(([k])=>!k.startsWith('_draft_'))
    .sort((a,b)=>b[0].localeCompare(a[0]));
  if(!entries.length){
    el.innerHTML='<p style="font-size:11px;color:var(--dim);text-align:center;padding:20px;">No reflections yet. Save your first one above.</p>';
  } else {
    el.innerHTML=entries.map(([wk,e])=>{
      const energyLabels=['heavy','tough','okay','good','glowing'];
      const eLabel=e.energy?energyLabels[e.energy-1]:'';
      return `<div class="wr-history-item">
        <div class="wr-history-week">${wk}${eLabel?' <span class="wr-history-energy">· felt '+eLabel+'</span>':''}</div>
        ${e.proud?`<div class="wr-history-row"><span>🌟</span> ${_escAttrSafe(e.proud)}</div>`:''}
        ${e.grateful?`<div class="wr-history-row"><span>💛</span> ${_escAttrSafe(e.grateful)}</div>`:''}
        ${e.carry?`<div class="wr-history-row"><span>🌱</span> ${_escAttrSafe(e.carry)}</div>`:''}
      </div>`;
    }).join('');
  }
  document.getElementById('weeklyReflectHistoryModal').classList.add('show');
}
function _escAttrSafe(s){return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function closeWeeklyReflectHistory(){document.getElementById('weeklyReflectHistoryModal').classList.remove('show');}

// Manual re-open from Wins tab or anywhere
function openWeeklyReflectManual(){
  const sub=document.getElementById('wrSubtitle');
  if(sub){
    const wk=_isoWeekKey(new Date());
    sub.textContent=wk;
  }
  document.getElementById('weeklyReflectModal').classList.add('show');
}

// ===== DAILY BRAIN DUMP CHECK-IN =====
// Once a day, if the Inbox has unsorted items, show a 30-second sweep modal.
function checkDailyBrainDumpCheckin(){
  const today=todayStr();
  if(localStorage.getItem('bdCheckinDone_'+today))return;
  const inboxItems=D.tasks.filter(t=>t.cat==='braindump'&&!t.done);
  if(!inboxItems.length){localStorage.setItem('bdCheckinDone_'+today,'1');return;}
  // If the daily motivation is up, wait
  if(document.getElementById('motivModal')?.classList.contains('show')){
    setTimeout(checkDailyBrainDumpCheckin,3000);
    return;
  }
  renderBrainDumpCheckin(inboxItems.slice(0,5));
}

function renderBrainDumpCheckin(items){
  const old=document.getElementById('bdCheckinModal');if(old)old.remove();
  const modal=document.createElement('div');
  modal.id='bdCheckinModal';
  modal.className='modal-bg show';
  modal.onclick=function(e){if(e.target===this)dismissBrainDumpCheckin();};
  const catOpts=Object.entries(D.cats).filter(([k])=>k!=='braindump').map(([k,v])=>`<option value="${k}">${v.emoji} ${v.label}</option>`).join('');
  const rows=items.map(t=>`
    <div class="bdci-row" data-id="${t.id}">
      <div class="bdci-text">${_bdEsc(t.text)}</div>
      <div class="bdci-actions">
        <select class="bdci-cat" onchange="bdCheckinSort(${t.id},this.value)">
          <option value="">Move to...</option>${catOpts}
        </select>
        <button class="bdci-btn bdci-remind" onclick="bdCheckinRemind(event,${t.id})" title="Remind me later"><span class="mi" style="font-size:14px;">notifications</span></button>
        <button class="bdci-btn bdci-trash" onclick="bdCheckinTrash(${t.id})" title="Delete">✕</button>
      </div>
    </div>`).join('');
  modal.innerHTML=`
    <div class="modal" style="max-width:520px;">
      <h3 style="display:flex;align-items:center;gap:8px;"><span class="mi" style="color:var(--purple);">psychology</span> Brain Dump Sweep <span class="badge" style="background:rgba(167,139,250,.15);color:var(--purple);">${items.length}</span></h3>
      <p style="font-size:11px;color:var(--dim);margin-bottom:12px;">30-second sort. Move to a category, set a reminder, or toss.</p>
      <div class="bdci-list">${rows}</div>
      <div class="modal-btns" style="margin-top:14px;">
        <button class="t-btn" onclick="snoozeBrainDumpCheckin()">Remind me tonight</button>
        <button class="t-btn primary" onclick="dismissBrainDumpCheckin()">Done</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function _bdEsc(s){return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

function bdCheckinSort(id,catKey){
  if(!catKey)return;
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  t.cat=catKey;
  save();
  const row=document.querySelector(`.bdci-row[data-id="${id}"]`);
  if(row){row.style.transition='opacity .3s';row.style.opacity='0';setTimeout(()=>row.remove(),300);}
  if(typeof renderInbox==='function')renderInbox();
  if(typeof renderSidebarTasks==='function')renderSidebarTasks();
  if(typeof renderLegend==='function')renderLegend();
  if(typeof renderCalRightStash==='function')renderCalRightStash();
}
function bdCheckinTrash(id){
  if(typeof trashTask==='function')trashTask(id);
  const row=document.querySelector(`.bdci-row[data-id="${id}"]`);
  if(row){row.style.transition='opacity .3s';row.style.opacity='0';setTimeout(()=>row.remove(),300);}
  if(typeof renderInbox==='function')renderInbox();
}
function bdCheckinRemind(e,id){
  if(typeof remindBrainDumpItem==='function')remindBrainDumpItem(e,id);
}

function dismissBrainDumpCheckin(){
  const m=document.getElementById('bdCheckinModal');if(m)m.remove();
  localStorage.setItem('bdCheckinDone_'+todayStr(),'1');
}
function snoozeBrainDumpCheckin(){
  const m=document.getElementById('bdCheckinModal');if(m)m.remove();
  const t=new Date();t.setHours(18,0,0,0);
  if(t<=new Date())t.setDate(t.getDate()+1);
  const dateKey=dateStr(t);
  const startMin=t.getHours()*60+t.getMinutes();
  const tl=getTimeline(dateKey)||[];
  if(!tl.some(s=>s._bdSweep)){
    let idx=tl.length;
    for(let j=0;j<tl.length;j++){if(parseMin(tl[j].t)>startMin){idx=j;break;}}
    tl.splice(idx,0,{t:minToTime(startMin),text:'🧠 Brain dump sweep',cls:'reminder',sm:'Sort the Inbox',loc:'',end:minToTime(startMin+15),_id:'bd_sweep_'+Date.now(),_reminder:true,_bdSweep:true});
    setTimeline(dateKey,tl);
    renderCalendar();renderMiniCal();
  }
  localStorage.setItem('bdCheckinDone_'+todayStr(),'1');
  const toast=document.getElementById('saveToast');
  if(toast){toast.innerHTML='⏰ Sweep reminder set for 6 PM';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1800);}
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

// ===== PWA INSTALL + PHONE NOTIFICATIONS =====
let _deferredInstallPrompt=null;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();
  _deferredInstallPrompt=e;
});

function showNotifSetup(){
  const isPWA=window.matchMedia('(display-mode:standalone)').matches||window.navigator.standalone;
  const isIOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
  const hasNotifAPI='Notification' in window;
  const perm=hasNotifAPI?Notification.permission:'unsupported';
  let content='';
  if(isPWA&&perm==='granted'){
    content=`<div style="text-align:center;padding:20px;">
      <div style="font-size:36px;margin-bottom:12px;">🔔✅</div>
      <h3 style="font-size:16px;margin-bottom:8px;">Notifications are ON</h3>
      <p style="font-size:12px;color:var(--dim);margin-bottom:16px;">You'll get reminders 10 min before events, plus a tomorrow preview at 8 PM.</p>
      <div style="font-size:11px;color:var(--dim);background:var(--bg);padding:10px;border-radius:8px;">
        <b>Tip:</b> Make sure Do Not Disturb is off and BCC notifications are allowed in your phone's Settings → Notifications.
      </div>
    </div>`;
  } else if(isPWA&&perm==='denied'){
    content=`<div style="text-align:center;padding:20px;">
      <div style="font-size:36px;margin-bottom:12px;">🔕</div>
      <h3 style="font-size:16px;margin-bottom:8px;">Notifications Blocked</h3>
      <p style="font-size:12px;color:var(--dim);margin-bottom:16px;">You've blocked notifications. To fix:</p>
      <ol style="text-align:left;font-size:12px;color:var(--text);line-height:1.8;padding-left:20px;">
        <li>Open your phone's <b>Settings</b></li>
        <li>Go to <b>Notifications</b> → find <b>BCC</b> (or your browser name)</li>
        <li>Toggle notifications <b>ON</b></li>
        <li>Come back and refresh this page</li>
      </ol>
    </div>`;
  } else if(isPWA&&perm==='default'){
    content=`<div style="text-align:center;padding:20px;">
      <div style="font-size:36px;margin-bottom:12px;">🔔</div>
      <h3 style="font-size:16px;margin-bottom:8px;">Enable Notifications</h3>
      <p style="font-size:12px;color:var(--dim);margin-bottom:16px;">Get reminders before events and a tomorrow preview each evening.</p>
      <button onclick="Notification.requestPermission().then(p=>{updateNotifBtn();showNotifSetup();})" style="background:var(--blue);color:white;border:none;border-radius:10px;padding:12px 28px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;">Turn On Notifications</button>
    </div>`;
  } else if(isIOS){
    content=`<div style="text-align:center;padding:20px;">
      <div style="font-size:36px;margin-bottom:12px;">📱</div>
      <h3 style="font-size:16px;margin-bottom:8px;">Get Notifications on iPhone</h3>
      <p style="font-size:12px;color:var(--dim);margin-bottom:16px;">Add BCC to your Home Screen to enable push notifications:</p>
      <ol style="text-align:left;font-size:12px;color:var(--text);line-height:2;padding-left:20px;">
        <li>Tap the <b>Share</b> button <span style="font-size:14px;">⬆️</span> in Safari</li>
        <li>Scroll down and tap <b>"Add to Home Screen"</b></li>
        <li>Tap <b>Add</b></li>
        <li>Open BCC from your Home Screen</li>
        <li>Tap 🔔 to enable notifications</li>
      </ol>
      <div style="font-size:10px;color:var(--dim);margin-top:12px;background:var(--bg);padding:8px;border-radius:8px;">Requires iOS 16.4+ and Safari</div>
    </div>`;
  } else {
    content=`<div style="text-align:center;padding:20px;">
      <div style="font-size:36px;margin-bottom:12px;">📱</div>
      <h3 style="font-size:16px;margin-bottom:8px;">Get Notifications on Your Phone</h3>
      <p style="font-size:12px;color:var(--dim);margin-bottom:16px;">Install BCC as an app for the best experience:</p>
      ${_deferredInstallPrompt?`<button onclick="_deferredInstallPrompt.prompt();_deferredInstallPrompt.userChoice.then(()=>{_deferredInstallPrompt=null;showNotifSetup();});" style="background:var(--blue);color:white;border:none;border-radius:10px;padding:12px 28px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;margin-bottom:16px;">Install BCC App</button>`:`
      <ol style="text-align:left;font-size:12px;color:var(--text);line-height:2;padding-left:20px;">
        <li>Tap your browser's <b>menu</b> (⋮ or ⋯)</li>
        <li>Tap <b>"Install app"</b> or <b>"Add to Home Screen"</b></li>
        <li>Open BCC from your Home Screen</li>
        <li>Tap 🔔 to enable notifications</li>
      </ol>`}
      ${hasNotifAPI&&perm==='default'?`<div style="margin-top:16px;"><p style="font-size:11px;color:var(--dim);margin-bottom:8px;">Or enable browser notifications now:</p><button onclick="Notification.requestPermission().then(p=>{updateNotifBtn();showNotifSetup();})" style="background:var(--card);color:var(--blue);border:1px solid var(--blue);border-radius:10px;padding:10px 24px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;">Enable Browser Notifications</button></div>`:''}
    </div>`;
  }
  let modal=document.getElementById('notifSetupModal');
  if(!modal){
    modal=document.createElement('div');
    modal.id='notifSetupModal';
    modal.style.cssText='position:fixed;inset:0;z-index:300;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);';
    modal.onclick=e=>{if(e.target===modal)modal.remove();};
    document.body.appendChild(modal);
  }
  modal.innerHTML=`<div style="background:var(--card);border:1px solid var(--border);border-radius:16px;max-width:400px;width:90vw;max-height:85vh;overflow-y:auto;box-shadow:0 16px 48px rgba(0,0,0,.5);">
    <div style="display:flex;justify-content:flex-end;padding:8px 12px 0;"><button onclick="document.getElementById('notifSetupModal').remove()" style="background:none;border:none;color:var(--dim);font-size:18px;cursor:pointer;">✕</button></div>
    ${content}
  </div>`;
}

// ===== GLOBAL SEARCH =====
function toggleSearch(){
  const wrap=document.getElementById('searchInputWrap');
  const inp=document.getElementById('globalSearchInput');
  if(wrap.style.display==='none'){wrap.style.display='flex';inp.focus();}
  else closeSearch();
}
function closeSearch(){
  document.getElementById('searchInputWrap').style.display='none';
  document.getElementById('searchResults').style.display='none';
  document.getElementById('globalSearchInput').value='';
}
function handleSearchKey(e){
  if(e.key==='Escape')closeSearch();
  if(e.key==='Enter'){
    const first=document.querySelector('.sr-item');
    if(first)first.click();
  }
}
function runGlobalSearch(q){
  const res=document.getElementById('searchResults');
  if(!q||q.length<2){res.style.display='none';return;}
  const lq=q.toLowerCase();
  const results=[];
  // Search calendar blocks
  if(D.days){
    Object.entries(D.days).forEach(([dt,slots])=>{
      if(!Array.isArray(slots))return;
      slots.forEach(s=>{
        if((s.text&&s.text.toLowerCase().includes(lq))||(s.sm&&s.sm.toLowerCase().includes(lq))||(s.loc&&s.loc.toLowerCase().includes(lq))){
          results.push({type:'event',text:s.text,date:dt,icon:'📅'});
        }
      });
    });
  }
  // Search tasks
  if(D.tasks){
    D.tasks.forEach(t=>{
      if(t.text&&t.text.toLowerCase().includes(lq)){
        results.push({type:'task',text:t.text,date:t.date||'',icon:t.done?'✅':'☐'});
      }
    });
  }
  // Search meeting notes
  if(D.meetings){
    D.meetings.forEach(m=>{
      if((m.title&&m.title.toLowerCase().includes(lq))||(m.notes&&m.notes.toLowerCase().includes(lq))){
        results.push({type:'meeting',text:m.title||'Meeting',date:m.date||'',icon:'📝'});
      }
    });
  }
  // Search brain dump
  if(D.brainDump&&D.brainDump.toLowerCase().includes(lq)){
    results.push({type:'note',text:'Brain Dump',date:'',icon:'🧠'});
  }
  // Search parking lot
  if(D.parkingItems){
    D.parkingItems.forEach(p=>{
      if(p.text&&p.text.toLowerCase().includes(lq)){
        results.push({type:'note',text:p.text,date:p.added||'',icon:'🅿️'});
      }
    });
  }
  if(!results.length){res.innerHTML='<div class="sr-empty">No results</div>';res.style.display='block';return;}
  // Group and render (max 12 results)
  const grouped={};
  results.slice(0,12).forEach(r=>{
    if(!grouped[r.type])grouped[r.type]=[];
    grouped[r.type].push(r);
  });
  const labels={event:'Events',task:'Tasks',meeting:'Meetings',note:'Notes'};
  let html='';
  Object.entries(grouped).forEach(([type,items])=>{
    html+=`<div class="sr-group"><div class="sr-group-title">${labels[type]||type}</div>`;
    items.forEach(item=>{
      const dateDisp=item.date?item.date.slice(5):'';
      html+=`<div class="sr-item" onclick="searchGoTo('${type}','${item.date}')"><span class="sr-icon">${item.icon}</span><span>${item.text.length>40?item.text.slice(0,40)+'…':item.text}</span><span class="sr-date">${dateDisp}</span></div>`;
    });
    html+=`</div>`;
  });
  res.innerHTML=html;
  res.style.display='block';
}
function searchGoTo(type,dt){
  closeSearch();
  if(type==='event'&&dt){D.selectedDate=dt;renderAll();document.querySelector('[data-tab="calendar"]')?.click();}
  else if(type==='task'){document.querySelector('[data-tab="tasks"]')?.click();}
  else if(type==='meeting'){document.querySelector('[data-tab="meetings"]')?.click();}
  else if(type==='note'){document.querySelector('[data-tab="tasks"]')?.click();}
}
document.addEventListener('keydown',e=>{
  if((e.metaKey||e.ctrlKey)&&e.key==='k'){e.preventDefault();toggleSearch();}
  // Cmd+Z / Ctrl+Z → undo last save (skip when typing in inputs/textareas/contenteditable)
  if((e.metaKey||e.ctrlKey)&&!e.shiftKey&&(e.key==='z'||e.key==='Z')){
    const t=e.target;
    const tag=t&&t.tagName;
    const inField=tag==='INPUT'||tag==='TEXTAREA'||tag==='SELECT'||(t&&t.isContentEditable);
    if(!inField){
      e.preventDefault();
      if(typeof undo==='function')undo();
    }
  }
});

// Open the full block-add popover from the ⊕ icon — uses today's date and rounds to the next 15-min slot.
function openAddBlockPopover(e){
  if(e&&e.stopPropagation)e.stopPropagation();
  if(typeof openDvPopover!=='function')return;
  const now=new Date();
  const mins=now.getHours()*60+Math.ceil(now.getMinutes()/15)*15;
  const dt=todayStr();
  // openDvPopover signature: (e, dt, hr, mins, editIdx)
  openDvPopover(e||{clientX:window.innerWidth/2,clientY:120,stopPropagation:()=>{}},dt,Math.floor(mins/60),mins,null);
}

// ===== REMIND LATER TODAY =====
// Drops an amber-colored "⏰ <thought>" block onto the calendar at the chosen time.
// If the time is already past, schedules for tomorrow at that time.
function quickRemindLater(){
  const inp=document.getElementById('rlInput');
  const text=(inp?.value||'').trim();
  if(!text){if(inp)inp.focus();return;}
  // Find which chip is active. If none, default to 30m.
  let targetDate=new Date();
  const activeChip=document.querySelector('.rl-chip.rl-active');
  const tInput=document.getElementById('rlTime');
  if(tInput&&tInput.value){
    const [hh,mm]=tInput.value.split(':').map(Number);
    targetDate.setHours(hh,mm,0,0);
  } else if(activeChip&&activeChip.dataset.rlAt){
    const [hh,mm]=activeChip.dataset.rlAt.split(':').map(Number);
    targetDate.setHours(hh,mm,0,0);
  } else {
    const mins=activeChip?parseInt(activeChip.dataset.rlMins,10):30;
    targetDate=new Date(Date.now()+mins*60000);
  }
  if(targetDate.getTime()<=Date.now()+60000){
    // Time already passed — push to tomorrow same time
    targetDate.setDate(targetDate.getDate()+1);
  }
  const dateKey=dateStr(targetDate);
  const startMin=targetDate.getHours()*60+targetDate.getMinutes();
  const tl=getTimeline(dateKey)||[];
  let idx=tl.length;
  for(let j=0;j<tl.length;j++){if(parseMin(tl[j].t)>startMin){idx=j;break;}}
  const slot={
    t:minToTime(startMin),
    text:'⏰ '+text,
    cls:'reminder',
    sm:'Reminder',
    loc:'',
    end:minToTime(Math.min(24*60-1,startMin+15)),
    _id:'rem_'+Date.now(),
    _reminder:true
  };
  tl.splice(idx,0,slot);
  setTimeline(dateKey,tl);
  // Also surface via the existing remind-pill / toast system so a notification fires.
  if(!D.tasks)D.tasks=[];
  D.tasks.push({
    id:(D.nextId||100)+Math.floor(Math.random()*9999),
    text:text,
    cat:'reminder',
    pri:'med',
    done:false,
    date:'',
    remindAt:targetDate.toISOString(),
    _fromRemindLater:true
  });
  D.nextId=(D.nextId||100)+1;
  save();
  if(inp)inp.value='';
  // Clear chip selection
  document.querySelectorAll('.rl-chip.rl-active').forEach(c=>c.classList.remove('rl-active'));
  if(tInput)tInput.value='';
  renderCalendar();renderMiniCal();renderRemindLaterPending();
  const isTomorrow=dateKey!==todayStr();
  const label=targetDate.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+(isTomorrow?' tomorrow':'');
  const toast=document.getElementById('saveToast');
  if(toast){toast.innerHTML='⏰ Reminder set · '+label;toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1800);}
}

function renderRemindLaterPending(){
  const el=document.getElementById('rlPending');if(!el)return;
  const now=Date.now();
  const todayKey=todayStr();
  const tl=getTimeline(todayKey)||[];
  const upcoming=tl.filter(s=>s._reminder&&parseMin(s.t)*60000+dateObj(todayKey).getTime()>now)
    .sort((a,b)=>parseMin(a.t)-parseMin(b.t));
  if(!upcoming.length){el.innerHTML='';return;}
  el.innerHTML='<div class="rl-pending-title">Next today</div>'+upcoming.slice(0,3).map(s=>{
    return `<div class="rl-pending-row"><span class="rl-pending-t">${s.t}</span><span class="rl-pending-text">${(s.text||'').replace(/^⏰\s*/,'')}</span></div>`;
  }).join('');
}

// Wire up chip selection
document.addEventListener('click',function(e){
  const chip=e.target.closest('.rl-chip');
  if(!chip)return;
  if(chip.classList.contains('rl-time'))return;
  document.querySelectorAll('.rl-chip.rl-active').forEach(c=>c.classList.remove('rl-active'));
  chip.classList.add('rl-active');
  const tInput=document.getElementById('rlTime');
  if(tInput)tInput.value='';
});
// Custom time picker clears chip selection
document.addEventListener('input',function(e){
  if(e.target&&e.target.id==='rlTime'){
    document.querySelectorAll('.rl-chip.rl-active').forEach(c=>c.classList.remove('rl-active'));
  }
});

// ===== TRANSCRIPT UPLOAD / SUMMARIZE / Q&A =====
let _transcriptParsed=null;

function loadTranscriptFile(ev){
  const file=ev.target.files&&ev.target.files[0];if(!file)return;
  const reader=new FileReader();
  reader.onload=function(e){
    document.getElementById('mtgTranscriptInput').value=e.target.result;
    _transcriptParsed=null;
    const toast=document.getElementById('saveToast');
    if(toast){toast.innerHTML='📎 Loaded '+file.name;toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1500);}
  };
  reader.readAsText(file);
  ev.target.value='';
}

function clearTranscript(){
  document.getElementById('mtgTranscriptInput').value='';
  document.getElementById('mtgTranscriptResult').innerHTML='';
  const q=document.getElementById('mtgTranscriptQ');if(q)q.value='';
  _transcriptParsed=null;
}

function parseTranscript(raw){
  if(!raw||!raw.trim())return {lines:[],rawText:''};
  const text=raw.replace(/\r\n?/g,'\n');
  const lines=[];
  // VTT/SRT detection
  const isVtt=/^WEBVTT/m.test(text)||/-->/.test(text);
  if(isVtt){
    const blocks=text.split(/\n\s*\n/);
    blocks.forEach(b=>{
      const ls=b.split('\n').map(l=>l.trim()).filter(Boolean);
      if(!ls.length)return;
      // Drop cue numbers (pure digits) and timestamp lines
      const content=ls.filter(l=>!/^\d+$/.test(l)&&!/-->/.test(l)&&!/^WEBVTT/i.test(l));
      const joined=content.join(' ').trim();
      if(joined){
        const sm=joined.match(/^([A-Z][\w .'-]{0,30}):\s*(.+)$/);
        if(sm)lines.push({speaker:sm[1].trim(),text:sm[2].trim()});
        else lines.push({speaker:'',text:joined});
      }
    });
  } else {
    text.split(/\n+/).forEach(l=>{
      const trimmed=l.trim();if(!trimmed)return;
      const sm=trimmed.match(/^([A-Z][\w .'-]{0,30}):\s*(.+)$/);
      if(sm)lines.push({speaker:sm[1].trim(),text:sm[2].trim()});
      else lines.push({speaker:'',text:trimmed});
    });
  }
  return {lines,rawText:text};
}

function ensureTranscriptParsed(){
  const raw=document.getElementById('mtgTranscriptInput').value;
  if(!raw||!raw.trim()){alert('Paste or upload a transcript first.');return null;}
  if(!_transcriptParsed||_transcriptParsed.rawText!==raw){
    _transcriptParsed=parseTranscript(raw);
  }
  return _transcriptParsed;
}

const _STOPWORDS=new Set(['the','a','an','and','or','but','if','then','of','to','in','on','at','for','with','is','are','was','were','be','been','being','it','this','that','these','those','i','you','we','they','he','she','my','our','your','their','his','her','as','by','from','about','into','out','up','down','so','not','no','yes','do','does','did','have','has','had','will','would','can','could','should','may','might','just','really','very','also','like','well','um','uh','okay','ok','yeah','right','kind','sort','lot','think','know','said','say','get','go','going','one','two','some','any','what','when','where','why','how','than','because','there','here','them','us']);

function _tok(s){return (s||'').toLowerCase().split(/[^a-z0-9]+/).filter(w=>w&&w.length>2&&!_STOPWORDS.has(w));}

function summarizeTranscript(parsed,mode){
  const ACTION_RE=/\b(i'?ll|we'?ll|let'?s|need to|gonna|going to|will|action item|todo|to do|by (mon|tue|wed|thu|fri|sat|sun|next week|tomorrow|eod|end of (week|day)))\b/i;
  const DECISION_RE=/\b(decided|agreed|resolved|final answer|let'?s go with|we'?re (going|gonna) (to|with)|the plan is)\b/i;
  const actions=[];
  const decisions=[];
  const highlights=[];
  parsed.lines.forEach(l=>{
    const txt=l.text;
    if(txt.length<3)return;
    const prefix=l.speaker?`**${l.speaker}:** `:'';
    if(ACTION_RE.test(txt))actions.push('- [ ] '+prefix+txt);
    else if(DECISION_RE.test(txt))decisions.push('- '+prefix+txt);
    else if(txt.length>60)highlights.push('- '+prefix+txt);
  });
  // Topic extraction: word frequency
  const freq={};
  parsed.lines.forEach(l=>_tok(l.text).forEach(w=>{freq[w]=(freq[w]||0)+1;}));
  const topics=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,8).map(e=>e[0]);
  let md='';
  if(mode==='actions'){
    md='### Action Items\n'+(actions.length?actions.join('\n'):'- (none detected — try summarize full)');
  } else {
    md='### Summary\n';
    if(topics.length)md+='**Topics:** '+topics.join(', ')+'\n\n';
    md+='### Action Items\n'+(actions.length?actions.join('\n'):'- (none detected)')+'\n\n';
    md+='### Decisions\n'+(decisions.length?decisions.join('\n'):'- (none detected)')+'\n\n';
    md+='### Key Points\n'+(highlights.slice(0,10).join('\n')||'- (transcript too short)');
  }
  return md;
}

function runTranscriptSummary(mode){
  const parsed=ensureTranscriptParsed();if(!parsed)return;
  const md=summarizeTranscript(parsed,mode);
  const notes=document.getElementById('mtgNotes');
  const linkSel=document.getElementById('mtgLinkBlock');
  if(linkSel&&linkSel.value){
    // Pre-fill title/date from linked meeting
    try{
      const [dt,idxStr]=linkSel.value.split('|');
      const idx=parseInt(idxStr,10);
      const tl=getTimeline(dt)||[];
      const slot=tl[idx];
      if(slot){
        if(!document.getElementById('mtgTitle').value)document.getElementById('mtgTitle').value=slot.text+' — Notes';
        document.getElementById('mtgDate').value=dt;
      }
    }catch(e){}
  } else if(!document.getElementById('mtgDate').value){
    document.getElementById('mtgDate').value=todayStr();
  }
  const existing=notes.value.trim();
  notes.value=(existing?existing+'\n\n':'')+md;
  saveMeetingNotes();
  const body=document.getElementById('mtgComposeBody');
  if(body)body.style.display='block';
  const toast=document.getElementById('saveToast');
  if(toast){toast.innerHTML='✓ Summary added to notes';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1800);}
}

function askTranscript(){
  const parsed=ensureTranscriptParsed();if(!parsed)return;
  const q=document.getElementById('mtgTranscriptQ').value.trim();
  if(!q){document.getElementById('mtgTranscriptResult').innerHTML='<div class="mt-empty">Type a question above.</div>';return;}
  const qTokens=_tok(q);
  if(!qTokens.length){document.getElementById('mtgTranscriptResult').innerHTML='<div class="mt-empty">Question needs more keywords.</div>';return;}
  const scored=parsed.lines.map((l,i)=>{
    const tokens=new Set(_tok(l.text));
    let score=0;qTokens.forEach(t=>{if(tokens.has(t))score++;});
    // Bonus for exact phrase
    if(l.text.toLowerCase().includes(q.toLowerCase()))score+=5;
    return {i,score,line:l};
  }).filter(x=>x.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
  if(!scored.length){
    document.getElementById('mtgTranscriptResult').innerHTML='<div class="mt-empty">No matching passages found. Try different keywords, or use "Copy for ChatGPT" for a deeper answer.</div>';
    return;
  }
  let html='<div class="mt-result-title">Top matches:</div>';
  scored.forEach(s=>{
    const before=parsed.lines[s.i-1];
    const after=parsed.lines[s.i+1];
    html+='<div class="mt-result-block">';
    if(before)html+='<div class="mt-result-context">'+(before.speaker?'<b>'+before.speaker+':</b> ':'')+_esc(before.text)+'</div>';
    html+='<div class="mt-result-hit">'+(s.line.speaker?'<b>'+s.line.speaker+':</b> ':'')+_highlightQuery(s.line.text,qTokens)+'</div>';
    if(after)html+='<div class="mt-result-context">'+(after.speaker?'<b>'+after.speaker+':</b> ':'')+_esc(after.text)+'</div>';
    html+='</div>';
  });
  document.getElementById('mtgTranscriptResult').innerHTML=html;
}

function _esc(s){return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function _highlightQuery(text,tokens){
  let out=_esc(text);
  tokens.forEach(t=>{
    const re=new RegExp('\\b('+t.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')\\b','gi');
    out=out.replace(re,'<mark>$1</mark>');
  });
  return out;
}

function copyTranscriptForAI(){
  const raw=document.getElementById('mtgTranscriptInput').value.trim();
  if(!raw){alert('Paste or upload a transcript first.');return;}
  const q=document.getElementById('mtgTranscriptQ').value.trim();
  const linkSel=document.getElementById('mtgLinkBlock');
  let header='Here is a meeting transcript.';
  if(linkSel&&linkSel.value){
    try{
      const [dt,idxStr]=linkSel.value.split('|');
      const tl=getTimeline(dt)||[];
      const slot=tl[parseInt(idxStr,10)];
      if(slot)header='Here is a transcript from the meeting "'+slot.text+'" on '+dt+(slot.t?' at '+slot.t:'')+'.';
    }catch(e){}
  }
  const prompt=header+'\n\n'+raw+'\n\n'+(q?'Question: '+q:'Please summarize the meeting, list action items with owners, and call out any decisions.');
  navigator.clipboard.writeText(prompt).then(()=>{
    const toast=document.getElementById('saveToast');
    if(toast){toast.innerHTML='✓ Copied — paste into ChatGPT or Claude';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),2000);}
  });
}

function populateLinkBlockOptions(){
  const sel=document.getElementById('mtgLinkBlock');if(!sel)return;
  const today=todayStr();
  const tmrw=dateStr(new Date(Date.now()+86400000));
  let html='<option value="">— link to a meeting (optional) —</option>';
  [today,tmrw].forEach(dt=>{
    const blocks=(typeof getMeetingBlocks==='function')?getMeetingBlocks(dt):[];
    if(!blocks.length)return;
    const label=dt===today?'Today':'Tomorrow';
    html+='<optgroup label="'+label+'">';
    blocks.forEach(b=>{
      const t=b.t||'';const text=(b.text||'').replace(/"/g,'');
      html+='<option value="'+dt+'|'+b._dayIdx+'">'+t+' — '+text.slice(0,40)+'</option>';
    });
    html+='</optgroup>';
  });
  sel.innerHTML=html;
}

// Re-populate the link dropdown whenever the transcript section is opened
document.addEventListener('toggle',function(e){
  if(e.target&&e.target.id==='mtgTranscriptBox'&&e.target.open){
    populateLinkBlockOptions();
  }
},true);

// ===== CLOCK-OUT CALCULATOR =====
// Given a clock-in time + shift length, computes clock-out. Also shows a reference table.
function _fmtTime(hh,mm){
  const ampm=hh<12?'AM':'PM';
  const h12=hh%12===0?12:hh%12;
  return h12+':'+String(mm).padStart(2,'0')+' '+ampm;
}
function _coShiftMinutes(){
  const sel=document.getElementById('coShift');
  if(!sel)return 510;
  if(sel.value==='custom'){
    const c=parseInt(document.getElementById('coCustom').value,10);
    return isNaN(c)?510:Math.max(15,Math.min(1440,c));
  }
  return parseInt(sel.value,10)||510;
}
function setClockInNow(){
  const inp=document.getElementById('coClockIn');if(!inp)return;
  const now=new Date();
  inp.value=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0');
  renderClockOut();
}
function renderClockOut(){
  const customWrap=document.getElementById('coCustom');
  const sel=document.getElementById('coShift');
  if(customWrap&&sel)customWrap.style.display=sel.value==='custom'?'inline-block':'none';
  const shiftMin=_coShiftMinutes();
  // Result panel
  const resEl=document.getElementById('coResult');
  const inp=document.getElementById('coClockIn');
  if(resEl){
    const v=inp&&inp.value;
    if(!v){
      resEl.innerHTML='<div class="co-result-empty">Pick a clock-in time above</div>';
    } else {
      const [hh,mm]=v.split(':').map(Number);
      const totalIn=hh*60+mm;
      const totalOut=totalIn+shiftMin;
      const outH=Math.floor(totalOut/60);
      const outM=totalOut%60;
      const outDayLabel=outH>=24?' tomorrow':'';
      const oH=outH%24;
      const hrs=(shiftMin/60).toFixed(shiftMin%60===0?0:1);
      resEl.innerHTML=`
        <div class="co-result-card">
          <div class="co-result-row">
            <span class="co-result-label">Clock in</span>
            <span class="co-result-time co-in">${_fmtTime(hh,mm)}</span>
          </div>
          <div class="co-result-arrow">↓ ${hrs} hrs</div>
          <div class="co-result-row">
            <span class="co-result-label">Clock out</span>
            <span class="co-result-time co-out">${_fmtTime(oH,outM)}${outDayLabel}</span>
          </div>
        </div>`;
    }
  }
  // Reference table
  const tEl=document.getElementById('coTable');
  if(tEl){
    const startHour=6,endHour=10;
    const curIn=inp&&inp.value;
    let curMin=null;
    if(curIn){const [hh,mm]=curIn.split(':').map(Number);curMin=hh*60+mm;}
    let rows='<div class="co-table-header"><span>Clock In</span><span>Clock Out</span></div>';
    for(let h=startHour;h<=endHour;h++){
      for(let m=0;m<60;m+=15){
        if(h===endHour&&m>0)break;
        const totalMin=h*60+m;
        const outMin=totalMin+shiftMin;
        const oH=Math.floor(outMin/60)%24;
        const oM=outMin%60;
        const hl=curMin!=null&&Math.abs(totalMin-curMin)<8;
        rows+=`<div class="co-table-row${hl?' co-table-hl':''}">
          <span class="co-table-in">${_fmtTime(h,m)}${hl?' <span class="co-table-badge">you</span>':''}</span>
          <span class="co-table-arrow">→</span>
          <span class="co-table-out">${_fmtTime(oH,oM)}</span>
        </div>`;
      }
    }
    tEl.innerHTML=rows;
  }
}
// Initial render after init() runs
setTimeout(()=>{if(document.getElementById('coShift'))renderClockOut();},300);

// ===== WORK LOG =====
// D.workLog = [{id, text, project, impact, starred, ts, sourceTaskId?, sourceBlockId?}]
let _wlFilter='all';
let _wlProjectFilter='';
let _wlView='list';

function _wlEnsureStore(){
  if(!D.workLog)D.workLog=[];
  if(!D.workLogProjects)D.workLogProjects=[];
}

function addWorkLogEntry(opts){
  _wlEnsureStore();
  let text,project,impact,starred,sourceTaskId,sourceBlockId,ts;
  if(opts&&typeof opts==='object'){
    text=(opts.text||'').trim();
    project=(opts.project||'').trim();
    impact=opts.impact||'med';
    starred=!!opts.starred;
    sourceTaskId=opts.sourceTaskId||null;
    sourceBlockId=opts.sourceBlockId||null;
    ts=opts.ts||new Date().toISOString();
  } else {
    text=document.getElementById('wlInput').value.trim();
    project=document.getElementById('wlProject').value.trim();
    impact=document.getElementById('wlImpact').value;
    starred=document.getElementById('wlStarBtn').classList.contains('wl-star-on');
    ts=new Date().toISOString();
  }
  if(!text){
    const inp=document.getElementById('wlInput');if(inp)inp.focus();
    return;
  }
  const entry={
    id:Date.now()+Math.floor(Math.random()*1000),
    text,
    project:project||'',
    impact:impact||'med',
    starred:!!starred,
    ts,
  };
  if(sourceTaskId)entry.sourceTaskId=sourceTaskId;
  if(sourceBlockId)entry.sourceBlockId=sourceBlockId;
  D.workLog.unshift(entry);
  // Track project name for autocomplete
  if(project&&D.workLogProjects.indexOf(project)===-1){
    D.workLogProjects.unshift(project);
    if(D.workLogProjects.length>40)D.workLogProjects.length=40;
  }
  save();
  // Reset compose
  if(!opts){
    document.getElementById('wlInput').value='';
    document.getElementById('wlStarBtn').classList.remove('wl-star-on');
    document.getElementById('wlImpact').value='med';
    // Keep project — usually you'll log multiple in a row for the same one
  }
  renderWorkLog();
  const toast=document.getElementById('saveToast');
  if(toast){toast.innerHTML='✓ Logged'+(starred?' ⭐':'');toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1500);}
}

function setWlFilter(f,btn){
  _wlFilter=f;
  document.querySelectorAll('.wl-filter-btn').forEach(b=>b.classList.toggle('active',b===btn));
  renderWorkLog();
}
function setWlProjectFilter(p){_wlProjectFilter=p;renderWorkLog();}
function setWlView(v,btn){
  _wlView=v;
  document.querySelectorAll('.wl-view-btn').forEach(b=>b.classList.toggle('active',b===btn));
  renderWorkLog();
}

function _wlFilteredEntries(){
  _wlEnsureStore();
  const now=Date.now();
  let entries=D.workLog.slice();
  if(_wlFilter==='starred')entries=entries.filter(e=>e.starred);
  else if(_wlFilter==='high')entries=entries.filter(e=>e.impact==='high');
  else if(_wlFilter==='month')entries=entries.filter(e=>now-new Date(e.ts).getTime()<=30*86400000);
  else if(_wlFilter==='quarter')entries=entries.filter(e=>now-new Date(e.ts).getTime()<=90*86400000);
  if(_wlProjectFilter)entries=entries.filter(e=>e.project===_wlProjectFilter);
  return entries;
}

function renderWorkLog(){
  _wlEnsureStore();
  // Populate the project datalist + project filter dropdown
  const dl=document.getElementById('wlProjectList');
  if(dl)dl.innerHTML=D.workLogProjects.map(p=>'<option value="'+_wlEscAttr(p)+'">').join('');
  const filterSel=document.getElementById('wlProjectFilter');
  if(filterSel){
    const cur=_wlProjectFilter;
    filterSel.innerHTML='<option value="">All projects</option>'+D.workLogProjects.map(p=>`<option value="${_wlEscAttr(p)}"${p===cur?' selected':''}>${_wlEscAttr(p)}</option>`).join('');
  }

  const list=document.getElementById('wlList');
  const empty=document.getElementById('wlEmpty');
  if(!list||!empty)return;

  const entries=_wlFilteredEntries();
  if(!entries.length){
    list.innerHTML='';
    empty.style.display='';
    empty.innerHTML=D.workLog.length
      ?'<p style="font-size:12px;color:var(--dim);text-align:center;padding:30px;">No entries match these filters. Try clearing them.</p>'
      :`<div style="text-align:center;padding:36px 20px;color:var(--dim);">
        <span class="mi" style="font-size:36px;opacity:.5;">work_history</span>
        <p style="font-size:13px;margin-top:12px;font-weight:600;color:var(--text);">Start your work log</p>
        <p style="font-size:11px;margin-top:6px;max-width:380px;margin-left:auto;margin-right:auto;line-height:1.6;">Log small wins as they happen — "got buy-in from Dr. Smith on VDA scenarios", "fixed the sim crash from last week". Tag a project to group them. Hit ⭐ on review-worthy entries. When perf review season rolls around, click "Build review writeup" to get a polished prompt for ChatGPT.</p>
      </div>`;
    return;
  }
  empty.style.display='none';

  if(_wlView==='grouped'){
    const groups={};
    entries.forEach(e=>{
      const p=e.project||'(no project)';
      if(!groups[p])groups[p]=[];
      groups[p].push(e);
    });
    list.innerHTML=Object.entries(groups).sort((a,b)=>b[1].length-a[1].length).map(([proj,items])=>{
      const starredCount=items.filter(i=>i.starred).length;
      return `<div class="wl-group">
        <div class="wl-group-header">
          <span class="mi" style="font-size:14px;color:var(--teal);">folder</span>
          <span class="wl-group-name">${_wlEscAttr(proj)}</span>
          <span class="wl-group-count">${items.length}</span>
          ${starredCount?`<span class="wl-group-starred">⭐ ${starredCount}</span>`:''}
        </div>
        <div class="wl-group-items">${items.map(_wlEntryHtml).join('')}</div>
      </div>`;
    }).join('');
  } else {
    list.innerHTML=entries.map(_wlEntryHtml).join('');
  }
}

function _wlEntryHtml(e){
  const ts=new Date(e.ts);
  const now=Date.now();
  const ageMs=now-ts.getTime();
  const ageDays=Math.floor(ageMs/86400000);
  const dateLabel=ageDays===0?'Today':ageDays===1?'Yesterday':ageDays<7?ts.toLocaleDateString([],{weekday:'short'}):ts.toLocaleDateString([],{month:'short',day:'numeric'});
  const timeLabel=ts.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
  const impactLabel=e.impact==='high'?'<span class="wl-impact-pill wl-impact-high">high</span>':e.impact==='low'?'<span class="wl-impact-pill wl-impact-low">small</span>':'';
  return `<div class="wl-entry ${e.starred?'wl-entry-starred':''}" data-id="${e.id}">
    <button class="wl-entry-star" onclick="toggleWlStar(${e.id})" title="${e.starred?'Unstar':'Star — review-worthy'}">${e.starred?'⭐':'☆'}</button>
    <div class="wl-entry-body">
      <div class="wl-entry-text">${_wlEscAttr(e.text)}</div>
      <div class="wl-entry-meta">
        ${e.project?`<span class="wl-entry-project">${_wlEscAttr(e.project)}</span>`:''}
        ${impactLabel}
        <span class="wl-entry-date">${dateLabel} · ${timeLabel}</span>
      </div>
    </div>
    <div class="wl-entry-actions">
      <button class="wl-entry-btn" onclick="editWlEntry(${e.id})" title="Edit"><span class="mi" style="font-size:13px;">edit</span></button>
      <button class="wl-entry-btn wl-entry-del" onclick="deleteWlEntry(${e.id})" title="Delete"><span class="mi" style="font-size:13px;">close</span></button>
    </div>
  </div>`;
}

function _wlEscAttr(s){return (s||'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

function toggleWlStar(id){
  _wlEnsureStore();
  const e=D.workLog.find(x=>x.id===id);if(!e)return;
  e.starred=!e.starred;
  save();renderWorkLog();
}
function deleteWlEntry(id){
  if(!confirm('Delete this work log entry?'))return;
  _wlEnsureStore();
  D.workLog=D.workLog.filter(e=>e.id!==id);
  save();renderWorkLog();
}
function editWlEntry(id){
  _wlEnsureStore();
  const e=D.workLog.find(x=>x.id===id);if(!e)return;
  bccPrompt('Edit entry:',e.text,(txt)=>{
    if(txt==null)return;
    if(!txt.trim()){deleteWlEntry(id);return;}
    e.text=txt.trim();
    save();renderWorkLog();
  });
}

// One-click "log this" from any task or block
function logTaskAsWork(taskId){
  const t=D.tasks.find(x=>x.id===taskId);if(!t)return;
  const cat=D.cats[t.cat];
  addWorkLogEntry({
    text:t.text,
    project:(cat&&cat.label!=='Brain Dump')?cat.label:'',
    impact:'med',
    starred:false,
    sourceTaskId:taskId
  });
}
function logBlockAsWork(dt,slotId){
  const tl=getTimeline(dt);if(!tl)return;
  const idx=tl.findIndex(s=>s._id===slotId);
  if(idx<0)return;
  const slot=tl[idx];
  const cat=D.cats[slot.cls];
  addWorkLogEntry({
    text:slot.text.replace(/^[⏰📅📍]\s*/,''),
    project:(cat&&cat.label!=='Brain Dump'&&cat.label!=='Reminder')?cat.label:'',
    impact:'med',
    starred:false,
    sourceBlockId:slotId,
    ts:new Date(dt+'T'+(slot.t||'9:00 AM')).toISOString()
  });
}

// Review writeup picker
function openWlReviewPicker(){
  _wlEnsureStore();
  if(!D.workLog.length){
    alert('No work log entries yet. Log a few first!');
    return;
  }
  document.getElementById('wlReviewModal').classList.add('show');
  updateWlReviewPreview();
  ['wlRevStarred','wlRevHighImpact','wlRevGroupProj','wlRevRange'].forEach(id=>{
    const el=document.getElementById(id);
    if(el&&!el._bound){el.addEventListener('change',updateWlReviewPreview);el._bound=true;}
  });
}
function closeWlReviewPicker(){document.getElementById('wlReviewModal').classList.remove('show');}

function _wlReviewBuildEntries(){
  _wlEnsureStore();
  const useStarred=document.getElementById('wlRevStarred').checked;
  const useHigh=document.getElementById('wlRevHighImpact').checked;
  const range=document.getElementById('wlRevRange').value;
  const cutoff=range==='all'?0:(Date.now()-parseInt(range,10)*86400000);
  return D.workLog.filter(e=>{
    if(cutoff&&new Date(e.ts).getTime()<cutoff)return false;
    if(useStarred&&!useHigh)return e.starred;
    if(!useStarred&&useHigh)return e.impact==='high';
    if(useStarred&&useHigh)return e.starred||e.impact==='high';
    return true; // neither box ticked → include all in range
  }).sort((a,b)=>new Date(b.ts)-new Date(a.ts));
}

function updateWlReviewPreview(){
  const entries=_wlReviewBuildEntries();
  const previewEl=document.getElementById('wlReviewPreview');
  if(!previewEl)return;
  if(!entries.length){
    previewEl.innerHTML='<div class="wl-review-empty">No entries match these filters.</div>';
    return;
  }
  const group=document.getElementById('wlRevGroupProj').checked;
  let html=`<div class="wl-review-count">${entries.length} entr${entries.length===1?'y':'ies'} selected</div>`;
  if(group){
    const groups={};
    entries.forEach(e=>{const p=e.project||'(no project)';if(!groups[p])groups[p]=[];groups[p].push(e);});
    html+=Object.entries(groups).map(([proj,items])=>`
      <div class="wl-review-group">
        <div class="wl-review-group-name">${_wlEscAttr(proj)} <span class="wl-review-group-n">${items.length}</span></div>
        ${items.slice(0,5).map(e=>`<div class="wl-review-item">${e.starred?'⭐ ':''}${_wlEscAttr(e.text)}</div>`).join('')}
        ${items.length>5?`<div class="wl-review-more">+ ${items.length-5} more</div>`:''}
      </div>`).join('');
  } else {
    html+=entries.slice(0,15).map(e=>`<div class="wl-review-item">${e.starred?'⭐ ':''}${e.project?'<b>['+_wlEscAttr(e.project)+']</b> ':''}${_wlEscAttr(e.text)}</div>`).join('');
    if(entries.length>15)html+=`<div class="wl-review-more">+ ${entries.length-15} more</div>`;
  }
  previewEl.innerHTML=html;
}

function copyWlReviewPrompt(){
  const entries=_wlReviewBuildEntries();
  if(!entries.length){alert('No entries match your filters.');return;}
  const group=document.getElementById('wlRevGroupProj').checked;
  const today=new Date().toLocaleDateString('en-US',{month:'long',year:'numeric'});
  let body='';
  if(group){
    const groups={};
    entries.forEach(e=>{const p=e.project||'(uncategorized)';if(!groups[p])groups[p]=[];groups[p].push(e);});
    Object.entries(groups).forEach(([proj,items])=>{
      body+='\n## '+proj+'\n';
      items.forEach(e=>{
        const dt=new Date(e.ts).toLocaleDateString([],{month:'short',day:'numeric'});
        body+=(e.starred?'⭐ ':'- ')+'['+dt+'] '+e.text+(e.impact==='high'?' (high impact)':'')+'\n';
      });
    });
  } else {
    entries.forEach(e=>{
      const dt=new Date(e.ts).toLocaleDateString([],{month:'short',day:'numeric'});
      body+=(e.starred?'⭐ ':'- ')+'['+dt+'] '+(e.project?'['+e.project+'] ':'')+e.text+(e.impact==='high'?' (high impact)':'')+'\n';
    });
  }
  const prompt=`I'm preparing for a performance review as of ${today}. Below is my raw work log — small things I've logged as they happened. Please help me:

1. Group these into 3–5 major themes / projects, prioritizing the ones with the most depth or starred (⭐) entries.
2. For each theme, write a STAR-format accomplishment (Situation, Task, Action, Result) that I could use in a self-review or talking points.
3. Surface 2–3 standout wins that I should emphasize most.
4. Flag any patterns I might be undervaluing (e.g. leadership, cross-functional collaboration, mentoring, risk reduction).
5. Suggest 1–2 areas of growth I might want to mention based on what's NOT in the log.

Keep the tone confident but not boastful. Use my actual phrasing where possible — don't invent details.

---

WORK LOG:
${body}`;
  navigator.clipboard.writeText(prompt).then(()=>{
    const toast=document.getElementById('saveToast');
    if(toast){toast.innerHTML='✓ Copied — paste into ChatGPT or Claude';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),2200);}
    closeWlReviewPicker();
  });
}

init();

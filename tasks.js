// ===== CALENDAR TASK PANEL =====
function renderTasksForDate(containerId,dt){
  const el=document.getElementById(containerId);
  if(!el)return;
  const tasks=D.tasks.filter(t=>t.date===dt&&t.cat!=='braindump'&&!isSnoozed(t)).sort((a,b)=>{if(a.done!==b.done)return a.done?1:-1;const p={high:0,med:1,low:2};return p[a.pri]-p[b.pri];});
  const done=tasks.filter(t=>t.done).length;
  const collapsed=el.dataset.collapsed==='true';

  let html=`<div class="cal-tasks-bar" onclick="toggleCalTasks('${containerId}')">
    <span class="cal-tasks-title">TODAY'S TASKS</span>
    <span class="cal-tasks-badge">${done}/${tasks.length}</span>
    <span class="cal-tasks-chevron">${collapsed?'&#9654;':'&#9662;'}</span>
  </div>`;

  if(!collapsed){
    html+=`<div class="cal-tasks-list">`;
    html+=tasks.map(t=>{
      const cat=D.cats[t.cat];
      return `<div class="task-item ${t.done?'done':''}" oncontextmenu="event.preventDefault();openTaskCtx(event,${t.id});">
        <div class="p-dot ${t.pri}"></div>
        <input type="checkbox" ${t.done?'checked':''} onchange="togTask(${t.id},this)">
        <div class="t-label" style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${cat?cat.emoji:''}${t.effort&&EFFORT_TAGS[t.effort]?'<span class="task-effort-badge">'+EFFORT_TAGS[t.effort].emoji+'</span>':''}${t.diff&&typeof DIFF_TAGS!=='undefined'&&DIFF_TAGS[t.diff]?'<span class="task-effort-badge" title="'+DIFF_TAGS[t.diff].label+'">'+DIFF_TAGS[t.diff].emoji+'</span>':''} ${t.text}</div>
        <div class="task-defer-btns">
          <button class="defer-btn" onclick="openRemindPicker(event,${t.id})" title="Remind later">⏰</button>
          <button class="defer-btn" onclick="deferToTomorrow(${t.id})" title="Move to tomorrow">→ tmrw</button>
          <button class="defer-btn later" onclick="deferToLater(${t.id})" title="Stash for later">→ stash</button>
        </div>
      </div>`;
    }).join('')||'<p style="font-size:10px;color:var(--dim);text-align:center;padding:8px;">No tasks today</p>';
    html+=`<div class="add-inline">
      <input type="text" placeholder="+ add task..." onkeydown="if(event.key==='Enter')addCalTask(this,'${dt}')">
    </div>`;
    html+=`</div>`;
  }
  el.innerHTML=html;
}
function toggleCalTasks(containerId){
  const el=document.getElementById(containerId);
  if(!el)return;
  el.dataset.collapsed=el.dataset.collapsed==='true'?'false':'true';
  const dt=el.dataset.taskDate||todayStr();
  renderTasksForDate(containerId,dt);
}
function addCalTask(inp,dt){
  const text=inp.value.trim();if(!text)return;
  D.tasks.push({id:D.nextId++,text,cat:'personal',pri:'med',done:false,date:dt});
  inp.value='';save();renderCalTasks();updateStats();
}
function renderCalTasks(){
  renderCalRightTasks();
  renderCalRightCompleted();
  renderCalRightStash();
  renderQuickWins();
  if(typeof renderCalRightWinsDone==='function')renderCalRightWinsDone();
}

// ===== SIDEBAR TASKS (delegates to calendar panels) =====
function renderSidebarTasks(){renderCalTasks();}
function addSidebarTask(inp){
  const text=inp.value.trim();if(!text)return;
  D.tasks.push({id:D.nextId++,text,cat:'personal',pri:'med',done:false,date:todayStr()});
  inp.value='';save();renderCalTasks();updateStats();
}
function togTask(id,el){const t=D.tasks.find(x=>x.id===id);if(!t)return;if(el&&el.checked!==undefined){t.done=el.checked;}else{t.done=!t.done;}if(t.done){t.doneAt=Date.now();celebrate();autoAddWin(t.text,t.date||todayStr());if(typeof maybeLogWorkWin==='function')maybeLogWorkWin(t.text,t.cat,{sourceTaskId:t.id});}else{delete t.doneAt;}save();setTimeout(()=>{renderCalendar();renderCalTasks();renderAllTasks();updateStats();if(typeof renderCalRightWinsDone==='function')renderCalRightWinsDone();if(typeof renderCalRightTrash==='function')renderCalRightTrash();},300);}
function moveTaskDate(id,dir){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  const d=new Date((t.date||todayStr())+'T12:00:00');
  d.setDate(d.getDate()+dir);
  t.date=d.toISOString().split('T')[0];
  save();renderCalTasks();renderAllTasks();renderCalendar();updateStats();
}
function deferToTomorrow(id){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  const d=new Date(todayStr()+'T12:00:00');
  d.setDate(d.getDate()+1);
  t.date=d.toISOString().split('T')[0];
  save();renderCalTasks();renderAllTasks();renderCalendar();updateStats();
  const toast=document.getElementById('saveToast');if(toast){toast.innerHTML='→ Moved to tomorrow';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1200);}
}
function deferToLater(id){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  t.date='';
  save();renderCalTasks();renderAllTasks();renderCalendar();updateStats();
  const toast=document.getElementById('saveToast');if(toast){toast.innerHTML='📌 Moved to Stash';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1200);}
}
const _coachSnoozed={};
function coachSnooze(id){
  _coachSnoozed[id]=Date.now()+2*60*60*1000;
  const toast=document.getElementById('saveToast');if(toast){toast.innerHTML='⏰ Snoozed 2 hrs';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1200);}
}
function isSnoozed(t){return (_coachSnoozed[t.id]&&Date.now()<_coachSnoozed[t.id])||(t.remindAt&&new Date(t.remindAt)>new Date());}
function laterToToday(id){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  t.date=todayStr();
  save();renderCalTasks();renderAllTasks();renderCalendar();updateStats();
  const toast=document.getElementById('saveToast');if(toast){toast.innerHTML='✓ Pulled to today';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1200);}
}

// ===== QUICK ADD =====
let qaMode='task';
function setQaMode(mode){
  qaMode=mode;
  const el=id=>document.getElementById(id);
  el('qaModeTask')?.classList.toggle('active',mode==='task');
  el('qaModeBlock')?.classList.toggle('active',mode==='block');
  if(el('qaPriWrap'))el('qaPriWrap').style.display=mode==='task'?'':'none';
  if(el('qaTimeWrap'))el('qaTimeWrap').style.display=mode==='block'?'':'none';
  if(el('qaInput'))el('qaInput').placeholder=mode==='task'?'+ Add a task...':'+ Add a calendar block...';
}
function quickAdd(){
  const inp=document.getElementById('qaInput');if(!inp)return;
  const text=inp.value.trim();if(!text)return;
  const catEl=document.getElementById('qaCat');if(!catEl)return;
  const cat=catEl.value;
  if(qaMode==='task'){
    const pri=document.getElementById('qaPri').value;
    D.tasks.push({id:D.nextId++,text,cat,pri,done:false,date:todayStr()});
    document.getElementById('qaInput').value='';save();renderSidebarTasks();updateStats();renderLegend();
  } else {
    // Add as a calendar block to today's timeline
    const dt=D.selectedDate||todayStr();
    let t=document.getElementById('qaTime').value.trim();
    if(!t){const now=new Date(),m=now.getHours()*60+now.getMinutes();t=minToTime(Math.round(m/15)*15);}
    const tl=getTimeline(dt)||[];
    const newMin=parseMin(t);
    let idx=tl.length;
    for(let j=0;j<tl.length;j++){if(parseMin(tl[j].t)>newMin){idx=j;break;}}
    tl.splice(idx,0,{t,text,cls:cat,sm:''});
    setTimeline(dt,tl);
    document.getElementById('qaInput').value='';document.getElementById('qaTime').value='';
    renderCalendar();renderLegend();
  }
}

// ===== ALL TASKS (SIMPLIFIED: Today + Parked/Later) =====
let _slCollapsed=JSON.parse(localStorage.getItem('swimlaneCollapsed')||'{}');
let _doneCollapsed=localStorage.getItem('doneCollapsed')==='true';
let _todayDoneCollapsed=localStorage.getItem('todayDoneCollapsed')==='true';
let _parkedCollapsed=localStorage.getItem('parkedCollapsed')!=='false';
let _todayShowAll=false;

function renderAllTasks(){
  if(window.innerWidth<=900){renderMobileTasks();return;}
  const priOrd={high:0,med:1,low:2};
  const today=todayStr();

  // --- TODAY section: tasks dated today or overdue, active first then done ---
  const todayActive=D.tasks.filter(t=>!t.done&&t.cat!=='braindump'&&t.date&&t.date<=today&&!isSnoozed(t)).sort((a,b)=>{
    if(a.date!==b.date){if(a.date<today&&b.date>=today)return -1;if(b.date<today&&a.date>=today)return 1;}
    return priOrd[a.pri]-priOrd[b.pri];
  });
  const todayDone=D.tasks.filter(t=>t.done&&t.cat!=='braindump'&&t.date&&t.date<=today);

  const todayEl=document.getElementById('tasksSimpleToday');
  if(todayEl){
    const totalActive=todayActive.length;
    const totalDone=todayDone.length;
    let h=`<div class="simple-tasks-section">
      <div class="simple-tasks-header">
        <span class="mi" style="font-size:20px;color:var(--blue);">today</span>
        <span class="simple-tasks-title">Today</span>
        <span class="badge">${totalActive}</span>
        ${totalDone?`<span style="font-size:10px;color:var(--green);margin-left:4px;">✓ ${totalDone} done</span>`:''}
      </div>`;

    if(!todayActive.length&&!todayDone.length){
      h+=`<div class="simple-tasks-empty">No tasks for today — add one above!</div>`;
    } else {
      const SHOW_LIMIT=5;
      const visibleTasks=_todayShowAll?todayActive:todayActive.slice(0,SHOW_LIMIT);
      visibleTasks.forEach(t=>{
        const cat=D.cats[t.cat];
        h+=`<div class="simple-task-row" draggable="true" ondragstart="event.dataTransfer.setData('text/plain','task:'+${t.id});event.dataTransfer.effectAllowed='move';this.style.opacity='.3';" ondragend="this.style.opacity='1';" oncontextmenu="event.preventDefault();openTaskCtx(event,${t.id});" style="cursor:grab;">
          <div class="p-dot ${t.pri}"></div>
          <input type="checkbox" onchange="togTask(${t.id},this)">
          <div class="simple-task-content">
            <span class="simple-task-text">${cat?cat.emoji:''} ${t.text}</span>
          </div>
          <div class="simple-task-actions">
            <button class="defer-btn" onclick="openRemindPicker(event,${t.id})" title="Remind later">⏰</button>
            <button class="defer-btn" onclick="deferToTomorrow(${t.id})" title="Tomorrow">→ tmrw</button>
            <button class="defer-btn later" onclick="deferToLater(${t.id})" title="Park for later">→ later</button>
          </div>
        </div>`;
      });
      if(!_todayShowAll&&todayActive.length>SHOW_LIMIT){
        h+=`<button class="simple-show-more" onclick="_todayShowAll=true;renderAllTasks();">show ${todayActive.length-SHOW_LIMIT} more...</button>`;
      } else if(_todayShowAll&&todayActive.length>SHOW_LIMIT){
        h+=`<button class="simple-show-more" onclick="_todayShowAll=false;renderAllTasks();">show less</button>`;
      }

      // Completed tasks greyed out inline
      if(todayDone.length){
        const sortedDoneDisplay=todayDone.sort((a,b)=>(b.doneAt||0)-(a.doneAt||0));
        h+=`<div class="simple-done-toggle" onclick="toggleTodayDone()" style="background:rgba(52,211,153,.08);border-radius:8px;padding:6px 8px;margin-top:4px;">
          <span class="mi" style="font-size:14px;color:var(--green);">check_circle</span>
          <span style="color:var(--green);font-weight:600;">${sortedDoneDisplay.length} completed</span>
          <span class="swimlane-chevron">${_todayDoneCollapsed?'▸':'▾'}</span>
        </div>`;
        if(!_todayDoneCollapsed){
          sortedDoneDisplay.forEach(t=>{
            const cat=D.cats[t.cat];
            h+=`<div class="simple-task-row done" style="background:rgba(52,211,153,.06);border-color:rgba(52,211,153,.2);">
              <input type="checkbox" checked onchange="togTask(${t.id},this)">
              <span class="simple-task-text" style="color:var(--green);opacity:.8;">${cat?cat.emoji:''} ${t.text}</span>
              <button class="task-act-btn" onclick="delTask(${t.id})" style="opacity:.4;">x</button>
            </div>`;
          });
        }
      }
    }
    h+=`</div>`;
    todayEl.innerHTML=h;
  }

  // --- SNOOZED section ---
  const snoozedTasks=D.tasks.filter(t=>!t.done&&t.cat!=='braindump'&&isSnoozed(t));
  if(snoozedTasks.length){
    let sh=`<div class="simple-tasks-section" style="margin-top:16px;">
      <div class="simple-tasks-header" style="cursor:pointer;" onclick="toggleSnoozedView()">
        <span class="mi" style="font-size:20px;color:var(--pink);">snooze</span>
        <span class="simple-tasks-title">Snoozed</span>
        <span class="badge" style="background:rgba(244,114,182,.15);color:var(--pink);">${snoozedTasks.length}</span>
        <span class="swimlane-chevron">${_snoozedCollapsed?'▸':'▾'}</span>
      </div>`;
    if(!_snoozedCollapsed){
      snoozedTasks.forEach(t=>{
        const cat=D.cats[t.cat];
        const remindDate=new Date(t.remindAt);
        const label=remindDate.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
        sh+=`<div class="simple-task-row" draggable="true" ondragstart="event.dataTransfer.setData('text/plain','task:'+${t.id});event.dataTransfer.effectAllowed='move';this.style.opacity='.3';" ondragend="this.style.opacity='.6';" style="opacity:.6;cursor:grab;">
          <div class="p-dot ${t.pri}"></div>
          <div class="simple-task-content">
            <span class="simple-task-text">${cat?cat.emoji:''} ${t.text}</span>
            <span style="font-size:9px;color:var(--pink);">⏰ ${label}</span>
          </div>
          <div class="simple-task-actions">
            <button class="defer-btn" onclick="unsnooze(${t.id})" title="Bring back now">↑ now</button>
          </div>
        </div>`;
      });
    }
    sh+=`</div>`;
    if(todayEl){todayEl.innerHTML+=sh;}
  }

  // --- PARKED / LATER section: undated tasks + parking items + backlog ---
  const laterTasks=D.tasks.filter(t=>!t.done&&t.cat!=='braindump'&&(!t.date||t.date>today)&&!isSnoozed(t)).sort((a,b)=>(b.id||0)-(a.id||0));
  const laterDone=D.tasks.filter(t=>t.done&&t.cat!=='braindump'&&(!t.date||t.date>today));
  const parked=D.parkingItems||[];
  const backlog=D.backlog||[];

  const parkedEl=document.getElementById('tasksSimpleParked');
  if(parkedEl){
    const totalParked=laterTasks.length+parked.length+backlog.length;
    let h=`<div class="simple-tasks-section parked-section">
      <div class="simple-tasks-header" onclick="toggleParkedSection()" style="cursor:pointer;">
        <span class="mi" style="font-size:20px;color:var(--purple);">schedule</span>
        <span class="simple-tasks-title">Parked / Later</span>
        <span class="badge" style="background:rgba(192,132,252,.15);color:#c084fc;">${totalParked}</span>
        <span class="swimlane-chevron" style="margin-left:auto;">${_parkedCollapsed?'▸':'▾'}</span>
      </div>`;

    if(_parkedCollapsed){
      h+=`</div>`;parkedEl.innerHTML=h;return;
    }
    if(!totalParked&&!laterDone.length){
      h+=`<div class="simple-tasks-empty">Nothing parked — your mind is clear!</div>`;
    } else {
      // Later tasks (no date or future date)
      laterTasks.forEach(t=>{
        const cat=D.cats[t.cat];
        const dl=t.date?new Date(t.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}):'';
        h+=`<div class="simple-task-row" draggable="true" ondragstart="event.dataTransfer.setData('text/plain','task:'+${t.id});event.dataTransfer.effectAllowed='move';this.style.opacity='.3';" ondragend="this.style.opacity='1';" oncontextmenu="event.preventDefault();openTaskCtx(event,${t.id});" style="cursor:grab;">
          <div class="p-dot ${t.pri}"></div>
          <input type="checkbox" onchange="togTask(${t.id},this)">
          <div class="simple-task-content">
            <span class="simple-task-text">${cat?cat.emoji:''} ${t.text}</span>
            ${dl?`<span style="font-size:9px;color:var(--dim);">${dl}</span>`:''}
          </div>
          <div class="simple-task-actions">
            <button class="defer-btn" onclick="openRemindPicker(event,${t.id})" title="Remind later">⏰</button>
            <button class="defer-btn" onclick="laterToToday(${t.id})" title="Pull to today">→ today</button>
            <button class="task-act-btn" onclick="openEdit(${t.id})">edit</button>
          </div>
        </div>`;
      });

      // Parked thoughts
      parked.forEach(p=>{
        h+=`<div class="simple-task-row parked-thought">
          <span style="font-size:13px;flex-shrink:0;">📌</span>
          <div class="simple-task-content">
            <span class="simple-task-text">${p.text}</span>
            <span style="font-size:9px;color:var(--dim);">parked ${p.added||''}</span>
          </div>
          <div class="simple-task-actions">
            <button class="defer-btn" onclick="promoteParkingItem(${p.id})" title="Make a task">→ task</button>
            <button class="task-act-btn" style="color:var(--green);" onclick="parkingItemDone(${p.id});renderAllTasks();renderCalTasks();" title="Done">✓</button>
            <button class="task-act-btn" onclick="removeParkingItem(${p.id});renderAllTasks();renderCalTasks();">x</button>
          </div>
        </div>`;
      });

      // Backlog
      backlog.forEach(b=>{
        const cat=D.cats[b.cat];
        h+=`<div class="simple-task-row parked-thought" style="opacity:.6;">
          <span style="font-size:13px;flex-shrink:0;">${cat?.emoji||'📌'}</span>
          <div class="simple-task-content">
            <span class="simple-task-text">${b.text}</span>
            <span style="font-size:9px;color:var(--dim);">dropped ${b.droppedOn||''}</span>
          </div>
          <div class="simple-task-actions">
            <button class="defer-btn" onclick="restoreFromBacklog(${b.id})" title="Restore">↑ restore</button>
            <button class="task-act-btn" onclick="removeFromBacklog(${b.id});renderAllTasks();">x</button>
          </div>
        </div>`;
      });

      // Completed later tasks
      if(laterDone.length){
        h+=`<div class="simple-done-toggle" onclick="toggleLaterDone()">
          <span class="mi" style="font-size:14px;color:var(--green);">check_circle</span>
          <span>${laterDone.length} completed</span>
          <span class="swimlane-chevron">${_doneCollapsed?'▸':'▾'}</span>
        </div>`;
        if(!_doneCollapsed){
          laterDone.forEach(t=>{
            const cat=D.cats[t.cat];
            h+=`<div class="simple-task-row done">
              <input type="checkbox" checked onchange="togTask(${t.id},this)">
              <span class="simple-task-text">${cat?cat.emoji:''} ${t.text}</span>
              <button class="task-act-btn" onclick="delTask(${t.id})" style="opacity:.4;">x</button>
            </div>`;
          });
        }
      }
    }
    h+=`</div>`;
    parkedEl.innerHTML=h;
  }
}
function toggleTodayDone(){
  _todayDoneCollapsed=!_todayDoneCollapsed;
  localStorage.setItem('todayDoneCollapsed',_todayDoneCollapsed);
  renderAllTasks();
}
function toggleLaterDone(){
  _doneCollapsed=!_doneCollapsed;
  localStorage.setItem('doneCollapsed',_doneCollapsed);
  renderAllTasks();
}
function toggleParkedSection(){
  _parkedCollapsed=!_parkedCollapsed;
  localStorage.setItem('parkedCollapsed',_parkedCollapsed);
  renderAllTasks();
}

// ===== DRAG TASKS BETWEEN CATEGORIES =====
let _dragTaskId=null;
function taskDragStart(e,id){
  _dragTaskId=id;
  e.dataTransfer.effectAllowed='move';
  e.dataTransfer.setData('text/plain',id);
  e.target.classList.add('dragging');
}
function taskDragEnd(e){
  _dragTaskId=null;
  e.target.classList.remove('dragging');
}
function taskDropOnCat(e,catKey){
  e.preventDefault();
  if(!_dragTaskId)return;
  const t=D.tasks.find(x=>x.id===_dragTaskId);
  if(!t)return;
  t.cat=catKey;
  save();renderAllTasks();renderCalTasks();
  const toast=document.getElementById('saveToast');
  if(toast){const cat=D.cats[catKey];toast.innerHTML=`✓ Moved to ${cat?.emoji||''} ${cat?.label||catKey}`;toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1500);}
}

// ===== TASK → CALENDAR BLOCK =====
function taskToCalBlock(id){
  const t=D.tasks.find(x=>x.id===id);
  if(!t)return;
  if(!t.date){alert('Set a due date first (use edit or arrows).');return;}
  const dt=t.date;
  const cat=D.cats[t.cat];
  const now=new Date();
  let startMin=Math.ceil((now.getHours()*60+now.getMinutes())/15)*15;
  if(dt!==todayStr())startMin=9*60; // default 9am for future dates
  const tl=getTimeline(dt)||[];
  // Check if already on calendar
  const alreadyExists=tl.some(s=>s.text===t.text||s._taskId===t.id);
  if(alreadyExists){
    const toast=document.getElementById('saveToast');
    if(toast){toast.innerHTML='Already on calendar for that day';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1500);}
    return;
  }
  const endMin=Math.min(24*60,startMin+30);
  let idx=tl.length;
  for(let j=0;j<tl.length;j++){if(parseMin(tl[j].t)>startMin){idx=j;break;}}
  tl.splice(idx,0,{t:minToTime(startMin),text:t.text,cls:'_todo',sm:'',end:minToTime(endMin),_taskId:t.id,_id:'s'+Date.now()+'_'+Math.floor(Math.random()*9999)});
  setTimeline(dt,tl);
  renderCalendar();renderMiniCal();
  const toast=document.getElementById('saveToast');
  if(toast){toast.innerHTML=`📅 Added "${t.text}" to ${dt===todayStr()?'today':new Date(dt+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})}`;toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),2000);}
}

function toggleSwimlane(ck){
  _slCollapsed[ck]=!_slCollapsed[ck];
  localStorage.setItem('swimlaneCollapsed',JSON.stringify(_slCollapsed));
  renderAllTasks();
}
function toggleDoneSection(){
  _doneCollapsed=!_doneCollapsed;
  localStorage.setItem('doneCollapsed',_doneCollapsed);
  renderAllTasks();
}
function swimlaneQuickAdd(){
  const inp=document.getElementById('swimlaneAddInput');
  const text=inp.value.trim();if(!text)return;
  const cat=document.getElementById('swimlaneAddCat')?.value||'personal';
  const pri=document.getElementById('swimlaneAddPri')?.value||'med';
  D.tasks.push({id:D.nextId++,text,cat,pri,done:false,date:todayStr()});
  inp.value='';save();renderAllTasks();renderCalTasks();updateStats();
}
function swimlaneCatAdd(ck){
  if(_slCollapsed[ck]){_slCollapsed[ck]=false;localStorage.setItem('swimlaneCollapsed',JSON.stringify(_slCollapsed));renderAllTasks();setTimeout(()=>swimlaneCatAdd(ck),50);return;}
  const lane=document.querySelector(`.swimlane[data-cat="${ck}"] .swimlane-body`);
  if(!lane)return;
  if(lane.querySelector('.swimlane-inline-add'))return;
  const div=document.createElement('div');div.className='swimlane-inline-add';
  div.innerHTML=`<input type="text" placeholder="New task..." onkeydown="if(event.key==='Enter'){swimlaneInlineCommit('${ck}',this);}if(event.key==='Escape'){this.parentElement.remove();}" onblur="setTimeout(()=>this.parentElement?.remove(),150)">`;
  lane.insertBefore(div,lane.firstChild);div.querySelector('input').focus();
}
function swimlaneInlineCommit(ck,inp){
  const text=inp.value.trim();if(!text)return;
  D.tasks.push({id:D.nextId++,text,cat:ck,pri:'med',done:false,date:todayStr()});
  save();renderAllTasks();renderCalTasks();updateStats();
}
function delTask(id){trashTask(id);renderSidebarTasks();renderAllTasks();updateStats();}

// ===== TASK VIEW TOGGLE (List vs Buckets) =====
let _taskView='list';
function switchTaskView(view,btn){
  _taskView=view;
  document.querySelectorAll('#p-tasks .tasks-subtab').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  document.getElementById('tasksActivePane').style.display=view==='list'?'':'none';
  document.getElementById('tasksBucketPane').style.display=view==='buckets'?'':'none';
  if(view==='buckets')renderBucketView();
}

function renderBucketView(){
  const el=document.getElementById('tasksBucketPane');if(!el)return;
  const today=todayStr();
  const allActive=D.tasks.filter(t=>!t.done&&t.cat!=='braindump'&&!isSnoozed(t));
  const buckets={
    quick:{label:'⚡ Easy but annoying',desc:'Quick wins you keep putting off',color:'var(--green)',tasks:[]},
    focus:{label:'🧠 Longer / Focus',desc:'Need a real block of time',color:'var(--purple)',tasks:[]},
    call:{label:'📞 Call-based',desc:'During business hours only',color:'var(--blue)',tasks:[]},
    errand:{label:'🚗 Errands',desc:'Out-of-house tasks',color:'var(--teal)',tasks:[]},
    low:{label:'😴 Low energy ok',desc:'Good for wind-down time',color:'var(--dim)',tasks:[]},
    untagged:{label:'📋 Unsorted',desc:'Drag here or tag with an effort type',color:'var(--text)',tasks:[]}
  };
  allActive.forEach(t=>{
    const key=t.effort&&buckets[t.effort]?t.effort:'untagged';
    buckets[key].tasks.push(t);
  });
  let html='';
  Object.entries(buckets).forEach(([key,bucket])=>{
    const count=bucket.tasks.length;
    html+=`<div class="effort-bucket" data-bucket="${key}" ondragover="event.preventDefault();this.classList.add('drag-over');" ondragleave="this.classList.remove('drag-over');" ondrop="event.preventDefault();this.classList.remove('drag-over');dropOnBucket(event,'${key}');" style="margin-bottom:16px;border:1px solid var(--border);border-radius:10px;padding:12px;border-left:3px solid ${bucket.color};">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:13px;font-weight:700;">${bucket.label}</span>
        <span class="badge" style="font-size:10px;">${count}</span>
        <span style="font-size:10px;color:var(--dim);margin-left:auto;">${bucket.desc}</span>
      </div>`;
    if(!count){
      html+=`<div style="font-size:11px;color:var(--dim);padding:8px;text-align:center;">No tasks</div>`;
    } else {
      bucket.tasks.forEach(t=>{
        const cat=D.cats[t.cat];
        const dateLabel=!t.date?'later':t.date<=today?'today':new Date(t.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'});
        html+=`<div class="simple-task-row" draggable="true" ondragstart="bucketDragStart(event,${t.id})" style="cursor:grab;" oncontextmenu="event.preventDefault();openTaskCtx(event,${t.id});">
          <div class="p-dot ${t.pri}"></div>
          <input type="checkbox" onchange="togTask(${t.id},this);renderBucketView();">
          <div class="simple-task-content" style="flex:1;">
            <span class="simple-task-text">${cat?cat.emoji:''} ${t.text}</span>
            <span style="font-size:9px;color:var(--dim);">${dateLabel}</span>
          </div>
          <div class="simple-task-actions">
            <button class="defer-btn" onclick="openRemindPicker(event,${t.id})" title="Remind later">⏰</button>
            <button class="defer-btn" onclick="deferToTomorrow(${t.id});renderBucketView();">→ tmrw</button>
            <button class="defer-btn later" onclick="deferToLater(${t.id});renderBucketView();">→ later</button>
          </div>
        </div>`;
      });
    }
    html+=`</div>`;
  });
  el.innerHTML=html;
}

let _bucketDragId=null;
function bucketDragStart(e,id){
  _bucketDragId=id;
  e.dataTransfer.effectAllowed='move';
  e.dataTransfer.setData('text/plain',id);
  e.target.style.opacity='.5';
  setTimeout(()=>{if(e.target)e.target.style.opacity='';},300);
}
function dropOnBucket(e,bucketKey){
  const id=_bucketDragId||parseInt(e.dataTransfer.getData('text/plain'));
  if(!id)return;
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  t.effort=bucketKey==='untagged'?'':bucketKey;
  save();renderBucketView();renderAllTasks();renderCalTasks();
  const toast=document.getElementById('saveToast');
  const bucket=EFFORT_TAGS[bucketKey];
  if(toast){toast.innerHTML=`✓ Tagged as ${bucket?bucket.emoji+' '+bucket.label:'Unsorted'}`;toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1500);}
  _bucketDragId=null;
}

// ===== REMIND LATER =====
let _snoozedCollapsed=true;
function toggleSnoozedView(){_snoozedCollapsed=!_snoozedCollapsed;renderAllTasks();}

function openRemindPicker(e,id){
  e.stopPropagation();
  const old=document.getElementById('remindPickerMenu');if(old)old.remove();
  const menu=document.createElement('div');
  menu.id='remindPickerMenu';
  menu.style.cssText=`position:fixed;left:${Math.min(e.clientX,window.innerWidth-160)}px;top:${Math.min(e.clientY,window.innerHeight-200)}px;z-index:200;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:4px;box-shadow:0 8px 24px rgba(0,0,0,.4);min-width:150px;`;
  const now=new Date();const hr=now.getHours();
  let btns=`<div style="padding:4px 10px;font-size:10px;font-weight:600;color:var(--dim);border-bottom:1px solid var(--border);margin-bottom:2px;">Remind me...</div>`;
  btns+=`<button class="wk-ctx-btn" onclick="document.getElementById('remindPickerMenu').remove();setReminder(${id},60);"><span style="font-size:12px;margin-right:4px;">⏰</span> In 1 hour</button>`;
  btns+=`<button class="wk-ctx-btn" onclick="document.getElementById('remindPickerMenu').remove();setReminder(${id},120);"><span style="font-size:12px;margin-right:4px;">⏰</span> In 2 hours</button>`;
  if(hr<18)btns+=`<button class="wk-ctx-btn" onclick="document.getElementById('remindPickerMenu').remove();setReminderTonight(${id});"><span style="font-size:12px;margin-right:4px;">🌆</span> Tonight 6 PM</button>`;
  btns+=`<button class="wk-ctx-btn" onclick="document.getElementById('remindPickerMenu').remove();setReminderTomorrow9(${id});"><span style="font-size:12px;margin-right:4px;">🌅</span> Tomorrow 9 AM</button>`;
  btns+=`<button class="wk-ctx-btn" onclick="document.getElementById('remindPickerMenu').remove();remindCustom(${id});"><span class="mi" style="font-size:14px;">event</span> Pick date...</button>`;
  menu.innerHTML=btns;
  document.body.appendChild(menu);
  const dismiss=(ev)=>{if(!menu.contains(ev.target)){menu.remove();document.removeEventListener('mousedown',dismiss);}};
  setTimeout(()=>document.addEventListener('mousedown',dismiss),10);
}

function setReminder(id,mins){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  t.remindAt=new Date(Date.now()+mins*60000).toISOString();
  save();renderCalTasks();renderAllTasks();updateStats();
  if(typeof renderBucketView==='function'&&_taskView==='buckets')renderBucketView();
  const label=mins<60?mins+'m':Math.round(mins/60)+'h';
  const toast=document.getElementById('saveToast');if(toast){toast.innerHTML=`⏰ Reminder set · ${label}`;toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1500);}
}

function setReminderTonight(id){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  const tonight=new Date();tonight.setHours(18,0,0,0);
  if(tonight<=new Date())tonight.setDate(tonight.getDate()+1);
  t.remindAt=tonight.toISOString();
  save();renderCalTasks();renderAllTasks();updateStats();
  const toast=document.getElementById('saveToast');if(toast){toast.innerHTML='⏰ Reminder set · 6 PM';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1500);}
}

function setReminderTomorrow9(id){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  const tmrw=new Date();tmrw.setDate(tmrw.getDate()+1);tmrw.setHours(9,0,0,0);
  t.remindAt=tmrw.toISOString();
  save();renderCalTasks();renderAllTasks();updateStats();
  const toast=document.getElementById('saveToast');if(toast){toast.innerHTML='⏰ Reminder set · tomorrow 9 AM';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1500);}
}

function remindCustom(id){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  bccPrompt('Remind date & time (YYYY-MM-DD HH:MM):',todayStr()+' 17:00',(dt)=>{
    if(!dt)return;
    const parsed=new Date(dt.replace(' ','T'));
    if(isNaN(parsed.getTime())){alert('Invalid date/time format');return;}
    t.remindAt=parsed.toISOString();
    save();renderCalTasks();renderAllTasks();updateStats();
    const label=parsed.toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
    const toast=document.getElementById('saveToast');if(toast){toast.innerHTML='⏰ Reminder set · '+label;toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),2000);}
  });
}

function unsnooze(id){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  delete t.remindAt;
  save();renderCalTasks();renderAllTasks();updateStats();
  const toast=document.getElementById('saveToast');if(toast){toast.innerHTML='✓ Task resurfaced';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1200);}
}

function checkReminders(){
  const now=new Date();let surfaced=0;
  D.tasks.forEach(t=>{if(t.remindAt&&new Date(t.remindAt)<=now){delete t.remindAt;surfaced++;}});
  if(surfaced){
    save();renderCalTasks();renderAllTasks();updateStats();
    if(typeof generateCoachSuggestions==='function')generateCoachSuggestions();
    const toast=document.getElementById('saveToast');
    if(toast){toast.innerHTML=`🔔 ${surfaced} task${surfaced>1?'s':''} resurfaced!`;toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),2500);}
    if(typeof playReminderSound==='function')playReminderSound();
  }
}

// ===== TASKS SUB-TABS =====
function switchTasksSubtab(tab,btn){
  document.querySelectorAll('.tasks-subtab').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  document.getElementById('tasksActivePane').style.display=tab==='active'?'':'none';
  document.getElementById('tasksParkingPane').style.display=tab==='parking'?'':'none';
  const blPane=document.getElementById('tasksBacklogPane');
  if(blPane)blPane.style.display=tab==='backlog'?'':'none';
  if(tab==='parking')renderParkingList();
  if(tab==='backlog'&&typeof renderBacklog==='function')renderBacklog();
}

// switchTaskView: used by the List / Buckets / Lists sub-tab buttons in index.html
function switchTaskView(tab,btn){
  document.querySelectorAll('.tasks-subtab').forEach(b=>b.classList.remove('active'));
  if(btn)btn.classList.add('active');
  const activePane=document.getElementById('tasksActivePane');
  const bucketPane=document.getElementById('tasksBucketPane');
  const listsPane=document.getElementById('tasksListsPane');
  if(activePane)activePane.style.display=tab==='list'?'':'none';
  if(bucketPane)bucketPane.style.display=tab==='buckets'?'':'none';
  if(listsPane)listsPane.style.display=tab==='lists'?'':'none';
  if(tab==='buckets')renderBuckets();
  if(tab==='lists')renderLists();
  if(tab==='list')renderAllTasks();
}

// ===== BUCKETS VIEW =====
let _bucketDragKey=null;
function _getBucketOrder(){
  const cats=D.cats||{};
  const allKeys=Object.keys(cats).filter(k=>k!=='braindump');
  const saved=D.catOrder||[];
  const ordered=saved.filter(k=>allKeys.includes(k));
  allKeys.forEach(k=>{if(!ordered.includes(k))ordered.push(k);});
  return ordered;
}
function renderBuckets(){
  const el=document.getElementById('tasksBucketPane');if(!el)return;
  const cats=D.cats;
  const today=todayStr();
  const activeTasks=D.tasks.filter(t=>!t.done&&t.cat!=='braindump');
  const orderedKeys=_getBucketOrder();
  const buckets=orderedKeys.map(k=>[k,cats[k]]).filter(([,c])=>c);
  if(!buckets.length){el.innerHTML='<p style="color:var(--dim);text-align:center;padding:24px;font-size:12px;">No categories yet.</p>';return;}
  let h='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;padding:4px 0;">';
  buckets.forEach(([k,cat])=>{
    const tasks=activeTasks.filter(t=>t.cat===k).sort((a,b)=>{const p={high:0,med:1,low:2};return p[a.pri]-p[b.pri];});
    const done=D.tasks.filter(t=>t.done&&t.cat===k&&t.date&&t.date<=today);
    h+=`<div data-bucketkey="${k}"
          ondragover="event.preventDefault();this.style.outline='2px solid var(--blue)';event.dataTransfer.dropEffect='move';"
          ondragleave="this.style.outline='';"
          ondrop="event.preventDefault();this.style.outline='';const dt=event.dataTransfer.getData('text/plain');if(_bucketDragKey&&_bucketDragKey!=='${k}'){const o=_getBucketOrder();const fi=o.indexOf(_bucketDragKey);const ti=o.indexOf('${k}');if(fi>-1&&ti>-1){o.splice(fi,1);o.splice(ti,0,_bucketDragKey);}D.catOrder=o;save();_bucketDragKey=null;renderBuckets();return;}_bucketDragKey=null;if(dt&&dt.match(/^[0-9]+$/)){_dragTaskId=parseInt(dt);taskDropOnCat(event,'${k}');}"
          style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;min-height:80px;">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
        <span draggable="true" ondragstart="_bucketDragKey='${k}';event.dataTransfer.effectAllowed='move';event.dataTransfer.setData('text/plain','bucket:${k}');" style="font-size:13px;color:var(--dim);cursor:grab;" title="Drag to reorder categories">⠿</span>
        <span style="font-size:16px;">${cat.emoji}</span>
        <span style="font-size:12px;font-weight:600;color:${cat.color};">${cat.label}</span>
        <span style="font-size:10px;color:var(--dim);margin-left:auto;">${tasks.length}${done.length?' · '+done.length+'✓':''}</span>
        <button onclick="bucketInlineAdd('${k}')" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:16px;line-height:1;padding:0 2px;" title="Add task">+</button>
      </div>
      <div id="bucket-tasks-${k}">
        ${tasks.map(t=>`<div class="simple-task-row" draggable="true" ondragstart="taskDragStart(event,${t.id})" ondragend="taskDragEnd(event)" oncontextmenu="event.preventDefault();openTaskCtx(event,${t.id});" style="margin-bottom:4px;padding:5px 6px;">
          <div class="p-dot ${t.pri}"></div>
          <input type="checkbox" onchange="togTask(${t.id},this)">
          <span class="simple-task-text" style="flex:1;font-size:12px;">${t.text}</span>
          <button class="task-act-btn" onclick="openEdit(${t.id})" style="font-size:9px;opacity:.5;">edit</button>
        </div>`).join('')||'<p style="font-size:11px;color:var(--dim);text-align:center;padding:6px 0;">Empty</p>'}
      </div>
      <div id="bucket-add-${k}" style="display:none;margin-top:4px;">
        <input type="text" placeholder="New task..." style="width:100%;padding:6px 8px;font-size:12px;background:var(--bg);border:1px solid var(--border);border-radius:7px;color:var(--text);outline:none;font-family:inherit;box-sizing:border-box;"
          onkeydown="if(event.key==='Enter')bucketInlineCommit('${k}',this);if(event.key==='Escape'){document.getElementById('bucket-add-${k}').style.display='none';}"
          onblur="setTimeout(()=>{const d=document.getElementById('bucket-add-${k}');if(d)d.style.display='none';},150)">
      </div>
    </div>`;
  });
  // Custom lists as additional bucket cards
  _initLists();
  if(D.lists.length){
    D.lists.forEach(list=>{
      const items=list.items||[];
      const doneCount=items.filter(i=>i.done).length;
      const activeItems=items.filter(i=>!i.done);
      h+=`<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;min-height:80px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
          <span style="font-size:16px;">✅</span>
          <span style="font-size:12px;font-weight:600;color:var(--text);">${list.name}</span>
          <span style="font-size:10px;color:var(--dim);margin-left:auto;">${doneCount}/${items.length}</span>
          <button onclick="bucketListInlineAdd('list-${list.id}')" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:16px;line-height:1;padding:0 2px;" title="Add item">+</button>
        </div>
        <div>
          ${items.map(item=>`<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid var(--border);">
            <input type="checkbox" ${item.done?'checked':''} onchange="toggleListItem(${list.id},${item.id},this)" style="flex-shrink:0;">
            <span style="flex:1;font-size:12px;${item.done?'text-decoration:line-through;color:var(--dim);':''}">${item.text}</span>
            <button onclick="deleteListItem(${list.id},${item.id});renderBuckets();" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:10px;opacity:.4;">✕</button>
          </div>`).join('')||'<p style="font-size:11px;color:var(--dim);text-align:center;padding:6px 0;">Empty</p>'}
        </div>
        <div id="bucket-add-list-${list.id}" style="display:none;margin-top:4px;">
          <input type="text" placeholder="New item..." style="width:100%;padding:6px 8px;font-size:12px;background:var(--bg);border:1px solid var(--border);border-radius:7px;color:var(--text);outline:none;font-family:inherit;box-sizing:border-box;"
            onkeydown="if(event.key==='Enter')bucketListItemCommit(${list.id},this);if(event.key==='Escape'){document.getElementById('bucket-add-list-${list.id}').style.display='none';}"
            onblur="setTimeout(()=>{const d=document.getElementById('bucket-add-list-${list.id}');if(d)d.style.display='none';},150)">
        </div>
      </div>`;
    });
    // "New list" card
    h+=`<div style="background:var(--card);border:2px dashed var(--border);border-radius:12px;padding:12px;min-height:80px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer;" onclick="document.getElementById('bucketNewListWrap').style.display='';document.getElementById('bucketNewListInput').focus();">
      <span style="font-size:22px;color:var(--dim);">+</span>
      <span style="font-size:11px;color:var(--dim);">New list</span>
      <div id="bucketNewListWrap" style="display:none;width:100%;" onclick="event.stopPropagation()">
        <input type="text" id="bucketNewListInput" placeholder="List name..." style="width:100%;padding:6px 8px;font-size:12px;background:var(--bg);border:1px solid var(--border);border-radius:7px;color:var(--text);outline:none;font-family:inherit;box-sizing:border-box;"
          onkeydown="if(event.key==='Enter')createListFromBucket(this);if(event.key==='Escape')this.closest('[onclick]').style.display='none';"
          onblur="setTimeout(()=>{const w=document.getElementById('bucketNewListWrap');if(w)w.style.display='none';},150)">
      </div>
    </div>`;
  } else {
    // No lists yet — just show a "New list" card
    h+=`<div style="background:var(--card);border:2px dashed var(--border);border-radius:12px;padding:12px;min-height:80px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;cursor:pointer;" onclick="document.getElementById('bucketNewListWrap').style.display='';document.getElementById('bucketNewListInput').focus();">
      <span style="font-size:22px;color:var(--dim);">+</span>
      <span style="font-size:11px;color:var(--dim);">New list</span>
      <div id="bucketNewListWrap" style="display:none;width:100%;" onclick="event.stopPropagation()">
        <input type="text" id="bucketNewListInput" placeholder="List name..." style="width:100%;padding:6px 8px;font-size:12px;background:var(--bg);border:1px solid var(--border);border-radius:7px;color:var(--text);outline:none;font-family:inherit;box-sizing:border-box;"
          onkeydown="if(event.key==='Enter')createListFromBucket(this);if(event.key==='Escape')this.closest('[onclick]').style.display='none';"
          onblur="setTimeout(()=>{const w=document.getElementById('bucketNewListWrap');if(w)w.style.display='none';},150)">
      </div>
    </div>`;
  }
  h+='</div>';
  el.innerHTML=h;
}
function bucketListInlineAdd(wrapperId){
  const d=document.getElementById('bucket-add-'+wrapperId);if(!d)return;
  d.style.display='';
  const inp=d.querySelector('input');if(inp){inp.value='';inp.focus();}
}
function bucketListItemCommit(listId,inp){
  const text=inp.value.trim();if(!text)return;
  _initLists();
  const list=D.lists.find(l=>l.id===listId);if(!list)return;
  if(!list.items)list.items=[];
  list.items.push({id:Date.now(),text,done:false});
  save();renderBuckets();
}
function createListFromBucket(inp){
  const name=inp.value.trim();if(!name)return;
  _initLists();
  D.lists.push({id:Date.now(),name,items:[]});
  save();renderBuckets();
}
function bucketInlineAdd(cat){
  const d=document.getElementById('bucket-add-'+cat);if(!d)return;
  d.style.display='';
  const inp=d.querySelector('input');if(inp){inp.value='';inp.focus();}
}
function bucketInlineCommit(cat,inp){
  const text=inp.value.trim();if(!text)return;
  D.tasks.push({id:D.nextId++,text,cat,pri:'med',done:false,date:todayStr()});
  save();renderBuckets();renderCalTasks();updateStats();
}

// ===== CUSTOM LISTS =====
function _initLists(){if(!D.lists)D.lists=[];}

function renderLists(){
  const el=document.getElementById('tasksListsPane');if(!el)return;
  _initLists();
  let h=`<div style="padding:4px 0;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
      <input type="text" id="newListNameInput" placeholder="New list name..." style="flex:1;padding:8px 10px;font-size:13px;background:var(--bg);border:1px solid var(--border);border-radius:8px;color:var(--text);outline:none;font-family:inherit;"
        onkeydown="if(event.key==='Enter')createList()">
      <button onclick="createList()" style="padding:8px 14px;background:var(--blue);border:none;border-radius:8px;color:#fff;font-size:12px;cursor:pointer;">+ New List</button>
    </div>`;
  if(!D.lists.length){
    h+='<p style="color:var(--dim);text-align:center;padding:24px;font-size:12px;">No lists yet — create one above!</p>';
  } else {
    D.lists.forEach(list=>{
      const items=list.items||[];
      const done=items.filter(i=>i.done).length;
      h+=`<div style="background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px;margin-bottom:10px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
          <span style="font-size:14px;font-weight:600;">${list.name}</span>
          <span style="font-size:10px;color:var(--dim);margin-left:4px;">${done}/${items.length}</span>
          <button onclick="deleteList(${list.id})" style="margin-left:auto;background:none;border:none;color:var(--dim);cursor:pointer;font-size:12px;opacity:.5;" title="Delete list">✕</button>
        </div>
        <div>
          ${items.map(item=>`<div style="display:flex;align-items:center;gap:6px;padding:4px 0;border-bottom:1px solid var(--border);">
            <input type="checkbox" ${item.done?'checked':''} onchange="toggleListItem(${list.id},${item.id},this)" style="flex-shrink:0;">
            <span style="flex:1;font-size:13px;${item.done?'text-decoration:line-through;color:var(--dim);':''}">${item.text}</span>
            <button onclick="deleteListItem(${list.id},${item.id})" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:11px;opacity:.5;">✕</button>
          </div>`).join('')}
        </div>
        <div style="display:flex;gap:6px;margin-top:8px;">
          <input type="text" placeholder="+ Add item..." id="listItemInput-${list.id}"
            style="flex:1;padding:6px 8px;font-size:12px;background:var(--bg);border:1px solid var(--border);border-radius:7px;color:var(--text);outline:none;font-family:inherit;"
            onkeydown="if(event.key==='Enter')addListItem(${list.id})">
          <button onclick="addListItem(${list.id})" style="padding:6px 10px;background:var(--bg);border:1px solid var(--border);border-radius:7px;color:var(--text);font-size:12px;cursor:pointer;">Add</button>
        </div>
      </div>`;
    });
  }
  h+='</div>';
  el.innerHTML=h;
}
function createList(){
  _initLists();
  const inp=document.getElementById('newListNameInput');if(!inp)return;
  const name=inp.value.trim();if(!name)return;
  D.lists.push({id:Date.now(),name,items:[]});
  inp.value='';save();renderLists();
}
function deleteList(id){
  _initLists();
  if(!confirm('Delete this list?'))return;
  D.lists=D.lists.filter(l=>l.id!==id);
  save();renderLists();
}
function addListItem(listId){
  _initLists();
  const inp=document.getElementById('listItemInput-'+listId);if(!inp)return;
  const text=inp.value.trim();if(!text)return;
  const list=D.lists.find(l=>l.id===listId);if(!list)return;
  if(!list.items)list.items=[];
  list.items.push({id:Date.now(),text,done:false});
  inp.value='';save();renderLists();
}
function toggleListItem(listId,itemId,el){
  _initLists();
  const list=D.lists.find(l=>l.id===listId);if(!list||!list.items)return;
  const item=list.items.find(i=>i.id===itemId);if(!item)return;
  item.done=el.checked;save();_refreshListViews();
}
function deleteListItem(listId,itemId){
  _initLists();
  const list=D.lists.find(l=>l.id===listId);if(!list||!list.items)return;
  list.items=list.items.filter(i=>i.id!==itemId);
  save();_refreshListViews();
}
function _refreshListViews(){
  const bp=document.getElementById('tasksBucketPane');
  const lp=document.getElementById('tasksListsPane');
  if(bp&&bp.style.display!=='none')renderBuckets();
  if(lp&&lp.style.display!=='none')renderLists();
}

// ===== PARKING LOT =====
function addParkingItem(){
  const inp=document.getElementById('parkingAddInput');
  const val=inp.value.trim();if(!val)return;
  if(!D.parkingItems)D.parkingItems=[];
  D.parkingItems.push({id:Date.now(),text:val,added:todayStr()});
  inp.value='';save();renderParkingList();
}
function removeParkingItem(id){
  if(!D.parkingItems)return;
  D.parkingItems=D.parkingItems.filter(p=>p.id!==id);
  save();renderParkingList();
}
function parkingItemDone(id){
  if(!D.parkingItems)return;
  const item=D.parkingItems.find(p=>p.id===id);
  if(item){
    const today=todayStr();
    if(!D.reflections)D.reflections={};
    if(!D.reflections[today])D.reflections[today]={};
    if(!D.reflections[today].manualWins)D.reflections[today].manualWins=[];
    if(!D.reflections[today].manualWins.includes(item.text))D.reflections[today].manualWins.push(item.text);
  }
  D.parkingItems=D.parkingItems.filter(p=>p.id!==id);
  save();renderParkingList();
}
function promoteParkingItem(id){
  if(!D.parkingItems)return;
  const item=D.parkingItems.find(p=>p.id===id);if(!item)return;
  D.tasks.push({id:D.nextId++,text:item.text,cat:'personal',pri:'med',done:false,date:todayStr()});
  D.parkingItems=D.parkingItems.filter(p=>p.id!==id);
  save();renderParkingList();renderSidebarTasks();renderAllTasks();updateStats();
}
function renderParkingList(){
  const el=document.getElementById('parkingList');if(!el)return;
  const items=D.parkingItems||[];
  if(!items.length){el.innerHTML='<p style="color:var(--dim);text-align:center;padding:20px;font-size:12px;">Nothing parked yet — add things you want to come back to.</p>';return;}
  el.innerHTML=items.map(p=>`<div class="parking-item">
    <span style="font-size:14px;">📌</span>
    <div class="pi-text">${p.text}<div style="font-size:9px;color:var(--dim);margin-top:1px;">added ${p.added||''}</div></div>
    <button class="pi-act pi-promote" onclick="promoteParkingItem(${p.id})" title="Move to active tasks">↑ activate</button>
    <button class="pi-act pi-del" onclick="removeParkingItem(${p.id})" title="Remove">✕</button>
  </div>`).join('');
}

// ===== CALENDAR RIGHT PANEL =====
function renderCalRightTasks(){
  const el=document.getElementById('calRightTaskList');if(!el)return;
  const today=todayStr();
  const dt=(D.calView==='day'||D.calView==='tomorrow')?D.selectedDate:today;

  const tl=(typeof getTimeline==='function')?getTimeline(dt):[];
  const now=new Date();const nowMin=now.getHours()*60+now.getMinutes();
  const isToday=dt===today;

  // Include ALL tasks for this date + overdue — active + done (done shown greyed inline)
  const overdueTasks=isToday?D.tasks.filter(t=>t.date&&t.date<today&&!t.done&&t.cat!=='braindump'&&!isSnoozed(t)):[];
  const todayActiveTasks=D.tasks.filter(t=>t.date===dt&&!t.done&&t.cat!=='braindump'&&!isSnoozed(t)).sort((a,b)=>{const p={high:0,med:1,low:2};return (p[a.pri]||1)-(p[b.pri]||1);});
  const activeTasks=[...overdueTasks,...todayActiveTasks];
  const doneTasks=D.tasks.filter(t=>t.date===dt&&t.done&&t.cat!=='braindump');
  const activeSlots=tl.filter(s=>!s.done);
  const doneSlots=tl.filter(s=>s.done);
  const activeCount=activeSlots.length+activeTasks.length;
  const doneCount=doneSlots.length+doneTasks.length;
  const badge=document.getElementById('calRightTaskBadge');
  if(badge)badge.textContent=activeCount+(doneCount?` · ${doneCount}✓`:'');

  if(!activeSlots.length&&!activeTasks.length&&!doneSlots.length&&!doneTasks.length){
    el.innerHTML='<p style="font-size:10px;color:var(--dim);text-align:center;padding:8px;">No tasks or events for this day</p>';return;
  }

  function renderBlock(opts){
    const opacity=opts.done?0.4:opts.isPast?0.5:1;
    const currentDot=opts.isCurrent?'<span style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block;flex-shrink:0;animation:pulse 2s infinite;"></span>':'';
    const strikeStyle=opts.done?'text-decoration:line-through;':'';
    const bgColor=opts.done?'background:rgba(52,211,153,.04);':'';
    const checkFill=opts.done?`background:${opts.color};color:#fff;`:`background:none;color:${opts.color};`;
    const subtitle=opts.subtitle||'';
    const dragAttr=opts.taskId&&!opts.done?`draggable="true" ondragstart="event.dataTransfer.setData('text/plain','task:'+${opts.taskId});event.dataTransfer.effectAllowed='move';this.style.opacity='.3';" ondragend="this.style.opacity='${opacity}';" style="cursor:grab;`:'style="';
    return `<div ${dragAttr}display:flex;align-items:center;gap:6px;padding:4px 0;opacity:${opacity};border-bottom:1px solid var(--border);${bgColor}" title="${(opts.fullText||opts.label||'').replace(/"/g,'&quot;')}" ${opts.ctx||''}>
      <button onclick="event.stopPropagation();${opts.toggleAction}" style="${checkFill}border:1.5px solid ${opts.color};width:11px;height:11px;border-radius:50%;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:7px;padding:0;">${opts.done?'✓':''}</button>
      ${currentDot}
      <div style="flex:1;min-width:0;">
        <div style="font-size:11px;font-weight:600;${strikeStyle}">${opts.label}</div>
        ${subtitle?`<div style="font-size:9px;color:var(--dim);">${subtitle}</div>`:''}
      </div>
      ${opts.extraBtn||''}
      <div style="width:3px;height:20px;border-radius:2px;background:${opts.color};flex-shrink:0;opacity:.6;"></div>
    </div>`;
  }

  // Plan banner — show today's pre-planned spots + priorities
  let bannerHtml='';
  const todayMode=(typeof getTodayMode==='function')?getTodayMode():null;
  const todayPris=(typeof getTodayPriorities==='function')?getTodayPriorities():[];
  if(isToday){
    const spotPart=todayMode?todayMode.icon+' '+todayMode.label:'';
    const priParts=todayPris.filter(p=>!p.done).slice(0,2).map(p=>p.text).join(' · ');
    const savedPlan=D.dayPlans&&D.dayPlans[today]||'';
    const defaultText=[(spotPart||''),(priParts||'')].filter(Boolean).join(' · ');
    const planText=savedPlan||defaultText;
    bannerHtml=`<div style="background:rgba(96,165,250,.07);border:1px solid rgba(96,165,250,.18);border-radius:6px;padding:5px 8px;margin-bottom:6px;font-size:10px;line-height:1.5;">
      <span style="font-weight:700;color:var(--blue);">Your plan:</span>
      <input type="text" id="todayPlanInput" value="${planText.replace(/"/g,'&quot;')}" placeholder="What's your plan for today?" onchange="if(!D.dayPlans)D.dayPlans={};D.dayPlans[todayStr()]=this.value;save();" style="background:none;border:none;color:var(--text);font-size:10px;font-family:inherit;width:calc(100% - 70px);outline:none;padding:0;">
    </div>`;
  }

  let html='';

  // --- SCHEDULE section (time blocks/meetings) ---
  const allSlotBlocks=[];
  activeSlots.forEach(slot=>{
    if(!slot._id)slot._id='s'+Date.now()+'_'+Math.floor(Math.random()*9999);
    const sid=slot._id;
    const cat=D.cats&&D.cats[slot.cls];
    const catColor=cat?cat.color:slot.cls==='focus'?'#fbbf24':slot.cls==='_task'?'#f87171':slot.cls==='_todo'?'#60a5fa':'var(--blue)';
    const startM=(typeof parseMin==='function')?parseMin(slot.t):0;
    const endM=slot.end?parseMin(slot.end):startM+60;
    allSlotBlocks.push(renderBlock({
      color:catColor, done:false,
      isPast:isToday&&endM<=nowMin, isCurrent:isToday&&startM<=nowMin&&endM>nowMin,
      label:slot.text, subtitle:slot.t+(slot.end?' – '+slot.end:'')+(slot.loc?' · '+slot.loc:''),
      toggleAction:`togSlotDone('${dt}','${sid}')`,
      extraBtn:`<button onclick="event.stopPropagation();slotToTask('${dt}','${sid}')" title="Move to tasks" style="font-size:8px;border:1px solid var(--dim);border-radius:3px;background:none;color:var(--dim);cursor:pointer;padding:1px 4px;flex-shrink:0;opacity:.5;" onmouseenter="this.style.opacity='1';this.style.color='var(--blue)';this.style.borderColor='var(--blue)';" onmouseleave="this.style.opacity='.5';this.style.color='var(--dim)';this.style.borderColor='var(--dim)';">→ task</button>`,
      ctx:''
    }));
  });
  doneSlots.forEach(slot=>{
    if(!slot._id)slot._id='s'+Date.now()+'_'+Math.floor(Math.random()*9999);
    const sid=slot._id;
    const cat=D.cats&&D.cats[slot.cls];
    const catColor=cat?cat.color:'var(--green)';
    allSlotBlocks.push(renderBlock({
      color:catColor, done:true, isPast:false, isCurrent:false,
      label:slot.text, subtitle:'',
      toggleAction:`togSlotDone('${dt}','${sid}')`, ctx:''
    }));
  });

  if(allSlotBlocks.length){
    html+=`<div style="font-size:9px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;padding:4px 0 2px;">Schedule</div>`;
    html+=allSlotBlocks.join('');
  }

  // --- TASKS section (to-do items) ---
  const allTaskBlocks=[];
  activeTasks.forEach(t=>{
    const cat=D.cats[t.cat];
    const catColor=cat?cat.color:'var(--dim)';
    const emoji=cat?cat.emoji:'';
    const effortTag=t.effort&&EFFORT_TAGS[t.effort]?EFFORT_TAGS[t.effort].emoji+' ':'';
    allTaskBlocks.push(renderBlock({
      color:catColor, done:false, isPast:false, isCurrent:false,
      label:(t.urgent?'⚡ ':'')+emoji+' '+effortTag+t.text, fullText:t.text, subtitle:'', taskId:t.id,
      toggleAction:`togTask(${t.id})`, ctx:`oncontextmenu="event.preventDefault();openTaskCtx(event,${t.id});"`,
      extraBtn:`<button onclick="event.stopPropagation();openRemindPicker(event,${t.id})" title="Remind later" style="font-size:10px;border:1px solid var(--pink);border-radius:3px;background:none;color:var(--pink);cursor:pointer;padding:1px 4px;flex-shrink:0;opacity:.6;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='.6'">⏰</button>`
    }));
  });
  doneTasks.forEach(t=>{
    const cat=D.cats[t.cat];
    const catColor=cat?cat.color:'var(--dim)';
    const emoji=cat?cat.emoji:'';
    allTaskBlocks.push(renderBlock({
      color:catColor, done:true, isPast:false, isCurrent:false,
      label:emoji+' '+t.text, subtitle:'',
      toggleAction:`togTask(${t.id})`, ctx:`oncontextmenu="event.preventDefault();openTaskCtx(event,${t.id});"`
    }));
  });

  if(allTaskBlocks.length){
    html+=`<div style="font-size:9px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;padding:${allSlotBlocks.length?'8':'4'}px 0 2px;">Tasks</div>`;
    html+=allTaskBlocks.join('');
  }

  el.innerHTML=bannerHtml+html;
}
function slotToTask(dt,sid){
  const tl=getTimeline(dt);
  const i=_slotIdx(tl,sid);
  if(i<0)return;
  const slot=tl[i];
  const catKey=(slot.cls&&D.cats[slot.cls])?slot.cls:'personal';
  D.tasks.push({id:D.nextId++,text:slot.text,cat:catKey,pri:'med',done:false,date:dt});
  tl.splice(i,1);
  setTimeline(dt,tl);
  renderCalRightTasks();renderCalendar();updateStats();
}
function addCalRightTask(inp){
  const text=inp.value.trim();if(!text)return;
  const dt=(D.calView==='day'||D.calView==='tomorrow')?D.selectedDate:todayStr();
  D.tasks.push({id:D.nextId++,text,cat:'personal',pri:'med',done:false,date:dt});
  inp.value='';save();renderCalRightTasks();renderAllTasks();updateStats();
}
// Completed tasks are now shown inline in renderCalRightTasks — this is a no-op for compat
function renderCalRightCompleted(){}

// ===== WINS & DONE CARD =====
function renderCalRightWinsDone(){
  const el=document.getElementById('calRightWinsDoneList');if(!el)return;
  const today=todayStr();
  const weekDates=getWeekDates(today);

  function gatherDay(dt){
    const doneTasks=D.tasks.filter(t=>t.done&&t.date===dt&&t.cat!=='braindump');
    const doneSlots=(getTimeline(dt)||[]).filter(s=>s.done);
    const manualWins=(D.reflections&&D.reflections[dt]&&D.reflections[dt].manualWins)||[];
    const items=[];
    const seen=new Set(); // avoid showing the same win twice (e.g. a completed task auto-logs a manual win)
    const norm=s=>(s||'').trim().toLowerCase();
    doneTasks.forEach(t=>{
      const cat=D.cats[t.cat];
      seen.add(norm(t.text));
      items.push({text:t.text,emoji:cat?cat.emoji:'',cat:t.cat,color:cat?cat.color:'var(--dim)',type:'task',sourceId:t.id});
    });
    doneSlots.forEach(s=>{
      const cat=D.cats&&D.cats[s.cls];
      if(!s._id)s._id='s'+Date.now()+'_'+Math.floor(Math.random()*9999);
      seen.add(norm(s.text));
      items.push({text:s.text,emoji:cat?cat.emoji:'📅',cat:s.cls||'event',color:cat?cat.color:'var(--blue)',type:'block',sourceId:s._id,dt:dt});
    });
    manualWins.forEach(w=>{
      if(seen.has(norm(w)))return; // already shown as a completed task/event
      seen.add(norm(w));
      items.push({text:w,emoji:'✨',cat:'_win',color:'var(--green)',type:'win'});
    });
    return items;
  }

  const todayItems=gatherDay(today);
  const badge=document.getElementById('calRightWinsBadge');
  if(badge)badge.textContent=todayItems.length;

  // Quick-add win input (always shown)
  const winInputHtml=`<div style="display:flex;gap:4px;margin-bottom:8px;">
    <input type="text" id="quickAddWinInput" placeholder="+ log a win..." onkeydown="if(event.key==='Enter')quickAddWin()" style="flex:1;padding:5px 8px;font-size:10px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--text);font-family:inherit;">
    <button class="t-btn" onclick="quickAddWin()" style="font-size:10px;padding:4px 10px;border-color:var(--green);color:var(--green);font-weight:600;">+</button>
  </div>`;

  if(!todayItems.length){
    el.innerHTML=winInputHtml+'<p style="font-size:10px;color:var(--dim);text-align:center;padding:8px;">Nothing completed yet — you got this!</p>';
    return;
  }

  // Group by category
  const groups={};
  todayItems.forEach(item=>{
    const key=item.cat||'other';
    if(!groups[key])groups[key]={emoji:item.emoji,color:item.color,items:[]};
    groups[key].items.push(item);
  });
  const sorted=Object.entries(groups).sort((a,b)=>b[1].items.length-a[1].items.length);

  let html=winInputHtml;
  html+='<div style="font-size:9px;font-weight:700;color:var(--green);margin-bottom:4px;">TODAY — '+todayItems.length+' completed</div>';
  sorted.forEach(([key,g])=>{
    html+=`<div style="margin-bottom:4px;">`;
    html+=`<div style="font-size:8px;color:var(--dim);font-weight:600;margin-bottom:2px;">${g.emoji} ${g.items.length}</div>`;
    g.items.forEach(item=>{
      const logBtn=item.type==='task'?`<button class="wl-quick-log" onclick="event.stopPropagation();logTaskAsWork(${item.sourceId})" title="Add to Work Log"><span class="mi" style="font-size:11px;">work_history</span></button>`:item.type==='block'?`<button class="wl-quick-log" onclick="event.stopPropagation();logBlockAsWork('${item.dt}','${item.sourceId}')" title="Add to Work Log"><span class="mi" style="font-size:11px;">work_history</span></button>`:'';
      html+=`<div style="display:flex;align-items:center;gap:4px;padding:2px 0;opacity:.85;">
        <span style="color:var(--green);font-size:10px;">✓</span>
        <span style="font-size:10px;text-decoration:line-through;color:var(--dim);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.text}</span>
        ${logBtn}
      </div>`;
    });
    html+=`</div>`;
  });

  // Earlier this week
  const earlierDates=weekDates.filter(d=>d<today);
  let earlierTotal=0;
  const earlierByDay=[];
  earlierDates.forEach(dt=>{
    const items=gatherDay(dt);
    if(items.length){earlierTotal+=items.length;earlierByDay.push({dt,items});}
  });
  if(earlierTotal){
    const dayNames=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    html+=`<div style="margin-top:6px;border-top:1px solid var(--border);padding-top:4px;">
      <div class="wins-earlier-toggle" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display==='none'?'block':'none';this.querySelector('span').textContent=this.nextElementSibling.style.display==='none'?'▸':'▾';" style="font-size:9px;color:var(--dim);cursor:pointer;font-weight:600;">
        <span>▸</span> Earlier this week · ${earlierTotal} wins
      </div>
      <div style="display:none;">`;
    earlierByDay.reverse().forEach(({dt,items})=>{
      const d=new Date(dt+'T12:00:00');
      const dayLabel=dayNames[d.getDay()];
      html+=`<div style="font-size:8px;color:var(--dim);font-weight:600;margin:4px 0 2px;">${dayLabel} — ${items.length}</div>`;
      items.slice(0,5).forEach(item=>{
        html+=`<div style="display:flex;align-items:center;gap:4px;padding:1px 0;opacity:.6;">
          <span style="color:var(--green);font-size:9px;">✓</span>
          <span style="font-size:9px;text-decoration:line-through;color:var(--dim);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${item.text}</span>
        </div>`;
      });
      if(items.length>5) html+=`<div style="font-size:8px;color:var(--dim);padding-left:14px;">+${items.length-5} more</div>`;
    });
    html+=`</div></div>`;
  }

  el.innerHTML=html;
}
function quickAddWin(){
  const inp=document.getElementById('quickAddWinInput');if(!inp)return;
  const text=inp.value.trim();if(!text)return;
  const today=todayStr();
  autoAddWin(text,today);
  inp.value='';
  renderCalRightWinsDone();
  renderCalendar();
}

// Legacy compat — redirect old calls to unified stash
function renderCalRightLater(){renderCalRightStash();}
function renderCalRightParking(){renderCalRightStash();}
function renderCalRightBacklog(){renderCalRightStash();}

function renderCalRightTrash(){
  const el=document.getElementById('calRightTrashList');if(!el)return;
  const trash=D.trash||[];
  const badge=document.getElementById('calRightTrashBadge');
  if(badge)badge.textContent=trash.length;
  if(!trash.length){
    el.innerHTML='<p style="font-size:10px;color:var(--dim);text-align:center;padding:6px;">Trash is empty</p>';
    return;
  }
  let html='';
  trash.slice().reverse().slice(0,10).forEach((t,vi)=>{
    const ri=trash.length-1-vi;
    const cat=D.cats[t.cat];
    const emoji=cat?cat.emoji:'📋';
    const ago=t._trashedAt?Math.round((Date.now()-t._trashedAt)/60000):0;
    const agoLabel=ago<60?ago+'m ago':ago<1440?Math.round(ago/60)+'h ago':Math.round(ago/1440)+'d ago';
    html+=`<div style="display:flex;align-items:center;gap:4px;padding:3px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:11px;flex-shrink:0;">${emoji}</span>
      <span style="font-size:10px;color:var(--dim);flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;text-decoration:line-through;">${t.text}</span>
      <span style="font-size:8px;color:var(--dim);flex-shrink:0;">${agoLabel}</span>
      <button onclick="restoreTask(${ri});renderCalRightTrash();renderCalendar();renderSidebarTasks();renderAllTasks();updateStats();" style="background:none;border:none;color:var(--blue);cursor:pointer;font-size:9px;padding:0 3px;flex-shrink:0;" title="Restore">↩</button>
    </div>`;
  });
  if(trash.length>10)html+=`<div style="font-size:9px;color:var(--dim);text-align:center;padding:4px;">+${trash.length-10} more</div>`;
  html+=`<button onclick="if(confirm('Empty trash? This cannot be undone.')){emptyTrash();renderCalRightTrash();}" style="margin-top:6px;width:100%;background:none;border:1px solid var(--red);color:var(--red);border-radius:6px;padding:4px 0;font-size:10px;cursor:pointer;font-family:inherit;opacity:.7;">Empty Trash</button>`;
  el.innerHTML=html;
}

function initTrashDropZone(){
  const trashCard=document.querySelector('[data-card="calright-trash"]');
  if(!trashCard)return;
  trashCard.addEventListener('dragover',function(e){
    const data=e.dataTransfer.types.includes('text/plain');
    if(!data)return;
    e.preventDefault();e.dataTransfer.dropEffect='move';
    trashCard.classList.add('trash-drag-active');
  });
  trashCard.addEventListener('dragleave',function(e){
    if(trashCard.contains(e.relatedTarget))return;
    trashCard.classList.remove('trash-drag-active');
  });
  trashCard.addEventListener('drop',function(e){
    e.preventDefault();trashCard.classList.remove('trash-drag-active');
    const raw=e.dataTransfer.getData('text/plain');
    if(!raw||!raw.startsWith('task:'))return;
    const id=parseInt(raw.replace('task:',''));
    if(isNaN(id))return;
    trashTask(id);
    renderCalRightTrash();renderCalTasks();renderAllTasks();renderCalendar();updateStats();
    const toast=document.getElementById('saveToast');
    if(toast){toast.innerHTML='🗑 Moved to trash';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1200);}
  });
}
initTrashDropZone();

function renderCalRightStash(){
  const el=document.getElementById('calRightStashList');if(!el)return;
  const today=todayStr();
  const laterTasks=D.tasks.filter(t=>!t.date&&!t.done&&t.cat!=='braindump'&&!isSnoozed(t)).sort((a,b)=>(b.urgent?1:0)-(a.urgent?1:0)||(b.id||0)-(a.id||0));
  const parked=D.parkingItems||[];
  const backlog=D.backlog||[];
  const total=laterTasks.length+parked.length+backlog.length;
  const snoozedTasks=D.tasks.filter(t=>!t.done&&t.cat!=='braindump'&&isSnoozed(t)&&t.remindAt);
  const snoozedToday=snoozedTasks.filter(t=>{const rd=new Date(t.remindAt);const td=new Date();return rd.toDateString()===td.toDateString();});
  const totalWithSnoozed=total+snoozedTasks.length;
  const badge=document.getElementById('calRightStashBadge');
  if(badge){badge.textContent=totalWithSnoozed;badge.classList.toggle('stash-pulse',totalWithSnoozed>5);}
  if(!total&&!snoozedTasks.length){el.innerHTML='<p style="font-size:10px;color:var(--dim);text-align:center;padding:8px;">Queue is clear — nice!</p>';return;}

  const STASH_LIMIT=3;
  const allItems=[];

  laterTasks.forEach(t=>{
    const cat=D.cats[t.cat];
    allItems.push({sort:0,html:`<div class="task-item" style="padding:3px 0;cursor:grab;" draggable="true" ondragstart="event.dataTransfer.setData('text/plain','task:'+${t.id});event.dataTransfer.effectAllowed='move';this.style.opacity='.4';" ondragend="this.style.opacity='1';" oncontextmenu="event.preventDefault();openTaskCtx(event,${t.id});">
      <div class="p-dot ${t.pri}"></div>
      <input type="checkbox" onchange="togTask(${t.id},this)">
      <div class="t-label" style="flex:1;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${t.text}">${t.urgent?'⚡ ':''}${cat?cat.emoji:''} ${t.text}</div>
      <button class="defer-btn" onclick="stashSetDate(${t.id})" title="Set date" style="font-size:9px;">📅</button>
      <button class="defer-btn" onclick="laterToToday(${t.id})" title="Pull to today" style="font-size:9px;">→ today</button>
    </div>`});
  });

  parked.forEach(p=>{
    allItems.push({sort:1,html:`<div class="task-item" style="padding:3px 0;">
      <span style="font-size:11px;flex-shrink:0;">📌</span>
      <div class="t-label" style="flex:1;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${p.text}</div>
      <button class="defer-btn" onclick="promoteParkingItem(${p.id});renderCalRightStash();" title="Make a task" style="font-size:9px;">→ task</button>
      <button class="pi-act" onclick="parkingItemDone(${p.id});renderCalRightStash();" title="Done" style="font-size:9px;color:var(--green);">✓</button>
      <button class="pi-act pi-del" onclick="removeParkingItem(${p.id});renderCalRightStash();" title="Remove" style="font-size:9px;">✕</button>
    </div>`});
  });

  backlog.forEach(b=>{
    const cat=D.cats[b.cat];
    allItems.push({sort:2,html:`<div class="task-item" style="padding:3px 0;opacity:.6;">
      <span style="font-size:11px;">${cat?.emoji||'📌'}</span>
      <div class="t-label" style="flex:1;font-size:11px;">${b.text}</div>
      <button class="defer-btn" onclick="restoreFromBacklog(${b.id});renderCalRightStash();" style="font-size:9px;">↑</button>
      <button class="pi-act pi-del" onclick="removeFromBacklog(${b.id});renderCalRightStash();" style="font-size:9px;">✕</button>
    </div>`});
  });

  let html='';

  // Compact status row (snoozed + nudge folded into one line)
  const statusBits=[];
  if(snoozedToday.length) statusBits.push(`<span style="color:var(--pink);">⏰ ${snoozedToday.length} due today</span>`);
  if(snoozedTasks.length-snoozedToday.length>0) statusBits.push(`<span>${snoozedTasks.length-snoozedToday.length} snoozed</span>`);
  if(total>0) statusBits.push(`<span>${total} parked</span>`);
  if(statusBits.length){
    html+=`<div class="ondeck-status">${statusBits.join('<span class="ondeck-sep">·</span>')}</div>`;
  }

  // Items list (compact)
  html+=`<div class="ondeck-list">`;
  html+=allItems.slice(0,STASH_LIMIT).map(i=>i.html).join('');
  if(allItems.length>STASH_LIMIT){
    html+=`<div id="stashOverflow" style="display:none;">${allItems.slice(STASH_LIMIT).map(i=>i.html).join('')}</div>`;
  }
  html+=`</div>`;

  // Single combined footer action
  const extraCount=allItems.length>STASH_LIMIT?allItems.length-STASH_LIMIT:0;
  if(extraCount>0){
    html+=`<button class="ondeck-more-btn" onclick="(function(b){var o=document.getElementById('stashOverflow');if(o.style.display==='none'){o.style.display='block';b.textContent='Show less';}else{o.style.display='none';b.textContent='Show ${extraCount} more →';}})(this);">Show ${extraCount} more →</button>`;
  }
  if(total>0) html+=`<button class="ondeck-review-btn" onclick="openParkingReview()">📋 Review queue</button>`;

  el.innerHTML=html;
}

function addToStash(inp){
  const text=inp.value.trim();if(!text)return;
  if(!D.parkingItems)D.parkingItems=[];
  D.parkingItems.push({id:Date.now(),text,added:todayStr()});
  inp.value='';save();renderCalRightStash();renderParkingList();
}

function dateParkingItem(id){
  const p=(D.parkingItems||[]).find(x=>x.id===id);if(!p)return;
  bccPrompt('Remind date (YYYY-MM-DD):',p.remindDate||todayStr(),(dt)=>{
    if(!dt)return;
    p.remindDate=dt;
    save();renderCalRightStash();
    if(typeof renderParkingList==='function')renderParkingList();
  });
}
function addCalRightParking(inp){addToStash(inp);}

function schedParkingReview(){
  const today=new Date();
  const dayOfWeek=today.getDay();
  const daysUntilFri=dayOfWeek<=5?(5-dayOfWeek):(7-dayOfWeek+5);
  const nextFri=new Date(today);nextFri.setDate(today.getDate()+(daysUntilFri||7));
  const dt=nextFri.toISOString().split('T')[0];
  const stashCount=(D.parkingItems||[]).length+(D.tasks.filter(t=>!t.date&&!t.done&&t.cat!=='braindump')).length+(D.backlog||[]).length;
  const tl=getTimeline(dt)||[];
  const already=tl.some(s=>s.text&&s.text.includes('Review stash'));
  if(already){
    const toast=document.getElementById('saveToast');
    if(toast){toast.innerHTML='Already scheduled for '+new Date(dt+'T12:00:00').toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),2000);}
    return;
  }
  const startMin=14*60;
  let idx=tl.length;
  for(let j=0;j<tl.length;j++){if(parseMin(tl[j].t)>startMin){idx=j;break;}}
  tl.splice(idx,0,{t:'2:00 PM',text:'📌 Review stash ('+stashCount+' items)',cls:'braindump',sm:'Go through stash — promote, delete, or defer',end:'2:30 PM'});
  setTimeline(dt,tl);
  renderCalendar();renderMiniCal();
  const label=new Date(dt+'T12:00:00').toLocaleDateString('en-US',{weekday:'long',month:'short',day:'numeric'});
  const toast=document.getElementById('saveToast');
  if(toast){toast.innerHTML='📌 Review block added for '+label+' at 2 PM';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),2500);}
}
function autoParkingReview(){
  const laterTasks=D.tasks.filter(t=>!t.date&&!t.done&&t.cat!=='braindump');
  const stashCount=(D.parkingItems||[]).length+laterTasks.length;
  if(!stashCount)return;
  const dt=todayStr();
  const lastReview=D._lastParkingReview||'';
  if(lastReview===dt)return;
  D._lastParkingReview=dt;
  // Show a small daily check-in with 3-5 random stash items
  openDailyStashCheckin();
}
function openDailyStashCheckin(){
  const old=document.getElementById('dailyStashCheckin');if(old)old.remove();
  const laterTasks=D.tasks.filter(t=>!t.date&&!t.done&&t.cat!=='braindump');
  const parked=D.parkingItems||[];
  const all=[...laterTasks.map(t=>({type:'task',item:t})),...parked.map(p=>({type:'parked',item:p}))];
  if(!all.length)return;
  // Shuffle and pick up to 4
  for(let i=all.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[all[i],all[j]]=[all[j],all[i]];}
  const batch=all.slice(0,4);
  const modal=document.createElement('div');
  modal.id='dailyStashCheckin';
  modal.style.cssText='position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);';
  let itemsHtml=batch.map(b=>{
    if(b.type==='task'){
      const t=b.item;const cat=D.cats[t.cat];
      return `<div class="stash-checkin-row" style="display:flex;align-items:center;gap:6px;padding:8px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:13px;">${cat?cat.emoji:'📋'}</span>
        <span style="flex:1;font-size:12px;">${t.text}</span>
        <div style="display:flex;gap:3px;flex-shrink:0;">
          <button class="t-btn" style="font-size:8px;padding:2px 6px;border-color:var(--green);color:var(--green);" onclick="laterToToday(${t.id});this.closest('.stash-checkin-row').style.opacity='.3';this.closest('.stash-checkin-row').style.pointerEvents='none';">→ today</button>
          <button class="t-btn" style="font-size:8px;padding:2px 6px;" onclick="stashSetDate(${t.id});this.closest('.stash-checkin-row').style.opacity='.3';this.closest('.stash-checkin-row').style.pointerEvents='none';">📅 date</button>
          <button class="t-btn" style="font-size:8px;padding:2px 6px;border-color:var(--red);color:var(--red);" onclick="dropLaterTask(${t.id});this.closest('.stash-checkin-row').style.opacity='.3';this.closest('.stash-checkin-row').style.pointerEvents='none';">✕</button>
        </div>
      </div>`;
    } else {
      const p=b.item;
      return `<div class="stash-checkin-row" style="display:flex;align-items:center;gap:6px;padding:8px 0;border-bottom:1px solid var(--border);">
        <span style="font-size:13px;">📌</span>
        <span style="flex:1;font-size:12px;">${p.text}</span>
        <div style="display:flex;gap:3px;flex-shrink:0;">
          <button class="t-btn" style="font-size:8px;padding:2px 6px;" onclick="promoteParkingItem(${p.id});this.closest('.stash-checkin-row').style.opacity='.3';this.closest('.stash-checkin-row').style.pointerEvents='none';">↑ task</button>
          <button class="t-btn" style="font-size:8px;padding:2px 6px;border-color:var(--red);color:var(--red);" onclick="removeParkingItem(${p.id});this.closest('.stash-checkin-row').style.opacity='.3';this.closest('.stash-checkin-row').style.pointerEvents='none';">✕</button>
        </div>
      </div>`;
    }
  }).join('');
  const remaining=all.length-batch.length;
  modal.innerHTML=`<div style="background:var(--card);border-radius:12px;padding:20px;max-width:440px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,.5);border:1px solid var(--border);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
      <h3 style="margin:0;font-size:15px;">📌 Daily Stash Check-in</h3>
      <button onclick="document.getElementById('dailyStashCheckin').remove()" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:18px;">✕</button>
    </div>
    <div style="font-size:10px;color:var(--dim);margin-bottom:10px;">Here are a few items from your stash. Pull to today, pick a date, or drop.</div>
    ${itemsHtml}
    ${remaining>0?`<div style="font-size:9px;color:var(--dim);text-align:center;padding:6px 0;">${remaining} more in stash</div>`:''}
    <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:12px;">
      <button onclick="openParkingReview();document.getElementById('dailyStashCheckin').remove();" class="t-btn" style="padding:5px 12px;font-size:10px;">See all</button>
      <button onclick="document.getElementById('dailyStashCheckin').remove()" class="t-btn" style="padding:5px 12px;font-size:10px;border-color:var(--green);color:var(--green);">Done</button>
    </div>
  </div>`;
  modal.onclick=(e)=>{if(e.target===modal)modal.remove();};
  document.body.appendChild(modal);
}
function stashSetDate(id){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  bccPrompt('Set date (YYYY-MM-DD):',todayStr(),(dt)=>{
    if(!dt||!/^\d{4}-\d{2}-\d{2}$/.test(dt))return;
    t.date=dt;
    save();renderCalTasks();renderAllTasks();renderCalendar();updateStats();
    if(typeof renderCalRightStash==='function')renderCalRightStash();
    const toast=document.getElementById('saveToast');if(toast){toast.innerHTML='📅 Scheduled for '+dt;toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1500);}
  });
}
function openParkingReview(){
  const old=document.getElementById('parkingReviewModal');if(old)old.remove();
  const modal=document.createElement('div');
  modal.id='parkingReviewModal';
  modal.style.cssText='position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(3px);';
  const parked=D.parkingItems||[];
  const laterTasks=D.tasks.filter(t=>!t.date&&!t.done&&t.cat!=='braindump');
  const backlog=D.backlog||[];
  const dump=D.brainDump||'';

  let laterHtml=laterTasks.length?laterTasks.map(t=>{
    const cat=D.cats[t.cat];
    return `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">
      <span style="font-size:12px;">${cat?cat.emoji:'📋'}</span>
      <span style="flex:1;font-size:12px;">${t.text}</span>
      <button onclick="laterToToday(${t.id});openParkingReview();" class="t-btn" style="font-size:9px;padding:2px 6px;border-color:var(--green);color:var(--green);">→ today</button>
      <button onclick="stashSetDate(${t.id});openParkingReview();" class="t-btn" style="font-size:9px;padding:2px 6px;">📅 date</button>
      <button onclick="dropLaterTask(${t.id});openParkingReview();" class="t-btn" style="font-size:9px;padding:2px 6px;border-color:var(--red);color:var(--red);">✕ drop</button>
    </div>`;
  }).join(''):'<div style="font-size:11px;color:var(--dim);padding:8px 0;">None</div>';

  let parkHtml=parked.length?parked.map((p,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">
    <span style="font-size:12px;">📌</span>
    <span style="flex:1;font-size:12px;">${p.text}</span>
    <button onclick="parkingItemDone(${p.id});openParkingReview();" class="t-btn" style="font-size:9px;padding:2px 6px;border-color:var(--green);color:var(--green);">✓ Done</button>
    <button onclick="promoteParkingItem(${p.id});openParkingReview();" class="t-btn" style="font-size:9px;padding:2px 6px;">↑ Task</button>
    <button onclick="removeParkingItem(${p.id});openParkingReview();" class="t-btn" style="font-size:9px;padding:2px 6px;border-color:var(--red);color:var(--red);">✕</button>
  </div>`).join(''):'<div style="font-size:11px;color:var(--dim);padding:8px 0;">None</div>';

  let backlogHtml=backlog.length?backlog.map((b,i)=>`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid var(--border);">
    <span style="font-size:12px;">${D.cats[b.cat]?D.cats[b.cat].emoji:'📋'}</span>
    <span style="flex:1;font-size:12px;">${b.text}</span>
    <button onclick="restoreFromBacklog(${i});openParkingReview();" class="t-btn" style="font-size:9px;padding:2px 6px;">↑ Restore</button>
  </div>`).join(''):'<div style="font-size:11px;color:var(--dim);padding:8px 0;">None</div>';

  let dumpHtml=dump.trim()?`<div style="font-size:11px;white-space:pre-wrap;background:var(--bg);border-radius:6px;padding:8px;max-height:120px;overflow-y:auto;border:1px solid var(--border);">${dump.replace(/</g,'&lt;')}</div>`:'<div style="font-size:11px;color:var(--dim);padding:8px 0;">Brain dump is empty</div>';

  modal.innerHTML=`<div style="background:var(--card);border-radius:12px;padding:20px;max-width:560px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.5);border:1px solid var(--border);">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
      <h3 style="margin:0;font-size:16px;">📌 Weekly Stash Review</h3>
      <button onclick="document.getElementById('parkingReviewModal').remove()" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:18px;">✕</button>
    </div>
    <div style="margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;color:var(--purple);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Later Tasks (${laterTasks.length})</div>
      ${laterHtml}
    </div>
    <div style="margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Parked Thoughts (${parked.length})</div>
      ${parkHtml}
    </div>
    <div style="margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Brain Dump</div>
      ${dumpHtml}
    </div>
    <div style="margin-bottom:16px;">
      <div style="font-size:11px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px;">Backlog (${backlog.length})</div>
      ${backlogHtml}
    </div>
    <div style="text-align:right;margin-top:12px;">
      <button onclick="document.getElementById('parkingReviewModal').remove()" class="t-btn" style="padding:6px 16px;">Done reviewing</button>
    </div>
  </div>`;
  modal.onclick=(e)=>{if(e.target===modal)modal.remove();};
  document.body.appendChild(modal);
}

// ===== QUICK WINS =====
if(!window._quickWins)window._quickWins=[];
function renderQuickWins(){
  const el=document.getElementById('quickWinsList');if(!el)return;
  const wins=window._quickWins;
  const badge=document.getElementById('quickWinsBadge');
  if(badge)badge.textContent=wins.length;
  const moveBtn=document.getElementById('qwMoveBtn');
  const hasChecked=wins.some(w=>w.checked);
  if(moveBtn)moveBtn.style.display=hasChecked?'':'none';
  if(!wins.length){el.innerHTML='<p style="font-size:10px;color:var(--dim);text-align:center;padding:6px;">Type what you did and hit enter — it saves as a win automatically</p>';return;}
  el.innerHTML=wins.map((w,i)=>`<div class="qw-item${w.checked?' checked':''}" id="qw-${i}">
    <span class="qw-check${w.checked?' qw-checked':''}" onclick="toggleQuickWin(${i})">
      ${w.checked?'<span class="mi" style="font-size:16px;color:var(--green);">check_circle</span>':'<span class="mi" style="font-size:16px;color:var(--border);">radio_button_unchecked</span>'}
    </span>
    <span class="qw-text">${w.text}</span>
    <button class="qw-del" onclick="deleteQuickWin(${i})">✕</button>
  </div>`).join('');
}
function addQuickWin(){
  const inp=document.getElementById('quickWinsInput');if(!inp)return;
  const text=inp.value.trim();if(!text)return;
  const today=todayStr();
  if(!D.reflections)D.reflections={};
  if(!D.reflections[today])D.reflections[today]={};
  if(!D.reflections[today].manualWins)D.reflections[today].manualWins=[];
  if(!D.reflections[today].manualWins.includes(text))D.reflections[today].manualWins.push(text);
  window._quickWins.push({text,checked:true,added:today});
  inp.value='';
  save();renderQuickWins();renderSidebarWins();
  setTimeout(()=>{
    const item=document.querySelector('#quickWinsList .qw-item:last-child');
    if(item)item.classList.add('qw-just-added');
  },10);
  const toast=document.getElementById('saveToast');
  if(toast){toast.innerHTML='✨ Saved to today\'s wins!';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1800);}
  if(typeof renderWinsTab==='function')renderWinsTab();
}
function toggleQuickWin(idx){
  if(!window._quickWins[idx])return;
  const w=window._quickWins[idx];
  w.checked=!w.checked;
  const today=todayStr();
  if(!D.reflections)D.reflections={};
  if(!D.reflections[today])D.reflections[today]={};
  if(!D.reflections[today].manualWins)D.reflections[today].manualWins=[];
  if(w.checked){
    if(!D.reflections[today].manualWins.includes(w.text))D.reflections[today].manualWins.push(w.text);
  } else {
    D.reflections[today].manualWins=D.reflections[today].manualWins.filter(x=>x!==w.text);
  }
  save();
  if(typeof renderWinsTab==='function')renderWinsTab();
  renderQuickWins();
}
function deleteQuickWin(idx){
  window._quickWins.splice(idx,1);renderQuickWins();
}
function moveCheckedWinsToWins(){
  const today=todayStr();
  if(!D.reflections)D.reflections={};
  if(!D.reflections[today])D.reflections[today]={};
  if(!D.reflections[today].manualWins)D.reflections[today].manualWins=[];
  const checked=window._quickWins.filter(w=>w.checked);
  checked.forEach(w=>{if(!D.reflections[today].manualWins.includes(w.text))D.reflections[today].manualWins.push(w.text);});
  window._quickWins=window._quickWins.filter(w=>!w.checked);
  save();renderQuickWins();
  const toast=document.getElementById('saveToast');
  if(toast){toast.innerHTML='✨ '+checked.length+' win'+(checked.length>1?'s':'')+' saved!';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),2000);}
}

// ===== SIDEBAR QUICK WINS =====
function renderSidebarWins(){
  const el=document.getElementById('sidebarWinsList');if(!el)return;
  const wins=window._quickWins||[];
  const badge=document.getElementById('sidebarWinsBadge');
  if(badge)badge.textContent=wins.length;
  if(!wins.length){el.innerHTML='<p style="font-size:10px;color:var(--dim);text-align:center;padding:6px;">Log a win — you deserve it</p>';return;}
  el.innerHTML=wins.map((w,i)=>`<div class="qw-item${w.checked?' checked':''}" id="sqw-${i}">
    <span class="qw-check${w.checked?' qw-checked':''}" onclick="toggleQuickWin(${i});renderSidebarWins();">
      ${w.checked?'<span class="mi" style="font-size:16px;color:var(--green);">check_circle</span>':'<span class="mi" style="font-size:16px;color:var(--border);">radio_button_unchecked</span>'}
    </span>
    <span class="qw-text">${w.text}</span>
    <button class="qw-del" onclick="deleteQuickWin(${i});renderSidebarWins();">✕</button>
  </div>`).join('');
}
function addQuickWinSidebar(){
  const inp=document.getElementById('sidebarWinsInput');if(!inp)return;
  const text=inp.value.trim();if(!text)return;
  const today=todayStr();
  if(!D.reflections)D.reflections={};
  if(!D.reflections[today])D.reflections[today]={};
  if(!D.reflections[today].manualWins)D.reflections[today].manualWins=[];
  if(!D.reflections[today].manualWins.includes(text))D.reflections[today].manualWins.push(text);
  window._quickWins.push({text,checked:true,added:today});
  const evDate=checkWinForScheduledEvent(text);
  inp.value='';
  save();renderSidebarWins();renderQuickWins();
  const toast=document.getElementById('saveToast');
  if(evDate){
    if(toast){toast.innerHTML='📅 Event created for '+new Date(dateObj(evDate)).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),2200);}
    if(typeof renderCalendar==='function')renderCalendar();
  } else {
    if(toast){toast.innerHTML='✨ Saved to today\'s wins!';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1800);}
  }
  if(typeof renderWinsTab==='function')renderWinsTab();
}

// ===== EDIT MODAL =====
// ===== TASK RIGHT-CLICK CONTEXT MENU =====
function openTaskCtx(e,id){
  const old=document.getElementById('taskCtxMenu');if(old)old.remove();
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  const menu=document.createElement('div');
  menu.id='taskCtxMenu';
  menu.style.cssText=`position:fixed;left:${Math.min(e.clientX,window.innerWidth-170)}px;top:${Math.min(e.clientY,window.innerHeight-140)}px;z-index:200;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:4px;box-shadow:0 8px 24px rgba(0,0,0,.4);min-width:150px;`;
  menu.innerHTML=`
    <div style="padding:4px 10px;font-size:10px;font-weight:600;color:var(--dim);border-bottom:1px solid var(--border);margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:180px;">${t.text}</div>
    <button class="wk-ctx-btn" onclick="document.getElementById('taskCtxMenu').remove();openEdit(${id});">
      <span class="mi" style="font-size:14px;">edit</span> Edit
    </button>
    <button class="wk-ctx-btn" onclick="const _t=D.tasks.find(x=>x.id===${id});if(_t){_t.urgent=!_t.urgent;save();renderAll();}document.getElementById('taskCtxMenu').remove();">
      <span class="mi" style="font-size:14px;color:var(--red);">bolt</span> ${t.urgent?'Un-mark ASAP':'Mark ASAP ⚡'}
    </button>
    <button class="wk-ctx-btn" onclick="document.getElementById('taskCtxMenu').remove();openRemindPicker(event,${id});">
      <span class="mi" style="font-size:14px;">snooze</span> Remind later
    </button>
    <button class="wk-ctx-btn" onclick="document.getElementById('taskCtxMenu').remove();deferToTomorrow(${id});">
      <span class="mi" style="font-size:14px;">arrow_forward</span> Move to tomorrow
    </button>
    <button class="wk-ctx-btn" onclick="document.getElementById('taskCtxMenu').remove();deferToLater(${id});">
      <span class="mi" style="font-size:14px;">inventory_2</span> Move to Queue
    </button>
    <button class="wk-ctx-btn" onclick="document.getElementById('taskCtxMenu').remove();delTask(${id});" style="color:var(--red);">
      <span class="mi" style="font-size:14px;">delete</span> Delete
    </button>`;
  document.body.appendChild(menu);
  const dismiss=(ev)=>{if(!menu.contains(ev.target)){menu.remove();document.removeEventListener('mousedown',dismiss);}};
  setTimeout(()=>document.addEventListener('mousedown',dismiss),10);
}

let editId=null;
function openEdit(id){const t=D.tasks.find(x=>x.id===id);if(!t)return;editId=id;buildCatSelects();document.getElementById('edText').value=t.text;const edCatEl=document.getElementById('edCat');edCatEl.value=t.cat&&D.cats[t.cat]?t.cat:Object.keys(D.cats)[0];document.getElementById('edPri').value=t.pri||'med';document.getElementById('edDate').value=t.date||'';
  const edRem=document.getElementById('edRemindAt');
  if(edRem){
    if(t.remindAt){const d=new Date(t.remindAt);const pad=n=>String(n).padStart(2,'0');edRem.value=d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())+'T'+pad(d.getHours())+':'+pad(d.getMinutes());}
    else edRem.value='';
  }
  const edEffortEl=document.getElementById('edEffort');
  if(edEffortEl){edEffortEl.innerHTML=Object.entries(EFFORT_TAGS).map(([k,v])=>`<button type="button" class="effort-chip${t.effort===k?' active':''}" data-effort="${k}" onclick="document.querySelectorAll('#edEffort .effort-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active');" style="${t.effort===k?'color:'+v.color+';border-color:'+v.color:''}">${v.emoji} ${v.label}</button>`).join('')+`<button type="button" class="effort-chip${!t.effort?' active':''}" data-effort="" onclick="document.querySelectorAll('#edEffort .effort-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active');">None</button>`;}
  const edDiffEl=document.getElementById('edDiff');
  if(edDiffEl){edDiffEl.innerHTML=Object.entries(DIFF_TAGS).map(([k,v])=>`<button type="button" class="effort-chip${t.diff===k?' active':''}" data-diff="${k}" onclick="document.querySelectorAll('#edDiff .effort-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active');" style="${t.diff===k?'color:'+v.color+';border-color:'+v.color:''}">${v.emoji} ${v.label}</button>`).join('')+`<button type="button" class="effort-chip${!t.diff?' active':''}" data-diff="" onclick="document.querySelectorAll('#edDiff .effort-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active');">None</button>`;}
  document.getElementById('editModal').classList.add('show');}
function closeModal(){document.getElementById('editModal').classList.remove('show');editId=null;}
function saveModal(){const t=D.tasks.find(x=>x.id===editId);if(!t)return;t.text=document.getElementById('edText').value;t.cat=document.getElementById('edCat').value;t.pri=document.getElementById('edPri').value;const newDate=document.getElementById('edDate').value;const oldDate=t.date;t.date=newDate;const activeChip=document.querySelector('#edEffort .effort-chip.active');t.effort=activeChip?activeChip.dataset.effort:'';
  const activeDiff=document.querySelector('#edDiff .effort-chip.active');t.diff=activeDiff?activeDiff.dataset.diff:'';
  const remVal=document.getElementById('edRemindAt')?.value;
  if(remVal){t.remindAt=new Date(remVal).toISOString();}else{delete t.remindAt;}
  save();closeModal();renderSidebarTasks();renderAllTasks();renderLegend();
  // If date was changed and has a date, offer to add to calendar
  if(newDate&&newDate!==oldDate){taskToCalBlock(t.id);}
}
function deleteFromModal(){trashTask(editId);closeModal();renderSidebarTasks();renderAllTasks();updateStats();}

// ===== CAT MANAGER =====
function buildCatSelects(){
  const opts=Object.entries(D.cats).map(([k,v])=>`<option value="${k}">${v.icon?'●':v.emoji} ${v.label}</option>`).join('');
  document.getElementById('edCat').innerHTML=opts;
  const qaCat=document.getElementById('qaCat');if(qaCat)qaCat.innerHTML=catPickerOptions();
  const slCat=document.getElementById('swimlaneAddCat');
  if(slCat){slCat.innerHTML=Object.entries(D.cats).filter(([k,v])=>(!v._hidePick)).map(([k,v])=>`<option value="${k}" ${k==='personal'?'selected':''}>${v.emoji} ${v.label}</option>`).join('');}
}
function openCatMgr(){renderCatList();renderColorSwatches();renderEmojiGrid();renderIconGrid();document.getElementById('catModal').classList.add('show');}
function closeCatMgr(){document.getElementById('catModal').classList.remove('show');buildCatSelects();renderLegend();updateDynamicBlockCSS();renderCalendar();renderAllTasks();}

function renderCatIcon(v){
  if(v.icon)return `<span class="mi" style="color:${v.color};font-size:20px;">${v.icon}</span>`;
  return `<span style="font-size:16px;">${v.emoji}</span>`;
}

function renderCatList(){
  document.getElementById('catList').innerHTML=Object.entries(D.cats).map(([k,v])=>`<div class="cat-row" style="display:flex;gap:6px;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);">
    <button class="cat-icon-btn" onclick="openIconPicker('${k}')" title="Change icon" style="background:none;border:1px solid var(--border);border-radius:6px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .15s;flex-shrink:0;">
      ${renderCatIcon(v)}
    </button>
    <input type="text" value="${v.label}" onchange="D.cats['${k}'].label=this.value.trim();save();" style="flex:1;background:transparent;border:none;border-bottom:1px solid transparent;color:var(--text);font-size:13px;font-weight:500;outline:none;padding:2px 0;font-family:inherit;" onfocus="this.style.borderBottomColor='var(--blue)'" onblur="this.style.borderBottomColor='transparent'">
    <label style="cursor:pointer;position:relative;flex-shrink:0;">
      <span class="cat-color-dot" data-key="${k}" style="width:22px;height:22px;border-radius:6px;background:${v.color};display:inline-block;vertical-align:middle;border:2px solid rgba(255,255,255,.1);cursor:pointer;transition:transform .15s,box-shadow .15s;" title="Click to change color"></span>
      <input type="color" value="${v.color}" style="position:absolute;opacity:0;width:0;height:0;" onchange="updateCatColor('${k}',this.value,this)">
    </label>
    <button class="task-act-btn" onclick="if(confirm('Delete this category?')){delete D.cats['${k}'];save();renderCatList();}" style="font-size:13px;" title="Delete">x</button>
  </div>`).join('');
}
function updateCatColor(key,color,input){
  D.cats[key].color=color;save();
  // Update the dot visually without re-rendering
  const dot=input.parentElement.querySelector('.cat-color-dot');
  if(dot)dot.style.background=color;
  renderLegend();updateDynamicBlockCSS();
}

// Icon picker for existing categories
let editingCatKey=null;
function openIconPicker(key){
  editingCatKey=key;
  // Show a small popup near the button
  const popup=document.getElementById('catIconPopup');
  if(popup)popup.remove();
  const div=document.createElement('div');
  div.id='catIconPopup';
  div.style.cssText='position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px;z-index:10001;max-width:300px;box-shadow:0 8px 24px rgba(0,0,0,.3);';
  div.innerHTML=`<div style="font-size:11px;font-weight:600;margin-bottom:6px;color:var(--dim);">Pick icon for ${D.cats[key].label}</div>
    <div style="display:flex;gap:4px;margin-bottom:6px;">
      <button class="qa-mode active" onclick="this.parentElement.parentElement.querySelector('.ep').style.display='';this.parentElement.parentElement.querySelector('.ip').style.display='none';this.classList.add('active');this.nextElementSibling.classList.remove('active');" style="font-size:9px;padding:3px 8px;">Emoji</button>
      <button class="qa-mode" onclick="this.parentElement.parentElement.querySelector('.ep').style.display='none';this.parentElement.parentElement.querySelector('.ip').style.display='';this.classList.add('active');this.previousElementSibling.classList.remove('active');" style="font-size:9px;padding:3px 8px;">Icons</button>
    </div>
    <div class="ep"><div class="emoji-grid">${EMOJI_PICKS.map(e=>`<div class="emoji-pick" onclick="setCatIcon('${editingCatKey}','${e}','emoji')">${e}</div>`).join('')}</div></div>
    <div class="ip" style="display:none;"><div class="emoji-grid">${MATERIAL_ICONS.map(ic=>`<div class="emoji-pick" onclick="setCatIcon('${editingCatKey}','${ic}','icon')" title="${ic}"><span class="mi" style="font-size:18px;">${ic}</span></div>`).join('')}</div></div>
    <button class="t-btn" onclick="this.parentElement.remove();" style="margin-top:8px;width:100%;font-size:10px;">Close</button>`;
  document.body.appendChild(div);
}
function setCatIcon(key,val,type){
  if(type==='emoji'){D.cats[key].emoji=val;delete D.cats[key].icon;}
  else{D.cats[key].icon=val;D.cats[key].emoji='';}
  save();renderCatList();renderLegend();
  const popup=document.getElementById('catIconPopup');if(popup)popup.remove();
}

const COLOR_SWATCHES=[
  '#fb7185','#f43f5e','#e11d48','#be123c',
  '#f97316','#ea580c','#fbbf24','#f59e0b',
  '#a3e635','#84cc16','#34d399','#10b981',
  '#2dd4bf','#14b8a6','#06b6d4','#0ea5e9',
  '#60a5fa','#3b82f6','#818cf8','#6366f1',
  '#a78bfa','#8b5cf6','#c084fc','#a855f7',
  '#e879f9','#d946ef','#f0abfc','#c026d3',
  '#fb923c','#78716c','#94a3b8','#64748b',
];
const EMOJI_PICKS=['🏥','🔬','📚','💕','🏠','🏃','🧠','📌','💼','🎯','🔥','⭐','💡','🎵','🎨','✈️','🍎','💪','🌿','☕','📝','🎓','💻','📊','🗓️','❤️','🌙','☀️','🚀','🎉','🛒','🧹','📦','🚗','📞','✏️','🩺','🏋️','🧘','🎶'];
const MATERIAL_ICONS=['home','school','work','call','favorite','star','local_hospital','science','menu_book','volunteer_activism','shopping_cart','fitness_center','self_improvement','directions_run','restaurant','local_cafe','edit_note','schedule','event','checklist','psychology','lightbulb','medical_services','stethoscope','biotech','groups','family_restroom','elderly','local_grocery_store','receipt_long','local_shipping','drive_eta','flight','pets','eco','spa','music_note','palette','code','analytics'];

let selectedSwatchColor='#60a5fa';
let selectedEmoji='';
let iconMode='emoji';

function setIconMode(mode){
  iconMode=mode;
  document.getElementById('iconModeEmoji').classList.toggle('active',mode==='emoji');
  document.getElementById('iconModeIcon').classList.toggle('active',mode==='icon');
  document.getElementById('iconPickerEmoji').style.display=mode==='emoji'?'':'none';
  document.getElementById('iconPickerIcon').style.display=mode==='icon'?'':'none';
}

function renderColorSwatches(){
  const el=document.getElementById('colorSwatches');
  el.innerHTML=COLOR_SWATCHES.map(c=>`<div class="color-swatch ${c===selectedSwatchColor?'selected':''}" style="background:${c};" onclick="pickSwatch('${c}',this)"></div>`).join('');
}
function pickSwatch(color,el){
  selectedSwatchColor=color;
  document.getElementById('newCatColor').value=color;
  document.querySelectorAll('.color-swatch').forEach(s=>s.classList.remove('selected'));
  el.classList.add('selected');
}

function renderEmojiGrid(){
  const el=document.getElementById('emojiGrid');
  el.innerHTML=EMOJI_PICKS.map(e=>`<div class="emoji-pick ${e===selectedEmoji?'selected':''}" onclick="pickEmoji('${e}',this)">${e}</div>`).join('');
}
function pickEmoji(emoji,el){
  selectedEmoji=emoji;
  document.getElementById('newCatEmoji').value=emoji;
  document.querySelectorAll('.emoji-pick').forEach(s=>s.classList.remove('selected'));
}

function renderIconGrid(filter){
  const el=document.getElementById('iconGrid');
  const filtered=filter?MATERIAL_ICONS.filter(ic=>ic.includes(filter.toLowerCase())):MATERIAL_ICONS;
  el.innerHTML=filtered.map(ic=>`<div class="emoji-pick" onclick="pickMaterialIcon('${ic}',this)" title="${ic}"><span class="mi" style="font-size:18px;">${ic}</span></div>`).join('');
}
function filterIcons(val){renderIconGrid(val);}
function pickMaterialIcon(icon,el){
  selectedEmoji='';
  document.getElementById('newCatEmoji').value='';
  document.querySelectorAll('#iconGrid .emoji-pick').forEach(s=>s.classList.remove('selected'));
  el.classList.add('selected');
  // Store on a temp var
  window._selectedMaterialIcon=icon;
}

function addCategory(){
  const label=document.getElementById('newCatLabel').value.trim();if(!label)return;
  const color=document.getElementById('newCatColor').value||selectedSwatchColor;
  const emoji=document.getElementById('newCatEmoji').value.trim()||'📌';
  const key=label.toLowerCase().replace(/[^a-z0-9]/g,'').slice(0,12);
  if(iconMode==='icon'&&window._selectedMaterialIcon){
    D.cats[key]={emoji:'',label,color,icon:window._selectedMaterialIcon};
  } else {
    D.cats[key]={emoji,label,color};
  }
  save();renderCatList();buildCatSelects();renderLegend();
  document.getElementById('newCatLabel').value='';document.getElementById('newCatEmoji').value='';
  selectedEmoji='';window._selectedMaterialIcon=null;
  renderColorSwatches();renderEmojiGrid();renderIconGrid();
  updateDynamicBlockCSS();
}

function _lightenHex(hex,amt){
  let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  r=Math.min(255,r+amt);g=Math.min(255,g+amt);b=Math.min(255,b+amt);
  return '#'+[r,g,b].map(c=>c.toString(16).padStart(2,'0')).join('');
}
function _darkenHex(hex,amt){
  let r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);
  r=Math.max(0,r-amt);g=Math.max(0,g-amt);b=Math.max(0,b-amt);
  return '#'+[r,g,b].map(c=>c.toString(16).padStart(2,'0')).join('');
}
function updateDynamicBlockCSS(){
  let styleEl=document.getElementById('dynamicCatCSS');
  if(!styleEl){styleEl=document.createElement('style');styleEl.id='dynamicCatCSS';document.head.appendChild(styleEl);}
  let css='';
  Object.entries(D.cats).forEach(([k,v])=>{
    const hex=v.color;
    const light=_lightenHex(hex,60);
    const dark=_darkenHex(hex,80);
    css+=`.wk-block.${k}{background:${hex}22;border-color:${hex};color:${light};}`;
    css+=`.dv-ev.${k}{background:${hex}1a;border-color:${hex};color:${light};}`;
    css+=`.mo-cell .mo-block.${k}{background:${hex}22;color:${light};border-left:2px solid ${hex};}`;
    css+=`:root.light .wk-block.${k}{background:${hex}18;border-color:${hex};color:${dark};}`;
    css+=`:root.light .dv-ev.${k}{background:${hex}12;border-color:${hex};color:${dark};}`;
  });
  css+=`.wk-block._task{background:#f8717122;border-color:#f87171;color:#fca5a5;}`;
  css+=`.dv-ev._task{background:#f871711a;border-color:#f87171;color:#fca5a5;}`;
  css+=`.mo-cell .mo-block._task{background:#f8717122;color:#fca5a5;border-left:2px solid #f87171;}`;
  css+=`:root.light .wk-block._task{background:#f8717118;border-color:#f87171;color:#dc2626;}`;
  css+=`:root.light .dv-ev._task{background:#f8717112;border-color:#f87171;color:#dc2626;}`;
  css+=`.wk-block._todo{background:#60a5fa22;border-color:#60a5fa;color:#93c5fd;}`;
  css+=`.dv-ev._todo{background:#60a5fa1a;border-color:#60a5fa;color:#93c5fd;}`;
  css+=`.mo-cell .mo-block._todo{background:#60a5fa22;color:#93c5fd;border-left:2px solid #60a5fa;}`;
  css+=`:root.light .wk-block._todo{background:#60a5fa18;border-color:#60a5fa;color:#2563eb;}`;
  css+=`:root.light .dv-ev._todo{background:#60a5fa12;border-color:#60a5fa;color:#2563eb;}`;
  // Meetings/calls/events: always peach, independent of the chop (work) category color
  // so general CHOP work can be slate while meetings stay peach.
  const mtg=(typeof MEETING_PEACH!=='undefined')?MEETING_PEACH:'#f0a884';
  const mtgLight=_lightenHex(mtg,40);
  const mtgDark=_darkenHex(mtg,90);
  const mtgBar=_darkenHex(mtg,30);
  css+=`.wk-block.is-meeting,.dv-block.is-meeting{background:${mtg}4d!important;border-color:${mtg}!important;border-left-color:${mtgBar}!important;color:${mtgLight}!important;}`;
  css+=`.wk-block.is-meeting *,.dv-block.is-meeting *{color:${mtgLight}!important;}`;
  css+=`:root.light .wk-block.is-meeting,:root.light .dv-block.is-meeting{background:${mtg}6b!important;border-color:${mtgBar}!important;border-left-color:${mtgBar}!important;color:${mtgDark}!important;}`;
  css+=`:root.light .wk-block.is-meeting *,:root.light .dv-block.is-meeting *{color:${mtgDark}!important;}`;
  styleEl.textContent=css;
}

// Mobile sidebar toggle
function toggleMobileSidebar(){
  const sb=document.querySelector('.sidebar');
  sb.classList.toggle('mobile-open');
  if(sb.classList.contains('mobile-open')){
    document.body.style.overflow='hidden';
  } else {
    document.body.style.overflow='';
  }
}
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){
    const sb=document.querySelector('.sidebar');
    if(sb&&sb.classList.contains('mobile-open')){toggleMobileSidebar();}
  }
});

// ===== INBOX =====
function dumpToInbox(){
  const lines=document.getElementById('brainDump').value.split('\n').filter(l=>l.trim());if(!lines.length)return;
  const today=todayStr();
  lines.forEach(l=>{D.tasks.push({id:D.nextId++,text:l.trim(),cat:'braindump',pri:'med',done:false,date:today});});
  document.getElementById('brainDump').value='';D.brainDump='';save();renderInbox();renderSidebarTasks();
}
function renderInbox(){
  const inboxTasks=D.tasks.filter(t=>t.cat==='braindump'&&!t.done);
  document.getElementById('inboxCount').textContent=inboxTasks.length;
  const el=document.getElementById('inboxItems');
  if(!inboxTasks.length){el.innerHTML='<p style="font-size:11px;color:var(--dim);text-align:center;padding:10px;">Empty</p>';return;}
  const catOpts=catPickerOptions();
  el.innerHTML=inboxTasks.map(t=>{
    const hasRemind=t.remindAt&&new Date(t.remindAt)>new Date();
    const remindLabel=hasRemind?new Date(t.remindAt).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'';
    return `<div class="task-item" style="margin-bottom:2px;">
    <div style="flex:1;"><div class="t-label">${t.text}${hasRemind?`<span style="font-size:9px;color:var(--amber);margin-left:6px;">⏰ ${remindLabel}</span>`:''}</div></div>
    <button class="task-act-btn" onclick="remindBrainDumpItem(event,${t.id})" title="Remind me about this" style="color:var(--amber);"><span class="mi" style="font-size:14px;">notifications</span></button>
    <select onchange="if(this.value){const tk=D.tasks.find(x=>x.id===${t.id});if(tk){tk.cat=this.value;save();renderInbox();renderSidebarTasks();renderLegend();}}" style="font-size:10px;padding:3px 6px;background:var(--bg);border:1px solid var(--border);border-radius:5px;color:var(--text);max-width:120px;">
      <option value="">Move to...</option>${catOpts}
    </select>
    <button class="task-act-btn" onclick="trashTask(${t.id});renderInbox();">x</button>
  </div>`;}).join('');
}

// Brain dump item → reminder picker (mirrors openRemindPicker but writes a calendar block too)
function remindBrainDumpItem(e,id){
  e.stopPropagation();
  const old=document.getElementById('bdRemindMenu');if(old)old.remove();
  const menu=document.createElement('div');
  menu.id='bdRemindMenu';
  menu.style.cssText=`position:fixed;left:${Math.min(e.clientX,window.innerWidth-200)}px;top:${Math.min(e.clientY,window.innerHeight-260)}px;z-index:200;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:4px;box-shadow:0 8px 24px rgba(0,0,0,.4);min-width:180px;`;
  const hr=new Date().getHours();
  let btns=`<div style="padding:4px 10px;font-size:10px;font-weight:600;color:var(--dim);border-bottom:1px solid var(--border);margin-bottom:2px;">Remind me about this...</div>`;
  btns+=`<button class="wk-ctx-btn" onclick="document.getElementById('bdRemindMenu').remove();brainDumpToReminder(${id},30);"><span style="font-size:12px;margin-right:4px;">⏰</span> In 30 min</button>`;
  btns+=`<button class="wk-ctx-btn" onclick="document.getElementById('bdRemindMenu').remove();brainDumpToReminder(${id},60);"><span style="font-size:12px;margin-right:4px;">⏰</span> In 1 hour</button>`;
  btns+=`<button class="wk-ctx-btn" onclick="document.getElementById('bdRemindMenu').remove();brainDumpToReminder(${id},120);"><span style="font-size:12px;margin-right:4px;">⏰</span> In 2 hours</button>`;
  if(hr<18)btns+=`<button class="wk-ctx-btn" onclick="document.getElementById('bdRemindMenu').remove();brainDumpToReminderAt(${id},18,0);"><span style="font-size:12px;margin-right:4px;">🌆</span> Tonight 6 PM</button>`;
  btns+=`<button class="wk-ctx-btn" onclick="document.getElementById('bdRemindMenu').remove();brainDumpToReminderAt(${id},9,0,true);"><span style="font-size:12px;margin-right:4px;">🌅</span> Tomorrow 9 AM</button>`;
  btns+=`<button class="wk-ctx-btn" onclick="document.getElementById('bdRemindMenu').remove();brainDumpToReminderCustom(${id});"><span class="mi" style="font-size:14px;">event</span> Pick date/time...</button>`;
  menu.innerHTML=btns;
  document.body.appendChild(menu);
  const dismiss=ev=>{if(!menu.contains(ev.target)){menu.remove();document.removeEventListener('mousedown',dismiss);}};
  setTimeout(()=>document.addEventListener('mousedown',dismiss),10);
}

function brainDumpToReminder(id,minsFromNow){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  const target=new Date(Date.now()+minsFromNow*60000);
  _scheduleBrainDumpReminder(t,target);
}
function brainDumpToReminderAt(id,hr,min,tomorrow){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  const target=new Date();
  if(tomorrow)target.setDate(target.getDate()+1);
  target.setHours(hr,min,0,0);
  if(!tomorrow&&target<=new Date())target.setDate(target.getDate()+1);
  _scheduleBrainDumpReminder(t,target);
}
function brainDumpToReminderCustom(id){
  const t=D.tasks.find(x=>x.id===id);if(!t)return;
  bccPrompt('Remind date & time (YYYY-MM-DD HH:MM):',todayStr()+' 15:00',(dt)=>{
    if(!dt)return;
    const parsed=new Date(dt.replace(' ','T'));
    if(isNaN(parsed.getTime())){alert('Invalid date/time');return;}
    _scheduleBrainDumpReminder(t,parsed);
  });
}
function _scheduleBrainDumpReminder(t,target){
  t.remindAt=target.toISOString();
  // Drop a matching calendar block on the target date
  const dateKey=dateStr(target);
  const startMin=target.getHours()*60+target.getMinutes();
  const tl=getTimeline(dateKey)||[];
  let idx=tl.length;
  for(let j=0;j<tl.length;j++){if(parseMin(tl[j].t)>startMin){idx=j;break;}}
  tl.splice(idx,0,{
    t:minToTime(startMin),
    text:'⏰ '+t.text,
    cls:'reminder',
    sm:'From brain dump',
    loc:'',
    end:minToTime(Math.min(24*60-1,startMin+15)),
    _id:'rem_bd_'+t.id+'_'+Date.now(),
    _reminder:true,
    _bdSourceId:t.id
  });
  setTimeline(dateKey,tl);
  save();renderInbox();renderCalendar();renderMiniCal();
  const label=target.toLocaleString([],{weekday:'short',hour:'numeric',minute:'2-digit'});
  const toast=document.getElementById('saveToast');
  if(toast){toast.innerHTML='⏰ Reminder set · '+label;toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1800);}
}

// ===== MOBILE TASKS VIEW =====
function renderMobileTasks(){
  const pane=document.getElementById('tasksActivePane');
  if(!pane)return;
  pane.style.display='';
  const pp=document.getElementById('tasksParkingPane');if(pp)pp.style.display='none';
  const bp=document.getElementById('tasksBacklogPane');if(bp)bp.style.display='none';

  const today=todayStr();
  const tmrw=dateStr(new Date(new Date().getTime()+86400000));
  const priOrd={high:0,med:1,low:2};
  const active=D.tasks.filter(t=>!t.done&&t.cat!=='braindump'&&!isSnoozed(t));
  const done=D.tasks.filter(t=>t.done&&t.cat!=='braindump');

  const todayTasks=active.filter(t=>t.date===today||t.date<today&&t.date).sort((a,b)=>priOrd[a.pri]-priOrd[b.pri]);
  const tmrwTasks=active.filter(t=>t.date===tmrw).sort((a,b)=>priOrd[a.pri]-priOrd[b.pri]);
  const laterTasks=active.filter(t=>!t.date||(t.date>tmrw)).sort((a,b)=>priOrd[a.pri]-priOrd[b.pri]);

  function taskRow(t,section){
    const cat=D.cats[t.cat];
    const catOpts=Object.entries(D.cats||{}).filter(([k,v])=>(!v._hidePick||k===t.cat)).map(([k,v])=>`<option value="${k}" ${t.cat===k?'selected':''}>${v.emoji} ${v.label}</option>`).join('');
    let actions='';
    if(section==='today'){
      actions=`<button onclick="openRemindPicker(event,${t.id})" style="font-size:10px;padding:4px 8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--pink);cursor:pointer;">⏰</button>
        <button onclick="deferToTomorrow(${t.id})" style="font-size:10px;padding:4px 8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--dim);cursor:pointer;">tmrw</button>
        <button onclick="deferToLater(${t.id})" style="font-size:10px;padding:4px 8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--dim);cursor:pointer;">later</button>`;
    } else if(section==='tomorrow'){
      actions=`<button onclick="laterToToday(${t.id})" style="font-size:10px;padding:4px 8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--dim);cursor:pointer;">today</button>
        <button onclick="deferToLater(${t.id})" style="font-size:10px;padding:4px 8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--dim);cursor:pointer;">later</button>`;
    } else {
      actions=`<button onclick="laterToToday(${t.id})" style="font-size:10px;padding:4px 8px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--dim);cursor:pointer;">today</button>`;
    }
    return `<div style="display:flex;align-items:flex-start;gap:8px;padding:10px 12px;background:var(--card);border:1px solid var(--border);border-radius:10px;margin-bottom:6px;">
      <input type="checkbox" onchange="togTask(${t.id},this)" style="width:20px;height:20px;flex-shrink:0;margin-top:2px;">
      <div style="flex:1;min-width:0;">
        <div style="font-size:13px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.text}</div>
        <div style="margin-top:4px;display:flex;gap:6px;align-items:center;flex-wrap:wrap;">
          <select onchange="(function(el){var tk=D.tasks.find(function(x){return x.id===${t.id};});if(tk){tk.cat=el.value;save();renderMobileTasks();}})(this)" style="font-size:10px;padding:2px 4px;background:var(--bg);border:1px solid var(--border);border-radius:6px;color:var(--dim);max-width:110px;">${catOpts}</select>
        </div>
      </div>
      <div style="display:flex;gap:4px;flex-shrink:0;flex-wrap:wrap;justify-content:flex-end;margin-top:2px;">${actions}</div>
    </div>`;
  }

  let h=`<div style="padding:4px 0;">
    <div style="margin-bottom:6px;">
      <input type="text" id="mobileTaskAdd" placeholder="+ Add a task..."
        onkeydown="if(event.key==='Enter'){const v=this.value.trim();if(v){D.tasks.push({id:D.nextId++,text:v,cat:'personal',pri:'med',done:false,date:'${today}'});this.value='';save();renderMobileTasks();updateStats();}}"
        style="width:100%;padding:12px 14px;font-size:14px;background:var(--card);border:1px solid var(--border);border-radius:10px;color:var(--text);outline:none;font-family:inherit;">
    </div>`;

  // Today
  h+=`<div style="margin-bottom:16px;">
    <div style="font-size:13px;font-weight:700;color:var(--blue);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
      <span class="mi" style="font-size:18px;">today</span> Today <span style="font-size:11px;font-weight:500;color:var(--dim);">${todayTasks.length}</span>
    </div>`;
  if(todayTasks.length) todayTasks.forEach(t=>{h+=taskRow(t,'today');});
  else h+=`<div style="font-size:12px;color:var(--dim);padding:12px;text-align:center;">Nothing for today</div>`;
  h+=`</div>`;

  // Tomorrow
  h+=`<div style="margin-bottom:16px;">
    <div style="font-size:13px;font-weight:700;color:var(--purple);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
      <span class="mi" style="font-size:18px;">wb_sunny</span> Tomorrow <span style="font-size:11px;font-weight:500;color:var(--dim);">${tmrwTasks.length}</span>
    </div>`;
  if(tmrwTasks.length) tmrwTasks.forEach(t=>{h+=taskRow(t,'tomorrow');});
  else h+=`<div style="font-size:12px;color:var(--dim);padding:12px;text-align:center;">Nothing for tomorrow</div>`;
  h+=`</div>`;

  // Later
  h+=`<div style="margin-bottom:16px;">
    <div style="font-size:13px;font-weight:700;color:var(--dim);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
      <span class="mi" style="font-size:18px;">schedule</span> Later <span style="font-size:11px;font-weight:500;color:var(--dim);">${laterTasks.length}</span>
    </div>`;
  if(laterTasks.length) laterTasks.forEach(t=>{h+=taskRow(t,'later');});
  else h+=`<div style="font-size:12px;color:var(--dim);padding:12px;text-align:center;">Nothing stashed</div>`;
  h+=`</div>`;

  // Done — shown right after today, newest first
  if(done.length){
    const sortedDone=done.sort((a,b)=>(b.doneAt||0)-(a.doneAt||0));
    h+=`<div style="margin-bottom:16px;">
      <div style="font-size:13px;font-weight:700;color:var(--green);margin-bottom:8px;display:flex;align-items:center;gap:6px;">
        <span class="mi" style="font-size:18px;">check_circle</span> Done today <span style="font-size:11px;font-weight:500;color:var(--dim);">${sortedDone.length}</span>
      </div>`;
    sortedDone.forEach(t=>{
      const cat=D.cats[t.cat];
      h+=`<div style="display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--card);border:1px solid var(--border);border-radius:10px;margin-bottom:4px;opacity:.5;">
        <input type="checkbox" checked onchange="togTask(${t.id},this)" style="width:20px;height:20px;">
        <span style="font-size:13px;text-decoration:line-through;flex:1;">${cat?cat.emoji:''} ${t.text}</span>
      </div>`;
    });
    h+=`</div>`;
  }
  h+=`</div>`;

  pane.innerHTML=h;
  // Hide desktop elements
  const subtabs=document.querySelector('#p-tasks .tasks-subtabs');if(subtabs)subtabs.style.display='none';
  const sidebar=document.getElementById('tasksCatSidebar');if(sidebar)sidebar.style.display='none';
  const mainInbox=document.getElementById('tasksMainInbox');if(mainInbox)mainInbox.style.display='none';
  const doneSection=document.getElementById('swimlaneDoneSection');if(doneSection)doneSection.style.display='none';
  const addBar=document.querySelector('.swimlane-add-bar');if(addBar)addBar.style.display='none';
}


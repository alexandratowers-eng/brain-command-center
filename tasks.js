// ===== CALENDAR TASK PANEL =====
function renderTasksForDate(containerId,dt){
  const el=document.getElementById(containerId);
  if(!el)return;
  const tasks=D.tasks.filter(t=>t.date===dt&&t.cat!=='braindump').sort((a,b)=>{if(a.done!==b.done)return a.done?1:-1;const p={high:0,med:1,low:2};return p[a.pri]-p[b.pri];});
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
        <div class="t-label" style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${cat?cat.emoji:''}${t.effort&&EFFORT_TAGS[t.effort]?'<span class="task-effort-badge">'+EFFORT_TAGS[t.effort].emoji+'</span>':''} ${t.text}</div>
        <div class="task-defer-btns">
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
}

// ===== SIDEBAR TASKS (delegates to calendar panels) =====
function renderSidebarTasks(){renderCalTasks();}
function addSidebarTask(inp){
  const text=inp.value.trim();if(!text)return;
  D.tasks.push({id:D.nextId++,text,cat:'personal',pri:'med',done:false,date:todayStr()});
  inp.value='';save();renderCalTasks();updateStats();
}
function togTask(id,el){const t=D.tasks.find(x=>x.id===id);if(!t)return;if(el&&el.checked!==undefined){t.done=el.checked;}else{t.done=!t.done;}if(t.done)celebrate();save();setTimeout(()=>{renderCalTasks();renderAllTasks();updateStats();},300);}
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

// ===== ALL TASKS (BOARD VIEW) =====
let _slCollapsed=JSON.parse(localStorage.getItem('swimlaneCollapsed')||'{}');
let _doneCollapsed=localStorage.getItem('doneCollapsed')!=='false';

function renderAllTasks(){
  const priOrd={high:0,med:1,low:2};
  const today=todayStr();
  const allActive=D.tasks.filter(t=>!t.done&&t.cat!=='braindump');
  const allDone=D.tasks.filter(t=>t.done&&t.cat!=='braindump');

  // --- CENTRAL TASK INBOX ---
  const inbox=document.getElementById('tasksMainInbox');
  if(inbox){
    const sorted=[...allActive].sort((a,b)=>{const p=priOrd[a.pri]-priOrd[b.pri];if(p!==0)return p;return (a.date||'z').localeCompare(b.date||'z');});
    let ihtml=`<h3><span class="mi" style="color:var(--blue);font-size:18px;">inbox</span> All Tasks <span class="badge">${sorted.length}</span></h3>`;
    if(!sorted.length){
      ihtml+=`<div style="text-align:center;padding:30px;color:var(--dim);font-size:12px;">No active tasks — add one above!</div>`;
    } else {
      sorted.forEach(t=>{
        const cat=D.cats[t.cat];
        const priE=t.pri==='high'?'🔴':t.pri==='low'?'🔵':'🟡';
        const dl=t.date?(t.date===today?'Today':new Date(t.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})):'No date';
        const catColor=cat?cat.color:'var(--blue)';
        ihtml+=`<div class="task-inbox-item" draggable="true" data-task-id="${t.id}" ondragstart="taskDragStart(event,${t.id})" ondragend="taskDragEnd(event)">
          <div class="p-dot ${t.pri}" style="flex-shrink:0;"></div>
          <input type="checkbox" onchange="togTask(${t.id},this)" style="flex-shrink:0;">
          <div style="flex:1;min-width:0;">
            <div style="font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${t.effort&&EFFORT_TAGS[t.effort]?'<span class="task-effort-badge">'+EFFORT_TAGS[t.effort].emoji+'</span>':''}${t.text}</div>
            <div style="font-size:9px;color:var(--dim);display:flex;gap:6px;align-items:center;margin-top:2px;">
              <span style="color:${catColor};">${cat?.emoji||'📌'} ${cat?.label||''}</span>
              <span>${dl}</span>
            </div>
          </div>
          <div style="display:flex;gap:3px;flex-shrink:0;align-items:center;">
            <div class="task-date-move">
              <button class="task-move-btn" onclick="event.stopPropagation();moveTaskDate(${t.id},-1)">◀</button>
              <span class="task-date-label" style="font-size:8px;min-width:32px;">${dl}</span>
              <button class="task-move-btn" onclick="event.stopPropagation();moveTaskDate(${t.id},1)">▶</button>
            </div>
            ${t.date?`<button class="task-to-cal-btn" onclick="event.stopPropagation();taskToCalBlock(${t.id})" title="Add to calendar as a block">📅 →cal</button>`:''}
            <button class="task-act-btn" onclick="event.stopPropagation();openEdit(${t.id})" style="font-size:10px;">edit</button>
            <button class="task-act-btn" onclick="event.stopPropagation();delTask(${t.id})" style="font-size:10px;">x</button>
          </div>
        </div>`;
      });
    }
    inbox.innerHTML=ihtml;
    // Drop zone for the inbox
    inbox.ondragover=e=>{e.preventDefault();inbox.classList.add('drag-over');};
    inbox.ondragleave=()=>inbox.classList.remove('drag-over');
    inbox.ondrop=e=>{e.preventDefault();inbox.classList.remove('drag-over');};
  }

  // --- CATEGORY SIDEBAR (swimlanes) ---
  const grouped={};
  Object.keys(D.cats).forEach(k=>{if(k==='braindump')return;grouped[k]=allActive.filter(t=>t.cat===k);});

  const catOrder=Object.keys(D.cats).filter(k=>k!=='braindump');
  catOrder.sort((a,b)=>{
    const aH=grouped[a]?.length>0?0:1,bH=grouped[b]?.length>0?0:1;
    if(aH!==bH)return aH-bH;
    if(grouped[a]?.length&&grouped[b]?.length){
      const aM=Math.min(...grouped[a].map(t=>priOrd[t.pri]||1));
      const bM=Math.min(...grouped[b].map(t=>priOrd[t.pri]||1));
      return aM-bM;
    }
    return 0;
  });

  const container=document.getElementById('swimlaneContainer');
  if(!container)return;
  let html='';

  catOrder.forEach(ck=>{
    const cat=D.cats[ck];if(!cat)return;
    const tasks=(grouped[ck]||[]).sort((a,b)=>priOrd[a.pri]-priOrd[b.pri]);
    const collapsed=_slCollapsed[ck]===true;
    const count=tasks.length;

    html+=`<div class="swimlane" data-cat="${ck}" ondragover="event.preventDefault();this.classList.add('drag-over');" ondragleave="this.classList.remove('drag-over');" ondrop="taskDropOnCat(event,'${ck}');this.classList.remove('drag-over');">
      <div class="swimlane-header" onclick="toggleSwimlane('${ck}')" style="border-left-color:${cat.color};">
        <span class="swimlane-icon">${cat.emoji||'📌'}</span>
        <span class="swimlane-label">${cat.label}</span>
        <span class="swimlane-count">${count>0?count+' left':'empty'}</span>
        <button class="swimlane-add-btn" onclick="event.stopPropagation();swimlaneCatAdd('${ck}')" title="Add task to ${cat.label}">+</button>
        <span class="swimlane-chevron">${collapsed?'▸':'▾'}</span>
      </div>`;

    if(!collapsed){
      html+=`<div class="swimlane-body">`;
      if(!tasks.length){
        html+=`<div class="swimlane-empty">Drop tasks here or click +</div>`;
      } else {
        tasks.forEach(t=>{
          const priE=t.pri==='high'?'🔴':t.pri==='low'?'🔵':'🟡';
          const dl=t.date?(t.date===today?'Today':new Date(t.date+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'})):'';
          html+=`<div class="swimlane-task" data-id="${t.id}" draggable="true" ondragstart="taskDragStart(event,${t.id})" ondragend="taskDragEnd(event)">
            <span class="swimlane-pri">${priE}</span>
            <input type="checkbox" onchange="togTask(${t.id},this)">
            <span class="swimlane-task-text">${t.text}</span>
            ${dl?`<span class="task-date-label" style="font-size:8px;">${dl}</span>`:''}
            <div class="task-actions"><button class="task-act-btn" onclick="openEdit(${t.id})">edit</button><button class="task-act-btn" onclick="delTask(${t.id})">x</button></div>
          </div>`;
        });
      }
      html+=`</div>`;
    }
    html+=`</div>`;
  });
  container.innerHTML=html;

  const doneEl=document.getElementById('swimlaneDoneSection');
  if(!doneEl)return;
  let dH=`<div class="swimlane swimlane-done">
    <div class="swimlane-header swimlane-header-done" onclick="toggleDoneSection()">
      <span class="swimlane-icon">✅</span>
      <span class="swimlane-label">Done</span>
      <span class="swimlane-count">${allDone.length} completed</span>
      <span class="swimlane-chevron">${_doneCollapsed?'▸':'▾'}</span>
    </div>`;
  if(!_doneCollapsed&&allDone.length){
    dH+=`<div class="swimlane-body swimlane-body-done">`;
    allDone.forEach(t=>{
      const cat=D.cats[t.cat];
      dH+=`<div class="swimlane-task done">
        <input type="checkbox" checked onchange="togTask(${t.id},this)">
        <span class="swimlane-task-text">${cat?.emoji||''} ${t.text}</span>
        <div class="task-actions"><button class="task-act-btn" onclick="delTask(${t.id})">x</button></div>
      </div>`;
    });
    dH+=`</div>`;
  }
  dH+=`</div>`;
  doneEl.innerHTML=allDone.length?dH:'';
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
function delTask(id){D.tasks=D.tasks.filter(t=>t.id!==id);save();renderSidebarTasks();renderAllTasks();updateStats();}

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
    D.reflections[today].manualWins.push(item.text);
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

  const tasks=D.tasks.filter(t=>t.date===dt&&!t.done&&t.cat!=='braindump').sort((a,b)=>{const p={high:0,med:1,low:2};return (p[a.pri]||1)-(p[b.pri]||1);});
  const activeSched=tl.filter(s=>!s.done).length;
  const activeCount=activeSched+tasks.length;
  const badge=document.getElementById('calRightTaskBadge');
  if(badge)badge.textContent=activeCount;

  if(!activeSched&&!tasks.length){
    el.innerHTML='<p style="font-size:10px;color:var(--dim);text-align:center;padding:8px;">No tasks or events for this day</p>';return;
  }

  // Build unified list — all items use the same block style
  function renderBlock(opts){
    const opacity=opts.done?0.4:opts.isPast?0.5:1;
    const currentDot=opts.isCurrent?'<span style="width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block;flex-shrink:0;animation:pulse 2s infinite;"></span>':'';
    const strikeStyle=opts.done?'text-decoration:line-through;':'';
    const subtitle=opts.subtitle||'';
    return `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;opacity:${opacity};border-bottom:1px solid var(--border);" ${opts.ctx||''}>
      <button onclick="event.stopPropagation();${opts.toggleAction}" style="background:none;border:1.5px solid ${opts.color};width:11px;height:11px;border-radius:50%;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:7px;color:${opts.color};padding:0;">${opts.done?'✓':''}</button>
      ${currentDot}
      <div style="flex:1;min-width:0;">
        <div style="font-size:11px;font-weight:600;${strikeStyle}">${opts.label}</div>
        ${subtitle?`<div style="font-size:9px;color:var(--dim);">${subtitle}</div>`:''}
      </div>
      <div style="width:3px;height:20px;border-radius:2px;background:${opts.color};flex-shrink:0;opacity:.6;"></div>
    </div>`;
  }

  let html='';

  // Schedule blocks
  tl.filter(slot=>!slot.done).forEach(slot=>{
    if(!slot._id)slot._id='s'+Date.now()+'_'+Math.floor(Math.random()*9999);
    const sid=slot._id;
    const cat=D.cats&&D.cats[slot.cls];
    const catColor=cat?cat.color:slot.cls==='focus'?'#fbbf24':slot.cls==='_task'?'#f87171':slot.cls==='_todo'?'#60a5fa':'var(--blue)';
    const startM=(typeof parseMin==='function')?parseMin(slot.t):0;
    const endM=slot.end?parseMin(slot.end):startM+60;
    html+=renderBlock({
      color:catColor, done:slot.done,
      isPast:isToday&&endM<=nowMin, isCurrent:isToday&&startM<=nowMin&&endM>nowMin,
      label:slot.text, subtitle:slot.t+(slot.end?' – '+slot.end:'')+(slot.loc?' · '+slot.loc:''),
      toggleAction:`togSlotDone('${dt}','${sid}')`, ctx:''
    });
  });

  // Tasks — same block style
  tasks.forEach(t=>{
    const cat=D.cats[t.cat];
    const catColor=cat?cat.color:'var(--dim)';
    const emoji=cat?cat.emoji:'';
    const effortTag=t.effort&&EFFORT_TAGS[t.effort]?EFFORT_TAGS[t.effort].emoji+' ':'';
    html+=renderBlock({
      color:catColor, done:t.done, isPast:false, isCurrent:false,
      label:emoji+' '+effortTag+t.text, subtitle:'',
      toggleAction:`togTask(${t.id})`, ctx:`oncontextmenu="event.preventDefault();openTaskCtx(event,${t.id});"`
    });
  });

  el.innerHTML=html;
}
function addCalRightTask(inp){
  const text=inp.value.trim();if(!text)return;
  const dt=(D.calView==='day'||D.calView==='tomorrow')?D.selectedDate:todayStr();
  D.tasks.push({id:D.nextId++,text,cat:'personal',pri:'med',done:false,date:dt});
  inp.value='';save();renderCalRightTasks();renderAllTasks();updateStats();
}
function renderCalRightCompleted(){
  const el=document.getElementById('calRightCompletedList');if(!el)return;
  const today=todayStr();
  const dt=(D.calView==='day'||D.calView==='tomorrow')?D.selectedDate:today;
  const tl=(typeof getTimeline==='function')?getTimeline(dt):[];
  const doneSlots=tl.filter(s=>s.done);
  const doneTasks=D.tasks.filter(t=>t.date===dt&&t.done&&t.cat!=='braindump');
  const total=doneSlots.length+doneTasks.length;
  const badge=document.getElementById('calRightCompletedBadge');
  if(badge)badge.textContent=total;
  if(!total){el.innerHTML='<p style="font-size:10px;color:var(--dim);text-align:center;padding:8px;">Nothing completed yet</p>';return;}
  let html='';
  doneSlots.forEach(slot=>{
    if(!slot._id)slot._id='s'+Date.now()+'_'+Math.floor(Math.random()*9999);
    const sid=slot._id;
    const cat=D.cats&&D.cats[slot.cls];
    const catColor=cat?cat.color:slot.cls==='focus'?'#fbbf24':slot.cls==='_task'?'#f87171':slot.cls==='_todo'?'#60a5fa':'var(--blue)';
    html+=`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);opacity:.6;">
      <button onclick="event.stopPropagation();togSlotDone('${dt}','${sid}')" style="background:${catColor};border:1.5px solid ${catColor};width:11px;height:11px;border-radius:50%;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:7px;color:#fff;padding:0;">✓</button>
      <div style="flex:1;min-width:0;">
        <div style="font-size:11px;text-decoration:line-through;color:var(--dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${(slot.text||'').replace(/</g,'&lt;')}</div>
      </div>
    </div>`;
  });
  doneTasks.forEach(t=>{
    const cat=D.cats[t.cat];
    const catColor=cat?cat.color:'var(--dim)';
    const emoji=cat?cat.emoji:'';
    html+=`<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);opacity:.6;" oncontextmenu="event.preventDefault();openTaskCtx(event,${t.id});">
      <button onclick="event.stopPropagation();togTask(${t.id})" style="background:${catColor};border:1.5px solid ${catColor};width:11px;height:11px;border-radius:50%;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:7px;color:#fff;padding:0;">✓</button>
      <div style="flex:1;min-width:0;">
        <div style="font-size:11px;text-decoration:line-through;color:var(--dim);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${emoji} ${t.text}</div>
      </div>
    </div>`;
  });
  el.innerHTML=html;
}
// Legacy compat — redirect old calls to unified stash
function renderCalRightLater(){renderCalRightStash();}
function renderCalRightParking(){renderCalRightStash();}
function renderCalRightBacklog(){renderCalRightStash();}

function renderCalRightStash(){
  const el=document.getElementById('calRightStashList');if(!el)return;
  const today=todayStr();
  const laterTasks=D.tasks.filter(t=>!t.date&&!t.done&&t.cat!=='braindump');
  const parked=D.parkingItems||[];
  const backlog=D.backlog||[];
  const total=laterTasks.length+parked.length+backlog.length;
  const badge=document.getElementById('calRightStashBadge');
  if(badge)badge.textContent=total;
  if(!total){el.innerHTML='<p style="font-size:10px;color:var(--dim);text-align:center;padding:8px;">Nothing stashed — your mind is clear</p>';return;}

  let html='';

  // Overdue reminders first
  const overdueParked=parked.filter(p=>p.remindDate&&p.remindDate<today);
  if(overdueParked.length){
    html+=`<div style="font-size:8px;font-weight:700;color:var(--amber);text-transform:uppercase;letter-spacing:.5px;padding:4px 0 2px;margin-top:2px;">⚠️ Needs attention</div>`;
    overdueParked.forEach(p=>{html+=stashParkRow(p,true);});
  }

  // Later tasks
  if(laterTasks.length){
    html+=`<div style="font-size:8px;font-weight:700;color:var(--purple);text-transform:uppercase;letter-spacing:.5px;padding:4px 0 2px;margin-top:4px;">Tasks for later (${laterTasks.length})</div>`;
    laterTasks.forEach(t=>{
      const cat=D.cats[t.cat];
      html+=`<div class="task-item" style="padding:3px 0;" oncontextmenu="event.preventDefault();openTaskCtx(event,${t.id});">
        <div class="p-dot ${t.pri}"></div>
        <div class="t-label" style="flex:1;font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${cat?cat.emoji:''}${t.effort&&EFFORT_TAGS[t.effort]?'<span class="task-effort-badge">'+EFFORT_TAGS[t.effort].emoji+'</span>':''} ${t.text}</div>
        <button class="defer-btn" onclick="laterToToday(${t.id})" title="Pull to today" style="font-size:9px;">→ today</button>
      </div>`;
    });
  }

  // Parked thoughts (non-overdue)
  const normalParked=parked.filter(p=>!p.remindDate||p.remindDate>=today);
  if(normalParked.length){
    html+=`<div style="font-size:8px;font-weight:700;color:var(--blue);text-transform:uppercase;letter-spacing:.5px;padding:4px 0 2px;margin-top:4px;">Parked thoughts (${normalParked.length})</div>`;
    normalParked.forEach(p=>{html+=stashParkRow(p,false);});
  }

  // Backlog
  if(backlog.length){
    html+=`<div style="font-size:8px;font-weight:700;color:var(--dim);text-transform:uppercase;letter-spacing:.5px;padding:4px 0 2px;margin-top:4px;">Dropped / backlog (${backlog.length})</div>`;
    backlog.slice(0,5).forEach(b=>{
      const cat=D.cats[b.cat];
      html+=`<div class="parking-item" style="padding:3px 0;">
        <span style="font-size:12px;">${cat?.emoji||'📌'}</span>
        <div class="pi-text" style="font-size:11px;">${b.text}</div>
        <button class="pi-act pi-promote" onclick="restoreFromBacklog(${b.id})" title="Restore to today" style="font-size:9px;">↑</button>
        <button class="pi-act pi-del" onclick="removeFromBacklog(${b.id})" title="Delete" style="font-size:9px;">✕</button>
      </div>`;
    });
    if(backlog.length>5) html+=`<p style="font-size:9px;color:var(--dim);text-align:center;">+${backlog.length-5} more</p>`;
  }
  el.innerHTML=html;
}
function stashParkRow(p,overdue){
  const dateLabel=p.remindDate?new Date(p.remindDate+'T12:00:00').toLocaleDateString('en-US',{month:'short',day:'numeric'}):'';
  return `<div class="parking-item" style="padding:3px 0;${overdue?'border-left:2px solid var(--amber);padding-left:4px;':''}">
    <span style="font-size:12px;">📌</span>
    <div class="pi-text" style="font-size:11px;flex:1;">
      ${p.text}
      ${dateLabel?`<div style="font-size:8px;color:${overdue?'var(--amber)':'var(--dim)'};margin-top:1px;">${overdue?'⚠️ ':'📅 '}${dateLabel}</div>`:''}
    </div>
    <button class="pi-act" onclick="dateParkingItem(${p.id})" title="Set reminder date" style="font-size:9px;color:var(--amber);">📅</button>
    <button class="pi-act" onclick="parkingItemDone(${p.id});renderCalRightStash();" title="Mark complete" style="font-size:9px;color:var(--green);">✓</button>
    <button class="pi-act pi-del" onclick="removeParkingItem(${p.id});renderCalRightStash();" title="Remove" style="font-size:9px;">✕</button>
  </div>`;
}

function addToStash(inp){
  const text=inp.value.trim();if(!text)return;
  if(!D.parkingItems)D.parkingItems=[];
  D.parkingItems.push({id:Date.now(),text,added:todayStr()});
  inp.value='';save();renderCalRightStash();renderParkingList();
}

function dateParkingItem(id){
  const p=(D.parkingItems||[]).find(x=>x.id===id);if(!p)return;
  const dt=prompt('Remind date (YYYY-MM-DD):',p.remindDate||todayStr());
  if(!dt)return;
  p.remindDate=dt;
  save();renderCalRightStash();
  if(typeof renderParkingList==='function')renderParkingList();
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
  const stashCount=(D.parkingItems||[]).length+(D.tasks.filter(t=>!t.date&&!t.done&&t.cat!=='braindump')).length;
  if(!stashCount)return;
  const today=new Date();
  if(today.getDay()!==5)return;
  const dt=todayStr();
  const tl=getTimeline(dt)||[];
  if(tl.some(s=>s.text&&s.text.includes('Review stash')||s.text&&s.text.includes('Review parked')))return;
  const lastReview=D._lastParkingReview||'';
  if(lastReview===dt)return;
  D._lastParkingReview=dt;
  const startMin=14*60;
  let idx=tl.length;
  for(let j=0;j<tl.length;j++){if(parseMin(tl[j].t)>startMin){idx=j;break;}}
  tl.splice(idx,0,{t:'2:00 PM',text:'📌 Review stash ('+stashCount+' items)',cls:'braindump',sm:'Weekly check — promote, delete, or defer',end:'2:30 PM'});
  setTimeline(dt,tl);save();
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
  D.reflections[today].manualWins.push(text);
  window._quickWins.push({text,checked:true,added:today});
  inp.value='';
  save();renderQuickWins();
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
  if(w.checked){
    const today=todayStr();
    if(!D.reflections)D.reflections={};
    if(!D.reflections[today])D.reflections[today]={};
    if(!D.reflections[today].manualWins)D.reflections[today].manualWins=[];
    D.reflections[today].manualWins.push(w.text);
    save();
    if(typeof renderWinsTab==='function')renderWinsTab();
  }
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
  checked.forEach(w=>D.reflections[today].manualWins.push(w.text));
  window._quickWins=window._quickWins.filter(w=>!w.checked);
  save();renderQuickWins();
  const toast=document.getElementById('saveToast');
  if(toast){toast.innerHTML='✨ '+checked.length+' win'+(checked.length>1?'s':'')+' saved!';toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),2000);}
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
    <button class="wk-ctx-btn" onclick="document.getElementById('taskCtxMenu').remove();deferToTomorrow(${id});">
      <span class="mi" style="font-size:14px;">arrow_forward</span> Move to tomorrow
    </button>
    <button class="wk-ctx-btn" onclick="document.getElementById('taskCtxMenu').remove();deferToLater(${id});">
      <span class="mi" style="font-size:14px;">inventory_2</span> Move to Stash
    </button>
    <button class="wk-ctx-btn" onclick="document.getElementById('taskCtxMenu').remove();delTask(${id});" style="color:var(--red);">
      <span class="mi" style="font-size:14px;">delete</span> Delete
    </button>`;
  document.body.appendChild(menu);
  const dismiss=(ev)=>{if(!menu.contains(ev.target)){menu.remove();document.removeEventListener('mousedown',dismiss);}};
  setTimeout(()=>document.addEventListener('mousedown',dismiss),10);
}

let editId=null;
function openEdit(id){const t=D.tasks.find(x=>x.id===id);if(!t)return;editId=id;document.getElementById('edText').value=t.text;document.getElementById('edCat').value=t.cat;document.getElementById('edPri').value=t.pri;document.getElementById('edDate').value=t.date||'';
  const ec=document.getElementById('edEffort');
  if(ec){ec.innerHTML=Object.entries(EFFORT_TAGS).map(([k,v])=>`<button type="button" class="effort-chip${t.effort===k?' active':''}" data-effort="${k}" onclick="document.querySelectorAll('#edEffort .effort-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active');" style="${t.effort===k?'color:'+v.color+';border-color:'+v.color:''}">${v.emoji} ${v.label}</button>`).join('')+`<button type="button" class="effort-chip${!t.effort?' active':''}" data-effort="" onclick="document.querySelectorAll('#edEffort .effort-chip').forEach(c=>c.classList.remove('active'));this.classList.add('active');">None</button>`;}
  document.getElementById('editModal').classList.add('show');}
function closeModal(){document.getElementById('editModal').classList.remove('show');editId=null;}
function saveModal(){const t=D.tasks.find(x=>x.id===editId);if(!t)return;t.text=document.getElementById('edText').value;t.cat=document.getElementById('edCat').value;t.pri=document.getElementById('edPri').value;const newDate=document.getElementById('edDate').value;const oldDate=t.date;t.date=newDate;const activeChip=document.querySelector('#edEffort .effort-chip.active');t.effort=activeChip?activeChip.dataset.effort:'';save();closeModal();renderSidebarTasks();renderAllTasks();renderLegend();
  // If date was changed and has a date, offer to add to calendar
  if(newDate&&newDate!==oldDate){taskToCalBlock(t.id);}
}
function deleteFromModal(){D.tasks=D.tasks.filter(t=>t.id!==editId);save();closeModal();renderSidebarTasks();renderAllTasks();updateStats();}

// ===== CAT MANAGER =====
function buildCatSelects(){
  const opts=Object.entries(D.cats).map(([k,v])=>`<option value="${k}">${v.icon?'●':v.emoji} ${v.label}</option>`).join('');
  const qaCat=document.getElementById('qaCat');if(qaCat)qaCat.innerHTML=opts;
  document.getElementById('edCat').innerHTML=opts;
  const slCat=document.getElementById('swimlaneAddCat');
  if(slCat){slCat.innerHTML=Object.entries(D.cats).filter(([k])=>k!=='braindump').map(([k,v])=>`<option value="${k}" ${k==='personal'?'selected':''}>${v.emoji} ${v.label}</option>`).join('');}
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
      <span class="cat-color-dot" data-key="${k}" style="width:22px;height:22px;border-radius:6px;background:${v.color};display:inline-block;vertical-align:middle;border:2px solid rgba(255,255,255,.1);"></span>
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
  const catOpts=Object.entries(D.cats).filter(([k])=>k!=='braindump').map(([k,v])=>`<option value="${k}">${v.emoji} ${v.label}</option>`).join('');
  el.innerHTML=inboxTasks.map(t=>`<div class="task-item" style="margin-bottom:2px;">
    <div style="flex:1;"><div class="t-label">${t.text}</div></div>
    <select onchange="if(this.value){const tk=D.tasks.find(x=>x.id===${t.id});if(tk){tk.cat=this.value;save();renderInbox();renderSidebarTasks();renderLegend();}}" style="font-size:10px;padding:3px 6px;background:var(--bg);border:1px solid var(--border);border-radius:5px;color:var(--text);max-width:120px;">
      <option value="">Move to...</option>${catOpts}
    </select>
    <button class="task-act-btn" onclick="D.tasks=D.tasks.filter(x=>x.id!==${t.id});save();renderInbox();">x</button>
  </div>`).join('');
}


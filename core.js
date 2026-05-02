// ===== INIT =====
// ===== THEME =====
function applyAutoTheme(){
  const manual=localStorage.getItem('alex_theme_override');
  // Only go light if user explicitly toggled it on
  document.documentElement.classList.toggle('light',manual==='light');
  updateThemeBtn();
}
function toggleTheme(){
  const isLight=document.documentElement.classList.contains('light');
  if(isLight){
    localStorage.setItem('alex_theme_override','dark');
    document.documentElement.classList.remove('light');
  } else {
    localStorage.setItem('alex_theme_override','light');
    document.documentElement.classList.add('light');
  }
  updateThemeBtn();
}
function resetThemeAuto(){
  localStorage.removeItem('alex_theme_override');
  applyAutoTheme();
}
function updateThemeBtn(){
  const btn=document.getElementById('themeBtn');
  if(!btn)return;
  const isLight=document.documentElement.classList.contains('light');
  btn.textContent=isLight?'🌙':'☀️';
  btn.title=isLight?'Switch to night mode':'Switch to day mode';
}

function init(){
  localStorage.removeItem('alex_theme_override');
  applyAutoTheme();
  document.getElementById('dateLabel').textContent=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});
  if(D.logoIcon) document.getElementById('logoIcon').textContent=D.logoIcon;
  if(D.logoText) document.getElementById('logoText').value=D.logoText;
  const savedHide=localStorage.getItem('sidebarHidden');
  if(savedHide==='true'){document.getElementById('sidebarEl').classList.add('hidden');document.querySelector('.app').classList.add('sidebar-hidden');}
  buildCatSelects();
  renderMiniCal();
  renderLegend();
  renderEnergy();
  generateCoachSuggestions();
  renderDistractions();
  renderTomorrowMode();
  checkOverdueTasks();
  renderSidebarTasks();
  updateDynamicBlockCSS();
  renderCalendar();
  renderMcat();
  document.getElementById('brainDump').value=D.brainDump||'';
  updateStats();
  updateTimerDisp();
  initMeetingNotes();
  if(typeof renderWeeklyGoal==='function')renderWeeklyGoal();
  restoreCollapsed();
  if(typeof checkMorningMotivation==='function')checkMorningMotivation();
  if(typeof checkEveningMotivation==='function')checkEveningMotivation();
  setInterval(()=>{renderCalendar();applyAutoTheme();generateCoachSuggestions();},60000);
  // On mobile, default to day view for easier use
  if(window.innerWidth<=900&&D.calView==='week'){setCalView('day');}
}

// ===== DATA DROPDOWN =====
function toggleDataMenu(){
  const menu=document.getElementById('dataMenu');
  menu.classList.toggle('open');
}
document.addEventListener('click',function(e){
  const dd=document.getElementById('dataDropdown');
  if(dd&&!dd.contains(e.target)){
    document.getElementById('dataMenu').classList.remove('open');
  }
});

// ===== SIDEBAR TOGGLE =====
function toggleSidebar(){
  const sb=document.getElementById('sidebarEl');
  const app=document.querySelector('.app');
  const hidden=sb.classList.toggle('hidden');
  app.classList.toggle('sidebar-hidden',hidden);
  if(hidden){
    // Clear inline styles from resize so CSS .hidden works
    sb.style.width='';
    app.style.gridTemplateColumns='';
  } else {
    // Restore saved width
    const saved=localStorage.getItem('sidebarWidth');
    if(saved&&parseInt(saved)>=180){
      sb.style.width=saved+'px';
      app.style.gridTemplateColumns=saved+'px 1fr';
    }
  }
  localStorage.setItem('sidebarHidden',hidden);
}

// ===== RIGHT PANEL TOGGLE =====
function toggleRightPanel(){
  const panel=document.getElementById('cal-right-panel');
  const cal=document.getElementById('p-cal');
  const btn=document.getElementById('rightPanelToggle');
  const handle=document.getElementById('rightPanelResize');
  if(!panel)return;
  const hidden=panel.classList.toggle('collapsed');
  cal.classList.toggle('right-hidden',hidden);
  if(handle)handle.style.display=hidden?'none':'';
  btn.textContent=hidden?'▶ Panel':'◀ Panel';
  if(hidden){
    cal.style.gridTemplateColumns='';
  } else {
    const saved=localStorage.getItem('rightPanelWidth');
    const w=saved?parseInt(saved):260;
    cal.style.gridTemplateColumns=`1fr 5px ${w}px`;
  }
  localStorage.setItem('rightPanelHidden',hidden);
}
(function(){
  const saved=localStorage.getItem('rightPanelHidden');
  if(saved==='true'){
    setTimeout(()=>{
      const panel=document.getElementById('cal-right-panel');
      const cal=document.getElementById('p-cal');
      const btn=document.getElementById('rightPanelToggle');
      if(panel){panel.classList.add('collapsed');cal.classList.add('right-hidden');if(btn)btn.textContent='▶ Panel';const rh=document.getElementById('rightPanelResize');if(rh)rh.style.display='none';}
    },0);
  }
})();

// ===== SIDEBAR RESIZE =====
(function(){
  const handle=document.getElementById('sidebarResize');
  if(!handle)return;
  let dragging=false,startX=0,startW=0;
  handle.addEventListener('mousedown',e=>{
    e.preventDefault();
    dragging=true;
    startX=e.clientX;
    startW=document.getElementById('sidebarEl').offsetWidth;
    handle.classList.add('active');
    document.body.style.cursor='col-resize';
    document.body.style.userSelect='none';
  });
  document.addEventListener('mousemove',e=>{
    if(!dragging)return;
    const w=Math.min(Math.max(180,startW+(e.clientX-startX)),window.innerWidth*0.5);
    document.querySelector('.app').style.gridTemplateColumns=w+'px 1fr';
    document.getElementById('sidebarEl').style.width=w+'px';
  });
  document.addEventListener('mouseup',()=>{
    if(!dragging)return;
    dragging=false;
    handle.classList.remove('active');
    document.body.style.cursor='';
    document.body.style.userSelect='';
    const w=document.getElementById('sidebarEl').offsetWidth;
    localStorage.setItem('sidebarWidth',w);
  });
  const saved=localStorage.getItem('sidebarWidth');
  if(saved){
    const w=parseInt(saved);
    if(w>=180){
      document.querySelector('.app').style.gridTemplateColumns=w+'px 1fr';
      document.getElementById('sidebarEl').style.width=w+'px';
    }
  }
})();

// ===== RIGHT PANEL RESIZE =====
(function(){
  const handle=document.getElementById('rightPanelResize');
  if(!handle)return;
  let dragging=false,startX=0,startW=0;
  handle.addEventListener('mousedown',e=>{
    e.preventDefault();
    dragging=true;
    startX=e.clientX;
    startW=document.querySelector('#cal-right-panel').offsetWidth;
    handle.classList.add('active');
    document.body.style.cursor='col-resize';
    document.body.style.userSelect='none';
  });
  document.addEventListener('mousemove',e=>{
    if(!dragging)return;
    const w=Math.min(Math.max(200,startW-(e.clientX-startX)),window.innerWidth*0.45);
    document.getElementById('p-cal').style.gridTemplateColumns=`1fr 5px ${w}px`;
  });
  document.addEventListener('mouseup',()=>{
    if(!dragging)return;
    dragging=false;
    handle.classList.remove('active');
    document.body.style.cursor='';
    document.body.style.userSelect='';
    const w=document.querySelector('#cal-right-panel').offsetWidth;
    localStorage.setItem('rightPanelWidth',w);
  });
  const saved=localStorage.getItem('rightPanelWidth');
  if(saved){
    const w=parseInt(saved);
    if(w>=200)document.getElementById('p-cal').style.gridTemplateColumns=`1fr 5px ${w}px`;
  }
})();

// ===== LEFT SIDEBAR CARD DRAG REORDER =====
(function(){
  const panel=document.getElementById('sidebarEl');
  if(!panel)return;
  let dragCard=null,placeholder=null,startY=0;
  function getCards(){return [...panel.querySelectorAll('.s-card')];}

  panel.addEventListener('mousedown',e=>{
    const handle=e.target.closest('.rp-drag-handle');
    if(!handle)return;
    if(!handle.closest('#sidebarEl'))return;
    e.preventDefault();e.stopPropagation();
    dragCard=handle.closest('.s-card');
    if(!dragCard)return;
    startY=e.clientY;
    const rect=dragCard.getBoundingClientRect();
    placeholder=document.createElement('div');
    placeholder.className='rp-drop-placeholder';
    placeholder.style.height=rect.height+'px';
    dragCard.parentNode.insertBefore(placeholder,dragCard);
    dragCard.style.position='fixed';
    dragCard.style.top=rect.top+'px';
    dragCard.style.left=rect.left+'px';
    dragCard.style.width=rect.width+'px';
    dragCard.style.zIndex='999';
    dragCard.style.opacity='.85';
    dragCard.style.boxShadow='0 4px 20px rgba(0,0,0,.3)';
    dragCard.style.pointerEvents='none';
    document.body.style.cursor='grabbing';
    document.body.style.userSelect='none';
  });

  document.addEventListener('mousemove',e=>{
    if(!dragCard||!placeholder||!dragCard.closest('body'))return;
    if(!dragCard.style.position)return;
    const dy=e.clientY-startY;
    const origTop=parseFloat(dragCard.style.top);
    dragCard.style.top=(origTop+dy)+'px';
    startY=e.clientY;
    const cards=getCards().filter(c=>c!==dragCard);
    const midY=e.clientY;
    let insertBefore=null;
    for(const c of cards){
      const r=c.getBoundingClientRect();
      if(midY<r.top+r.height/2){insertBefore=c;break;}
    }
    if(insertBefore){panel.insertBefore(placeholder,insertBefore);}
    else{panel.appendChild(placeholder);}
  });

  document.addEventListener('mouseup',()=>{
    if(!dragCard||!placeholder)return;
    panel.insertBefore(dragCard,placeholder);
    placeholder.remove();
    dragCard.style.position='';dragCard.style.top='';dragCard.style.left='';
    dragCard.style.width='';dragCard.style.zIndex='';dragCard.style.opacity='';
    dragCard.style.boxShadow='';dragCard.style.pointerEvents='';
    document.body.style.cursor='';document.body.style.userSelect='';
    const order=getCards().map(c=>c.dataset.card);
    localStorage.setItem('sidebarCardOrder',JSON.stringify(order));
    dragCard=null;placeholder=null;
  });

  const saved=localStorage.getItem('sidebarCardOrder');
  if(saved){
    try{
      const order=JSON.parse(saved);
      const cards=getCards();
      const map={};cards.forEach(c=>{map[c.dataset.card]=c;});
      order.forEach(key=>{if(map[key])panel.appendChild(map[key]);});
      cards.forEach(c=>{if(!order.includes(c.dataset.card))panel.appendChild(c);});
    }catch(e){}
  }
})();

// ===== RIGHT PANEL CARD DRAG REORDER =====
(function(){
  const panel=document.getElementById('cal-right-panel');
  if(!panel)return;
  let dragCard=null,placeholder=null,startY=0;
  function getCards(){return [...panel.querySelectorAll('.s-card')];}

  panel.addEventListener('mousedown',e=>{
    const handle=e.target.closest('.rp-drag-handle');
    if(!handle)return;
    e.preventDefault();
    e.stopPropagation();
    dragCard=handle.closest('.s-card');
    if(!dragCard)return;
    startY=e.clientY;
    const rect=dragCard.getBoundingClientRect();
    placeholder=document.createElement('div');
    placeholder.className='rp-drop-placeholder';
    placeholder.style.height=rect.height+'px';
    dragCard.parentNode.insertBefore(placeholder,dragCard);
    dragCard.style.position='fixed';
    dragCard.style.top=rect.top+'px';
    dragCard.style.left=rect.left+'px';
    dragCard.style.width=rect.width+'px';
    dragCard.style.zIndex='999';
    dragCard.style.opacity='.85';
    dragCard.style.boxShadow='0 4px 20px rgba(0,0,0,.3)';
    dragCard.style.pointerEvents='none';
    document.body.style.cursor='grabbing';
    document.body.style.userSelect='none';
  });

  document.addEventListener('mousemove',e=>{
    if(!dragCard||!placeholder)return;
    const dy=e.clientY-startY;
    const origTop=parseFloat(dragCard.style.top);
    dragCard.style.top=(origTop+dy)+'px';
    startY=e.clientY;
    const cards=getCards().filter(c=>c!==dragCard);
    const midY=e.clientY;
    let insertBefore=null;
    for(const c of cards){
      const r=c.getBoundingClientRect();
      if(midY<r.top+r.height/2){insertBefore=c;break;}
    }
    if(insertBefore){panel.insertBefore(placeholder,insertBefore);}
    else{panel.appendChild(placeholder);}
  });

  document.addEventListener('mouseup',()=>{
    if(!dragCard||!placeholder)return;
    panel.insertBefore(dragCard,placeholder);
    placeholder.remove();
    dragCard.style.position='';
    dragCard.style.top='';
    dragCard.style.left='';
    dragCard.style.width='';
    dragCard.style.zIndex='';
    dragCard.style.opacity='';
    dragCard.style.boxShadow='';
    dragCard.style.pointerEvents='';
    document.body.style.cursor='';
    document.body.style.userSelect='';
    const order=getCards().map(c=>c.dataset.card);
    localStorage.setItem('rpCardOrder',JSON.stringify(order));
    dragCard=null;placeholder=null;
  });

  // Restore saved order
  const saved=localStorage.getItem('rpCardOrder');
  if(saved){
    try{
      const order=JSON.parse(saved);
      const cards=getCards();
      const map={};cards.forEach(c=>{map[c.dataset.card]=c;});
      order.forEach(key=>{if(map[key])panel.appendChild(map[key]);});
      cards.forEach(c=>{if(!order.includes(c.dataset.card))panel.appendChild(c);});
    }catch(e){}
  }
})();

// ===== COLLAPSIBLE CARDS =====
function toggleCard(id,btn){
  const body=document.getElementById('cardBody-'+id);
  if(!body)return;
  body.classList.toggle('collapsed');
  btn.textContent=body.classList.contains('collapsed')?'▸':'▾';
  // Save state
  const collapsed=JSON.parse(localStorage.getItem('collapsedCards')||'{}');
  collapsed[id]=body.classList.contains('collapsed');
  localStorage.setItem('collapsedCards',JSON.stringify(collapsed));
}
function restoreCollapsed(){
  const collapsed=JSON.parse(localStorage.getItem('collapsedCards')||'{}');
  Object.entries(collapsed).forEach(([id,val])=>{
    if(val){
      const body=document.getElementById('cardBody-'+id);
      const card=document.querySelector(`[data-card="${id}"]`);
      if(body){body.classList.add('collapsed');}
      if(card){const btn=card.querySelector('.s-collapse');if(btn)btn.textContent='▸';}
    }
  });
}

// ===== TABS =====
function switchTab(id,el){
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  document.getElementById('p-'+id).classList.add('active');
  el.classList.add('active');
  const vt=document.getElementById('viewToggle');
  vt.style.display='flex';
  if(id==='tasks')renderAllTasks();
  if(id==='dump')renderInbox();
  if(id==='cal')renderCalendar();
  if(id==='wins')renderWinsTab();
  if(id==='rec'&&typeof renderMtgCalendarView==='function')renderMtgCalendarView();
}

// ===== CAL VIEW =====
function setCalView(v,el){
  D.calView=v;save();
  document.querySelectorAll('.vt-btn').forEach(b=>b.classList.remove('active'));
  if(el)el.classList.add('active');
  // Switch to calendar tab if not already there
  const calTab=document.querySelector('.tab-btn[onclick*="switchTab(\'cal\'"]');
  if(calTab&&!document.getElementById('p-cal').classList.contains('active')){
    switchTab('cal',calTab);
  } else {
    renderCalendar();
  }
}
function renderCalendar(){
  document.getElementById('calWeekView').style.display=D.calView==='week'?'block':'none';
  document.getElementById('calDayView').style.display=(D.calView==='day'||D.calView==='tomorrow')?'block':'none';
  document.getElementById('calMonthView').style.display=D.calView==='month'?'block':'none';
  if(D.calView==='week')renderWeekView();
  else if(D.calView==='day')renderDayView();
  else if(D.calView==='tomorrow'&&typeof renderTomorrowView==='function')renderTomorrowView();
  else renderMonthView();
  if(typeof renderCalRightTasks==='function')renderCalRightTasks();
  if(typeof renderCalRightCompleted==='function')renderCalRightCompleted();
  if(typeof renderCalRightParking==='function')renderCalRightParking();
  if(typeof renderCalRightBacklog==='function')renderCalRightBacklog();
}


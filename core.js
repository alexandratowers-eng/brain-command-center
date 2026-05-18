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
  if(typeof checkDailyMotivation==='function')checkDailyMotivation();
  if(typeof checkReminders==='function')checkReminders();
  setInterval(()=>{renderCalendar();applyAutoTheme();generateCoachSuggestions();if(typeof checkReminders==='function')checkReminders();},60000);
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
  const td=document.getElementById('templateDropdown');
  const tm=document.getElementById('templateMenu');
  if(td&&tm&&!td.contains(e.target)){
    tm.classList.remove('open');
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
  btn.textContent=hidden?'▶':'◀';
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

// ===== UNIFIED CARD DRAG — CROSS-PANEL REORDER =====
(function(){
  const sidebar=document.getElementById('sidebarEl');
  const rightPanel=document.getElementById('cal-right-panel');
  if(!sidebar||!rightPanel)return;
  const panels=[sidebar,rightPanel];
  const storageKeys={'sidebarEl':'sidebarCardOrder','cal-right-panel':'rpCardOrder'};
  let dragCard=null,placeholder=null,startY=0,sourcePanel=null,currentPanel=null;

  function getCards(p){return [...p.querySelectorAll('.s-card')];}

  function panelUnderCursor(x,y){
    for(const p of panels){
      const r=p.getBoundingClientRect();
      if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return p;
    }
    return null;
  }

  function saveOrder(p){
    const key=storageKeys[p.id];
    if(key)localStorage.setItem(key,JSON.stringify(getCards(p).map(c=>c.dataset.card)));
  }

  document.addEventListener('mousedown',e=>{
    const handle=e.target.closest('.rp-drag-handle');
    if(!handle)return;
    const card=handle.closest('.s-card');
    if(!card)return;
    const panel=panels.find(p=>p.contains(card));
    if(!panel)return;
    e.preventDefault();e.stopPropagation();
    dragCard=card;sourcePanel=panel;currentPanel=panel;
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
    dragCard.style.top=(parseFloat(dragCard.style.top)+dy)+'px';
    startY=e.clientY;
    const target=panelUnderCursor(e.clientX,e.clientY)||currentPanel;
    if(target!==currentPanel){
      currentPanel=target;
      panels.forEach(p=>p.classList.toggle('card-drop-target',p===target&&p!==sourcePanel));
    }
    if(placeholder.parentNode!==currentPanel)currentPanel.appendChild(placeholder);
    const cards=getCards(currentPanel).filter(c=>c!==dragCard);
    let insertBefore=null;
    for(const c of cards){
      const r=c.getBoundingClientRect();
      if(e.clientY<r.top+r.height/2){insertBefore=c;break;}
    }
    if(insertBefore)currentPanel.insertBefore(placeholder,insertBefore);
    else currentPanel.appendChild(placeholder);
  });

  document.addEventListener('mouseup',()=>{
    if(!dragCard||!placeholder)return;
    currentPanel.insertBefore(dragCard,placeholder);
    placeholder.remove();
    dragCard.style.position='';dragCard.style.top='';dragCard.style.left='';
    dragCard.style.width='';dragCard.style.zIndex='';dragCard.style.opacity='';
    dragCard.style.boxShadow='';dragCard.style.pointerEvents='';
    document.body.style.cursor='';document.body.style.userSelect='';
    panels.forEach(p=>p.classList.remove('card-drop-target'));
    saveOrder(sourcePanel);
    if(currentPanel!==sourcePanel)saveOrder(currentPanel);
    dragCard=null;placeholder=null;sourcePanel=null;currentPanel=null;
  });

  panels.forEach(p=>{
    const key=storageKeys[p.id];
    const saved=key&&localStorage.getItem(key);
    if(saved){
      try{
        const order=JSON.parse(saved);
        const cards=getCards(p);
        const map={};cards.forEach(c=>{map[c.dataset.card]=c;});
        order.forEach(k=>{if(map[k])p.appendChild(map[k]);});
        cards.forEach(c=>{if(!order.includes(c.dataset.card))p.appendChild(c);});
      }catch(e){}
    }
  });
})();

// ===== RIGHT PANEL CARD TITLE EDITING =====
(function(){
  const saved=JSON.parse(localStorage.getItem('rpCardTitles')||'{}');
  document.querySelectorAll('#cal-right-panel .s-card').forEach(card=>{
    const cardId=card.dataset.card;if(!cardId)return;
    const title=card.querySelector('.s-title');if(!title)return;
    // Apply saved title
    if(saved[cardId]){
      const textNodes=[...title.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim());
      if(textNodes.length)textNodes[0].textContent=' '+saved[cardId]+' ';
    }
    // Add edit button if not already there
    if(!title.querySelector('.rp-title-edit')){
      const btn=document.createElement('span');
      btn.className='mi rp-title-edit';
      btn.style.cssText='font-size:11px;color:var(--dim);cursor:pointer;opacity:0;transition:opacity .15s;margin-left:2px;';
      btn.textContent='edit';
      btn.title='Rename this section';
      btn.onclick=function(e){
        e.stopPropagation();
        const textNodes=[...title.childNodes].filter(n=>n.nodeType===3&&n.textContent.trim());
        const currentText=textNodes.length?textNodes[0].textContent.trim():'';
        const newName=prompt('Rename card:',currentText);
        if(newName!==null&&newName.trim()){
          if(textNodes.length)textNodes[0].textContent=' '+newName.trim()+' ';
          const titles=JSON.parse(localStorage.getItem('rpCardTitles')||'{}');
          titles[cardId]=newName.trim();
          localStorage.setItem('rpCardTitles',JSON.stringify(titles));
        }
      };
      const collapse=title.querySelector('.s-collapse');
      if(collapse)title.insertBefore(btn,collapse);
      else title.appendChild(btn);
      title.addEventListener('mouseenter',()=>{btn.style.opacity='1';});
      title.addEventListener('mouseleave',()=>{btn.style.opacity='0';});
    }
  });
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
  const panel=document.getElementById('p-'+id);
  if(panel)panel.classList.add('active');
  if(el)el.classList.add('active');
  const vt=document.getElementById('viewToggle');
  if(vt)vt.style.display=(id==='cal')?'flex':'none';
  const mvt=document.getElementById('mobileViewToggle');
  if(mvt)mvt.style.display=(id==='cal')?'':'none';
  if(id==='tasks')renderAllTasks();
  if(id==='dump'){renderInbox();if(typeof initWorryNotes==='function')initWorryNotes();}
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
function toggleDayDropdown(){
  document.getElementById('vtDayMenu').classList.toggle('show');
}
function closeDayDropdown(){
  document.getElementById('vtDayMenu').classList.remove('show');
}
document.addEventListener('click',function(e){
  var menu=document.getElementById('vtDayMenu');
  if(menu&&!e.target.closest('.vt-dropdown'))menu.classList.remove('show');
});

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
  if(typeof renderCalRightWinsDone==='function')renderCalRightWinsDone();
  if(typeof renderCalRightTrash==='function')renderCalRightTrash();
}


// ===== MEETING/EVENT/CALL COLOR OVERRIDE =====
function isMeetingBlock(slot){
  if(!slot||!slot.text)return false;
  if(slot.cls==='errands')return true;
  const lc=slot.text.toLowerCase();
  return /\b(meeting|call|zoom|teams|standup|huddle|touchbase|touch base|check-in|check in|1[:\s]?on[:\s]?1|sync|appointment|appt|event|conference|interview|webinar)\b/i.test(lc);
}
function getBlockColor(slot){
  if(isMeetingBlock(slot))return '#fde68a';
  if(slot.cls==='focus')return '#fbbf24';
  if(slot.cls==='_task')return '#f87171';
  if(slot.cls==='_todo')return '#60a5fa';
  const cat=D.cats[slot.cls];
  return cat?cat.color:'var(--blue)';
}

// ===== QUICK-ADD AGENT =====
function parseQuickAdd(raw){
  let text=raw.trim();
  if(!text)return null;
  let result={title:'',date:null,time:null,duration:30,cat:'personal',details:'',loc:''};
  const today=new Date();
  const todayDow=today.getDay();

  // --- Extract time range "10am-12pm" or "10:30am-11:30am" ---
  const rangeRe=/\b(\d{1,2}(?::\d{2})?\s*(?:am|pm))\s*[-–to]+\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i;
  const rangeM=text.match(rangeRe);
  if(rangeM){
    result.time=parseTimeStr(rangeM[1]);
    const endMin=parseTimeStr(rangeM[2]);
    if(endMin>result.time)result.duration=endMin-result.time;
    text=text.replace(rangeM[0],'');
  }

  // --- Extract "at <time>" ---
  if(result.time===null){
    const atRe=/\b(?:at\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm))\b/i;
    const atM=text.match(atRe);
    if(atM){
      result.time=parseTimeStr(atM[1]);
      text=text.replace(atM[0],'');
    }
  }

  // --- "at noon" / "at midnight" ---
  if(result.time===null){
    if(/\bat\s+noon\b/i.test(text)){result.time=720;text=text.replace(/\bat\s+noon\b/i,'');}
    else if(/\bnoon\b/i.test(text)){result.time=720;text=text.replace(/\bnoon\b/i,'');}
    else if(/\bat\s+midnight\b/i.test(text)){result.time=0;text=text.replace(/\bat\s+midnight\b/i,'');}
  }

  // --- Extract duration "for 1hr", "for 30min", "for 1.5 hours" ---
  const durRe=/\bfor\s+(\d+(?:\.\d+)?)\s*(hr|hrs|hour|hours|h|min|mins|minutes|m)\b/i;
  const durM=text.match(durRe);
  if(durM){
    const n=parseFloat(durM[1]);
    const unit=durM[2].toLowerCase();
    result.duration=unit.startsWith('h')?Math.round(n*60):Math.round(n);
    text=text.replace(durM[0],'');
  }

  // --- Extract date ---
  const dowNames=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const dowShort=['sun','mon','tue','wed','thu','fri','sat'];
  const monthNames=['january','february','march','april','may','june','july','august','september','october','november','december'];
  const monthShort=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];

  if(/\btomorrow\b/i.test(text)){
    const d=new Date(today);d.setDate(d.getDate()+1);
    result.date=dateStr(d);
    text=text.replace(/\btomorrow\b/i,'');
  } else if(/\btoday\b/i.test(text)){
    result.date=todayStr();
    text=text.replace(/\btoday\b/i,'');
  } else if(/\btonight\b/i.test(text)){
    result.date=todayStr();
    if(result.time===null)result.time=20*60;
    text=text.replace(/\btonight\b/i,'');
  }

  // "next monday", "this friday", "monday", "fri"
  if(!result.date){
    const nextDowRe=new RegExp('\\b(?:next\\s+|this\\s+)?('+dowNames.join('|')+'|'+dowShort.join('|')+')\\b','i');
    const dowM=text.match(nextDowRe);
    if(dowM){
      const dayName=dowM[1].toLowerCase();
      let targetDow=dowNames.indexOf(dayName);
      if(targetDow===-1)targetDow=dowShort.indexOf(dayName);
      if(targetDow!==-1){
        const isNext=/next/i.test(dowM[0]);
        let diff=targetDow-todayDow;
        if(diff<=0)diff+=7;
        if(isNext&&diff<7)diff+=7;
        const d=new Date(today);d.setDate(d.getDate()+diff);
        result.date=dateStr(d);
        text=text.replace(dowM[0],'');
      }
    }
  }

  // "april 28", "apr 28", "4/28"
  if(!result.date){
    const mdRe=new RegExp('\\b('+monthNames.join('|')+'|'+monthShort.join('|')+')\\s+(\\d{1,2})\\b','i');
    const mdM=text.match(mdRe);
    if(mdM){
      const mName=mdM[1].toLowerCase();
      let mi=monthNames.indexOf(mName);
      if(mi===-1)mi=monthShort.indexOf(mName);
      const day=parseInt(mdM[2]);
      const d=new Date(today.getFullYear(),mi,day);
      if(d<today)d.setFullYear(d.getFullYear()+1);
      result.date=dateStr(d);
      text=text.replace(mdM[0],'');
    }
  }
  if(!result.date){
    const slashRe=/\b(\d{1,2})\/(\d{1,2})\b/;
    const slashM=text.match(slashRe);
    if(slashM){
      const mo=parseInt(slashM[1])-1,day=parseInt(slashM[2]);
      const d=new Date(today.getFullYear(),mo,day);
      if(d<today)d.setFullYear(d.getFullYear()+1);
      result.date=dateStr(d);
      text=text.replace(slashM[0],'');
    }
  }

  // Default to today
  if(!result.date)result.date=todayStr();

  // Default time to next rounded 15min if not specified
  if(result.time===null){
    const now=new Date();
    result.time=Math.ceil((now.getHours()*60+now.getMinutes())/15)*15;
    if(result.time>=24*60)result.time=23*60+45;
  }

  // --- Category detection ---
  const lc=text.toLowerCase();
  if(/\b(mcat|anki|qbank|uworld|kaplan|content\s*review|cars|p\/s)\b/i.test(lc))result.cat='mcat';
  else if(/\b(meeting|mtg|standup|huddle|touchbase|call|phone|zoom|teams)\b/i.test(lc))result.cat='errands';
  else if(/\b(chop|cold\s*call)\b/i.test(lc))result.cat='chop';
  else if(/\b(gym|pool|swim|walk|run|jog|dogs?\s*out|exercise|workout|hike|bike)\b/i.test(lc))result.cat='exercise';
  else if(/\b(med\s*app|application|personal\s*statement|secondary|amcas|experience)\b/i.test(lc))result.cat='medapp';
  else if(/\b(brain\s*dump|journal|dump|reflect)\b/i.test(lc))result.cat='braindump';
  else if(/\b(gma|grandma|grandmother|errand|grocery|pharmacy|doctor)\b/i.test(lc))result.cat='personal';
  else if(/\b(lunch|dinner|breakfast|eat|cook|meal)\b/i.test(lc))result.cat='personal';
  else if(/\b(break|rest|nap|chill|relax|free)\b/i.test(lc))result.cat='free';
  else result.cat='personal';

  // --- Clean up title ---
  result.title=text.replace(/\b(at|on|for|from|the)\b/gi,'').replace(/\s+/g,' ').replace(/^[\s,\-–]+|[\s,\-–]+$/g,'').trim();
  if(!result.title){
    const cat=D.cats[result.cat];
    result.title=cat?cat.emoji+' '+cat.label:'Block';
  }

  return result;
}

function parseTimeStr(s){
  const m=s.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if(!m)return null;
  let hr=parseInt(m[1]),min=parseInt(m[2])||0;
  const ap=m[3].toLowerCase();
  if(ap==='pm'&&hr!==12)hr+=12;
  if(ap==='am'&&hr===12)hr=0;
  return hr*60+min;
}

// --- Preview & Add ---
let _qaParsed=null;
function qaInputHandler(val){
  const preview=document.getElementById('qaPreview');
  const addBtn=document.getElementById('qaAddBtn');
  if(!val.trim()){
    preview.innerHTML='';
    addBtn.style.display='none';
    _qaParsed=null;
    return;
  }
  const p=parseQuickAdd(val);
  _qaParsed=p;
  if(!p){preview.innerHTML='';addBtn.style.display='none';return;}

  const d=dateObj(p.date);
  const dayLabel=p.date===todayStr()?'Today':p.date===dateStr(new Date(new Date().getTime()+86400000))?'Tomorrow':d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
  const timeLabel=minToTime(p.time);
  const durLabel=p.duration<60?p.duration+'m':Math.floor(p.duration/60)+'h'+(p.duration%60?p.duration%60+'m':'');
  const cat=D.cats[p.cat];
  const catLabel=p.cat==='free'?'Break':cat?cat.emoji+' '+cat.label:'';
  const catColor=p.cat==='free'?'var(--dim)':cat?cat.color:'var(--blue)';

  preview.innerHTML=`<span class="qa-chip" style="border-color:${catColor}40;background:${catColor}15;color:${catColor};">📅 ${dayLabel} ${timeLabel} · ${durLabel} · ${catLabel}</span>  <span class="qa-title-preview">"${p.title}"</span>`;
  addBtn.style.display='inline-flex';
}

function quickAddBlock(){
  if(!_qaParsed)return;
  const p=_qaParsed;
  const t=minToTime(p.time);
  const endTime=minToTime(Math.min(24*60,p.time+p.duration));
  const block={t,text:p.title,cls:p.cat,sm:p.details,loc:p.loc,end:endTime};

  const tl=getTimeline(p.date)||[];
  let idx=tl.length;
  for(let j=0;j<tl.length;j++){if(parseMin(tl[j].t)>p.time){idx=j;break;}}
  tl.splice(idx,0,block);
  setTimeline(p.date,tl);

  // Navigate to that date
  D.selectedDate=p.date;
  renderCalendar();renderMiniCal();

  // Clear input
  document.getElementById('qaInput').value='';
  document.getElementById('qaPreview').innerHTML='';
  document.getElementById('qaAddBtn').style.display='none';
  _qaParsed=null;

  // Toast
  const toast=document.getElementById('saveToast');
  if(toast){
    const d=dateObj(p.date);
    const dayLabel=p.date===todayStr()?'today':d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
    toast.innerHTML=`✓ Added "${p.title}" ${dayLabel} at ${minToTime(p.time)}`;
    toast.classList.add('show');
    clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),2500);
  }
}

// Wire up input
document.addEventListener('DOMContentLoaded',()=>{
  const inp=document.getElementById('qaInput');
  if(!inp)return;
  let _qaDebounce=null;
  inp.addEventListener('input',()=>{
    clearTimeout(_qaDebounce);
    _qaDebounce=setTimeout(()=>qaInputHandler(inp.value),150);
  });
  inp.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&_qaParsed){e.preventDefault();quickAddBlock();}
    if(e.key==='Escape'){inp.value='';qaInputHandler('');inp.blur();}
  });
});

// ===== WEEK VIEW =====
function renderWeekView(){
  const dates=getWeekDates(D.selectedDate);
  const today=todayStr();
  const now=new Date();const nowMin=now.getHours()*60+now.getMinutes();
  const startHr=7,endHr=24;
  const el=document.getElementById('calWeekView');

  // Header row
  let html='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">';
  html+=`<div style="display:flex;gap:6px;align-items:center;">
    <button class="t-btn" onclick="navWeek(-1)" style="padding:3px 8px;">&lt;</button>
    <span style="font-size:13px;font-weight:600;">${formatWeekRange(dates)}</span>
    <button class="t-btn" onclick="navWeek(1)" style="padding:3px 8px;">&gt;</button>
    <button class="t-btn" onclick="D.selectedDate=todayStr();save();renderCalendar();renderMiniCal();" style="font-size:10px;padding:3px 8px;">Today</button>
  </div>`;
  html+=`<button class="ics-btn" onclick="exportICS()">Export .ics</button>`;
  html+='</div>';

  // Grid
  html+='<div class="week-grid" style="max-height:calc(100vh - 140px);overflow-y:auto;">';
  // Corner
  html+='<div class="wk-corner"></div>';
  // Day headers
  dates.forEach(dt=>{
    const d=dateObj(dt);
    const isToday=dt===today;
    const isSel=dt===D.selectedDate;
    html+=`<div class="wk-day-hdr ${isToday?'today':''} ${isSel?'selected':''}" onclick="D.selectedDate='${dt}';setCalView('day');renderMiniCal();">
      <div class="wk-name">${d.toLocaleDateString('en-US',{weekday:'short'})}</div>
      <div class="wk-date">${d.getDate()}</div>
    </div>`;
  });

  // Time rows
  for(let hr=startHr;hr<endHr;hr++){
    // Time label
    html+=`<div class="wk-time-label">${hr===0?'12 AM':hr<12?hr+' AM':hr===12?'12 PM':(hr-12)+' PM'}</div>`;
    // Day cells
    dates.forEach(dt=>{
      html+=`<div class="wk-cell" data-date="${dt}" data-hour="${hr}" oncontextmenu="event.preventDefault();openWkPopover(event,'${dt}',${hr})"></div>`;
    });
  }
  html+='</div>';
  el.innerHTML=html;

  // Place blocks
  dates.forEach(dt=>{
    const tl=getTimeline(dt);
    tl.forEach((slot,i)=>{
      const startM=parseMin(slot.t);
      const endM=i<tl.length-1?parseMin(tl[i+1].t):startM+30;
      if(endM<=startM)return;
      const startRow=Math.floor(startM/60)-startHr;
      if(startRow<0)return;
      const durationPx=Math.max(16,Math.round((endM-startM)/60*40));
      const offsetPx=Math.round((startM%60)/60*40);
      const cellRow=startRow+2; // +2 for header row
      const colIdx=dates.indexOf(dt)+2; // +2 for time label col + 1-indexed
      // Find the cell
      const cells=el.querySelectorAll(`.wk-cell[data-date="${dt}"][data-hour="${startM>=60?Math.floor(startM/60):startHr}"]`);
      // Instead, position absolutely within the grid
      const block=document.createElement('div');
      block.className=`wk-block ${slot.cls} ${slot.done?'done':''} ${slot._locOnly?'loc-only':''} ${isMeetingBlock(slot)?'is-meeting':''}`;
      block.style.cssText=`grid-row:${cellRow+1};grid-column:${colIdx};top:${offsetPx}px;height:${durationPx}px;`;
      block.innerHTML=`${slot.text}${slot.sm?`<div class="wk-block-sub">${slot.sm}</div>`:''}`;
      block.title=`${slot.t} - ${slot.text}`;
      block.onclick=(e)=>{e.stopPropagation();D.selectedDate=dt;setCalView('day');renderMiniCal();};
    });
  });

  // Re-render with positioned blocks using absolute positioning approach
  renderWeekBlocks(el, dates, startHr, endHr);

  // Now line
  if(dates.includes(today)){
    const colIdx=dates.indexOf(today);
    const nowRow=(nowMin/60)-startHr;
    if(nowRow>=0&&nowRow<(endHr-startHr)){
      const grid=el.querySelector('.week-grid');
      if(grid){
        const line=document.createElement('div');
        line.className='now-line';
        line.style.cssText=`top:${40+nowRow*60}px;left:50px;`;
        grid.style.position='relative';
        grid.appendChild(line);
      }
    }
  }

  // Right-click and double-click on blank week grid space to add block
  const wkGrid=el.querySelector('.week-grid');
  if(wkGrid){
    const wkCalcClick=(e)=>{
      if(e.target.closest('.wk-block'))return null;
      const rect=wkGrid.getBoundingClientRect();
      const x=e.clientX-rect.left-50;
      const y=e.clientY-rect.top-40;
      if(x<0||y<0)return null;
      const gW=rect.width-50;
      const cW=gW/7;
      const colIdx=Math.min(6,Math.floor(x/cW));
      const hr=startHr+Math.floor(y/60);
      if(hr<startHr||hr>=endHr)return null;
      return {dt:dates[colIdx],hr};
    };
    wkGrid.addEventListener('contextmenu',e=>{
      const r=wkCalcClick(e);
      if(!r)return;
      e.preventDefault();
      e.stopPropagation();
      openWkPopover(e,r.dt,r.hr);
    });
    wkGrid.addEventListener('dblclick',e=>{
      const r=wkCalcClick(e);
      if(!r)return;
      openWkPopover(e,r.dt,r.hr);
    });
  }
}

function renderWeekBlocks(container, dates, startHr, endHr){
  const grid=container.querySelector('.week-grid');
  if(!grid)return;
  grid.style.position='relative';
  const gridW=grid.offsetWidth||800;
  const cellW=(gridW-50)/7;

  dates.forEach((dt,colIdx)=>{
    const tl=getTimeline(dt);
    const wkOverlaps=computeOverlaps(tl);
    tl.forEach((slot,i)=>{
      const startM=parseMin(slot.t);
      const nextM=i<tl.length-1?parseMin(tl[i+1].t):startM+60;
      const endM=slot.end?parseMin(slot.end):Math.min(startM+60,nextM);
      if(endM<=startM)return;
      const topPx=((startM/60)-startHr)*60+40;
      const heightPx=Math.max(20,((endM-startM)/60)*60);

      // Overlap positioning — use CSS calc with (100% - 54px) for the day area
      const wov=wkOverlaps[i]||{col:0,totalCols:1};
      const denom=7*wov.totalCols;
      const num=colIdx*wov.totalCols+wov.col;
      const leftExpr=`calc(52px + ${num} * (100% - 54px) / ${denom})`;
      const widthExpr=`calc((100% - 54px) / ${denom} - 2px)`;

      if(!slot._id){slot._id='s'+Date.now()+'_'+i;}
      const sid=slot._id;
      const block=document.createElement('div');
      block.className=`wk-block ${slot.cls} ${slot.done?'done':''} ${slot._locOnly?'loc-only':''} ${isMeetingBlock(slot)?'is-meeting':''}`;
      if(slot._locOnly){
        // loc-only: slim strip at left edge of this day column, behind events
        const stripLeft=`calc(52px + ${colIdx} * (100% - 54px) / 7 + 1px)`;
        block.style.cssText=`position:absolute;top:${topPx}px;left:${stripLeft};height:${heightPx}px;`;
      } else {
        block.style.cssText=`position:absolute;top:${topPx}px;left:${leftExpr};width:${widthExpr};height:${heightPx}px;`;
      }
      block.dataset.idx=i;
      block.dataset.dt=dt;
      block.dataset.sid=sid;
      if(slot._locOnly){
        block.title=`📍 ${slot.loc||slot.text||'Location'}`;
        block.innerHTML='';
      } else {
        const fs=heightPx<24?8:heightPx<36?9:heightPx<48?10:11;
        block.style.fontSize=fs+'px';
        block.style.lineHeight=heightPx<24?'1.1':'1.3';
        block.style.padding=heightPx<30?'2px 4px':'4px 6px';
        const _wkHasNote=(D.meetings||[]).some(m=>m.date===dt&&m.title&&slot.text&&(m.title.toLowerCase().includes(slot.text.toLowerCase().slice(0,10))||slot.text.toLowerCase().includes(m.title.toLowerCase().slice(0,10))));
        const padV=heightPx<30?4:8;
        const lineH=heightPx<24?1.1:1.3;
        const subLines=(heightPx>28&&slot.loc?1:0)+(heightPx>36&&slot.sm?1:0);
        const availH=heightPx-padV-(subLines*Math.ceil(fs*0.9*1.3));
        const maxLines=Math.max(1,Math.floor(availH/(fs*lineH)));
        const titleStyle=maxLines<=1
          ?'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:700;'
          :`overflow:hidden;font-weight:700;display:-webkit-box;-webkit-line-clamp:${maxLines};-webkit-box-orient:vertical;word-break:break-word;`;
        const doneBtn=heightPx>=24?`<span class="wk-done-btn" title="${slot.done?'Mark not done':'Mark done'}" style="position:absolute;top:2px;right:2px;width:10px;height:10px;border-radius:50%;border:1.5px solid currentColor;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:6px;opacity:.5;z-index:10;flex-shrink:0;">${slot.done?'✓':''}</span>`:'';
        const _isChopMtg=isMeetingBlock(slot)&&(slot.cls==='chop'||/\bchop\b/i.test(slot.text||''));
        const _chopTag=_isChopMtg?'<span class="meeting-chop-tag">CHOP</span>':'';
        block.innerHTML=`${doneBtn}<div style="${titleStyle}">${_wkHasNote?'<span class="mi" style="font-size:10px;color:var(--blue);vertical-align:middle;margin-right:2px;">description</span>':''}${_chopTag}${slot.text}</div>${heightPx>28&&slot.loc?`<div class="wk-block-sub" style="opacity:.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"><span class="mi" style="font-size:9px;">location_on</span>${slot.loc}</div>`:''}${heightPx>36&&slot.sm?`<div class="wk-block-sub" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${slot.sm}</div>`:''}`;
        block.title=`${slot.t} - ${slot.text}${slot.loc?' @ '+slot.loc:''}${_wkHasNote?' (has notes)':''}`;
      }
      block.oncontextmenu=(e)=>{e.preventDefault();e.stopPropagation();if(!slot._locOnly)openWkBlockMenu(e,dt,i);};
      block.onmousedown=(e)=>{
        if(slot._locOnly)return;
        if(e.target.closest('.wk-resize-handle'))return;
        if(e.target.closest('.wk-done-btn')){e.preventDefault();e.stopPropagation();togSlotDone(dt,String(sid));return;}
        e.preventDefault();e.stopPropagation();
        block._wasDragged=false;
        block._clickEvent=e;
        const gridEl=grid;
        const gridRect=gridEl.getBoundingClientRect();
        _wkBlockDrag={dt,idx:i,block,startX:e.clientX,startY:e.clientY,gridRect,cellW,
          startM:parseMin(slot.t),dates,startHr,colIdx,moved:false};
        block.style.zIndex='20';block.style.opacity='.85';block.style.cursor='grabbing';
        document.body.style.cursor='grabbing';document.body.style.userSelect='none';
      };
      if(!slot._locOnly){
        const resizeHandle=document.createElement('div');
        resizeHandle.className='wk-resize-handle';
        resizeHandle.dataset.dt=dt;
        resizeHandle.dataset.idx=i;
        resizeHandle.title='Drag to resize';
        block.appendChild(resizeHandle);
      }
      grid.appendChild(block);
    });

    const prevDt=dateStr(new Date(dateObj(dt).getTime()-86400000));
    const prevRef=D.reflections&&D.reflections[prevDt];
    if(prevRef&&prevRef.focusTomorrow&&prevRef.focusTomorrow.trim()){
      const note=document.createElement('div');
      note.className='wk-focus-note';
      const bottomPx=(endHr-startHr)*60+40;
      note.style.cssText=`position:absolute;top:${bottomPx}px;left:calc(52px + ${colIdx} * (100% - 54px) / 7);width:calc((100% - 54px) / 7 - 2px);`;
      note.innerHTML=`<span class="mi" style="font-size:12px;color:var(--green);vertical-align:middle;">lightbulb</span> ${prevRef.focusTomorrow.trim()}`;
      note.title='Focus from yesterday';
      grid.appendChild(note);
    }
  });
}

// Week block drag-to-move
let _wkBlockDrag=null;
document.addEventListener('mousemove',e=>{
  if(!_wkBlockDrag)return;
  e.preventDefault();
  const d=_wkBlockDrag;
  const dx=e.clientX-d.startX, dy=e.clientY-d.startY;
  if(Math.abs(dx)>4||Math.abs(dy)>4)d.moved=true;
  if(!d.moved)return;
  d.block._wasDragged=true;
  const minDelta=Math.round((dy/60)*60/15)*15;
  const colDelta=Math.round(dx/d.cellW);
  const newMin=Math.max(d.startHr*60,Math.min(23*60+45,d.startM+minDelta));
  const newCol=Math.max(0,Math.min(6,d.colIdx+colDelta));
  const topPx=((newMin/60)-d.startHr)*60+40;
  const leftPx=50+newCol*d.cellW+2;
  d.block.style.top=topPx+'px';
  d.block.style.left=leftPx+'px';
  d.pendingMin=newMin;
  d.pendingCol=newCol;
});
document.addEventListener('mouseup',(e)=>{
  if(!_wkBlockDrag)return;
  const d=_wkBlockDrag;
  if(d.moved&&d.pendingMin!==undefined){
    const oldTl=getTimeline(d.dt);
    const slot=oldTl[d.idx];
    slot.done=false;
    const newDt=d.dates[d.pendingCol];
    const oldStart=parseMin(slot.t);
    if(slot.end){
      const dur=parseMin(slot.end)-oldStart;
      slot.end=minToTime(d.pendingMin+dur);
    }
    slot.t=minToTime(d.pendingMin);
    if(newDt!==d.dt){
      oldTl.splice(d.idx,1);
      setTimeline(d.dt,oldTl);
      const newTl=getTimeline(newDt)||[];
      newTl.push(slot);
      newTl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
      setTimeline(newDt,newTl);
    } else {
      oldTl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
      setTimeline(d.dt,oldTl);
    }
    renderCalendar();
  } else {
    d.block.style.zIndex='';d.block.style.opacity='';d.block.style.cursor='';
    const tl=getTimeline(d.dt);
    const slot=tl[d.idx];
    if(slot&&slot.text&&slot.text.includes('Review parked')&&typeof openParkingReview==='function'){
      openParkingReview();
    } else {
      editWkBlock(d.dt,d.idx);
    }
  }
  _wkBlockDrag=null;
  document.body.style.cursor='';
  document.body.style.userSelect='';
});

function openWkBlockMenu(e,dt,idx){
  // Remove any existing context menu
  const old=document.getElementById('wkCtxMenu');if(old)old.remove();
  const tl=getTimeline(dt);
  const slot=tl[idx];
  const menu=document.createElement('div');
  menu.id='wkCtxMenu';
  menu.className='wk-ctx-menu';
  menu.style.cssText=`position:fixed;left:${Math.min(e.clientX,window.innerWidth-180)}px;top:${Math.min(e.clientY,window.innerHeight-160)}px;z-index:200;`;
  if(!slot._id){slot._id='s'+Date.now()+'_'+idx;save();}
  const sid=slot._id;
  menu.innerHTML=`
    <div class="wk-ctx-title">${slot.text}</div>
    <button class="wk-ctx-btn" onclick="document.getElementById('wkCtxMenu').remove();togSlotDone('${dt}','${sid}');">
      <span class="mi" style="font-size:14px;">${slot.done?'undo':'check_circle'}</span> ${slot.done?'Mark not done':'✓ Mark done'}
    </button>
    <button class="wk-ctx-btn" onclick="document.getElementById('wkCtxMenu').remove();setTimeout(()=>editWkBlock('${dt}',${idx}),0);">
      <span class="mi" style="font-size:14px;">edit</span> Edit block
    </button>
    <button class="wk-ctx-btn" onclick="document.getElementById('wkCtxMenu').remove();dupeSlot('${dt}','${sid}');">
      <span class="mi" style="font-size:14px;">content_copy</span> Duplicate
    </button>
    <button class="wk-ctx-btn" onclick="document.getElementById('wkCtxMenu').remove();D.selectedDate='${dt}';setCalView('day');renderMiniCal();">
      <span class="mi" style="font-size:14px;">open_in_full</span> Open in Day View
    </button>
    <button class="wk-ctx-btn" onclick="document.getElementById('wkCtxMenu').remove();removeSlot('${dt}','${sid}');" style="color:var(--red);">
      <span class="mi" style="font-size:14px;">delete</span> Delete block
    </button>`;
  document.body.appendChild(menu);
  const dismiss=(ev)=>{if(!menu.contains(ev.target)){menu.remove();document.removeEventListener('mousedown',dismiss);}};
  setTimeout(()=>document.addEventListener('mousedown',dismiss),10);
}

function editWkBlock(dt,idx){
  const tl=getTimeline(dt)||[];
  const slot=tl[idx];if(!slot)return;
  const mins=parseMin(slot.t);
  const fakeEvent={clientX:window.innerWidth/2-150,clientY:window.innerHeight/3};
  openDvPopover(fakeEvent,dt,null,mins,idx);
}

function formatWeekRange(dates){
  const s=dateObj(dates[0]),e=dateObj(dates[6]);
  const sM=s.toLocaleDateString('en-US',{month:'short'});
  const eM=e.toLocaleDateString('en-US',{month:'short'});
  if(sM===eM)return `${sM} ${s.getDate()} - ${e.getDate()}`;
  return `${sM} ${s.getDate()} - ${eM} ${e.getDate()}`;
}
function navWeek(dir){
  const d=dateObj(D.selectedDate);d.setDate(d.getDate()+dir*7);
  D.selectedDate=dateStr(d);save();renderCalendar();renderMiniCal();
}

// ===== WEEK POPOVER =====
let _wkPopDate=null, _wkPopMins=null;
function openWkPopover(e, dt, hr){
  e.stopPropagation();
  const mins=hr*60;
  _wkPopDate=dt; _wkPopMins=mins;
  const pop=document.getElementById('wkPopover');
  const x=Math.min(e.clientX, window.innerWidth-280);
  const y=Math.min(e.clientY, window.innerHeight-300);
  pop.style.left=x+'px'; pop.style.top=y+'px';
  let timeOpts='';
  for(let m=0;m<24*60;m+=15){
    const sel=m===mins?' selected':'';
    timeOpts+=`<option value="${m}"${sel}>${minToTime(m)}</option>`;
  }
  document.getElementById('wpTime').innerHTML=timeOpts;
  document.getElementById('wpDate').value=dt;
  const catOpts=Object.entries(D.cats).map(([k,v])=>`<option value="${k}">${v.emoji||''} ${v.label}</option>`).join('')+'<option value="free">--- Break</option>';
  document.getElementById('wpCat').innerHTML=catOpts;
  document.getElementById('wpTitle').value='';
  document.getElementById('wpDetails').value='';
  document.getElementById('wpLoc').value='';
  const wpLocOnly=document.getElementById('wpLocOnly');if(wpLocOnly)wpLocOnly.checked=false;
  pop.classList.add('show');
  setTimeout(()=>document.getElementById('wpTitle').focus(), 50);
}
function closeWkPopover(){
  document.getElementById('wkPopover').classList.remove('show');
  _wkPopDate=null; _wkPopMins=null;
}
function wkPopoverSave(){
  if(!_wkPopDate) return;
  const t=minToTime(parseInt(document.getElementById('wpTime').value));
  const newDate=document.getElementById('wpDate').value||_wkPopDate;
  const catKey=document.getElementById('wpCat').value;
  const title=document.getElementById('wpTitle').value.trim();
  const details=document.getElementById('wpDetails').value.trim();
  const loc=document.getElementById('wpLoc').value.trim();
  const locOnly=document.getElementById('wpLocOnly')?.checked||false;
  const cat=D.cats[catKey];
  const text=title||(locOnly&&loc?'📍 '+loc:(cat?cat.emoji+' '+cat.label:'Break'));
  const tl=getTimeline(newDate)||[];
  const newMin=parseMin(t);
  let idx=tl.length;
  for(let j=0;j<tl.length;j++){if(parseMin(tl[j].t)>newMin){idx=j;break;}}
  const endTime=minToTime(Math.min(24*60,newMin+30));
  tl.splice(idx,0,{t, text, cls:catKey, sm:details, loc, _locOnly:locOnly, end:endTime, _id:'s'+Date.now()+'_'+Math.floor(Math.random()*9999)});
  setTimeline(newDate, tl);
  closeWkPopover();
  renderCalendar(); renderMiniCal();
}
document.addEventListener('click',function(e){
  const pop=document.getElementById('wkPopover');
  if(pop && pop.classList.contains('show') && !pop.contains(e.target) && !e.target.classList.contains('wk-cell')){
    closeWkPopover();
  }
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape') closeWkPopover();
});

// ===== OVERLAP DETECTION =====
function computeOverlaps(tl){
  if(!tl||!tl.length)return {};
  const blocks=tl.map((s,i)=>{
    const startM=parseMin(s.t);
    const endM=s.end?parseMin(s.end):startM+30;
    return {idx:i,start:startM,end:Math.max(startM+15,endM),col:0,totalCols:1};
  });
  const sorted=[...blocks].sort((a,b)=>a.start-b.start);
  sorted.forEach(b=>{
    const used=new Set();
    sorted.forEach(o=>{
      if(o!==b&&o.start<b.end&&o.end>b.start){used.add(o.col);}
    });
    let c=0;while(used.has(c))c++;
    b.col=c;
  });
  const visited=new Set();
  sorted.forEach(b=>{
    if(visited.has(b.idx))return;
    const group=[];const queue=[b];
    while(queue.length){
      const curr=queue.shift();
      if(visited.has(curr.idx))continue;
      visited.add(curr.idx);group.push(curr);
      sorted.forEach(o=>{if(!visited.has(o.idx)&&o.start<curr.end&&o.end>curr.start)queue.push(o);});
    }
    const maxCol=Math.max(...group.map(g=>g.col))+1;
    group.forEach(g=>g.totalCols=maxCol);
  });
  const result={};blocks.forEach(b=>result[b.idx]=b);
  return result;
}

// ===== BLOCK CHECKLIST =====
function addBlockItem(dt,sid,text){
  const tl=getTimeline(dt);const i=_slotIdx(tl,sid);if(i<0)return;
  if(!tl[i].items)tl[i].items=[];
  tl[i].items.push({text,done:false});
  setTimeline(dt,tl);renderCalendar();
}
function toggleBlockItem(dt,sid,itemIdx){
  const tl=getTimeline(dt);const i=_slotIdx(tl,sid);if(i<0)return;
  if(!tl[i].items||!tl[i].items[itemIdx])return;
  tl[i].items[itemIdx].done=!tl[i].items[itemIdx].done;
  setTimeline(dt,tl);renderCalendar();
}
function removeBlockItem(dt,sid,itemIdx){
  const tl=getTimeline(dt);const i=_slotIdx(tl,sid);if(i<0)return;
  if(!tl[i].items)return;
  tl[i].items.splice(itemIdx,1);
  setTimeline(dt,tl);renderCalendar();
}
function promptBlockItem(dt,sid){
  const text=prompt('Add checklist item:');
  if(text&&text.trim())addBlockItem(dt,sid,text.trim());
}

// ===== DAY VIEW =====
function renderDayView(){
  const dt=D.selectedDate;
  const tl=getTimeline(dt)||[];
  const d=dateObj(dt);
  const today=todayStr();
  const now=new Date();const nowMin=now.getHours()*60+now.getMinutes();
  const isToday=dt===today;
  const el=document.getElementById('calDayView');
  const startHr=7,endHr=24;
  const ROW_H=56;

  let html=`<div class="dv-header">
    <div class="dv-nav">
      <button onclick="navDay(-1)">&lt;</button>
    </div>
    <h2>${d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</h2>
    <div class="dv-nav">
      <button onclick="navDay(1)">&gt;</button>
      <button onclick="D.selectedDate=todayStr();save();renderCalendar();renderMiniCal();">Today</button>
    </div>
    <button class="ics-btn" onclick="exportICS()" style="margin-left:auto;">Export .ics</button>
  </div>`;

  // Yesterday's focus nudge
  const prevDate=dateStr(new Date(dateObj(dt).getTime()-86400000));
  const prevRef=D.reflections&&D.reflections[prevDate];
  if(prevRef&&prevRef.focusTomorrow&&prevRef.focusTomorrow.trim()){
    html+=`<div class="focus-banner">
      <span style="font-size:14px;">💡</span>
      <span>Yesterday you said: "<em>${prevRef.focusTomorrow.trim()}</em>"</span>
    </div>`;
  }

  // Quick actions bar
  const catOpts=Object.entries(D.cats).map(([k,v])=>`<option value="${k}">${v.emoji} ${v.label}</option>`).join('')+'<option value="free">--- Break</option>';
  html+=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px;align-items:center;">
    <div class="topbar-dropdown" id="templateDropdown">
      <button class="topbar-dropdown-btn" onclick="document.getElementById('templateMenu').classList.toggle('open')" style="font-size:10px;display:flex;align-items:center;gap:4px;">📋 Templates ▾</button>
      <div class="topbar-dropdown-menu" id="templateMenu" style="left:0;right:auto;min-width:160px;">
        <button onclick="applyTemplate('remote');document.getElementById('templateMenu').classList.remove('open');">🏠 Remote</button>
        <button onclick="applyTemplate('inperson');document.getElementById('templateMenu').classList.remove('open');">🏢 In-Person</button>
        <button onclick="applyTemplate('study');document.getElementById('templateMenu').classList.remove('open');">📚 Study</button>
        <button onclick="applyTemplate('light');document.getElementById('templateMenu').classList.remove('open');">🌿 Light</button>
        <button onclick="applyTemplate('nightowl');document.getElementById('templateMenu').classList.remove('open');">🌙 Night Owl</button>
        <button onclick="applyTemplate('weekend');document.getElementById('templateMenu').classList.remove('open');">🛋️ Weekend</button>
      </div>
    </div>
  </div>`;


  // Outlook-style hour grid — always visible, blocks overlay
  const totalH=(endHr-startHr)*ROW_H;
  html+=`<div class="dv-grid-wrap" data-dt="${dt}" data-starthr="${startHr}" data-rowh="${ROW_H}" style="position:relative;min-height:${totalH}px;border:1px solid var(--border);border-radius:10px;overflow:visible;background:var(--card);">`;

  // Hour lines + labels
  for(let hr=startHr;hr<endHr;hr++){
    const top=(hr-startHr)*ROW_H;
    const label=hr<12?hr+' AM':hr===12?'12 PM':(hr-12)+' PM';
    html+=`<div class="dv-hour-row" data-hour="${hr}" style="position:absolute;top:${top}px;left:0;right:0;height:${ROW_H}px;border-bottom:1px solid var(--border);cursor:pointer;display:flex;align-items:flex-start;z-index:1;" >
      <div style="width:64px;padding:4px 8px 0 0;text-align:right;font-size:10px;color:var(--dim);flex-shrink:0;user-select:none;">${label}</div>
      <div style="flex:1;height:100%;border-left:1px solid var(--border);position:relative;">
        <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:10px;color:var(--border);opacity:0;transition:opacity .15s;pointer-events:none;" class="dv-hour-hint">+ click to add</div>
      </div>
    </div>`;
    // Half-hour line
    html+=`<div style="position:absolute;top:${top+ROW_H/2}px;left:64px;right:0;height:0;border-bottom:1px dashed rgba(255,255,255,.03);pointer-events:none;"></div>`;
  }

  // Now line
  if(isToday){
    const nowTop=(nowMin/60-startHr)*ROW_H;
    if(nowTop>=0&&nowTop<=totalH){
      html+=`<div class="now-line" style="position:absolute;top:${nowTop}px;left:60px;right:0;z-index:10;"></div>`;
    }
  }

  // Render blocks on top of the grid with overlap detection
  const overlaps=computeOverlaps(tl);
  tl.forEach((s,i)=>{
    if(!s._id)s._id='s'+Date.now()+'_'+i;
    const sid=s._id;
    const startM=parseMin(s.t);
    const nextM2=i<tl.length-1?parseMin(tl[i+1].t):startM+60;
    const endM=s.end?parseMin(s.end):Math.min(startM+60,nextM2);
    if(endM<=startM)return;
    const topPx=(startM/60-startHr)*ROW_H;
    const heightPx=Math.max(28,((endM-startM)/60)*ROW_H);
    const dvFs=heightPx<28?9:heightPx<38?10:heightPx<50?11:12;
    const dvPad=heightPx<35?'2px 6px':'4px 8px';
    const dvLh=heightPx<35?'1.1':'1.3';
    const isDone=s.done||false;
    const cat=D.cats[s.cls];
    const catColor=getBlockColor(s);
    const durMin=endM-startM;
    const durLabel=durMin<60?durMin+'m':Math.floor(durMin/60)+'h'+(durMin%60?durMin%60+'m':'');
    const _mtgNotes=(D.meetings||[]).filter(m=>m.date===dt&&m.title&&s.text&&(m.title.toLowerCase().includes(s.text.toLowerCase().slice(0,10))||s.text.toLowerCase().includes(m.title.toLowerCase().slice(0,10))));
    const _hasMtgNote=_mtgNotes.length>0;

    // Overlap positioning — use CSS calc for responsive sizing
    const ov=overlaps[i]||{col:0,totalCols:1};
    const isMobile=window.innerWidth<=900;
    const leftBase=isMobile?48:68;
    const rightBase=isMobile?4:8;
    // Each column is (100% - 76px) / totalCols wide
    const colWidthCalc=`(100% - ${leftBase+rightBase}px) / ${ov.totalCols}`;
    const blockLeft=`calc(${leftBase}px + ${ov.col} * ${colWidthCalc})`;
    const blockWidth=`calc(${colWidthCalc} - 3px)`;

    // Checklist items
    const items=s.items||[];
    let itemsHtml='';
    if(heightPx>50&&items.length){
      itemsHtml=`<div class="dv-block-checklist">${items.map((it,ii)=>`<label class="dv-block-check-item ${it.done?'done':''}" onclick="event.stopPropagation();">
        <input type="checkbox" ${it.done?'checked':''} onchange="event.stopPropagation();toggleBlockItem('${dt}','${sid}',${ii})" style="width:11px;height:11px;margin:0;cursor:pointer;">
        <span>${it.text}</span>
        <button onclick="event.stopPropagation();removeBlockItem('${dt}','${sid}',${ii})" class="dv-check-del">×</button>
      </label>`).join('')}</div>`;
    }

    const locOnlyStyle=s._locOnly?`position:absolute;top:${topPx}px;left:${leftBase}px;height:${heightPx}px;`:`position:absolute;top:${topPx}px;left:${blockLeft};width:${blockWidth};height:${heightPx}px;background:${catColor}25;border:1px solid ${catColor}50;border-left:4px solid ${catColor};border-radius:8px;padding:${dvPad};cursor:grab;z-index:5;display:flex;flex-direction:column;gap:2px;overflow:hidden;transition:opacity .2s,box-shadow .2s;user-select:none;backdrop-filter:blur(2px);justify-content:flex-start;font-size:${dvFs}px;line-height:${dvLh};${isDone?'opacity:.4;text-decoration:line-through;':''}`;
    if(s._locOnly){
      html+=`<div class="dv-block loc-only" data-sid="${sid}" data-idx="${i}" data-dt="${dt}" title="📍 ${(s.loc||s.text||'Location').replace(/"/g,'&quot;')}" style="${locOnlyStyle}"></div>`;
    } else {
      html+=`<div class="dv-block ${isDone?'dv-block-done':''}" data-sid="${sid}" data-idx="${i}" data-dt="${dt}" tabindex="0" oncontextmenu="event.preventDefault();event.stopPropagation();openDvBlockMenu(event,'${dt}',${i});" style="${locOnlyStyle}">
      <div style="display:flex;align-items:center;gap:6px;">
        <button class="dv-done-btn" onclick="event.preventDefault();event.stopPropagation();togSlotDone('${dt}','${sid}')" title="${isDone?'Mark not done':'Mark done'}" style="width:11px;height:11px;min-width:11px;border-radius:50%;border:1.5px solid ${catColor};background:${isDone?catColor:'none'};cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:7px;color:${isDone?'#fff':catColor};padding:0;flex-shrink:0;">${isDone?'✓':''}</button>
        ${_hasMtgNote?`<span class="mi dv-note-badge" title="Has meeting notes" style="font-size:12px;color:var(--blue);flex-shrink:0;">description</span>`:''}
        <div class="dv-main-input dv-drag-input" style="color:${catColor};font-size:${dvFs}px;font-weight:700;cursor:grab;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;">${(isMeetingBlock(s)&&(s.cls==='chop'||/\bchop\b/i.test(s.text||'')))?'<span class="meeting-chop-tag is-meeting">CHOP</span>':''}${(s.text||'').replace(/</g,'&lt;')}</div>
        <span style="font-size:9px;color:var(--dim);flex-shrink:0;">${durLabel}</span>
      </div>
      ${heightPx>36?`<div style="display:flex;flex-direction:column;gap:1px;overflow:hidden;flex:1;">
        ${s.loc?`<div style="font-size:9px;color:${catColor};opacity:.8;display:flex;align-items:center;gap:2px;"><span class="mi" style="font-size:10px;">location_on</span>${s.loc}</div>`:''}
        ${s.sm?`<div style="font-size:10px;color:${catColor};opacity:.7;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${(s.sm||'').replace(/</g,'&lt;')}</div>`:''}
        ${itemsHtml}
      </div>`:''}
      ${heightPx>=30?`<button class="dv-bump-tmrw-btn" onclick="event.preventDefault();event.stopPropagation();sidebarBumpToTomorrow('${dt}',${i});">&rarr; tmrw</button>`:''}
      <div class="dv-resize-handle" data-dt="${dt}" data-sid="${sid}" data-idx="${i}" title="Drag to resize"></div>
    </div>`;
    }
  });

  html+=`</div>`;

  // Bottom toolbar
  if(tl.length){
    html+=`<div class="shift-bar" style="margin-top:8px;">
      <span>Shift all</span>
      <button class="t-btn" onclick="shiftAll(-60)" style="font-size:9px;padding:3px 8px;">-1h</button>
      <button class="t-btn" onclick="shiftAll(-30)" style="font-size:9px;padding:3px 8px;">-30m</button>
      <button class="t-btn" onclick="shiftAll(-15)" style="font-size:9px;padding:3px 8px;">-15m</button>
      <button class="t-btn" onclick="shiftAll(15)" style="font-size:9px;padding:3px 8px;">+15m</button>
      <button class="t-btn" onclick="shiftAll(30)" style="font-size:9px;padding:3px 8px;">+30m</button>
      <button class="t-btn" onclick="shiftAll(60)" style="font-size:9px;padding:3px 8px;">+1h</button>
    </div>`;
  }

  el.innerHTML=html;
  initBlockDrag();
  initGridClick();

  // Scroll to now
  if(isToday){
    setTimeout(()=>{const nowSlot=el.querySelector('.dv-slot.now');if(nowSlot)nowSlot.scrollIntoView({block:'center',behavior:'smooth'});},100);
  }
}

function navDay(dir){const d=dateObj(D.selectedDate);d.setDate(d.getDate()+dir);D.selectedDate=dateStr(d);save();renderCalendar();renderMiniCal();}

function copyFromToday(){
  const today=todayStr();
  const template=getTimeline(today);
  if(template.length){
    D.days[D.selectedDate]=JSON.parse(JSON.stringify(template));
    save();renderCalendar();
  }
}

const TEMPLATES={
  remote:[
    {t:'8:30 AM',text:'Emails check',cls:'chop',sm:'',end:'9:15 AM'},
    {t:'9:15 AM',text:'Smoking study recruitment',cls:'chop',sm:'',end:'11:15 AM'},
    {t:'11:15 AM',text:'Smoking study follow-up',cls:'chop',sm:'',end:'12:15 PM'},
    {t:'12:15 PM',text:'Lunch',cls:'personal',sm:'',end:'1:00 PM'},
    {t:'1:00 PM',text:'Virtual driving work',cls:'chop',sm:'',end:'3:00 PM'},
    {t:'3:00 PM',text:'Nutrition work',cls:'chop',sm:'',end:'4:30 PM'},
    {t:'4:30 PM',text:'Wind down',cls:'free',sm:'',end:'5:30 PM'},
  ],
  inperson:[
    {t:'8:00 AM',text:'Emails check',cls:'chop',sm:'',end:'8:30 AM'},
    {t:'8:30 AM',text:'Smoking study recruitment',cls:'chop',sm:'',end:'10:30 AM'},
    {t:'10:30 AM',text:'Smoking study follow-up',cls:'chop',sm:'',end:'12:00 PM'},
    {t:'12:00 PM',text:'Lunch',cls:'personal',sm:'',end:'1:00 PM'},
    {t:'1:00 PM',text:'Other work tasks',cls:'chop',sm:'',end:'3:30 PM'},
    {t:'3:30 PM',text:'Wrap up',cls:'personal',sm:'',end:'4:30 PM'},
  ],
  study:[
    {t:'9:00 AM',text:'Emails check',cls:'chop',sm:'',end:'9:30 AM'},
    {t:'9:30 AM',text:'MCAT study block',cls:'mcat',sm:'',end:'12:00 PM'},
    {t:'12:00 PM',text:'Lunch',cls:'personal',sm:'',end:'1:00 PM'},
    {t:'1:00 PM',text:'MCAT practice Qs',cls:'mcat',sm:'',end:'3:00 PM'},
    {t:'3:00 PM',text:'Nutrition work',cls:'chop',sm:'',end:'4:30 PM'},
    {t:'4:30 PM',text:'Wind down',cls:'free',sm:'',end:'5:30 PM'},
  ],
  light:[
    {t:'9:30 AM',text:'Emails check',cls:'chop',sm:'',end:'10:00 AM'},
    {t:'10:00 AM',text:'One work task',cls:'personal',sm:'Pick the easiest thing. Just one.',end:'11:30 AM'},
    {t:'11:30 AM',text:'Lunch',cls:'personal',sm:'',end:'12:15 PM'},
    {t:'1:00 PM',text:'Rest / free time',cls:'free',sm:'Actual rest. No guilt.',end:'4:00 PM'},
  ],
  nightowl:[
    {t:'9:00 AM',text:'Emails check',cls:'chop',sm:'',end:'9:30 AM'},
    {t:'9:30 AM',text:'Smoking study recruitment',cls:'chop',sm:'',end:'12:00 PM'},
    {t:'12:00 PM',text:'Lunch',cls:'personal',sm:'',end:'1:00 PM'},
    {t:'1:00 PM',text:'Smoking study follow-up',cls:'chop',sm:'',end:'2:30 PM'},
    {t:'2:30 PM',text:'Virtual driving work',cls:'chop',sm:'',end:'4:00 PM'},
    {t:'4:00 PM',text:'Rest',cls:'free',sm:'',end:'5:00 PM'},
    {t:'7:00 PM',text:'Nutrition work',cls:'chop',sm:'',end:'9:00 PM'},
  ],
  weekend:[
    {t:'9:30 AM',text:'Sleep in / slow morning',cls:'free',sm:'No rush.',end:'10:30 AM'},
    {t:'10:30 AM',text:'Brunch',cls:'personal',sm:'',end:'11:30 AM'},
    {t:'11:30 AM',text:'Errands',cls:'errands',sm:'',end:'1:30 PM'},
    {t:'1:30 PM',text:'Free time / self care',cls:'free',sm:'',end:'4:00 PM'},
    {t:'4:00 PM',text:'MCAT study block',cls:'mcat',sm:'Optional — great to start in June!',end:'6:00 PM'},
  ],
};

function shiftAll(mins){
  const dt=D.selectedDate;
  const tl=getTimeline(dt);
  if(!tl.length)return;
  tl.forEach(s=>{
    const m=parseMin(s.t)+mins;
    s.t=minToTime(Math.max(0,Math.min(1439,m)));
  });
  setTimeline(dt,tl);renderCalendar();
}

function shiftToNow(){
  const dt=D.selectedDate;
  let tl=getTimeline(dt);
  if(!tl.length)return;
  const now=new Date();
  const nowMin=now.getHours()*60+now.getMinutes();
  const rounded=Math.round(nowMin/15)*15;
  // Remove blocks before now
  tl=tl.filter(s=>parseMin(s.t)>=rounded);
  if(!tl.length){setTimeline(dt,[]);renderCalendar();return;}
  // Shift remaining to start from now
  const firstMin=parseMin(tl[0].t);
  const diff=rounded-firstMin;
  tl.forEach(s=>{
    const m=parseMin(s.t)+diff;
    s.t=minToTime(Math.max(0,Math.min(1439,m)));
  });
  setTimeline(dt,tl);renderCalendar();
}

function shiftBlock(dt,idx,mins){
  const tl=getTimeline(dt);
  const m=parseMin(tl[idx].t)+mins;
  tl[idx].t=minToTime(Math.max(0,Math.min(1439,m)));
  tl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
  setTimeline(dt,tl);renderCalendar();
}

function applyTemplate(name){
  const tl=TEMPLATES[name];
  if(!tl)return;
  const dt=D.selectedDate;
  const existing=getTimeline(dt);
  if(existing.length&&!confirm('Replace current blocks with template?'))return;
  D.days[dt]=JSON.parse(JSON.stringify(tl));
  save();renderCalendar();
}

// Day view right-click context menu
function openDvBlockMenu(e,dt,idx){
  const old=document.getElementById('wkCtxMenu');if(old)old.remove();
  const tl=getTimeline(dt);
  const slot=tl[idx];if(!slot)return;
  if(!slot._id){slot._id='s'+Date.now()+'_'+idx;save();}
  const sid=slot._id;
  const menu=document.createElement('div');
  menu.id='wkCtxMenu';
  menu.className='wk-ctx-menu';
  menu.style.cssText=`position:fixed;left:${Math.min(e.clientX,window.innerWidth-180)}px;top:${Math.min(e.clientY,window.innerHeight-200)}px;z-index:200;`;
  menu.innerHTML=`
    <div class="wk-ctx-title">${slot.text}</div>
    <button class="wk-ctx-btn" onclick="document.getElementById('wkCtxMenu').remove();togSlotDone('${dt}','${sid}');">
      <span class="mi" style="font-size:14px;">${slot.done?'undo':'check_circle'}</span> ${slot.done?'Mark not done':'Mark done'}
    </button>
    <button class="wk-ctx-btn" onclick="document.getElementById('wkCtxMenu').remove();setTimeout(()=>openDvPopover({clientX:window.innerWidth/2-150,clientY:window.innerHeight/3},'${dt}',null,${parseMin(slot.t)},${idx}),0);">
      <span class="mi" style="font-size:14px;">edit</span> Edit block
    </button>
    <button class="wk-ctx-btn" onclick="document.getElementById('wkCtxMenu').remove();dupeSlot('${dt}','${sid}');">
      <span class="mi" style="font-size:14px;">content_copy</span> Duplicate
    </button>
    <button class="wk-ctx-btn" onclick="document.getElementById('wkCtxMenu').remove();removeSlot('${dt}','${sid}');" style="color:var(--red);">
      <span class="mi" style="font-size:14px;">delete</span> Delete block
    </button>`;
  document.body.appendChild(menu);
  const dismiss=(ev)=>{if(!menu.contains(ev.target)){menu.remove();document.removeEventListener('mousedown',dismiss);}};
  setTimeout(()=>document.addEventListener('mousedown',dismiss),10);
}

// Day view editing
function _slotIdx(tl,sid){return tl.findIndex(s=>String(s._id)===String(sid));}
function editSlotTime(dt,sid,val){const tl=getTimeline(dt);const i=_slotIdx(tl,sid);if(i<0)return;tl[i].t=val;tl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));setTimeline(dt,tl);renderCalendar();}
function editSlotText(dt,sid,val){const tl=getTimeline(dt);const i=_slotIdx(tl,sid);if(i<0)return;tl[i].text=val.trim()||tl[i].text;setTimeline(dt,tl);}
function editSlotSm(dt,sid,val){const tl=getTimeline(dt);const i=_slotIdx(tl,sid);if(i<0)return;tl[i].sm=val.trim();setTimeline(dt,tl);}
function togSlotDone(dt,sid){const tl=getTimeline(dt);const i=_slotIdx(tl,sid);if(i<0)return;const wasDone=tl[i].done;tl[i].done=!tl[i].done;setTimeline(dt,tl);if(tl[i].done){celebrate();autoAddWin(tl[i].text,dt);}renderCalendar();if(typeof renderCalRightTasks==='function')renderCalRightTasks();if(typeof renderCalRightCompleted==='function')renderCalRightCompleted();}
function removeSlot(dt,sid){const tl=getTimeline(dt);const i=_slotIdx(tl,sid);if(i<0)return;tl.splice(i,1);setTimeline(dt,tl);renderCalendar();}
function dupeSlot(dt,sid){const tl=getTimeline(dt);const i=_slotIdx(tl,sid);if(i<0)return;const orig=tl[i];const newT=parseMin(orig.t)+30;tl.splice(i+1,0,{t:minToTime(newT),text:orig.text,cls:orig.cls,sm:orig.sm,loc:orig.loc||'',_id:'s'+Date.now()+'_'+Math.floor(Math.random()*9999)});setTimeline(dt,tl);renderCalendar();}
function editSlotLoc(dt,sid,val){const tl=getTimeline(dt);const i=_slotIdx(tl,sid);if(i<0)return;tl[i].loc=val.trim();setTimeline(dt,tl);}
function editSlotCls(dt,sid,val){const tl=getTimeline(dt);const i=_slotIdx(tl,sid);if(i<0)return;tl[i].cls=val;setTimeline(dt,tl);renderCalendar();}

// Block selection
function toggleBlockSelect(el,e){
  if(e){
    const tag=e.target.tagName;
    if(tag==='INPUT'||tag==='SELECT'||tag==='BUTTON'||e.target.closest('button'))return;
  }
  el.classList.toggle('block-selected');
  updateSelectionBar();
}
function updateSelectionBar(){
  const selected=document.querySelectorAll('.block-selected');
  let bar=document.getElementById('selectionBar');
  if(selected.length){
    if(!bar){
      bar=document.createElement('div');
      bar.id='selectionBar';
      bar.className='selection-bar';
      document.body.appendChild(bar);
    }
    const names=[...selected].map(el=>{
      const dt=el.dataset.dt, idx=parseInt(el.dataset.idx);
      const tl=getTimeline(dt);
      return tl&&tl[idx]?tl[idx].text:'';
    }).filter(Boolean);
    const label=names.length===1?`"${names[0]}"`:names.length+' blocks';
    bar.innerHTML=`<span>${label} selected</span>
      <button class="t-btn" style="border-color:var(--red);color:var(--red);font-size:11px;" onclick="deleteSelectedBlocks()">Delete</button>
      <button class="t-btn" style="font-size:11px;" onclick="clearBlockSelection()">Cancel</button>`;
    bar.style.display='flex';
  } else if(bar){
    bar.style.display='none';
  }
}
function deleteSelectedBlocks(){
  const selected=document.querySelectorAll('.block-selected');
  if(!selected.length)return;
  const byDate={};
  selected.forEach(el=>{
    const dt=el.dataset.dt;
    const idx=parseInt(el.dataset.idx);
    if(!byDate[dt])byDate[dt]=[];
    byDate[dt].push(idx);
  });
  Object.entries(byDate).forEach(([dt,indices])=>{
    indices.sort((a,b)=>b-a);
    const tl=getTimeline(dt);
    indices.forEach(i=>tl.splice(i,1));
    setTimeline(dt,tl);
  });
  clearBlockSelection();
  renderCalendar();
}
function clearBlockSelection(){
  document.querySelectorAll('.block-selected').forEach(el=>el.classList.remove('block-selected'));
  const bar=document.getElementById('selectionBar');
  if(bar)bar.style.display='none';
}

function saveReflection(dt){
  if(!D.reflections) D.reflections={};
  const existing=D.reflections[dt]||{};
  D.reflections[dt]={
    smallWin: document.getElementById('refSmallWin')?.value||'',
    focusTomorrow: document.getElementById('refFocusTmrw')?.value||'',
    manualWins: existing.manualWins||[],
  };
  save();
}
function addManualWin(dt){
  const inp=document.getElementById('manualWinInput');
  const val=inp.value.trim();
  if(!val)return;
  if(!D.reflections) D.reflections={};
  if(!D.reflections[dt]) D.reflections[dt]={};
  if(!D.reflections[dt].manualWins) D.reflections[dt].manualWins=[];
  D.reflections[dt].manualWins.push(val);
  save();renderWinsTab();
}
function addFocusToTomorrow(dt){
  const text=document.getElementById('refFocusTmrw')?.value?.trim();
  if(!text){alert('Write something in the Focus for Tomorrow field first.');return;}
  saveReflection(dt);
  const tomorrow=dateStr(new Date(dateObj(dt).getTime()+86400000));
  const tl=getTimeline(tomorrow)||[];
  const already=tl.some(s=>s.cls==='focus'&&s.text===text);
  if(already){alert('Already added to tomorrow.');return;}
  tl.push({t:'8:00 AM',text,cls:'focus',sm:'Focus from yesterday',loc:''});
  tl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
  setTimeline(tomorrow,tl);
  const toast=document.getElementById('saveToast');
  if(toast){toast.innerHTML='✓ Added to '+new Date(dateObj(tomorrow)).toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});toast.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>toast.classList.remove('show'),1500);}
}

function removeManualWin(dt,idx){
  if(!D.reflections[dt]||!D.reflections[dt].manualWins)return;
  D.reflections[dt].manualWins.splice(idx,1);
  save();renderWinsTab();
}

// ===== WINS TAB =====
let _winsDate=null;
let _winsViewAll=false;
function renderWinsTab(){
  const el=document.getElementById('winsContent');
  if(!el)return;
  if(_winsViewAll){renderAllWinsView(el);return;}
  const dt=_winsDate||todayStr();
  _winsDate=dt;
  const d=dateObj(dt);
  const ref=D.reflections[dt]||{};
  const completedSlots=(getTimeline(dt)||[]).filter(s=>s.done);
  const completedTasks=D.tasks.filter(t=>t.date===dt&&t.done);
  const hasCompleted=completedSlots.length||completedTasks.length;

  const prevDate=dateStr(new Date(dateObj(dt).getTime()-86400000));
  const prevRef=D.reflections&&D.reflections[prevDate];
  let banner='';
  if(prevRef&&prevRef.focusTomorrow&&prevRef.focusTomorrow.trim()){
    banner=`<div class="focus-banner" style="margin-bottom:14px;">
      <span style="font-size:14px;">💡</span>
      <span>Yesterday you said: "<em>${prevRef.focusTomorrow.trim()}</em>"</span>
    </div>`;
  }

  el.innerHTML=`<div style="max-width:800px;margin:0 auto;">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;">
      <button class="t-btn" onclick="navWins(-1)" style="padding:4px 10px;">&lt;</button>
      <h2 style="font-size:18px;font-weight:600;flex:1;text-align:center;">${d.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})}</h2>
      <button class="t-btn" onclick="navWins(1)" style="padding:4px 10px;">&gt;</button>
      <button class="t-btn" onclick="_winsDate=todayStr();renderWinsTab();" style="font-size:10px;">Today</button>
      <button class="t-btn" onclick="_winsViewAll=true;renderWinsTab();" style="font-size:10px;border-color:var(--green);color:var(--green);">All Wins</button>
    </div>

    ${banner}

    <div class="reflection-section" style="max-width:none;">
      <h3 style="margin-bottom:20px;font-size:16px;">✨ Daily Wins</h3>

      <div style="font-size:11px;font-weight:600;color:var(--dim);text-transform:uppercase;letter-spacing:.4px;margin-bottom:10px;">What I accomplished</div>
      <div class="ref-completed">
        ${completedSlots.map(s=>`<div class="ref-completed-item">✓ ${s.text}</div>`).join('')}
        ${completedTasks.map(t=>`<div class="ref-completed-item">✓ ${t.text}</div>`).join('')}
        ${(ref.manualWins||[]).map((w,idx)=>`<div class="ref-completed-item" style="display:flex;align-items:center;gap:6px;">
          <span>✓</span><span style="flex:1">${w}</span>
          <button onclick="removeManualWin('${dt}',${idx})" style="background:none;border:none;color:var(--dim);cursor:pointer;font-size:10px;padding:0 2px;" title="Remove">✕</button>
        </div>`).join('')}
        ${!hasCompleted&&!(ref.manualWins||[]).length ? `<div class="ref-empty">Nothing yet — add what you did!</div>` : ''}
      </div>
      <div style="display:flex;gap:6px;margin-top:12px;">
        <input type="text" id="manualWinInput" placeholder="Type something you accomplished..." onkeydown="if(event.key==='Enter')addManualWin('${dt}')" style="flex:1;background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 14px;color:var(--text);font-size:12px;outline:none;font-family:inherit;">
        <button onclick="addManualWin('${dt}')" style="background:var(--green);color:white;border:none;border-radius:8px;padding:10px 16px;font-size:13px;cursor:pointer;font-weight:600;">+</button>
      </div>

      <div style="border-top:1px solid var(--border);margin-top:16px;padding-top:22px;">
        <div class="ref-field" style="margin-bottom:12px;">
          <label style="font-size:11px;margin-bottom:8px;">Focus for tomorrow</label>
          <textarea id="refFocusTmrw" placeholder="What do you want to carry forward? This will show up on tomorrow's calendar." oninput="saveReflection('${dt}')" style="min-height:64px;padding:12px 14px;font-size:13px;">${ref.focusTomorrow||''}</textarea>
        </div>
        <button class="t-btn" onclick="addFocusToTomorrow('${dt}')" style="font-size:11px;padding:6px 14px;display:flex;align-items:center;gap:5px;"><span class="mi" style="font-size:14px;">add_circle</span> Add to tomorrow's calendar</button>
      </div>
    </div>
  </div>`;
}

function renderAllWinsView(el){
  const allDates=[];
  if(D.reflections){
    Object.keys(D.reflections).forEach(dt=>{
      const ref=D.reflections[dt];
      const manualWins=ref.manualWins||[];
      const completedSlots=(getTimeline(dt)||[]).filter(s=>s.done);
      const completedTasks=D.tasks.filter(t=>t.date===dt&&t.done);
      const wins=[
        ...completedSlots.map(s=>s.text),
        ...completedTasks.map(t=>t.text),
        ...manualWins
      ];
      if(wins.length)allDates.push({dt,wins,smallWin:ref.smallWin||''});
    });
  }
  // Also check dates with completed timeline/tasks but no reflection entry
  const tlDates=Object.keys(D.days||{});
  tlDates.forEach(dt=>{
    if(allDates.some(d=>d.dt===dt))return;
    const completedSlots=(getTimeline(dt)||[]).filter(s=>s.done);
    const completedTasks=D.tasks.filter(t=>t.date===dt&&t.done);
    const wins=[...completedSlots.map(s=>s.text),...completedTasks.map(t=>t.text)];
    if(wins.length)allDates.push({dt,wins,smallWin:''});
  });
  allDates.sort((a,b)=>b.dt.localeCompare(a.dt));

  const totalWins=allDates.reduce((sum,d)=>sum+d.wins.length,0);

  let html=`<div style="max-width:800px;margin:0 auto;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <button class="t-btn" onclick="_winsViewAll=false;renderWinsTab();" style="padding:4px 10px;font-size:10px;">&lt; Daily View</button>
      <h2 style="font-size:18px;font-weight:600;flex:1;text-align:center;">All Wins</h2>
      <span style="font-size:11px;color:var(--green);font-weight:600;">${totalWins} total</span>
    </div>`;

  if(!allDates.length){
    html+=`<div style="text-align:center;padding:40px 20px;color:var(--dim);">
      <div style="font-size:32px;margin-bottom:10px;">✨</div>
      <div style="font-size:13px;">No wins logged yet — start adding what you accomplish!</div>
    </div>`;
  } else {
    allDates.forEach(({dt,wins,smallWin})=>{
      const d=dateObj(dt);
      const dayLabel=d.toLocaleDateString('en-US',{weekday:'short',month:'short',day:'numeric'});
      const isToday=dt===todayStr();
      html+=`<div style="margin-bottom:16px;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px 14px;${isToday?'border-color:rgba(52,211,153,.4);':''}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
          <span style="font-size:12px;font-weight:600;${isToday?'color:var(--green);':'color:var(--text);'}">${isToday?'Today — ':''} ${dayLabel}</span>
          <span style="font-size:10px;color:var(--dim);">${wins.length} win${wins.length!==1?'s':''}</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">
          ${wins.map(w=>`<span style="display:inline-flex;align-items:center;gap:4px;background:rgba(52,211,153,.08);border:1px solid rgba(52,211,153,.15);border-radius:6px;padding:3px 8px;font-size:10px;color:var(--green);">
            <span class="mi" style="font-size:11px;">check_circle</span>${w}
          </span>`).join('')}
        </div>
        ${smallWin?`<div style="margin-top:6px;font-size:10px;color:var(--dim);font-style:italic;padding-left:4px;">"${smallWin}"</div>`:''}
      </div>`;
    });
  }
  html+=`</div>`;
  el.innerHTML=html;
}

function navWins(dir){
  const d=dateObj(_winsDate||todayStr());
  d.setDate(d.getDate()+dir);
  _winsDate=dateStr(d);
  _winsViewAll=false;
  renderWinsTab();
}

// ===== LOGO PICKER =====
function openLogoPicker(){
  const icons=['🧠','⚡','🎯','🚀','💎','🔮','🌟','✨','🎨','🧩','🏆','💪','🌊','🔥','🌸','🦋','🌈','☀️','🌙','💫','🎵','📚','🔬','🏥','💖','🐉'];
  const pop=document.createElement('div');
  pop.style.cssText='position:fixed;top:50px;left:16px;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:12px;z-index:1002;box-shadow:0 8px 24px rgba(0,0,0,.4);display:grid;grid-template-columns:repeat(6,1fr);gap:4px;width:220px;';
  icons.forEach(ic=>{
    const btn=document.createElement('button');
    btn.textContent=ic;
    btn.style.cssText='font-size:20px;padding:6px;border:none;background:transparent;cursor:pointer;border-radius:6px;transition:background .15s;';
    btn.onmouseenter=()=>btn.style.background='rgba(96,165,250,.1)';
    btn.onmouseleave=()=>btn.style.background='transparent';
    btn.onclick=()=>{document.getElementById('logoIcon').textContent=ic;D.logoIcon=ic;save();document.body.removeChild(pop);};
    pop.appendChild(btn);
  });
  document.body.appendChild(pop);
  const dismiss=(e)=>{if(!pop.contains(e.target)&&e.target.id!=='logoIcon'){document.body.removeChild(pop);document.removeEventListener('click',dismiss);}};
  setTimeout(()=>document.addEventListener('click',dismiss),10);
}

function initGridClick(){
  const grid=document.querySelector('.dv-grid-wrap');
  if(!grid)return;
  const calcMins=(e)=>{
    const rect=grid.getBoundingClientRect();
    const y=e.clientY-rect.top;
    const startHr=parseInt(grid.dataset.starthr);
    const rowH=parseInt(grid.dataset.rowh);
    const totalMin=Math.floor(y/rowH)*60+Math.round((y%rowH)/rowH*60/15)*15;
    return startHr*60+totalMin;
  };
  grid.addEventListener('click',e=>{
    const block=e.target.closest('.dv-block');
    if(!block)return;
    if(block.classList.contains('loc-only'))return;
    if(block._wasDragged){block._wasDragged=false;return;}
    if(e.target.closest('input,button,label'))return;
    e.stopPropagation();
    const dt=block.dataset.dt;
    const idx=parseInt(block.dataset.idx);
    const tl=getTimeline(dt);
    const slot=tl[idx];
    if(slot&&slot.text&&slot.text.includes('Review parked')&&typeof openParkingReview==='function'){
      openParkingReview();
    } else if(slot){
      const mins=parseMin(slot.t);
      openDvPopover(e,dt,null,mins,idx);
    }
  });
  grid.addEventListener('contextmenu',e=>{
    const block=e.target.closest('.dv-block');
    if(block){
      e.preventDefault();
      e.stopPropagation();
      const dt=block.dataset.dt;
      const idx=parseInt(block.dataset.idx);
      openDvBlockMenu(e,dt,idx);
      return;
    }
    e.preventDefault();
    const mins=calcMins(e);
    const dt=grid.dataset.dt;
    if(mins>=7*60&&mins<24*60&&dt)openDvPopover(e,dt,null,mins);
  });
  grid.addEventListener('dblclick',e=>{
    if(e.target.closest('.dv-block'))return;
    if(_gridDragCreated){_gridDragCreated=false;return;}
    const mins=calcMins(e);
    const dt=grid.dataset.dt;
    if(mins>=7*60&&mins<24*60&&dt)openDvPopover(e,dt,null,mins);
  });

  // Drag-to-create: hold and drag on empty grid to create a new block
  let _gridDrag=null;
  grid.addEventListener('mousedown',e=>{
    if(e.button!==0)return;
    if(e.target.closest('.dv-block'))return;
    const mins=calcMins(e);
    const dt=grid.dataset.dt;
    if(!dt||mins<7*60||mins>=24*60)return;
    _gridDrag={dt,startMins:mins,curMins:mins,startY:e.clientY,ghost:null,moved:false};
  });
  document.addEventListener('mousemove',e=>{
    if(!_gridDrag)return;
    if(!_gridDrag.moved&&Math.abs(e.clientY-_gridDrag.startY)<6)return;
    _gridDrag.moved=true;
    const grid2=document.querySelector('.dv-grid-wrap');
    if(!grid2)return;
    const rect=grid2.getBoundingClientRect();
    const y=e.clientY-rect.top;
    const startHr2=parseInt(grid2.dataset.starthr);
    const rowH2=parseInt(grid2.dataset.rowh);
    const totalMin=Math.floor(y/rowH2)*60+Math.round((y%rowH2)/rowH2*60/15)*15;
    _gridDrag.curMins=Math.max(startHr2*60,Math.min(24*60,startHr2*60+totalMin));
    const topM=Math.min(_gridDrag.startMins,_gridDrag.curMins);
    const botM=Math.max(_gridDrag.startMins,_gridDrag.curMins);
    const endM=Math.max(botM,topM+15);
    if(!_gridDrag.ghost){
      _gridDrag.ghost=document.createElement('div');
      _gridDrag.ghost.className='dv-drag-ghost';
      grid2.appendChild(_gridDrag.ghost);
    }
    const topPx=(topM/60-startHr2)*rowH2;
    const hPx=((endM-topM)/60)*rowH2;
    _gridDrag.ghost.style.top=topPx+'px';
    _gridDrag.ghost.style.height=Math.max(14,hPx)+'px';
    const fmt2=m=>{const h=Math.floor(m/60),mm=m%60,ap=h>=12?'PM':'AM',hh=h%12||12;return hh+':'+(mm<10?'0':'')+mm+' '+ap;};
    _gridDrag.ghost.textContent=fmt2(topM)+' – '+fmt2(endM);
    _showResizeTooltip(e,topM,endM);
    document.body.style.cursor='ns-resize';
    document.body.style.userSelect='none';
  });
  document.addEventListener('mouseup',e=>{
    if(!_gridDrag)return;
    const drag=_gridDrag;
    _gridDrag=null;
    _hideResizeTooltip();
    document.body.style.cursor='';
    document.body.style.userSelect='';
    if(drag.ghost){drag.ghost.remove();}
    if(!drag.moved)return;
    _gridDragCreated=true;
    const topM=Math.min(drag.startMins,drag.curMins);
    const botM=Math.max(drag.startMins,drag.curMins);
    const endM=Math.max(botM,topM+15);
    const dt=drag.dt;
    const tl=getTimeline(dt)||[];
    const t=minToTime(topM);
    let idx=tl.length;
    for(let j=0;j<tl.length;j++){if(parseMin(tl[j].t)>topM){idx=j;break;}}
    const sid='s'+Date.now()+'_'+Math.floor(Math.random()*9999);
    tl.splice(idx,0,{t,text:'',cls:'personal',sm:'',loc:'',end:minToTime(endM),_id:sid});
    setTimeline(dt,tl);
    renderCalendar();
    setTimeout(()=>{
      const newBlock=document.querySelector(`.dv-block[data-sid="${sid}"]`);
      if(newBlock){
        const mainInput=newBlock.querySelector('.dv-main-input');
        if(mainInput){mainInput.focus();mainInput.select();}
      }
    },100);
  });
}
let _gridDragCreated=false;

// Day view popover
let _dvPopDate=null, _dvPopMins=null, _dvPopEditIdx=null;
function openDvPopover(e,dt,hr,mins,editIdx){
  _dvPopDate=dt;
  _dvPopMins=mins!=null?mins:(hr!=null?hr*60:9*60);
  _dvPopEditIdx=editIdx!=null?editIdx:null;
  const pop=document.getElementById('dvPopover');
  const x=Math.min(e.clientX+8, window.innerWidth-300);
  const y=Math.min(e.clientY-20, window.innerHeight-340);
  pop.style.left=x+'px'; pop.style.top=y+'px';
  let timeOpts='';
  for(let m=0;m<24*60;m+=15){
    const sel=m===_dvPopMins?' selected':'';
    timeOpts+=`<option value="${m}"${sel}>${minToTime(m)}</option>`;
  }
  document.getElementById('dpTime').innerHTML=timeOpts;
  document.getElementById('dpDate').value=dt;
  const catOpts=Object.entries(D.cats).map(([k,v])=>`<option value="${k}">${v.emoji||''} ${v.label}</option>`).join('')+'<option value="free">--- Break</option>';
  document.getElementById('dpCat').innerHTML=catOpts;
  const isEdit=_dvPopEditIdx!=null;
  pop.querySelector('h4').textContent=isEdit?'Edit Block':'+ New Block';
  const saveBtn=document.getElementById('dpSaveBtn');
  if(saveBtn)saveBtn.textContent=isEdit?'Save':'Add';
  const delBtn=document.getElementById('dpDeleteBtn');
  if(delBtn)delBtn.style.display=isEdit?'':'none';
  if(isEdit){
    const tl=getTimeline(dt)||[];
    const slot=tl[_dvPopEditIdx];
    if(slot){
      document.getElementById('dpTitle').value=slot.text||'';
      document.getElementById('dpDetails').value=slot.sm||'';
      document.getElementById('dpLoc').value=slot.loc||'';
      if(slot.cls)document.getElementById('dpCat').value=slot.cls;
      const slotMin=parseMin(slot.t);
      const rounded=Math.round(slotMin/15)*15;
      document.getElementById('dpTime').value=rounded;
    }
  } else {
    document.getElementById('dpTitle').value='';
    document.getElementById('dpDetails').value='';
    document.getElementById('dpLoc').value='';
  }
  const locOnlyCb=document.getElementById('dpLocOnly');
  if(locOnlyCb){
    if(isEdit){const tl2=getTimeline(dt)||[];const sl=tl2[_dvPopEditIdx];locOnlyCb.checked=sl&&sl._locOnly||false;}
    else locOnlyCb.checked=false;
  }
  pop.classList.add('show');
  setTimeout(()=>document.getElementById('dpTitle').focus(),50);
}
function closeDvPopover(){
  document.getElementById('dvPopover').classList.remove('show');
  _dvPopDate=null; _dvPopMins=null; _dvPopEditIdx=null;
}
function dvPopoverDelete(){
  if(!_dvPopDate||_dvPopEditIdx==null)return;
  const tl=getTimeline(_dvPopDate)||[];
  if(_dvPopEditIdx<tl.length){
    tl.splice(_dvPopEditIdx,1);
    setTimeline(_dvPopDate,tl);
  }
  closeDvPopover();
  renderCalendar();renderMiniCal();
}
function dvPopoverSave(){
  if(!_dvPopDate)return;
  const t=minToTime(parseInt(document.getElementById('dpTime').value));
  const newDate=document.getElementById('dpDate').value||_dvPopDate;
  const catKey=document.getElementById('dpCat').value;
  const title=document.getElementById('dpTitle').value.trim();
  const details=document.getElementById('dpDetails').value.trim();
  const loc=document.getElementById('dpLoc').value.trim();
  const locOnly=document.getElementById('dpLocOnly')?.checked||false;
  const cat=D.cats[catKey];
  const text=title||(locOnly&&loc?'📍 '+loc:(cat?cat.emoji+' '+cat.label:'Break'));
  const tl=getTimeline(_dvPopDate)||[];
  if(_dvPopEditIdx!=null&&tl[_dvPopEditIdx]){
    const slot=tl[_dvPopEditIdx];
    const oldStart=parseMin(slot.t);
    const oldEnd=slot.end?parseMin(slot.end):oldStart+30;
    const dur=oldEnd-oldStart;
    const newMin=parseMin(t);
    // If date changed, move block to new date
    if(newDate!==_dvPopDate){
      // Remove from old date
      tl.splice(_dvPopEditIdx,1);
      setTimeline(_dvPopDate,tl);
      // Add to new date
      const newTl=getTimeline(newDate)||[];
      let idx=newTl.length;
      for(let j=0;j<newTl.length;j++){if(parseMin(newTl[j].t)>newMin){idx=j;break;}}
      newTl.splice(idx,0,{t,text,cls:catKey,sm:details,loc,end:minToTime(Math.min(24*60,newMin+(dur>0?dur:30))),_id:slot._id||'s'+Date.now()+'_'+idx});
      setTimeline(newDate,newTl);
    } else {
      slot.t=t;
      slot.text=text;
      slot.cls=catKey;
      slot.sm=details;
      slot.loc=loc;
      slot._locOnly=locOnly;
      slot.end=minToTime(Math.min(24*60,newMin+(dur>0?dur:30)));
      slot.done=false;
      tl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
      setTimeline(_dvPopDate,tl);
    }
  } else {
    const destTl=newDate!==_dvPopDate?(getTimeline(newDate)||[]):tl;
    const newMin=parseMin(t);
    let idx=destTl.length;
    for(let j=0;j<destTl.length;j++){if(parseMin(destTl[j].t)>newMin){idx=j;break;}}
    const endTime=minToTime(Math.min(24*60,newMin+30));
    destTl.splice(idx,0,{t,text,cls:catKey,sm:details,loc,_locOnly:locOnly,end:endTime,_id:'s'+Date.now()+'_'+Math.floor(Math.random()*9999)});
    setTimeline(newDate,destTl);
  }
  closeDvPopover();
  renderCalendar();renderMiniCal();
}
document.addEventListener('click',function(e){
  const pop=document.getElementById('dvPopover');
  if(pop&&pop.classList.contains('show')&&!pop.contains(e.target)){
    closeDvPopover();
  }
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape')closeDvPopover();
});

function addBlockAtHour(dt,hr){
  const t=minToTime(hr*60);
  const tl=getTimeline(dt)||[];
  tl.push({t, text:'', cls:'personal', sm:'', loc:''});
  tl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
  setTimeline(dt,tl);renderCalendar();
}

function addNoteBlock(dt){
  const now=new Date();const m=now.getHours()*60+now.getMinutes();
  const t=minToTime(Math.round(m/15)*15);
  const tl=getTimeline(dt)||[];
  tl.push({t, text:'Quick Note', cls:'braindump', sm:'', loc:''});
  tl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
  setTimeline(dt,tl);renderCalendar();
}

function addListBlock(dt){
  const now=new Date();const m=now.getHours()*60+now.getMinutes();
  const t=minToTime(Math.round(m/15)*15);
  const tl=getTimeline(dt)||[];
  tl.push({t, text:'To-Do List', cls:'personal', sm:'item 1, item 2, ...', loc:''});
  tl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
  setTimeline(dt,tl);renderCalendar();
}

function addDaySlot(){
  const dt=D.selectedDate;
  let t=document.getElementById('dvAddTime').value.trim();
  if(!t){const now=new Date(),m=now.getHours()*60+now.getMinutes();t=minToTime(Math.round(m/15)*15);}
  const catKey=document.getElementById('dvAddType').value;
  const detail=document.getElementById('dvAddDetail').value.trim();
  const cat=D.cats[catKey];
  const text=detail||(cat?cat.emoji+' '+cat.label:'Break');
  const cls=catKey;
  const tl=getTimeline(dt)||[];
  const newMin=parseMin(t);
  let idx=tl.length;
  for(let j=0;j<tl.length;j++){if(parseMin(tl[j].t)>newMin){idx=j;break;}}
  tl.splice(idx,0,{t,text,cls,sm:detail&&cat?detail:''});
  setTimeline(dt,tl);
  document.getElementById('dvAddTime').value='';
  document.getElementById('dvAddDetail').value='';
  renderCalendar();
}

// Drag blocks to move them in the hour grid
let _blockDrag=null;
function initBlockDrag(){
  const grid=document.querySelector('.dv-grid-wrap');
  if(!grid)return;
  grid.addEventListener('mousedown',e=>{
    const block=e.target.closest('.dv-block');
    if(!block)return;
    if(e.target.closest('.dv-resize-handle'))return;
    if(e.target.tagName==='SELECT')return;
    if(e.target.tagName==='BUTTON'||e.target.closest('button'))return;
    e.preventDefault();
    const dt=block.dataset.dt;
    const sid=block.dataset.sid?block.dataset.sid:null;
    const tl=getTimeline(dt);
    const idx=sid!==null?_slotIdx(tl,sid):parseInt(block.dataset.idx);
    if(idx<0)return;
    const slot=tl[idx];
    const startMin=parseMin(slot.t);
    const endMin=slot.end?parseMin(slot.end):startMin+60;
    const duration=endMin-startMin;
    const gridRect=grid.getBoundingClientRect();
    const ROW_H=56;
    const startHr=7;
    const maxMin=24*60-duration;
    _blockDrag={dt,idx,startY:e.clientY,startMin,duration,maxMin,gridRect,ROW_H,startHr,block,grid,moved:false};
    block.style.zIndex='20';
    block.style.cursor='grabbing';
    document.body.style.cursor='grabbing';
    document.body.style.userSelect='none';
  });
  document.addEventListener('mousemove',e=>{
    if(!_blockDrag)return;
    e.preventDefault();
    const d=_blockDrag;
    const dy=e.clientY-d.startY;
    if(!d.moved&&Math.abs(dy)<4)return;
    d.moved=true;
    d.block.style.opacity='.85';
    const minDelta=Math.round((dy/d.ROW_H)*60/15)*15;
    const newMin=Math.max(d.startHr*60,Math.min(d.maxMin,d.startMin+minDelta));
    const topPx=(newMin/60-d.startHr)*d.ROW_H;
    d.block.style.top=topPx+'px';
    d.pendingMin=newMin;
    const scrollEl=d.grid.closest('.main');
    if(scrollEl){
      const rect=scrollEl.getBoundingClientRect();
      const margin=40;
      if(e.clientY>rect.bottom-margin)scrollEl.scrollTop+=8;
      else if(e.clientY<rect.top+margin)scrollEl.scrollTop-=8;
    }
  });
  document.addEventListener('mouseup',()=>{
    if(!_blockDrag)return;
    const d=_blockDrag;
    if(d.moved&&d.pendingMin!==undefined){
      const tl=getTimeline(d.dt);
      const slot=tl[d.idx];
      slot.done=false;
      slot.t=minToTime(d.pendingMin);
      slot.end=minToTime(d.pendingMin+d.duration);
      tl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
      setTimeline(d.dt,tl);
      renderCalendar();
    } else {
      d.block.style.zIndex='';
      d.block.style.opacity='';
      d.block.style.cursor='';
      d.block._wasDragged=false;
      const tl2=getTimeline(d.dt);
      const sl=tl2[d.idx];
      if(sl&&sl.text&&sl.text.includes('Review parked')&&typeof openParkingReview==='function'){
        openParkingReview();
      } else if(sl){
        const mins=parseMin(sl.t);
        openDvPopover({clientX:d.block.getBoundingClientRect().left+40,clientY:d.block.getBoundingClientRect().top+10},d.dt,null,mins,d.idx);
      }
    }
    _blockDrag=null;
    document.body.style.cursor='';
    document.body.style.userSelect='';
  });

  // Touch support for mobile: tap to edit, long-press to drag
  let _touchDragTimer=null;
  let _touchTapBlock=null;
  grid.addEventListener('touchstart',e=>{
    const block=e.target.closest('.dv-block');
    if(!block||block.classList.contains('loc-only'))return;
    if(e.target.closest('.dv-resize-handle,button,input,label'))return;
    const touch=e.touches[0];
    const dt=block.dataset.dt;
    const sid=block.dataset.sid||null;
    const tl=getTimeline(dt);
    const idx=sid!==null?_slotIdx(tl,sid):parseInt(block.dataset.idx);
    if(idx<0)return;
    const slot=tl[idx];
    const startMin=parseMin(slot.t);
    const endMin=slot.end?parseMin(slot.end):startMin+60;
    const duration=endMin-startMin;
    const gridRect=grid.getBoundingClientRect();
    const ROW_H=56;
    const startHr=7;
    const maxMin=24*60-duration;
    _touchTapBlock={dt,idx,block,touch:{x:touch.clientX,y:touch.clientY},moved:false};
    _touchDragTimer=setTimeout(()=>{
      _touchTapBlock=null;
      e.preventDefault();
      _blockDrag={dt,idx,startY:touch.clientY,startMin,duration,maxMin,gridRect,ROW_H,startHr,block,grid,moved:false,isTouch:true};
      block.style.zIndex='20';
      block.style.opacity='.85';
      block.style.boxShadow='0 4px 16px rgba(0,0,0,.3)';
      if(navigator.vibrate)navigator.vibrate(30);
    },400);
  },{passive:false});
  grid.addEventListener('touchmove',e=>{
    if(_touchTapBlock){
      const t=e.touches[0];
      if(Math.abs(t.clientX-_touchTapBlock.touch.x)>8||Math.abs(t.clientY-_touchTapBlock.touch.y)>8){
        _touchTapBlock.moved=true;
        if(_touchDragTimer){clearTimeout(_touchDragTimer);_touchDragTimer=null;}
        _touchTapBlock=null;
      }
    }
    if(_touchDragTimer&&!_blockDrag){clearTimeout(_touchDragTimer);_touchDragTimer=null;return;}
    if(!_blockDrag||!_blockDrag.isTouch)return;
    e.preventDefault();
    const touch=e.touches[0];
    const d=_blockDrag;
    const dy=touch.clientY-d.startY;
    if(!d.moved&&Math.abs(dy)<8)return;
    d.moved=true;
    const minDelta=Math.round((dy/d.ROW_H)*60/15)*15;
    const newMin=Math.max(d.startHr*60,Math.min(d.maxMin,d.startMin+minDelta));
    const topPx=(newMin/60-d.startHr)*d.ROW_H;
    d.block.style.top=topPx+'px';
    d.pendingMin=newMin;
  },{passive:false});
  grid.addEventListener('touchend',e=>{
    if(_touchDragTimer){clearTimeout(_touchDragTimer);_touchDragTimer=null;}
    // Quick tap — open edit popover
    if(_touchTapBlock&&!_touchTapBlock.moved){
      const tb=_touchTapBlock;
      _touchTapBlock=null;
      const tl=getTimeline(tb.dt)||[];
      const slot=tl[tb.idx];
      if(slot){
        const mins=parseMin(slot.t);
        const rect=tb.block.getBoundingClientRect();
        openDvPopover({clientX:rect.left+40,clientY:rect.top+10},tb.dt,null,mins,tb.idx);
      }
      return;
    }
    _touchTapBlock=null;
    if(!_blockDrag||!_blockDrag.isTouch)return;
    const d=_blockDrag;
    if(d.moved&&d.pendingMin!==undefined){
      const tl=getTimeline(d.dt);
      const slot=tl[d.idx];
      slot.done=false;
      slot.t=minToTime(d.pendingMin);
      slot.end=minToTime(d.pendingMin+d.duration);
      tl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
      setTimeline(d.dt,tl);
      renderCalendar();
    }
    d.block.style.zIndex='';d.block.style.opacity='';d.block.style.boxShadow='';
    _blockDrag=null;
  });
  grid.addEventListener('touchcancel',()=>{
    if(_touchDragTimer){clearTimeout(_touchDragTimer);_touchDragTimer=null;}
    _touchTapBlock=null;
    if(_blockDrag&&_blockDrag.isTouch){
      _blockDrag.block.style.zIndex='';_blockDrag.block.style.opacity='';_blockDrag.block.style.boxShadow='';
      _blockDrag=null;
    }
  });

  // Double-click on a block to open edit popover
  grid.addEventListener('dblclick',e=>{
    const block=e.target.closest('.dv-block');
    if(!block)return;
    e.preventDefault();
    e.stopPropagation();
    const dt=block.dataset.dt;
    const idx=parseInt(block.dataset.idx);
    const tl=getTimeline(dt)||[];
    const slot=tl[idx];
    if(slot){
      const mins=parseMin(slot.t);
      openDvPopover(e,dt,null,mins,idx);
    }
  });
}

// ===== BLOCK RESIZE =====
let _blockResize=null;
function initBlockResize(){
  document.addEventListener('mousedown',e=>{
    const handle=e.target.closest('.dv-resize-handle,.wk-resize-handle');
    if(!handle)return;
    e.preventDefault();
    e.stopPropagation();
    const dt=handle.dataset.dt;
    const sid=handle.dataset.sid?handle.dataset.sid:null;
    const tl=getTimeline(dt);
    const idx=sid!==null?_slotIdx(tl,sid):parseInt(handle.dataset.idx);
    if(idx<0)return;
    const startM=parseMin(tl[idx].t);
    const isWeek=handle.classList.contains('wk-resize-handle');
    const pxPerHour=isWeek?60:56;
    const block=handle.closest('.dv-block,.wk-block');
    _blockResize={dt,idx,startY:e.clientY,startM,block,pxPerHour,
      origEnd:tl[idx].end?parseMin(tl[idx].end):Math.min(startM+60,idx<tl.length-1?parseMin(tl[idx+1].t):startM+60)};
    document.body.style.cursor='ns-resize';
    document.body.style.userSelect='none';
  });
  document.addEventListener('mousemove',e=>{
    if(!_blockResize)return;
    e.preventDefault();
    const{startY,origEnd,startM,block,pxPerHour}=_blockResize;
    const dy=e.clientY-startY;
    const minDelta=Math.round((dy/pxPerHour)*60/15)*15;
    const newEnd=Math.max(startM+15,Math.min(24*60,origEnd+minDelta));
    const heightPx=Math.max(28,((newEnd-startM)/60)*pxPerHour);
    block.style.height=heightPx+'px';
    _blockResize.pendingEnd=newEnd;
    _showResizeTooltip(e,startM,newEnd);
  });
  document.addEventListener('mouseup',()=>{
    if(!_blockResize)return;
    _hideResizeTooltip();
    const{dt,idx,pendingEnd}=_blockResize;
    if(pendingEnd!==undefined){
      const tl=getTimeline(dt);
      tl[idx].end=minToTime(pendingEnd);
      setTimeline(dt,tl);
      renderCalendar();
    }
    _blockResize=null;
    document.body.style.cursor='';
    document.body.style.userSelect='';
  });
}
initBlockResize();

let _resizeTooltip=null;
function _showResizeTooltip(e,startM,endM){
  if(!_resizeTooltip){
    _resizeTooltip=document.createElement('div');
    _resizeTooltip.className='resize-time-tooltip';
    document.body.appendChild(_resizeTooltip);
  }
  const fmt=m=>{const h=Math.floor(m/60),mm=m%60,ap=h>=12?'PM':'AM',hh=h%12||12;return hh+':'+(mm<10?'0':'')+mm+' '+ap;};
  const dur=endM-startM;
  const durLabel=dur>=60?Math.floor(dur/60)+'h'+(dur%60?' '+dur%60+'m':''):dur+'m';
  _resizeTooltip.innerHTML=fmt(startM)+' – '+fmt(endM)+'<span class="resize-tooltip-dur">'+durLabel+'</span>';
  _resizeTooltip.style.display='flex';
  _resizeTooltip.style.left=(e.clientX+14)+'px';
  _resizeTooltip.style.top=(e.clientY-10)+'px';
}
function _hideResizeTooltip(){
  if(_resizeTooltip){_resizeTooltip.style.display='none';}
}

// ===== MONTH VIEW =====
function renderMonthView(){
  const selDate=dateObj(D.selectedDate);
  const year=selDate.getFullYear(),month=selDate.getMonth();
  const today=todayStr();
  const first=new Date(year,month,1);
  const startDay=first.getDay()||7; // Mon=1
  const daysInMonth=new Date(year,month+1,0).getDate();
  const el=document.getElementById('calMonthView');

  let html=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
    <div style="display:flex;gap:6px;align-items:center;">
      <button class="t-btn" onclick="navMonth(-1)" style="padding:3px 8px;">&lt;</button>
      <span style="font-size:14px;font-weight:600;">${first.toLocaleDateString('en-US',{month:'long',year:'numeric'})}</span>
      <button class="t-btn" onclick="navMonth(1)" style="padding:3px 8px;">&gt;</button>
    </div>
  </div>`;

  html+='<div class="month-grid">';
  ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(d=>html+=`<div class="mo-hdr">${d}</div>`);

  // Fill preceding days
  const prevMonth=new Date(year,month,0);
  const startOffset=(startDay===0?6:startDay-1);
  for(let i=startOffset-1;i>=0;i--){
    const dd=prevMonth.getDate()-i;
    const dt=dateStr(new Date(year,month-1,dd));
    html+=`<div class="mo-cell other" onclick="D.selectedDate='${dt}';setCalView('day');renderMiniCal();" oncontextmenu="openMonthPopover(event,'${dt}')">
      <div class="mo-num">${dd}</div>
      ${renderMonthDots(dt)}
    </div>`;
  }

  // This month
  for(let d=1;d<=daysInMonth;d++){
    const dt=dateStr(new Date(year,month,d));
    const isToday=dt===today;
    const isSel=dt===D.selectedDate;
    html+=`<div class="mo-cell ${isToday?'today':''} ${isSel?'selected':''}" onclick="D.selectedDate='${dt}';setCalView('day');renderMiniCal();" oncontextmenu="openMonthPopover(event,'${dt}')">
      <div class="mo-num">${d}</div>
      ${renderMonthDots(dt)}
    </div>`;
  }

  // Fill remaining
  const totalCells=startOffset+daysInMonth;
  const remaining=7-(totalCells%7);
  if(remaining<7){
    for(let i=1;i<=remaining;i++){
      const dt=dateStr(new Date(year,month+1,i));
      html+=`<div class="mo-cell other" onclick="D.selectedDate='${dt}';setCalView('day');renderMiniCal();" oncontextmenu="openMonthPopover(event,'${dt}')">
        <div class="mo-num">${i}</div>
        ${renderMonthDots(dt)}
      </div>`;
    }
  }

  html+='</div>';
  el.innerHTML=html;
}

function renderMonthDots(dt){
  const tl=getTimeline(dt);
  const mtgNotes=(D.meetings||[]).filter(m=>m.date===dt);
  if(!tl.length&&!mtgNotes.length)return '';
  const blocks=tl.slice(0,4).map((s,i)=>{
    if(!s._id){s._id='s'+Date.now()+'_'+i+'_'+Math.floor(Math.random()*9999);}
    const sid=s._id;
    const cat=D.cats[s.cls];
    const color=cat?cat.color:'var(--dim)';
    const startM=parseMin(s.t);
    const nextM=i<tl.length-1?parseMin(tl[i+1].t):startM+60;
    const endM=s.end?parseMin(s.end):Math.min(startM+60,nextM);
    const dur=endM-startM;
    const isLong=dur>=60;
    const pad=isLong?'3px 4px':'1px 3px';
    const fs=isLong?9:8;
    const hasNote=mtgNotes.some(m=>m.title&&s.text&&(m.title.toLowerCase().includes(s.text.toLowerCase().slice(0,10))||s.text.toLowerCase().includes(m.title.toLowerCase().slice(0,10))));
    const doneBtn=`<span class="mo-done-btn" onclick="event.stopPropagation();togSlotDone('${dt}','${sid}');" title="${s.done?'Mark not done':'Mark done'}" style="display:inline-flex;align-items:center;justify-content:center;width:6px;height:6px;min-width:6px;border-radius:50%;border:1px solid ${color};background:${s.done?color:'none'};cursor:pointer;font-size:4px;color:${s.done?'#fff':color};margin-right:2px;flex-shrink:0;vertical-align:middle;">${s.done?'✓':''}</span>`;
    return `<div class="mo-block${s.done?' done':''}" data-dt="${dt}" data-idx="${i}" onclick="event.stopPropagation();toggleBlockSelect(this)" oncontextmenu="event.preventDefault();event.stopPropagation();openWkBlockMenu(event,'${dt}',${i});" style="background:${color}22;color:${color};border-left:2px solid ${color};cursor:pointer;display:flex;align-items:center;padding:${pad};font-size:${fs}px;${s.done?'opacity:.5;text-decoration:line-through;':''}">${doneBtn}${hasNote?'<span class="mi" style="font-size:9px;vertical-align:middle;">description</span> ':''}${s.text}</div>`;
  }).join('');
  return `<div class="mo-blocks">${blocks}</div>`;
}

function openMonthPopover(e,dt){
  e.preventDefault();
  e.stopPropagation();
  openWkPopover(e,dt,9);
}

// ===== SIDEBAR WEEK STRIP + TOMORROW PREVIEW =====
function renderSidebarWeek(){
  const el=document.getElementById('sidebarWeekStrip');
  if(!el)return;
  const today=todayStr();
  const weekDates=getWeekDates(today);
  let html='<div class="sw-strip">';
  weekDates.forEach(dt=>{
    const d=dateObj(dt);
    const tl=getTimeline(dt);
    const isToday=dt===today;
    const isSel=dt===D.selectedDate;
    const dayName=['M','T','W','T','F','S','S'][(d.getDay()+6)%7];
    const dayNum=d.getDate();
    const MAX_PIPS=6;
    const pips=tl.slice(0,MAX_PIPS).map(s=>{
      const color=getBlockColor(s);
      return `<div class="sw-pip" style="background:${color};opacity:${s.done?0.35:0.85};" title="${s.t} ${s.text}"></div>`;
    }).join('');
    const overflow=tl.length>MAX_PIPS?`<div class="sw-pip-more">+${tl.length-MAX_PIPS}</div>`:'';
    html+=`<div class="sw-day ${isToday?'sw-today':''} ${isSel?'sw-selected':''}" onclick="D.selectedDate='${dt}';save();renderCalendar();renderMiniCal();">
      <div class="sw-day-name">${dayName}</div>
      <div class="sw-day-num">${dayNum}</div>
      <div class="sw-pips">${pips}${overflow}</div>
    </div>`;
  });
  html+='</div>';
  el.innerHTML=html;
}

function renderSidebarTmrw(){
  const el=document.getElementById('sidebarTmrwPreview');
  if(!el)return;
  const tmrw=dateStr(new Date(dateObj(todayStr()).getTime()+86400000));
  const tl=getTimeline(tmrw);
  if(!tl.length){
    el.innerHTML=`<div class="sw-tmrw-empty">Nothing scheduled yet</div>
      <button class="t-btn" style="font-size:9px;margin-top:4px;width:100%;" onclick="D.selectedDate='${tmrw}';setCalView('day');">Plan tomorrow</button>`;
    return;
  }
  let html='';
  tl.forEach((s,i)=>{
    const color=getBlockColor(s);
    html+=`<div class="sw-tmrw-row ${s.done?'sw-tmrw-done':''}" style="border-left-color:${color};">
      <div class="sw-tmrw-time">${s.t}</div>
      <div class="sw-tmrw-text" style="color:${color};">${(s.text||'').replace(/</g,'&lt;')}</div>
      <button class="sw-bump-btn" title="Move to today" onclick="event.stopPropagation();sidebarBumpToToday('${tmrw}',${i});">&#8592;</button>
    </div>`;
  });
  html+=`<button class="t-btn" style="font-size:9px;margin-top:6px;width:100%;" onclick="D.selectedDate='${tmrw}';setCalView('day');">Open tomorrow &rsaquo;</button>`;
  el.innerHTML=html;
}

function sidebarBumpToToday(fromDt,idx){
  const fromTl=getTimeline(fromDt);
  if(idx<0||idx>=fromTl.length)return;
  const slot=fromTl.splice(idx,1)[0];
  setTimeline(fromDt,fromTl);
  const today=todayStr();
  const toTl=getTimeline(today)||[];
  toTl.push(slot);
  toTl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
  setTimeline(today,toTl);
  renderCalendar();renderMiniCal();
}

function sidebarBumpToTomorrow(fromDt,idx){
  const fromTl=getTimeline(fromDt);
  if(idx<0||idx>=fromTl.length)return;
  const slot=fromTl.splice(idx,1)[0];
  setTimeline(fromDt,fromTl);
  const tmrw=dateStr(new Date(dateObj(fromDt).getTime()+86400000));
  const toTl=getTimeline(tmrw)||[];
  toTl.push(slot);
  toTl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
  setTimeline(tmrw,toTl);
  renderCalendar();renderMiniCal();
}

function renderMiniCal(){
  renderSidebarWeek();
  renderSidebarTmrw();
}
function navMiniMonth(dir){D.miniMonth+=dir;if(D.miniMonth>11){D.miniMonth=0;D.miniYear++;}if(D.miniMonth<0){D.miniMonth=11;D.miniYear--;}save();renderMiniCal();}
function navMonth(dir){
  if(D.calView==='month'){
    const d=dateObj(D.selectedDate);
    d.setMonth(d.getMonth()+dir);
    D.selectedDate=dateStr(d);
    D.miniMonth=d.getMonth();D.miniYear=d.getFullYear();
    save();renderCalendar();renderMiniCal();
  } else {
    navMiniMonth(dir);
  }
}

// ===== LEGEND =====
function catIcon(v){
  if(v.icon)return `<span class="mi" style="font-size:14px;">${v.icon}</span>`;
  return v.emoji||'📌';
}
function renderLegend(){
  const today=todayStr();
  const el=document.getElementById('legendBox');
  if(!el)return;
  el.innerHTML=Object.entries(D.cats).filter(([k])=>k!=='braindump').map(([k,v])=>{
    const count=D.tasks.filter(t=>t.cat===k&&t.date===today&&!t.done).length;
    return `<div class="leg-item"><div class="leg-dot" style="background:${v.color}"></div><div class="leg-label">${catIcon(v)} ${v.label}</div>${count?`<div class="leg-count">${count}</div>`:''}</div>`;
  }).join('');
}

// ===== ENERGY =====
function renderEnergy(){
  const adv={1:'Rest mode',2:'Easy stuff',3:'Moderate',4:'Hard stuff!',5:'Peak!'};
  const bar=document.getElementById('eBar');
  if(bar)bar.innerHTML=Array.from({length:5},(_,i)=>`<div class="e-seg ${i<D.energy?'on':''}${D.energy<=2?' low':D.energy<=3?' med':''}" onclick="D.energy=${i+1};save();renderEnergy();updateStats();generateCoachSuggestions();"></div>`).join('');
  const adv_el=document.getElementById('eAdvice');if(adv_el)adv_el.textContent=adv[D.energy]||'';
  const eEl=document.getElementById('sEnergy');if(eEl)eEl.textContent=D.energy;
}

// ===== TIMER =====
let tInt=null,tSec=25*60,tRun=false,tBrk=false,tPre=25;
function setPreset(m,el){if(tRun)return;tPre=m;tSec=m*60;tBrk=false;updateTimerDisp();const inp=document.getElementById('timerInput');if(inp)inp.value=m;}
function setPresetFromInput(){if(tRun)return;const v=parseInt(document.getElementById('timerInput').value)||25;const m=Math.max(1,Math.min(240,v));tPre=m;tSec=m*60;tBrk=false;updateTimerDisp();}
function toggleTimer(){
  if(tRun){clearInterval(tInt);tRun=false;document.getElementById('timerStartBtn').textContent='Resume';document.getElementById('timerLabel').textContent='paused';return;}
  tRun=true;document.getElementById('timerStartBtn').textContent='Pause';document.getElementById('timerLabel').textContent=tBrk?'break':'focusing...';
  tInt=setInterval(()=>{
    tSec--;
    if(tSec<=0){clearInterval(tInt);tRun=false;
      if(!tBrk){D.pomo++;save();updateStats();celebrate();tBrk=true;tSec=5*60;document.getElementById('timerLabel').textContent='break time!';}
      else{tBrk=false;tSec=tPre*60;document.getElementById('timerLabel').textContent='ready';}
      document.getElementById('timerStartBtn').textContent='Start';
    }
    updateTimerDisp();
  },1000);
}
function resetTimer(){clearInterval(tInt);tRun=false;tBrk=false;tSec=tPre*60;document.getElementById('timerStartBtn').textContent='Start';document.getElementById('timerLabel').textContent='ready';updateTimerDisp();}
function updateTimerDisp(){const m=Math.floor(tSec/60),s=tSec%60;document.getElementById('timerDisp').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0');document.getElementById('pomoCount').textContent=D.pomo+' sessions';document.getElementById('sPomo').textContent=D.pomo;
  const total=tBrk?5*60:tPre*60;const pct=total>0?(total-tSec)/total:0;const circ=2*Math.PI*52;const ring=document.getElementById('timerRingProgress');if(ring)ring.style.strokeDashoffset=circ*(1-pct);
  const mini=document.getElementById('timerMiniDisp');if(mini)mini.textContent=tRun?(String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')):'';
}

function celebrate(){const msgs=['Nice!','Crushed it','Go you!','Yes!'];const el=document.createElement('div');el.textContent=msgs[Math.floor(Math.random()*msgs.length)];el.style.cssText='position:fixed;top:20%;left:50%;transform:translateX(-50%);background:var(--grad);color:white;padding:10px 20px;border-radius:10px;font-size:15px;font-weight:600;z-index:9999;animation:fadeUp 1.5s forwards;pointer-events:none;';document.body.appendChild(el);setTimeout(()=>el.remove(),1500);}

// ===== LOCATION STRIP TOOLTIP =====
(function(){
  let _locTip=null;
  function showLocTip(text,x,y){
    removeLocTip();
    const tip=document.createElement('div');
    tip.className='loc-strip-tip';
    tip.innerHTML=`<span class="mi">location_on</span><span>${text}</span>`;
    document.body.appendChild(tip);
    _locTip=tip;
    const tw=tip.offsetWidth||180;
    const th=tip.offsetHeight||36;
    const left=Math.min(x+14,window.innerWidth-tw-8);
    const top=Math.min(y-th/2,window.innerHeight-th-8);
    tip.style.left=left+'px';
    tip.style.top=top+'px';
  }
  function removeLocTip(){
    if(_locTip){_locTip.remove();_locTip=null;}
  }
  document.addEventListener('click',e=>{
    const block=e.target.closest('.wk-block.loc-only,.dv-block.loc-only');
    if(block){
      e.stopPropagation();
      e.preventDefault();
      const dt=block.dataset.dt;
      const sid=block.dataset.sid;
      const idx=parseInt(block.dataset.idx);
      const tl=dt?getTimeline(dt):null;
      let locText='';
      if(tl){
        const slot=sid?tl.find(s=>String(s._id)===String(sid)):tl[idx];
        if(slot)locText=slot.loc||slot.text||'Location';
      }
      if(!locText)locText='Location';
      if(_locTip){removeLocTip();return;}
      showLocTip(locText,e.clientX,e.clientY);
      setTimeout(()=>document.addEventListener('click',removeLocTip,{once:true}),10);
      return;
    }
    removeLocTip();
  },true);
})();


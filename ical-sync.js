// ===== APPLE CALENDAR SYNC (one-way, read-only mirror) =====
// Fetches published iCloud calendar links (webcal://...) and reconciles their
// events into D.days as normal blocks tagged _feed. Edits made in Apple
// Calendar flow in on the next sync; edits made here get overwritten, so the
// source of truth stays Apple Calendar.

function _icalEsc(s){return (s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

function _icalUnfold(text){
  const raw=text.split(/\r?\n/);
  const lines=[];
  raw.forEach(l=>{
    if((l.startsWith(' ')||l.startsWith('\t'))&&lines.length)lines[lines.length-1]+=l.slice(1);
    else lines.push(l);
  });
  return lines;
}

function _icalUnescape(v){
  return v.replace(/\\n/gi,' · ').replace(/\\,/g,',').replace(/\\;/g,';').replace(/\\\\/g,'\\');
}

// Returns {y,m,d,hh,mm,allDay} in LOCAL time. Zulu times are converted from
// UTC; TZID times are taken at face value (all the user's calendars are ET).
function _icalTime(val,params){
  if(/VALUE=DATE(?!-TIME)/.test(params)||/^\d{8}$/.test(val)){
    return {y:+val.slice(0,4),m:+val.slice(4,6),d:+val.slice(6,8),hh:0,mm:0,allDay:true};
  }
  const m=val.match(/^(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)?(Z?)$/);
  if(!m)return null;
  if(m[7]==='Z'){
    const dt=new Date(Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5],+(m[6]||0)));
    return {y:dt.getFullYear(),m:dt.getMonth()+1,d:dt.getDate(),hh:dt.getHours(),mm:dt.getMinutes(),allDay:false};
  }
  return {y:+m[1],m:+m[2],d:+m[3],hh:+m[4],mm:+m[5],allDay:false};
}

function _icalDateStr(t){return t.y+'-'+String(t.m).padStart(2,'0')+'-'+String(t.d).padStart(2,'0');}

function _icalParseEvents(text){
  const lines=_icalUnfold(text);
  const events=[];let cur=null;
  lines.forEach(line=>{
    if(line==='BEGIN:VEVENT'){cur={exdates:[]};return;}
    if(line==='END:VEVENT'){if(cur&&cur.start)events.push(cur);cur=null;return;}
    if(!cur)return;
    const ci=line.indexOf(':');if(ci<0)return;
    const head=line.slice(0,ci),val=line.slice(ci+1);
    const name=head.split(';')[0].toUpperCase();
    if(name==='UID')cur.uid=val;
    else if(name==='SUMMARY')cur.summary=_icalUnescape(val).replace(/[<>]/g,'').trim();
    else if(name==='LOCATION')cur.loc=_icalUnescape(val).replace(/[<>]/g,'').trim();
    else if(name==='DTSTART')cur.start=_icalTime(val,head);
    else if(name==='DTEND')cur.end=_icalTime(val,head);
    else if(name==='RRULE')cur.rrule=val;
    else if(name==='RECURRENCE-ID'){const t=_icalTime(val,head);if(t)cur.recurId=_icalDateStr(t);}
    else if(name==='EXDATE'){val.split(',').forEach(v=>{const t=_icalTime(v.trim(),head);if(t)cur.exdates.push(_icalDateStr(t));});}
    else if(name==='STATUS'&&/CANCELLED/i.test(val))cur.cancelled=true;
  });
  return events;
}

function _icalRule(rrule){
  const r={};
  rrule.split(';').forEach(p=>{const [k,v]=p.split('=');if(k&&v)r[k.toUpperCase()]=v;});
  return r;
}

// Expand one event into occurrences within [winStart, winEnd] (Date objects).
function _icalExpand(ev,winStart,winEnd){
  const occs=[];
  const s=ev.start;
  const startMin=s.allDay?7*60:s.hh*60+s.mm;
  let durMin=60;
  if(ev.end){
    const sd=new Date(s.y,s.m-1,s.d,s.hh,s.mm);
    const ed=new Date(ev.end.y,ev.end.m-1,ev.end.d,ev.end.hh,ev.end.mm);
    durMin=Math.round((ed-sd)/60000);
  }
  if(s.allDay)durMin=0;
  const push=d=>{
    if(d<winStart||d>winEnd)return;
    const dt=dateStr(d);
    if(ev.exdates.indexOf(dt)!==-1)return;
    occs.push({dt,startMin,endMin:durMin>0?Math.min(startMin+durMin,1439):0,allDay:!!s.allDay});
  };
  const first=new Date(s.y,s.m-1,s.d);
  if(!ev.rrule){push(first);return occs;}
  const r=_icalRule(ev.rrule);
  const freq=r.FREQ,interval=Math.max(1,parseInt(r.INTERVAL||'1'));
  let until=null;
  if(r.UNTIL){const t=_icalTime(r.UNTIL,'');if(t)until=new Date(t.y,t.m-1,t.d,23,59);}
  let count=r.COUNT?parseInt(r.COUNT):null;
  const maxIter=800;let made=0;
  if(freq==='WEEKLY'){
    const dayMap={SU:0,MO:1,TU:2,WE:3,TH:4,FR:5,SA:6};
    const byday=(r.BYDAY?r.BYDAY.split(','):[]).map(x=>dayMap[x.replace(/^[-+]?\d+/,'')]).filter(x=>x!==undefined);
    const days=byday.length?byday:[first.getDay()];
    // walk week by week from the week containing DTSTART
    const weekAnchor=new Date(first);weekAnchor.setDate(weekAnchor.getDate()-weekAnchor.getDay());
    for(let w=0;w<maxIter;w++){
      const wk=new Date(weekAnchor);wk.setDate(wk.getDate()+w*7*interval);
      let stop=false;
      for(const dow of days.slice().sort((a,b)=>a-b)){
        const d=new Date(wk);d.setDate(d.getDate()+dow);
        if(d<first)continue;
        if(until&&d>until){stop=true;break;}
        if(count!==null&&made>=count){stop=true;break;}
        made++;push(d);
      }
      if(stop||wk>winEnd)break;
    }
  }else if(freq==='DAILY'){
    for(let i=0;i<maxIter;i++){
      const d=new Date(first);d.setDate(d.getDate()+i*interval);
      if(until&&d>until)break;
      if(count!==null&&i>=count)break;
      if(d>winEnd)break;
      push(d);
    }
  }else if(freq==='MONTHLY'){
    for(let i=0;i<48;i++){
      const d=new Date(s.y,s.m-1+i*interval,s.d);
      if(until&&d>until)break;
      if(count!==null&&i>=count)break;
      if(d>winEnd)break;
      push(d);
    }
  }else if(freq==='YEARLY'){
    for(let i=0;i<5;i++){
      const d=new Date(s.y+i*interval,s.m-1,s.d);
      if(until&&d>until)break;
      if(d>winEnd)break;
      push(d);
    }
  }else{
    push(first);
  }
  return occs;
}

function _icalOccurrences(text){
  const events=_icalParseEvents(text);
  const now=new Date();
  const winStart=new Date(now);winStart.setDate(winStart.getDate()-30);
  const winEnd=new Date(now);winEnd.setDate(winEnd.getDate()+400);
  // recurrence-id overrides replace that date's base occurrence
  const overrides={};
  events.forEach(ev=>{if(ev.recurId&&ev.uid){(overrides[ev.uid]=overrides[ev.uid]||new Set()).add(ev.recurId);}});
  const out=[];
  events.forEach(ev=>{
    if(ev.cancelled)return;
    const skip=(!ev.recurId&&ev.uid&&overrides[ev.uid])?overrides[ev.uid]:null;
    _icalExpand(ev,winStart,winEnd).forEach(o=>{
      if(skip&&skip.has(o.dt))return;
      out.push({...o,summary:ev.summary||'(untitled)',loc:ev.loc||''});
    });
  });
  return out;
}

function _icalApply(feed,occs){
  Object.keys(D.days).forEach(dt=>{
    const tl=D.days[dt];
    if(Array.isArray(tl)&&tl.some(s=>s._feed===feed.id)){
      const kept=tl.filter(s=>s._feed!==feed.id);
      if(kept.length)D.days[dt]=kept;else delete D.days[dt];
    }
  });
  let added=0;
  occs.forEach(o=>{
    const tl=D.days[o.dt]||(D.days[o.dt]=[]);
    // skip if she already has the same block by hand (avoids doubles)
    const lc=o.summary.trim().toLowerCase();
    if(tl.some(s=>!s._feed&&s.text&&s.text.trim().toLowerCase()===lc&&Math.abs(parseMin(s.t)-o.startMin)<30))return;
    const slot={t:minToTime(o.startMin),text:o.summary,cls:feed.cls||'personal',sm:o.allDay?'All day':'',loc:o.loc,_id:'ics_'+feed.id+'_'+o.dt+'_'+o.startMin+'_'+added,_feed:feed.id};
    if(o.endMin>o.startMin)slot.end=minToTime(o.endMin);
    tl.push(slot);added++;
    tl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
  });
  return added;
}

async function _icalFetchText(url){
  const u=url.trim().replace(/^webcal:\/\//i,'https://');
  const tries=[u,'https://corsproxy.io/?url='+encodeURIComponent(u),'https://api.allorigins.win/raw?url='+encodeURIComponent(u)];
  for(const t of tries){
    try{
      const r=await fetch(t,{redirect:'follow'});
      if(r.ok){const txt=await r.text();if(txt.indexOf('BEGIN:VCALENDAR')!==-1)return txt;}
    }catch(e){}
  }
  throw new Error('Could not reach the calendar link');
}

async function syncIcalFeeds(showStatus){
  if(!D.icalFeeds||!D.icalFeeds.length)return;
  for(const feed of D.icalFeeds){
    if(feed.off)continue;
    const st=document.getElementById('icalStatus_'+feed.id);
    if(st)st.textContent='Syncing…';
    try{
      const text=await _icalFetchText(feed.url);
      const occs=_icalOccurrences(text);
      const n=_icalApply(feed,occs);
      feed.last=Date.now();feed.err='';
      if(st)st.textContent='✓ '+n+' events synced';
    }catch(e){
      feed.err=e.message||'sync failed';
      if(st)st.textContent='⚠️ '+feed.err;
    }
  }
  save();
  if(typeof renderCalendar==='function')try{renderCalendar();}catch(e){}
  if(typeof renderMiniCal==='function')try{renderMiniCal();}catch(e){}
  if(typeof renderToday==='function')try{renderToday();}catch(e){}
}

function icalAutoSync(){
  if(!D.icalFeeds||!D.icalFeeds.length)return;
  const oldest=Math.min(...D.icalFeeds.filter(f=>!f.off).map(f=>f.last||0));
  if(Date.now()-oldest>30*60*1000)syncIcalFeeds(false);
}

function openIcalModal(){
  D.icalFeeds=D.icalFeeds||[];
  let bg=document.getElementById('icalModalBg');
  if(bg)bg.remove();
  bg=document.createElement('div');
  bg.id='icalModalBg';
  bg.className='modal-bg show';
  const rows=D.icalFeeds.map(f=>{
    const last=f.last?new Date(f.last).toLocaleString([],{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'never';
    return `<div style="display:flex;flex-direction:column;gap:4px;padding:10px;border:1px solid var(--border);border-radius:10px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <b style="flex:1;">${_icalEsc(f.name)}</b>
        <select onchange="icalSetCls('${f.id}',this.value)" style="font-size:12px;">${catPickerOptions(f.cls)}</select>
        <button class="ics-btn" onclick="icalRemoveFeed('${f.id}')" title="Remove">✕</button>
      </div>
      <div style="font-size:11px;color:var(--muted);word-break:break-all;">${_icalEsc(f.url.slice(0,80))}${f.url.length>80?'…':''}</div>
      <div style="font-size:12px;color:var(--muted);" id="icalStatus_${f.id}">${f.err?'⚠️ '+_icalEsc(f.err):'Last synced: '+last}</div>
    </div>`;
  }).join('');
  bg.innerHTML=`<div class="modal" style="max-width:460px;">
    <h3 style="margin:0 0 4px;">🍎 Apple Calendar sync</h3>
    <p style="font-size:12.5px;color:var(--muted);margin:0 0 12px;line-height:1.5;">One-way mirror: events flow FROM Apple Calendar into here. Edit them in Apple Calendar, not here (local edits get overwritten on the next sync). Auto-refreshes every 30 min while the app is open.</p>
    <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:14px;">${rows||'<div style="font-size:13px;color:var(--muted);">No calendars linked yet.</div>'}</div>
    <div style="border-top:1px solid var(--border);padding-top:12px;display:flex;flex-direction:column;gap:8px;">
      <b style="font-size:13px;">Add a calendar</b>
      <input id="icalAddName" placeholder="Name (e.g. MCAT)" style="padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);">
      <input id="icalAddUrl" placeholder="Paste the public link (webcal://…)" style="padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);">
      <div style="display:flex;gap:8px;align-items:center;">
        <label style="font-size:12px;color:var(--muted);">Category</label>
        <select id="icalAddCls" style="flex:1;">${catPickerOptions()}</select>
      </div>
      <div style="font-size:11.5px;color:var(--muted);line-height:1.45;">Get the link on your Mac: Calendar app → right-click the calendar → Sharing Settings → check <b>Public Calendar</b> → copy the webcal link.</div>
    </div>
    <div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end;">
      <button class="ics-btn" onclick="document.getElementById('icalModalBg').remove()">Close</button>
      <button class="ics-btn" onclick="syncIcalFeeds(true)">🔄 Sync now</button>
      <button class="ics-btn" style="font-weight:600;" onclick="icalAddFeed()">Add + Sync</button>
    </div>
  </div>`;
  document.body.appendChild(bg);
  bg.onclick=e=>{if(e.target===bg)bg.remove();};
}

function icalAddFeed(){
  const name=(document.getElementById('icalAddName').value||'').trim();
  const url=(document.getElementById('icalAddUrl').value||'').trim();
  const cls=document.getElementById('icalAddCls').value;
  if(!url||!/^(webcal|https?):\/\//i.test(url)){alert('Paste the full webcal:// or https:// link from Apple Calendar sharing settings.');return;}
  D.icalFeeds=D.icalFeeds||[];
  if(D.icalFeeds.some(f=>f.url===url)){alert('That calendar is already linked.');return;}
  D.icalFeeds.push({id:'f'+Date.now(),name:name||'Calendar',url,cls,last:0});
  save();
  openIcalModal();
  syncIcalFeeds(true).then(()=>openIcalModal());
}

function icalSetCls(id,cls){
  const f=(D.icalFeeds||[]).find(x=>x.id===id);if(!f)return;
  f.cls=cls;save();
  Object.keys(D.days).forEach(dt=>{(D.days[dt]||[]).forEach(s=>{if(s._feed===id)s.cls=cls;});});
  save();
  if(typeof renderCalendar==='function')try{renderCalendar();}catch(e){}
}

function icalRemoveFeed(id){
  const f=(D.icalFeeds||[]).find(x=>x.id===id);if(!f)return;
  if(!confirm('Remove "'+f.name+'" and its synced events from the planner? (Nothing in Apple Calendar is touched.)'))return;
  Object.keys(D.days).forEach(dt=>{
    const kept=(D.days[dt]||[]).filter(s=>s._feed!==id);
    if(kept.length)D.days[dt]=kept;else delete D.days[dt];
  });
  D.icalFeeds=D.icalFeeds.filter(x=>x.id!==id);
  save();
  openIcalModal();
  if(typeof renderCalendar==='function')try{renderCalendar();}catch(e){}
}

setTimeout(()=>{try{icalAutoSync();}catch(e){}},2000);

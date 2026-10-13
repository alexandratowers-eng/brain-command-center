// ===== CLASS LINKS: Zoom + slides → Notability =====
// One place to store the class Zoom room and the Drive folder the decks live in,
// then stamp both onto every class block, the .ics export, and the pre-class nudge.

function _clGet(){
  D.classLinks=D.classLinks||{zoom:'',zoomId:'',slidesFolder:'',lastDeck:'',leadMin:25};
  return D.classLinks;
}

// --- ICS text escaping + line folding (the old export just stripped chars) ---
function _icsEsc(s){
  return String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
}
function _icsFold(line){
  if(line.length<=73)return line;
  let out=line.slice(0,73),rest=line.slice(73);
  while(rest.length>72){out+='\r\n '+rest.slice(0,72);rest=rest.slice(72);}
  return out+(rest?'\r\n '+rest:'');
}
function _icsLines(arr){return arr.filter(Boolean).map(_icsFold).join('\r\n');}
function _icsStamp(){return new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'');}

// --- Google Slides / Drive helpers ---
// Any Slides link → the direct PDF export. That URL downloads a real PDF, which is
// what Notability wants; a normal /edit link just opens the Slides app instead.
function slidesPdfUrl(url){
  const m=String(url||'').match(/presentation\/d\/([a-zA-Z0-9_-]+)/);
  if(m)return 'https://docs.google.com/presentation/d/'+m[1]+'/export/pdf';
  const f=String(url||'').match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if(f)return 'https://drive.google.com/uc?export=download&id='+f[1];
  return '';
}
function isSlidesLink(url){return !!slidesPdfUrl(url);}

// --- Stamp the saved links onto every class block (idempotent, runs each load) ---
function applyClassLinks(){
  const cl=_clGet();
  if(!cl.zoom&&!cl.slidesFolder)return 0;
  let n=0;
  Object.values(D.days||{}).forEach(tl=>{
    (tl||[]).forEach(s=>{
      if(s._brem==='class'){
        if(cl.zoom&&s.loc!==cl.zoom){s.loc=cl.zoom;n++;}
        const note='Class is the studying. Nothing after. Touch 1 = class.'+(cl.zoomId?' · ID '+cl.zoomId:'');
        if(s.sm!==note){s.sm=note;n++;}
      }
      if(s._brem==='primer'&&cl.slidesFolder){
        const note='Prime for class. Grab today\u2019s deck \u2192 Notability first.';
        if(s.sm!==note){s.sm=note;n++;}
      }
    });
  });
  return n;
}

// ===== MODAL =====
function openClassLinksModal(){
  const cl=_clGet();
  let bg=document.getElementById('clModalBg');if(bg)bg.remove();
  bg=document.createElement('div');
  bg.id='clModalBg';bg.className='modal-bg show';
  const inp='padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:13px;width:100%;box-sizing:border-box;';
  bg.innerHTML=`<div class="modal" style="max-width:520px;">
    <h3 style="margin:0 0 4px;">\u{1F393} Class links</h3>
    <p style="font-size:12.5px;color:var(--muted);margin:0 0 14px;line-height:1.5;">Set these once. They get stamped onto every class block, every reminder, and every calendar file you export.</p>

    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;">
      <label style="font-size:12px;font-weight:600;">Zoom join link</label>
      <input id="clZoom" value="${(cl.zoom||'').replace(/"/g,'&quot;')}" placeholder="https://us02web.zoom.us/j/..." style="${inp}">
      <label style="font-size:12px;font-weight:600;margin-top:6px;">Meeting ID + passcode <span style="font-weight:400;color:var(--muted);">(backup, optional)</span></label>
      <input id="clZoomId" value="${(cl.zoomId||'').replace(/"/g,'&quot;')}" placeholder="881 2345 678 / passcode 1234" style="${inp}">
    </div>

    <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px;border-top:1px solid var(--border);padding-top:12px;">
      <label style="font-size:12px;font-weight:600;">Google Drive folder with the decks</label>
      <input id="clFolder" value="${(cl.slidesFolder||'').replace(/"/g,'&quot;')}" placeholder="https://drive.google.com/drive/folders/..." style="${inp}">
      <label style="font-size:12px;font-weight:600;margin-top:6px;">Remind me to grab the deck</label>
      <select id="clLead" style="${inp}">
        ${[15,25,35,45,60].map(m=>`<option value="${m}"${(cl.leadMin||25)==m?' selected':''}>${m} min before class</option>`).join('')}
        <option value="0"${(cl.leadMin||25)==0?' selected':''}>Don't remind me</option>
      </select>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap;">
      <button class="ics-btn" onclick="document.getElementById('clModalBg').remove()">Cancel</button>
      <button class="ics-btn" onclick="openSlidesHelper()">\u{1F4C4} Deck \u2192 Notability</button>
      <button class="ics-btn" onclick="exportClassICS()">\u{1F4C5} Export class .ics</button>
      <button class="ics-btn" style="font-weight:600;border-color:var(--blue);color:var(--blue);" onclick="saveClassLinks()">Save</button>
    </div>
  </div>`;
  document.body.appendChild(bg);
  bg.onclick=e=>{if(e.target===bg)bg.remove();};
}

function saveClassLinks(){
  const cl=_clGet();
  cl.zoom=(document.getElementById('clZoom').value||'').trim();
  cl.zoomId=(document.getElementById('clZoomId').value||'').trim();
  cl.slidesFolder=(document.getElementById('clFolder').value||'').trim();
  cl.leadMin=parseInt(document.getElementById('clLead').value)||0;
  const n=applyClassLinks();
  save();renderAll();
  const bg=document.getElementById('clModalBg');if(bg)bg.remove();
  const t=document.getElementById('saveToast');
  if(t){t.innerHTML='\u2713 Saved \u2014 '+n+' class blocks updated';t.classList.add('show');setTimeout(()=>t.classList.remove('show'),3000);}
}

// ===== DECK → NOTABILITY HELPER =====
function openSlidesHelper(){
  const cl=_clGet();
  let bg=document.getElementById('clSlidesBg');if(bg)bg.remove();
  bg=document.createElement('div');
  bg.id='clSlidesBg';bg.className='modal-bg show';
  const inp='padding:8px;border-radius:8px;border:1px solid var(--border);background:var(--bg);color:var(--text);font-size:13px;width:100%;box-sizing:border-box;';
  bg.innerHTML=`<div class="modal" style="max-width:540px;max-height:85vh;overflow-y:auto;">
    <h3 style="margin:0 0 4px;">\u{1F4C4} Today\u2019s deck \u2192 Notability</h3>
    <p style="font-size:12.5px;color:var(--muted);margin:0 0 14px;line-height:1.5;">The whole trick: a Slides <i>/edit</i> link opens the Slides app. The <i>/export/pdf</i> link downloads a real PDF, and a real PDF is the only thing Notability will take.</p>

    <div style="display:flex;flex-direction:column;gap:8px;">
      ${cl.slidesFolder?`<button class="ics-btn" style="text-align:left;padding:9px 12px;" onclick="window.open('${cl.slidesFolder.replace(/'/g,'')}','_blank')">\u{1F4C1} Open the Drive folder \u2192 copy today\u2019s deck link</button>`:'<div style="font-size:12px;color:var(--amber);">No Drive folder saved yet \u2014 add one in Class links.</div>'}
      <input id="clDeckUrl" value="${(cl.lastDeck||'').replace(/"/g,'&quot;')}" placeholder="Paste the Google Slides link here" style="${inp}" oninput="clRenderDeck()">
      <div id="clDeckOut"></div>
    </div>

    <div style="border-top:1px solid var(--border);margin-top:16px;padding-top:12px;">
      <b style="font-size:13px;">On the iPad, three taps</b>
      <ol style="font-size:12.5px;color:var(--muted);line-height:1.6;margin:6px 0 0;padding-left:20px;">
        <li>Tap <b>Download PDF</b> above \u2014 Safari saves it to Files.</li>
        <li>Tap the blue download arrow \u2192 the PDF \u2192 <b>Share</b>.</li>
        <li>Choose <b>Notability</b>. It lands as a new note you can write on.</li>
      </ol>
      <p style="font-size:12px;color:var(--muted);line-height:1.5;margin:10px 0 0;">Want it down to one tap? Make an iOS Shortcut: <b>Get Contents of URL</b> (the /export/pdf link) \u2192 <b>Save File</b> to iCloud Drive \u2192 <b>Open In</b> Notability. Run it from the Lock Screen before class. Notability has no Shortcuts actions of its own, so <b>Open In</b> is the handoff.</p>
    </div>

    <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px;">
      <button class="ics-btn" onclick="document.getElementById('clSlidesBg').remove()">Close</button>
    </div>
  </div>`;
  document.body.appendChild(bg);
  bg.onclick=e=>{if(e.target===bg)bg.remove();};
  clRenderDeck();
}

function clRenderDeck(){
  const el=document.getElementById('clDeckOut');if(!el)return;
  const raw=(document.getElementById('clDeckUrl').value||'').trim();
  if(!raw){el.innerHTML='';return;}
  const pdf=slidesPdfUrl(raw);
  if(!pdf){
    el.innerHTML='<div style="font-size:12px;color:var(--amber);padding:6px 0;">That doesn\u2019t look like a Google Slides or Drive file link.</div>';
    return;
  }
  const cl=_clGet();cl.lastDeck=raw;save();
  el.innerHTML=`<div style="display:flex;flex-direction:column;gap:6px;padding:10px;border:1px solid var(--border);border-radius:10px;background:rgba(59,130,246,.06);">
    <div style="font-size:11px;color:var(--muted);word-break:break-all;">${pdf}</div>
    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <a class="ics-btn" href="${pdf}" target="_blank" rel="noopener" style="text-decoration:none;font-weight:600;border-color:var(--blue);color:var(--blue);">\u2B07 Download PDF</a>
      <button class="ics-btn" onclick="navigator.clipboard.writeText('${pdf}');this.textContent='\u2713 Copied';">\u{1F4CB} Copy PDF link</button>
    </div>
  </div>`;
}

// ===== PRE-CLASS SLIDES NUDGE =====
let _clSlidesNudged=new Set();
function checkSlidesReminder(){
  const cl=_clGet();
  const lead=cl.leadMin||0;
  if(!lead)return;
  const dt=todayStr();
  const tl=getTimeline(dt);
  if(!tl||!tl.length)return;
  const cls=tl.find(s=>s._brem==='class');
  if(!cls)return;
  const now=new Date();
  const diff=parseMin(cls.t)-(now.getHours()*60+now.getMinutes());
  const key='slides_'+dt;
  if(diff<=0||diff>lead||_clSlidesNudged.has(key))return;
  _clSlidesNudged.add(key);

  if('Notification' in window&&Notification.permission==='granted'){
    const n=new Notification('\u{1F4C4} Grab today\u2019s deck',{
      body:'Class in '+diff+' min. Slides \u2192 PDF \u2192 Notability, then you\u2019re set.',
      tag:key,requireInteraction:false
    });
    n.onclick=()=>{window.focus();openSlidesHelper();n.close();};
    setTimeout(()=>n.close(),30000);
  }
  const toast=document.getElementById('saveToast');
  if(toast){
    toast.innerHTML='\u{1F4C4} <b>Deck \u2192 Notability</b> \u2014 class in '+diff+' min';
    toast.style.cursor='pointer';
    toast.onclick=()=>{openSlidesHelper();toast.classList.remove('show');};
    toast.classList.add('show');
    clearTimeout(window._clToast);
    window._clToast=setTimeout(()=>{toast.classList.remove('show');toast.onclick=null;toast.style.cursor='';},15000);
  }
}

// ===== RECURRING CLASS .ICS (the one you re-import to Apple Calendar) =====
function exportClassICS(){
  const cl=_clGet();
  if(!cl.zoom&&!confirm('No Zoom link saved yet. Export anyway?'))return;
  const startInput=prompt('Start the series on which date? (YYYY-MM-DD)',todayStr());
  if(!startInput)return;
  const untilInput=prompt('Repeat until? (YYYY-MM-DD)','2027-01-31');
  if(!untilInput)return;

  // Roll forward to the first Mon/Wed/Thu on or after the chosen start.
  const p=startInput.split('-').map(Number);
  let d=new Date(p[0],p[1]-1,p[2],12);
  for(let i=0;i<7&&[1,3,4].indexOf(d.getDay())===-1;i++)d=new Date(d.getTime()+86400000);
  const ds=d.getFullYear()+String(d.getMonth()+1).padStart(2,'0')+String(d.getDate()).padStart(2,'0');
  // Floating DTSTART means UNTIL must be floating too (no trailing Z) per RFC 5545.
  const until=untilInput.replace(/-/g,'')+'T235959';
  const stamp=_icsStamp();

  // Floating local times (no TZID): the block stays at 5:30 PM local across DST,
  // which is what a class schedule actually means.
  const desc=[
    cl.zoom?'Join: '+cl.zoom:'',
    cl.zoomId?'Meeting ID / passcode: '+cl.zoomId:'',
    cl.slidesFolder?'Slides folder: '+cl.slidesFolder:'',
    '','Before class: open the deck, add /export/pdf to the link, download, share to Notability.'
  ].filter(x=>x!=='').join('\n');

  const ev=(uid,sum,st,en,withLinks,alarm)=>_icsLines([
    'BEGIN:VEVENT',
    'UID:'+uid+'@braincmd',
    'DTSTAMP:'+stamp,
    'DTSTART:'+ds+'T'+st+'00',
    'DTEND:'+ds+'T'+en+'00',
    'RRULE:FREQ=WEEKLY;BYDAY=MO,WE,TH;UNTIL='+until,
    'SUMMARY:'+_icsEsc(sum),
    withLinks&&cl.zoom?'LOCATION:'+_icsEsc(cl.zoom):'',
    withLinks&&cl.zoom?'URL;VALUE=URI:'+cl.zoom:'',
    withLinks?'DESCRIPTION:'+_icsEsc(desc):'',
    'BEGIN:VALARM','TRIGGER:-PT'+alarm+'M','ACTION:DISPLAY','DESCRIPTION:'+_icsEsc(sum),'END:VALARM',
    'END:VEVENT'
  ]);

  const ics=[
    'BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//BrainCmd//Class//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH',
    'X-WR-CALNAME:MCAT Class',
    ev('bc-brem-primer-'+ds,'\u{1F4D6} 15-min primer + grab deck','1715','1730',false,20),
    ev('bc-brem-class-'+ds,'\u{1F4DA} Brem class (Zoom)','1730','2030',true,10),
    'END:VCALENDAR',''
  ].join('\r\n');

  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([ics],{type:'text/calendar'}));
  a.download='mcat-class-zoom.ics';a.click();

  alert('Downloaded mcat-class-zoom.ics\n\nIn Apple Calendar: delete the old class events first (easiest if they live on their own calendar), then File \u2192 Import and pick a calendar.\n\nThe Zoom link is in the Location field, so Apple shows a Join button right on the event.');
}

// Boot: stamp links on load, then watch for the pre-class window.
setTimeout(()=>{if(applyClassLinks())save();},900);
setInterval(checkSlidesReminder,60000);
setTimeout(checkSlidesReminder,4000);

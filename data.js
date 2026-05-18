// ===== DATA =====
const SK='alex_planner_v6';
const EFFORT_TAGS={
  quick:{emoji:'⚡',label:'Easy but annoying',color:'var(--green)'},
  call:{emoji:'📞',label:'Call-based',color:'var(--blue)'},
  focus:{emoji:'🧠',label:'Longer / Focus',color:'var(--purple)'},
  low:{emoji:'😴',label:'Low energy ok',color:'var(--dim)'},
  errand:{emoji:'🚗',label:'Errands',color:'var(--amber)'}
};
let D=load();
function load(){try{const s=localStorage.getItem(SK);if(s){const d=JSON.parse(s);if(!d.days)d.days={};if(!d.selectedDate)d.selectedDate=todayStr();
  // Migrate: add reflections if missing
  if(!d.reflections) d.reflections={};
  if(!d.backlog) d.backlog=[];
  if(!d.worryLog) d.worryLog={};
  if(!d.weeklyGoals) d.weeklyGoals=[];
  if(!d.lists) d.lists=[];
  // Migrate: consolidate gma+errands into personal, inbox into braindump
  if(!d._catsMerged){
    // Merge category references in tasks
    if(d.tasks) d.tasks.forEach(t=>{if(t.cat==='gma'||t.cat==='errands')t.cat='personal';if(t.cat==='inbox')t.cat='braindump';});
    // Merge in day timelines
    if(d.days) Object.values(d.days).forEach(slots=>{if(Array.isArray(slots)) slots.forEach(s=>{if(s.cls==='gma')s.cls='personal';if(s.cls==='inbox')s.cls='braindump';});});
    // Remove old cats, ensure new ones
    if(d.cats){delete d.cats.gma;delete d.cats.inbox;}
    if(d.cats&&!d.cats.braindump) d.cats.braindump={emoji:'🧠',label:'Brain Dump',color:'#a78bfa'};
    if(d.cats&&!d.cats.personal) d.cats.personal={emoji:'🏠',label:'Personal',color:'#34d399'};
    if(d.cats&&!d.cats.deadline) d.cats.deadline={emoji:'🎯',label:'Deadline/Goal',color:'#f87171'};
    if(d.cats&&!d.cats.health) d.cats.health={emoji:'💚',label:'Health/Wellbeing',color:'#34d399'};
    if(d.cats&&!d.cats.errands) d.cats.errands={emoji:'📋',label:'Appts/Meetings',color:'#fcd34d'};
    // Update existing cat colors to new scheme
    if(d.cats.personal&&d.cats.personal.color==='#fbbf24') d.cats.personal.color='#34d399';
    if(d.cats.medapp&&d.cats.medapp.color==='#2dd4bf') d.cats.medapp.color='#f87171';
    if(d.cats.mcat&&d.cats.mcat.color==='#818cf8') d.cats.mcat.color='#60a5fa';
    d._catsMerged=true;
  }
  if(d.parking&&!d._parkingMigrated){
    const lines=d.parking.split('\n').filter(l=>l.trim());
    if(lines.length){
      if(!d.parkingItems)d.parkingItems=[];
      lines.forEach(l=>d.parkingItems.push({id:Date.now()+Math.random()*1000|0,text:l.trim(),added:todayStr()}));
    }
    d.parking='';d._parkingMigrated=true;
  }
  // One-time NotePlan import
  if(!d._npImported){
    const npTasks=[
      {text:'Clean up resume — formatting precise',cat:'medapp',pri:'high'},
      {text:'Send resume + PS to Alex, Stephanie, Brian',cat:'medapp',pri:'high'},
      {text:'Personal statement draft',cat:'medapp',pri:'high'},
      {text:'Go to coffee shop — organize 15 experiences',cat:'medapp',pri:'high'},
      {text:'Send resume to letter writers + offer extras',cat:'medapp',pri:'high'},
      {text:'PS: more about you, can touch on others',cat:'medapp',pri:'high'},
      {text:'Combine experiences per Susie meeting',cat:'medapp',pri:'med'},
      {text:'Talk through combined experiences w/ Brandee',cat:'medapp',pri:'med'},
      {text:'Send Brandee plan for each experience',cat:'medapp',pri:'med'},
      {text:'Email Eric',cat:'medapp',pri:'med'},
      {text:'Attach AAMC recs page to LOR requests',cat:'medapp',pri:'med'},
      {text:'Move caregiving out of volunteer or decide if clinical',cat:'medapp',pri:'med'},
      {text:'Practice talking about what I do',cat:'medapp',pri:'med'},
      {text:'Add Lucas fundraising to resume',cat:'medapp',pri:'low'},
      {text:'Find out org tobacco cess published in + Alex awards/PAS/NIH',cat:'chop',pri:'med'},
      {text:'Talk to Carmen',cat:'chop',pri:'med'},
      {text:'Returns',cat:'personal',pri:'low'},
      {text:'Text cuties gc or maeve maybe rach',cat:'personal',pri:'low'},
    ];
    npTasks.forEach(t=>{d.tasks.push({id:d.nextId++,text:t.text,cat:t.cat,pri:t.pri,done:false,date:''});});
    d._npImported=true;
  }
  if(!d._colorSwapV2){
    if(d.cats&&d.cats.personal) d.cats.personal.color='#34d399';
    if(d.cats&&d.cats.medapp) d.cats.medapp.color='#93c5fd';
    d._colorSwapV2=true;
  }
  if(d.tasks)d.tasks.forEach(t=>{if(!t.effort)t.effort='';});
  // Seed daily 10-min MCAT review blocks May 1–31 2026
  if(!d._mcatMaySeeded){
    if(!d.days)d.days={};
    const labels=['📚 MCAT Content Review','📚 MCAT Biochem Review','📚 MCAT P/S Review','📚 MCAT C/P Review','📚 MCAT B/B Review','📚 MCAT CARS Practice','📚 MCAT Flashcards'];
    let li=0;
    for(let day=1;day<=31;day++){
      const dt=`2026-05-${String(day).padStart(2,'0')}`;
      if(!d.days[dt])d.days[dt]=[];
      const tl=d.days[dt];
      const alreadyHas=tl.some(s=>s._mcatDaily);
      if(!alreadyHas){
        tl.push({t:'12:30 PM',text:labels[li%labels.length],cls:'mcat',sm:'10-min daily MCAT content review',loc:'',end:'12:40 PM',_mcatDaily:true,_id:'mcat_may_'+day});
        li++;
      }
    }
    d._mcatMaySeeded=true;
  }
  // Move MCAT daily blocks to 12:30 PM
  if(!d._mcatTimeFixed){
    if(d.days){Object.values(d.days).forEach(tl=>{if(Array.isArray(tl))tl.forEach(s=>{if(s._mcatDaily&&s.t==='8:00 AM'){s.t='12:30 PM';s.end='12:40 PM';}});});}
    d._mcatTimeFixed=true;
  }
  // Remove MCAT daily blocks before May 11, keep May 11–31 only
  if(!d._mcatStartNextWeek){
    if(d.days){
      for(let day=1;day<=10;day++){
        const dt=`2026-05-${String(day).padStart(2,'0')}`;
        if(d.days[dt]&&Array.isArray(d.days[dt])){
          d.days[dt]=d.days[dt].filter(s=>!s._mcatDaily);
        }
      }
    }
    d._mcatStartNextWeek=true;
  }
  // Switch MCAT from daily to twice-a-week (Wed+Sat), starting Wed May 13
  if(!d._mcatTwiceWeek){
    if(d.days){
      // Remove all daily MCAT blocks
      Object.keys(d.days).forEach(dt=>{
        if(Array.isArray(d.days[dt])){
          d.days[dt]=d.days[dt].filter(s=>!s._mcatDaily);
        }
      });
      // Add Wed+Sat MCAT blocks May 13–31
      const labels=['📚 MCAT Content Review','📚 MCAT Biochem Review','📚 MCAT P/S Review','📚 MCAT C/P Review','📚 MCAT B/B Review','📚 MCAT CARS Practice','📚 MCAT Flashcards'];
      let li=0;
      for(let day=13;day<=31;day++){
        const dt=`2026-05-${String(day).padStart(2,'0')}`;
        const dow=new Date(2026,4,day).getDay();
        if(dow!==3&&dow!==6)continue; // Wed=3, Sat=6
        if(!d.days[dt])d.days[dt]=[];
        const tl=d.days[dt];
        if(!tl.some(s=>s._mcatBiweekly)){
          tl.push({t:'12:30 PM',text:labels[li%labels.length],cls:'mcat',sm:'MCAT review (Wed & Sat)',loc:'',end:'12:40 PM',_mcatBiweekly:true,_id:'mcat_2x_'+day});
          li++;
        }
      }
    }
    d._mcatTwiceWeek=true;
  }
  // Category consolidation: CHOP→teal first, merge exercise+errands→personal
  if(!d._catsV3){
    if(d.tasks)d.tasks.forEach(t=>{if(t.cat==='exercise')t.cat='personal';if(t.cat==='errands')t.cat='personal';});
    if(d.days)Object.values(d.days).forEach(tl=>{if(Array.isArray(tl))tl.forEach(s=>{if(s.cls==='exercise')s.cls='personal';if(s.cls==='errands')s.cls='personal';});});
    if(d.cats){
      if(d.cats.chop)d.cats.chop.color='#60a5fa';
      if(d.cats.personal)d.cats.personal.color='#60a5fa';
      if(d.cats.mcat)d.cats.mcat.color='#818cf8';
      delete d.cats.exercise;delete d.cats.errands;
      const ordered={};
      ['chop','personal','mcat','medapp','deadline','health','braindump'].forEach(k=>{if(d.cats[k])ordered[k]=d.cats[k];});
      Object.keys(d.cats).forEach(k=>{if(!ordered[k])ordered[k]=d.cats[k];});
      d.cats=ordered;
    }
    d._catsV3=true;
  }
  // Remove MCAT blocks until June, seed June Wed+Sat
  if(!d._mcatJuneStart){
    if(d.days){
      Object.keys(d.days).forEach(dt=>{if(Array.isArray(d.days[dt]))d.days[dt]=d.days[dt].filter(s=>!s._mcatBiweekly&&!s._mcatDaily);});
      const labels=['📚 MCAT Content Review','📚 MCAT Biochem Review','📚 MCAT P/S Review','📚 MCAT C/P Review','📚 MCAT B/B Review','📚 MCAT CARS Practice','📚 MCAT Flashcards'];
      let li=0;
      for(let day=1;day<=30;day++){
        const dt=`2026-06-${String(day).padStart(2,'0')}`;
        const dow=new Date(2026,5,day).getDay();
        if(dow!==3&&dow!==6)continue;
        if(!d.days[dt])d.days[dt]=[];
        if(!d.days[dt].some(s=>s._mcatJune)){
          d.days[dt].push({t:'12:30 PM',text:labels[li%labels.length],cls:'mcat',sm:'MCAT review (Wed & Sat)',loc:'',end:'12:40 PM',_mcatJune:true,_id:'mcat_jun_'+day});
          li++;
        }
      }
    }
    d._mcatJuneStart=true;
  }
  // Personal statement blocks Mon-Fri May 18-22
  if(!d._psWeekMay18){
    if(!d.days)d.days={};
    ['2026-05-18','2026-05-19','2026-05-20','2026-05-21','2026-05-22'].forEach((dt,i)=>{
      if(!d.days[dt])d.days[dt]=[];
      if(!d.days[dt].some(s=>s._psBlock)){
        d.days[dt].push({t:'6:00 PM',text:'📝 Personal Statement + Experience Work',cls:'personal',sm:'PS draft + experience entries',loc:'',end:'7:00 PM',_psBlock:true,_id:'ps_may_'+(18+i)});
      }
    });
    d._psWeekMay18=true;
  }
  if(!d._chopBlue){
    if(d.cats&&d.cats.chop)d.cats.chop.color='#60a5fa';
    d._chopBlue=true;
  }
  // Re-introduce exercise as its own category (split from personal)
  if(!d._exerciseCatV2){
    if(!d.cats)d.cats={};
    d.cats.exercise={emoji:'🏃',label:'Exercise',color:'#2dd4bf'};
    const ordered={};
    ['chop','personal','exercise','mcat','medapp','deadline','health','braindump'].forEach(k=>{if(d.cats[k])ordered[k]=d.cats[k];});
    Object.keys(d.cats).forEach(k=>{if(!ordered[k])ordered[k]=d.cats[k];});
    d.cats=ordered;
    d._exerciseCatV2=true;
  }
  if(!d._defaultDay){
    d.calView='day';
    d._defaultDay=true;
  }
  return d;}}catch(e){}return defaults();}
let _st=null;
const _undoStack=[];
const _UNDO_MAX=30;
let _lastSnap=0;
function save(){
  const now=Date.now();
  if(now-_lastSnap>500){
    const prev=localStorage.getItem(SK);
    if(prev){_undoStack.push(prev);if(_undoStack.length>_UNDO_MAX)_undoStack.shift();}
    _lastSnap=now;
  }
  D._localModifiedAt=now;
  localStorage.setItem(SK,JSON.stringify(D));
  if(typeof SyncEngine!=='undefined')SyncEngine.scheduleSync();
  const t=document.getElementById('saveToast');if(t){t.innerHTML='✓ Saved';t.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>t.classList.remove('show'),1200);}
}
function undo(){
  if(!_undoStack.length)return;
  const snap=_undoStack.pop();
  if(!snap)return;
  const restored=JSON.parse(snap);
  Object.keys(D).forEach(k=>delete D[k]);
  Object.assign(D,restored);
  localStorage.setItem(SK,JSON.stringify(D));
  renderAll();
  const t=document.getElementById('saveToast');if(t){t.innerHTML='↩ Undone';t.classList.add('show');clearTimeout(_st);_st=setTimeout(()=>t.classList.remove('show'),1200);}
}
function renderAll(){
  buildCatSelects();renderMiniCal();renderLegend();renderEnergy();renderSidebarTasks();
  updateDynamicBlockCSS();renderCalendar();renderMcat();renderDistractions();renderTomorrowMode();checkOverdueTasks();
  if(typeof renderBacklog==='function')renderBacklog();
  if(typeof renderCalRightTasks==='function')renderCalRightTasks();
  if(typeof renderCalRightCompleted==='function')renderCalRightCompleted();
  if(typeof renderCalRightStash==='function')renderCalRightStash();
  if(typeof renderCalRightWinsDone==='function')renderCalRightWinsDone();
  if(typeof renderSidebarWins==='function')renderSidebarWins();
  if(typeof checkWeeklyReview==='function')checkWeeklyReview();
  if(typeof renderWeeklyGoal==='function')renderWeeklyGoal();
  if(typeof autoParkingReview==='function')autoParkingReview();
  document.getElementById('brainDump').value=D.brainDump||'';
  updateStats();updateTimerDisp();initMeetingNotes();
  if(D.logoIcon)document.getElementById('logoIcon').textContent=D.logoIcon;
  if(D.logoText)document.getElementById('logoText').value=D.logoText;
}
function todayStr(){return new Date().toISOString().split('T')[0];}

function defaults(){
  const today=todayStr();
  return{
    cats:{
      chop:{emoji:'🔬',label:'CHOP',color:'#60a5fa'},
      personal:{emoji:'🏠',label:'Personal',color:'#60a5fa'},
      exercise:{emoji:'🏃',label:'Exercise',color:'#2dd4bf'},
      mcat:{emoji:'📚',label:'MCAT',color:'#818cf8'},
      medapp:{emoji:'🏥',label:'Med Apps',color:'#f87171'},
      deadline:{emoji:'🎯',label:'Deadline/Goal',color:'#f87171'},
      health:{emoji:'💚',label:'Health/Wellbeing',color:'#34d399'},
      braindump:{emoji:'🧠',label:'Brain Dump',color:'#a78bfa'},
    },
    tasks:[
      {id:1,text:'Finalize resume/CV for letter writers',cat:'medapp',pri:'high',done:false,date:'2026-04-14'},
      {id:2,text:'Draft 15 experiences (AMCAS style)',cat:'medapp',pri:'high',done:false,date:'2026-04-14'},
      {id:3,text:'Personal statement rough draft',cat:'medapp',pri:'high',done:false,date:'2026-04-15'},
      {id:4,text:'Compile materials packet for LOR writers',cat:'medapp',pri:'high',done:false,date:'2026-04-16'},
      {id:5,text:'CHOP calls block',cat:'chop',pri:'med',done:false,date:today},
      {id:6,text:'P/S: Nervous System overview (20 min)',cat:'mcat',pri:'med',done:false,date:today},
      {id:7,text:'Check on Gma',cat:'personal',pri:'high',done:false,date:today},
      {id:8,text:'Grocery run',cat:'personal',pri:'med',done:false,date:today},
    ],
    days:{},
    reflections:{},
    energy:3,pomo:0,brainDump:'',parking:'',parkingItems:[],backlog:[],worryLog:{},lists:[],nextId:20,
    selectedDate:today,
    calView:'day',
    miniMonth:new Date().getMonth(),
    miniYear:new Date().getFullYear(),
    mcatSteps:[
      {text:'P/S: Khan Academy — Nervous System overview',time:'20 min',status:'todo'},
      {text:'P/S: Flashcards — psych terms',time:'15 min',status:'todo'},
      {text:'Kaplan QBank: 10 mixed Qs',time:'15 min',status:'todo'},
    ],
  };
}

// ===== HELPERS =====
function parseMin(t){if(!t)return 0;const m=t.match(/(\d+):?(\d*)\s*(AM|PM|am|pm)?/);if(!m)return 0;let hr=parseInt(m[1]),min=parseInt(m[2])||0;const ap=(m[3]||'').toUpperCase();if(ap==='PM'&&hr!==12)hr+=12;if(ap==='AM'&&hr===12)hr=0;return hr*60+min;}
function minToTime(mins){if(mins>=1440)mins=1439;let hr=Math.floor(mins/60),min=mins%60;const ap=hr>=12?'PM':'AM';if(hr>12)hr-=12;if(hr===0)hr=12;return hr+':'+String(min).padStart(2,'0')+' '+ap;}
function slotDur(tl,i){if(i>=tl.length-1)return '';const a=parseMin(tl[i].t),b=parseMin(tl[i+1].t);const d=b-a;if(d<=0||d>480)return '';if(d<60)return d+'m';const h=Math.floor(d/60),m=d%60;return h+'h'+(m?m+'m':'');}
function dateObj(str){const [y,m,d]=str.split('-').map(Number);return new Date(y,m-1,d);}
function dateStr(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function getTimeline(dt){return D.days[dt]||[];}
function setTimeline(dt,tl){D.days[dt]=tl;save();}
function autoAddWin(text,dt){
  if(!text)return;
  if(!dt)dt=todayStr();
  if(!D.reflections)D.reflections={};
  if(!D.reflections[dt])D.reflections[dt]={};
  if(!D.reflections[dt].manualWins)D.reflections[dt].manualWins=[];
  if(D.reflections[dt].manualWins.indexOf(text)===-1){
    D.reflections[dt].manualWins.push(text);
    save();
    if(typeof renderQuickWins==='function')renderQuickWins();
    if(typeof renderWinsTab==='function')renderWinsTab();
  }
}
function trashTask(id){
  const idx=D.tasks.findIndex(t=>t.id===id);
  if(idx===-1)return;
  const task=D.tasks.splice(idx,1)[0];
  task._trashedAt=Date.now();
  if(!D.trash)D.trash=[];
  D.trash.push(task);
  save();
}
function restoreTask(idx){
  if(!D.trash||!D.trash[idx])return;
  const task=D.trash.splice(idx,1)[0];
  delete task._trashedAt;
  D.tasks.push(task);
  save();
}
function emptyTrash(){
  D.trash=[];
  save();
}
function checkWinForScheduledEvent(text){
  const lc=text.toLowerCase();
  const m=lc.match(/scheduled\s+(?:for\s+)?(.+)/i);
  if(!m)return null;
  const rest=m[1].trim();
  const today=new Date();
  const todayDow=today.getDay();
  const dowNames=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  const dowShort=['sun','mon','tue','wed','thu','fri','sat'];
  const monthNames=['january','february','march','april','may','june','july','august','september','october','november','december'];
  const monthShort=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
  let evDate=null;
  if(/^tomorrow\b/i.test(rest)){
    const d=new Date(today);d.setDate(d.getDate()+1);evDate=dateStr(d);
  } else if(/^today\b/i.test(rest)){
    evDate=todayStr();
  }
  if(!evDate){
    const nextDowRe=new RegExp('^(?:next\\s+|this\\s+)?('+dowNames.join('|')+'|'+dowShort.join('|')+')\\b','i');
    const dowM=rest.match(nextDowRe);
    if(dowM){
      const dayName=dowM[1].toLowerCase();
      let targetDow=dowNames.indexOf(dayName);
      if(targetDow===-1)targetDow=dowShort.indexOf(dayName);
      if(targetDow!==-1){
        const isNext=/next/i.test(dowM[0]);
        let diff=targetDow-todayDow;
        if(diff<=0)diff+=7;
        if(isNext&&diff<7)diff+=7;
        const d=new Date(today);d.setDate(d.getDate()+diff);evDate=dateStr(d);
      }
    }
  }
  if(!evDate){
    const mdRe=new RegExp('^('+monthNames.join('|')+'|'+monthShort.join('|')+')\\s+(\\d{1,2})\\b','i');
    const mdM=rest.match(mdRe);
    if(mdM){
      const mName=mdM[1].toLowerCase();
      let mi=monthNames.indexOf(mName);
      if(mi===-1)mi=monthShort.indexOf(mName);
      const day=parseInt(mdM[2]);
      const d=new Date(today.getFullYear(),mi,day);
      if(d<today)d.setFullYear(d.getFullYear()+1);
      evDate=dateStr(d);
    }
  }
  if(!evDate){
    const slashM=rest.match(/^(\d{1,2})\/(\d{1,2})\b/);
    if(slashM){
      const mo=parseInt(slashM[1])-1,day=parseInt(slashM[2]);
      const d=new Date(today.getFullYear(),mo,day);
      if(d<today)d.setFullYear(d.getFullYear()+1);
      evDate=dateStr(d);
    }
  }
  if(!evDate)return null;
  const cleanTitle=text.replace(/\s*scheduled\s+(?:for\s+)?.*$/i,'').trim()||text;
  const tl=getTimeline(evDate)||[];
  const dup=tl.some(s=>s.text===cleanTitle);
  if(dup)return evDate;
  tl.push({t:'9:00 AM',text:cleanTitle,cls:'personal',sm:'From wins',loc:''});
  tl.sort((a,b)=>parseMin(a.t)-parseMin(b.t));
  setTimeline(evDate,tl);
  return evDate;
}
function getWeekDates(dt){const d=dateObj(dt);const day=d.getDay();const mon=new Date(d);mon.setDate(d.getDate()-(day===0?6:day-1));const dates=[];for(let i=0;i<7;i++){const dd=new Date(mon);dd.setDate(mon.getDate()+i);dates.push(dateStr(dd));}return dates;}


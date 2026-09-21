// ===== BREAK MENU =====
// Breaks end on a physical event, never a timer, so stopping is not a willpower call.

const BREAKS=[
  {id:'eyes',icon:'visibility',c:'--teal',drain:'Eyes fried',sub:'Screen blur, dry eyes',
   act:'Stand at a window. Find the farthest thing you can see and stare at it.',
   ends:'When you can name 3 far-away things out loud'},
  {id:'legs',icon:'directions_run',c:'--green',drain:'Restless',sub:'Legs jumping, body stiff',
   act:'20 squats, or hang off a doorframe until your arms give out.',
   ends:'The count hits 20'},
  {id:'fog',icon:'filter_drama',c:'--blue',drain:'Foggy',sub:'Rereading the same line',
   act:'Cold water on your wrists and the back of your neck.',
   ends:'When the cold stops feeling shocking'},
  {id:'irritable',icon:'music_note',c:'--rose',drain:'Irritable',sub:'Want to quit',
   act:'One song. Headphones, loud, standing up. Not sitting.',
   ends:'The song ends. That is your timer.'},
  {id:'lonely',icon:'chat_bubble',c:'--purple',drain:'Isolated',sub:'Alone for hours',
   act:'Send ONE voice memo to one person. Do not wait for a reply.',
   ends:'You hit send'},
  {id:'wired',icon:'bedtime',c:'--indigo',drain:'Wired',sub:'Cannot settle',
   act:'Lie flat on the floor. Phone in another room.',
   ends:'20 slow breaths'},
  {id:'hungry',icon:'restaurant',c:'--amber',drain:'Hungry',sub:'Been ignoring it',
   act:'Eat the pre-made thing. Sitting down, no screen.',
   ends:'The container is empty'}
];

const CLASS_FOOD=[
  {a:'Logging in / walking to your seat',f:'Protein shake, the whole thing',w:'Front-loads calories before you are capable of forgetting'},
  {a:'Attendance or the intro talk',f:'Banana, or a nut butter squeeze packet',w:'One hand, no noise, no cleanup'},
  {a:'Slides switch to a new section',f:'Soft cheese stick, dates, drinkable yogurt',w:'Natural lull, nobody is looking at you'},
  {a:'Someone else talks for 2+ minutes',f:'Hummus and soft pita, turkey tortilla roll-up',w:'Quiet, one-handed, actually filling'},
  {a:'The real break',f:'Overnight oats, or actual lunch, sitting down',w:'This one is the Eat break. Protect it.'}
];

let _brkLast=null;

function openBreaks(){
  if(!document.getElementById('breakModal')){
    const d=document.createElement('div');
    d.className='modal-bg';d.id='breakModal';
    d.onclick=e=>{if(e.target===d)closeBreaks();};
    d.innerHTML='<div class="modal brk-modal"><div id="brkBody"></div></div>';
    document.body.appendChild(d);
  }
  renderBreakPicker();
  document.getElementById('breakModal').classList.add('show');
}
function closeBreaks(){
  const m=document.getElementById('breakModal');
  if(m)m.classList.remove('show');
}

function brkHead(tab){
  return `<div class="brk-head">
    <div class="brk-seg">
      <button class="brk-seg-btn${tab==='break'?' on':''}" onclick="renderBreakPicker()">Take a break</button>
      <button class="brk-seg-btn${tab==='food'?' on':''}" onclick="renderClassFood()">Eat in class</button>
    </div>
    <button class="brk-x" onclick="closeBreaks()" aria-label="Close"><span class="mi">close</span></button>
  </div>`;
}

function renderBreakPicker(){
  const cards=BREAKS.map(b=>`
    <button class="brk-chip" style="--ac:var(${b.c})" onclick="showBreak('${b.id}')">
      <span class="mi brk-chip-i">${b.icon}</span>
      <span class="brk-chip-t">${b.drain}</span>
      <span class="brk-chip-s">${b.sub}</span>
    </button>`).join('');
  document.getElementById('brkBody').innerHTML=brkHead('break')+
    `<p class="brk-q">What is actually drained?</p>
     <div class="brk-grid">${cards}</div>
     <button class="brk-surprise" onclick="surpriseBreak()"><span class="mi">casino</span> Pick one for me</button>`;
}

function showBreak(id){
  const b=BREAKS.find(x=>x.id===id);if(!b)return;
  _brkLast=id;
  document.getElementById('brkBody').innerHTML=brkHead('break')+
    `<div class="brk-detail" style="--ac:var(${b.c})">
      <div class="brk-detail-top">
        <span class="mi brk-detail-i">${b.icon}</span>
        <div><div class="brk-detail-label">${b.drain}</div><div class="brk-detail-sub">${b.sub}</div></div>
      </div>
      <p class="brk-act">${b.act}</p>
      <div class="brk-ends">
        <div class="brk-ends-label">Ends when</div>
        <div class="brk-ends-text">${b.ends}</div>
      </div>
    </div>
    <div class="brk-foot">
      <button class="brk-btn ghost" onclick="renderBreakPicker()">Pick another</button>
      <button class="brk-btn solid" onclick="closeBreaks()">Go</button>
    </div>`;
}

function surpriseBreak(){
  const pool=BREAKS.filter(b=>b.id!==_brkLast);
  showBreak(pool[Math.floor(Math.random()*pool.length)].id);
}

function renderClassFood(){
  const rows=CLASS_FOOD.map(x=>`
    <div class="brk-food-row">
      <div class="brk-food-anchor">${x.a}</div>
      <div class="brk-food-what">${x.f}</div>
      <div class="brk-food-why">${x.w}</div>
    </div>`).join('');
  document.getElementById('brkBody').innerHTML=brkHead('food')+
    `<p class="brk-q">Stack it on something class already does.</p>
     <div class="brk-food">${rows}</div>
     <div class="brk-note"><strong>No crunch.</strong> Chips, carrots, apples and raw nuts are loud, so you will not eat them, so you crash at hour two and call it bad focus when it was blood sugar.</div>
     <div class="brk-note"><strong>Pack it in the bag, not on the counter.</strong> The counter is where food goes to be forgotten.</div>`;
}

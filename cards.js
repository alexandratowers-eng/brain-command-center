// Cards view: difficulty-bucket board for parked / stashed tasks.
// Pool = D.parkingItems + undated active tasks (t.date===''). Each carries a `diff` (easy/med/hard).
// All personal, localStorage only. No external calls.

const CARD_COLS = [
  ['hard', '🔴 Harder', 'Needs a real block of energy', 'var(--rose)'],
  ['med',  '🟡 Medium', 'Moderate lift',                 'var(--amber)'],
  ['easy', '🟢 Easier', 'Quick wins you keep dodging',   'var(--green)'],
  ['',     '⚪ Unsorted', 'Drag into a bucket',           'var(--dim)']
];

// Unified pool: {key, src, id, text, diff, sub}
function _cardPool(){
  const pool = [];
  (D.parkingItems || []).forEach(p => pool.push({
    key: 'park:' + p.id, src: 'park', id: p.id, text: p.text,
    diff: p.diff || '', sub: 'parked' + (p.added ? ' · ' + p.added : '')
  }));
  D.tasks.filter(t => !t.date && !t.done && t.cat !== 'braindump').forEach(t => {
    const cat = D.cats[t.cat];
    pool.push({
      key: 'task:' + t.id, src: 'task', id: t.id, text: t.text,
      diff: t.diff || '', sub: 'stash' + (cat ? ' · ' + cat.emoji + cat.label : '')
    });
  });
  return pool;
}

function _cardById(key){
  return _cardPool().find(c => c.key === key);
}

function renderCards(){
  const el = document.getElementById('cardsView');
  if(!el) return;
  const pool = _cardPool();
  let h = `<div class="cards-intro">
    <h3 style="font-size:14px;margin:0 0 2px;">🃏 Task Cards</h3>
    <p style="font-size:11px;color:var(--dim);margin:0;">Everything parked or stashed, sorted by how hard it feels. Drag a card between buckets or use the ⬆︎ to pick one for today.</p>
  </div>`;

  if(!pool.length){
    h += `<p style="color:var(--dim);text-align:center;padding:28px;font-size:12px;">Nothing parked or stashed. When you hit "→ later" or "→ stash" on a task, it lands here.</p>`;
    el.innerHTML = h;
    return;
  }

  h += '<div class="cards-board">';
  CARD_COLS.forEach(([diffKey, label, desc, color]) => {
    const cards = pool.filter(c => (c.diff || '') === diffKey);
    h += `<div class="cards-col" data-diff="${diffKey}"
        ondragover="event.preventDefault();this.classList.add('card-drop');"
        ondragleave="this.classList.remove('card-drop');"
        ondrop="event.preventDefault();this.classList.remove('card-drop');cardDropOnCol(event,'${diffKey}');"
        style="border-top:3px solid ${color};">
      <div class="cards-col-head">
        <span class="cards-col-label">${label}</span>
        <span class="badge" style="font-size:10px;">${cards.length}</span>
      </div>
      <div class="cards-col-desc">${desc}</div>`;
    if(!cards.length){
      h += `<div class="cards-empty">Drop here</div>`;
    } else {
      cards.forEach(c => {
        h += `<div class="task-card" draggable="true"
            ondragstart="cardDragStart(event,'${c.key}')"
            ondragend="this.style.opacity='';">
          <div class="task-card-text">${_cardEsc(c.text)}</div>
          <div class="task-card-sub">${_cardEsc(c.sub)}</div>
          <div class="task-card-acts">
            <button class="card-btn" onclick="cardToToday('${c.key}')" title="Do it today">⬆︎ today</button>
            <button class="card-btn" onclick="cardDone('${c.key}')" title="Mark done">✓</button>
            <button class="card-btn card-del" onclick="cardDelete('${c.key}')" title="Remove">✕</button>
          </div>
        </div>`;
      });
    }
    h += '</div>';
  });
  h += '</div>';
  el.innerHTML = h;
}

function _cardEsc(s){return (s==null?'':String(s)).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

let _cardDragKey = null;
function cardDragStart(e, key){
  _cardDragKey = key;
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', key);
  e.target.style.opacity = '.4';
}
function cardDropOnCol(e, diffKey){
  const key = _cardDragKey || e.dataTransfer.getData('text/plain');
  _cardDragKey = null;
  if(!key) return;
  cardSetDiff(key, diffKey);
}

function cardSetDiff(key, diffKey){
  const c = _cardById(key);
  if(!c) return;
  if(c.src === 'park'){
    const p = (D.parkingItems || []).find(x => x.id === c.id);
    if(p) p.diff = diffKey;
  } else {
    const t = D.tasks.find(x => x.id === c.id);
    if(t) t.diff = diffKey;
  }
  save();
  renderCards();
}

// Move a card into today's active tasks.
function cardToToday(key){
  const c = _cardById(key);
  if(!c) return;
  if(c.src === 'park'){
    const item = (D.parkingItems || []).find(x => x.id === c.id);
    if(!item) return;
    D.tasks.push({id:D.nextId++, text:item.text, cat:'personal', pri:'med', done:false, date:todayStr(), diff:item.diff||''});
    D.parkingItems = D.parkingItems.filter(x => x.id !== c.id);
  } else {
    const t = D.tasks.find(x => x.id === c.id);
    if(t) t.date = todayStr();
  }
  save();
  renderCards();
  if(typeof renderAllTasks==='function') renderAllTasks();
  if(typeof renderCalTasks==='function') renderCalTasks();
  if(typeof renderCalendar==='function') renderCalendar();
  if(typeof updateStats==='function') updateStats();
  _cardToast('⬆︎ Moved to today');
}

function cardDone(key){
  const c = _cardById(key);
  if(!c) return;
  if(c.src === 'park'){
    if(typeof parkingItemDone==='function'){ parkingItemDone(c.id); }
    else { D.parkingItems = D.parkingItems.filter(x => x.id !== c.id); save(); }
  } else {
    const t = D.tasks.find(x => x.id === c.id);
    if(t){
      t.done = true; t.doneAt = Date.now();
      if(typeof autoAddWin==='function') autoAddWin(t.text, todayStr());
      if(typeof maybeLogWorkWin==='function') maybeLogWorkWin(t.text, t.cat, {sourceTaskId:t.id});
      save();
    }
  }
  renderCards();
  if(typeof renderAllTasks==='function') renderAllTasks();
  if(typeof updateStats==='function') updateStats();
  _cardToast('✓ Done — nice');
}

function cardDelete(key){
  const c = _cardById(key);
  if(!c) return;
  if(!confirm('Remove this card?')) return;
  if(c.src === 'park'){
    D.parkingItems = (D.parkingItems || []).filter(x => x.id !== c.id);
  } else {
    D.tasks = D.tasks.filter(x => x.id !== c.id);
  }
  save();
  renderCards();
  if(typeof renderAllTasks==='function') renderAllTasks();
}

function _cardToast(msg){
  const toast = document.getElementById('saveToast');
  if(!toast) return;
  toast.innerHTML = msg;
  toast.classList.add('show');
  clearTimeout(_st);
  _st = setTimeout(() => toast.classList.remove('show'), 1300);
}

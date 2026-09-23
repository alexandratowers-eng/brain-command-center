// ===== PARKED THOUGHTS ("Come back to this") =====
// A parked note is pinned to the top of the Calendar tab until dismissed,
// so resurfacing never depends on remembering to look somewhere.

function parkedEsc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function parkedAge(ts){
  const days=Math.floor((Date.now()-ts)/86400000);
  if(days<=0)return{label:'today',stale:false};
  if(days===1)return{label:'1 day',stale:false};
  return{label:days+' days',stale:days>=3};
}

function renderParked(){
  const bar=document.getElementById('parkedBar');
  if(!bar)return;
  D.parked=D.parked||[];
  let items='';
  D.parked.forEach(p=>{
    const age=parkedAge(p.ts);
    items+='<div class="parked-item">'
      +'<button class="parked-done" onclick="doneParked('+p.id+')" title="Done, clear it"><span class="mi">check_circle</span></button>'
      +'<span class="parked-text">'+parkedEsc(p.text)+'</span>'
      +'<span class="parked-age'+(age.stale?' stale':'')+'">'+age.label+'</span>'
      +'</div>';
  });
  bar.innerHTML='<div class="parked-card'+(D.parked.length?'':' empty')+'">'
    +items
    +'<div class="parked-input-row">'
    +'<span class="mi parked-pin">push_pin</span>'
    +'<input type="text" id="parkedInput" class="parked-input" placeholder="Park it: next step is..." autocomplete="off" onkeydown="if(event.key===\'Enter\')addParked()">'
    +'<button class="parked-add" onclick="addParked()">Park</button>'
    +'</div></div>';
}

function addParked(){
  const inp=document.getElementById('parkedInput');
  const text=(inp.value||'').trim();
  if(!text)return;
  D.parked=D.parked||[];
  D.parked.unshift({id:Date.now(),text:text,ts:Date.now()});
  save();renderParked();
  document.getElementById('parkedInput').focus();
}

function doneParked(id){
  D.parked=(D.parked||[]).filter(p=>p.id!==id);
  save();renderParked();
}

document.addEventListener('DOMContentLoaded',renderParked);

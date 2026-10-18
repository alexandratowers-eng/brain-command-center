// ===== IDEAS PARKING LOT ("v-next wishes") =====
// Tweaks for BCC / Notability templates go here instead of into the code.
// Rule: only build an idea at the monthly review if it came up 2+ times from real use.

const IDEA_TAGS={bcc:'BCC',template:'Template',other:'Other'};
let _ideaTag='bcc';

function ideaEsc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

// First Sunday of this month, or next month's if that one has passed
function nextIdeaReview(){
  const now=new Date();now.setHours(0,0,0,0);
  const firstSun=(y,m)=>{const d=new Date(y,m,1);d.setDate(1+((7-d.getDay())%7));return d;};
  let d=firstSun(now.getFullYear(),now.getMonth());
  if(d<now)d=firstSun(now.getFullYear(),now.getMonth()+1);
  const isToday=d.getTime()===now.getTime();
  return{label:isToday?'today':d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'}),isToday};
}

function renderIdeas(){
  const list=document.getElementById('ideasList');
  if(!list)return;
  D.ideas=D.ideas||[];
  const ready=D.ideas.filter(i=>i.hits>=2).length;
  const badge=document.getElementById('ideasBadge');
  if(badge)badge.textContent=D.ideas.length;
  const rev=nextIdeaReview();
  let h='<div class="idea-review'+(rev.isToday?' due':'')+'"><span class="mi">event_repeat</span>Review '+rev.label
    +(ready?' · <b>'+ready+' ready</b>':'')+'</div>';
  const sorted=[...D.ideas].sort((a,b)=>(b.hits-a.hits)||(b.ts-a.ts));
  sorted.forEach(i=>{
    h+='<div class="idea-item'+(i.hits>=2?' ready':'')+'">'
      +'<div class="idea-body"><span class="idea-tag t-'+i.tag+'">'+IDEA_TAGS[i.tag]+'</span>'
      +'<span class="idea-text">'+ideaEsc(i.text)+'</span></div>'
      +'<button class="idea-hit" onclick="bumpIdea('+i.id+')" title="Came up again while using it">+1'+(i.hits>1?' <b>×'+i.hits+'</b>':'')+'</button>'
      +'<button class="idea-del" onclick="deleteIdea('+i.id+')" title="Let it go"><span class="mi">close</span></button>'
      +'</div>';
  });
  if(!D.ideas.length)h+='<div class="idea-empty">Nothing parked. Nice.</div>';
  list.innerHTML=h;
  document.querySelectorAll('.idea-tag-pick').forEach(b=>b.classList.toggle('on',b.dataset.tag===_ideaTag));
}

function pickIdeaTag(tag){_ideaTag=tag;renderIdeas();}

function addIdea(inp){
  const text=(inp.value||'').trim();
  if(!text)return;
  D.ideas=D.ideas||[];
  D.ideas.unshift({id:Date.now(),text:text,tag:_ideaTag,ts:Date.now(),hits:1});
  inp.value='';
  save();renderIdeas();
}
function bumpIdea(id){
  const i=(D.ideas||[]).find(x=>x.id===id);
  if(i){i.hits=(i.hits||1)+1;save();renderIdeas();}
}
function deleteIdea(id){
  D.ideas=(D.ideas||[]).filter(x=>x.id!==id);
  save();renderIdeas();
}

document.addEventListener('DOMContentLoaded',renderIdeas);

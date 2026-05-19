// ===== CLOUD SYNC (GitHub Gist) =====
window.SyncEngine=(function(){
  const SK='alex_planner_v6';
  const FILENAME='brain-command-center-data.json';
  const DEBOUNCE_MS=4000;
  let _timer=null;
  let _state='disabled';
  let _pulling=false;

  function getConfig(){
    const gistId=window.SYNC_GIST_ID||null;
    let token=window.SYNC_TOKEN||null;
    if(!token){try{token=localStorage.getItem('bcc_sync_token');}catch(e){}}
    if(!token){try{const s=localStorage.getItem('bcc_sync_cfg');if(s){const c=JSON.parse(s);token=c.token;}}catch(e){}}
    if(gistId&&token)return{gistId,token};
    return null;
  }

  function setStatus(state,msg){
    _state=state;
    const el=document.getElementById('syncStatusBtn');if(!el)return;
    const icons={idle:'cloud',syncing:'cloud_sync',error:'cloud_off',offline:'cloud_off',disabled:'cloud_queue'};
    const emoji={idle:'☁️',syncing:'🔄',error:'⚠️',offline:'📴',disabled:'🔗'};
    const ic=el.querySelector('.mi');
    if(ic)ic.textContent=icons[state]||'cloud';
    else el.textContent=emoji[state]||'☁️';
    el.title=msg||state;
    el.dataset.state=state;
  }

  async function gistGet(cfg){
    const r=await fetch('https://api.github.com/gists/'+cfg.gistId,{
      headers:{'Authorization':'token '+cfg.token,'Accept':'application/vnd.github.v3+json'}
    });
    if(!r.ok)throw new Error('GET '+r.status);
    const d=await r.json();
    const f=d.files[FILENAME];
    if(!f)return null;
    if(f.truncated){const raw=await fetch(f.raw_url);return await raw.json();}
    return JSON.parse(f.content);
  }

  async function gistPut(cfg,payload){
    const r=await fetch('https://api.github.com/gists/'+cfg.gistId,{
      method:'PATCH',
      headers:{'Authorization':'token '+cfg.token,'Accept':'application/vnd.github.v3+json','Content-Type':'application/json'},
      body:JSON.stringify({files:{[FILENAME]:{content:JSON.stringify(payload)}}})
    });
    if(!r.ok)throw new Error('PATCH '+r.status);
  }

  async function pull(){
    const cfg=getConfig();if(!cfg)return;
    if(_pulling)return;_pulling=true;
    if(!navigator.onLine){setStatus('offline','Offline — using local data');_pulling=false;return;}
    setStatus('syncing','Pulling from cloud...');
    try{
      const remote=await gistGet(cfg);
      if(!remote){setStatus('idle','Synced');_pulling=false;return;}
      const localRaw=localStorage.getItem(SK);
      const local=localRaw?JSON.parse(localRaw):null;
      const remoteTs=remote._syncedAt||0;
      const localTs=(local&&local._syncedAt)?local._syncedAt:0;
      const localModified=(local&&local._localModifiedAt)?local._localModifiedAt:0;
      if(remoteTs>localTs){
        if(localModified>localTs){
          // Both sides changed — merge tasks and days rather than losing one side
          const merged=mergeData(local,remote);
          merged._syncedAt=Date.now();
          delete merged._localModifiedAt;
          localStorage.setItem(SK,JSON.stringify(merged));
          if(typeof D!=='undefined'&&typeof load==='function'){
            const restored=load();
            Object.keys(D).forEach(k=>delete D[k]);
            Object.assign(D,restored);
            if(typeof renderAll==='function')renderAll();
          }
          await gistPut(cfg,merged);
          setStatus('idle','Synced ✓ merged '+new Date().toLocaleTimeString());
        } else {
          localStorage.setItem(SK,JSON.stringify(remote));
          if(typeof D!=='undefined'&&typeof load==='function'){
            const restored=load();
            Object.keys(D).forEach(k=>delete D[k]);
            Object.assign(D,restored);
            if(typeof renderAll==='function')renderAll();
          }
          setStatus('idle','Synced ✓ pulled '+new Date(remoteTs).toLocaleTimeString());
        }
      } else if(localModified&&localModified>localTs){
        scheduleSync();
        setStatus('idle','Synced ✓ (push pending)');
      } else {
        setStatus('idle','Synced ✓');
      }
    }catch(e){
      setStatus('error','Sync pull failed: '+e.message);
    }
    _pulling=false;
  }

  function scheduleSync(){
    const cfg=getConfig();if(!cfg)return;
    if(_timer)clearTimeout(_timer);
    _timer=setTimeout(()=>push(),DEBOUNCE_MS);
  }

  async function push(){
    const cfg=getConfig();if(!cfg)return;
    if(!navigator.onLine){setStatus('offline','Offline — will sync when back online');window.addEventListener('online',()=>push(),{once:true});return;}
    setStatus('syncing','Saving to cloud...');
    try{
      const raw=localStorage.getItem(SK);
      if(!raw){setStatus('idle','Nothing to sync');return;}
      const payload=JSON.parse(raw);
      payload._syncedAt=Date.now();
      delete payload._localModifiedAt;
      localStorage.setItem(SK,JSON.stringify(payload));
      if(typeof D!=='undefined'){D._syncedAt=payload._syncedAt;delete D._localModifiedAt;}
      await gistPut(cfg,payload);
      setStatus('idle','Synced ✓ '+new Date().toLocaleTimeString());
    }catch(e){
      setStatus('error','Cloud save failed: '+e.message);
      window.addEventListener('online',()=>push(),{once:true});
    }
  }

  function mergeData(local,remote){
    // Start with remote as base, merge in local additions
    const merged=JSON.parse(JSON.stringify(remote));
    // Merge tasks: keep all unique tasks by ID, prefer done=true
    if(local.tasks&&merged.tasks){
      const byId={};
      merged.tasks.forEach(t=>byId[t.id]=t);
      local.tasks.forEach(t=>{
        if(!byId[t.id]){byId[t.id]=t;}
        else if(t.done&&!byId[t.id].done){byId[t.id].done=true;}
        else if(t.date&&!byId[t.id].date){byId[t.id].date=t.date;}
      });
      merged.tasks=Object.values(byId);
    }
    // Merge days: union blocks by _id
    if(local.days){
      Object.keys(local.days).forEach(dt=>{
        if(!merged.days[dt]){merged.days[dt]=local.days[dt];return;}
        const remoteIds=new Set((merged.days[dt]||[]).map(s=>s._id).filter(Boolean));
        (local.days[dt]||[]).forEach(s=>{
          if(s._id&&!remoteIds.has(s._id))merged.days[dt].push(s);
        });
      });
    }
    // Merge reflections
    if(local.reflections){
      Object.keys(local.reflections).forEach(dt=>{
        if(!merged.reflections)merged.reflections={};
        if(!merged.reflections[dt]){merged.reflections[dt]=local.reflections[dt];return;}
        const lr=local.reflections[dt];const mr=merged.reflections[dt];
        if(lr.manualWins&&mr.manualWins){
          const set=new Set(mr.manualWins);
          lr.manualWins.forEach(w=>{if(!set.has(w))mr.manualWins.push(w);});
        } else if(lr.manualWins){mr.manualWins=lr.manualWins;}
      });
    }
    // Merge parkingItems
    if(local.parkingItems&&merged.parkingItems){
      const ids=new Set(merged.parkingItems.map(p=>p.id));
      local.parkingItems.forEach(p=>{if(!ids.has(p.id))merged.parkingItems.push(p);});
    }
    // Keep higher nextId
    if(local.nextId>merged.nextId)merged.nextId=local.nextId;
    // Preserve client-local UI state that shouldn't be overwritten by remote
    ['spotRowExpanded','daySpots','daySpotMeta','customSpots'].forEach(k=>{
      if(local[k]!==undefined){
        if(Array.isArray(local[k])){
          merged[k]=Array.isArray(merged[k])?[...merged[k]]:[];
          const seen=new Set(merged[k].map(x=>x&&x.key));
          local[k].forEach(x=>{if(x&&!seen.has(x.key))merged[k].push(x);});
        } else if(typeof local[k]==='object'&&local[k]){
          merged[k]={...(merged[k]||{}),...local[k]};
        } else {
          merged[k]=local[k];
        }
      }
    });
    return merged;
  }

  async function forcePull(){
    const cfg=getConfig();if(!cfg){alert('Sync not connected. Tap the cloud icon to set up.');return;}
    setStatus('syncing','Force pulling...');
    try{
      const remote=await gistGet(cfg);
      if(!remote){setStatus('error','Nothing in cloud');return;}
      localStorage.setItem(SK,JSON.stringify(remote));
      if(typeof D!=='undefined'&&typeof load==='function'){
        const restored=load();
        Object.keys(D).forEach(k=>delete D[k]);
        Object.assign(D,restored);
        if(typeof renderAll==='function')renderAll();
      }
      setStatus('idle','Synced ✓ force pulled');
      const toast=document.getElementById('saveToast');
      if(toast){toast.innerHTML='☁️ Pulled from cloud!';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2000);}
    }catch(e){setStatus('error','Pull failed: '+e.message);}
  }

  async function forcePush(){
    const cfg=getConfig();if(!cfg){alert('Sync not connected.');return;}
    setStatus('syncing','Force pushing...');
    try{
      const raw=localStorage.getItem(SK);if(!raw)return;
      const payload=JSON.parse(raw);
      payload._syncedAt=Date.now();
      delete payload._localModifiedAt;
      localStorage.setItem(SK,JSON.stringify(payload));
      if(typeof D!=='undefined'){D._syncedAt=payload._syncedAt;delete D._localModifiedAt;}
      await gistPut(cfg,payload);
      setStatus('idle','Synced ✓ force pushed');
      const toast=document.getElementById('saveToast');
      if(toast){toast.innerHTML='☁️ Pushed to cloud!';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2000);}
    }catch(e){setStatus('error','Push failed: '+e.message);}
  }

  function showPairingModal(){
    const existing=document.getElementById('syncPairModal');if(existing)existing.remove();
    const modal=document.createElement('div');modal.id='syncPairModal';
    modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML=`<div style="background:var(--card);border-radius:16px;padding:24px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.5);border:1px solid var(--border);">
      <h3 style="margin:0 0 8px;font-size:16px;">☁️ Connect Cloud Sync</h3>
      <p style="font-size:12px;color:var(--dim);margin:0 0 16px;">Paste your GitHub token below to sync between devices.</p>
      <input type="text" id="syncPairInput" placeholder="ghp_your_token_here" style="width:100%;padding:12px 14px;font-size:13px;background:var(--bg);border:1px solid var(--border);border-radius:10px;color:var(--text);outline:none;font-family:monospace;box-sizing:border-box;">
      <div style="display:flex;gap:8px;margin-top:14px;justify-content:flex-end;">
        <button onclick="document.getElementById('syncPairModal').remove()" style="padding:8px 16px;border-radius:8px;border:1px solid var(--border);background:none;color:var(--text);cursor:pointer;font-family:inherit;font-size:12px;">Cancel</button>
        <button onclick="SyncEngine.completePairing()" style="padding:8px 16px;border-radius:8px;border:none;background:var(--blue);color:white;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;">Connect</button>
      </div>
    </div>`;
    modal.onclick=e=>{if(e.target===modal)modal.remove();};
    document.body.appendChild(modal);
    document.getElementById('syncPairInput').focus();
  }

  function completePairing(){
    const inp=document.getElementById('syncPairInput');
    let val=(inp?inp.value:'').trim();
    if(!val){alert('Please paste your token.');return;}
    let token=val;
    if(val.startsWith('BCC:')){
      const parts=val.split(':');
      if(parts.length>=3){
        localStorage.setItem('bcc_sync_cfg',JSON.stringify({gistId:parts[1],token:parts.slice(2).join(':')}));
        token=parts.slice(2).join(':');
      }
    }
    localStorage.setItem('bcc_sync_token',token);
    document.getElementById('syncPairModal')?.remove();
    setStatus('syncing','Connecting...');
    pull().then(()=>{
      const toast=document.getElementById('saveToast');
      if(toast){toast.innerHTML='☁️ Sync connected!';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2000);}
    });
  }

  function autoPairFromURL(){
    const h=window.location.hash;
    if(!h)return false;
    const val=decodeURIComponent(h.slice(1));
    if(val.startsWith('BCC:')){
      const parts=val.split(':');
      if(parts.length<3)return false;
      localStorage.setItem('bcc_sync_cfg',JSON.stringify({gistId:parts[1],token:parts.slice(2).join(':')}));
    } else if(val.startsWith('ghp_')){
      localStorage.setItem('bcc_sync_token',val);
    } else {return false;}
    window.location.hash='';
    history.replaceState(null,'',window.location.pathname+window.location.search);
    return true;
  }

  function init(){
    const paired=autoPairFromURL();
    const cfg=getConfig();
    const el=document.getElementById('syncStatusBtn');
    if(el)el.addEventListener('click',()=>{
      if(_state==='error'||_state==='disabled'){showPairingModal();return;}
      // Show sync menu
      const old=document.getElementById('syncMenu');if(old)old.remove();
      const m=document.createElement('div');m.id='syncMenu';
      const r=el.getBoundingClientRect();
      m.style.cssText=`position:fixed;left:${r.left}px;top:${r.bottom+4}px;z-index:200;background:var(--card);border:1px solid var(--border);border-radius:8px;padding:4px;box-shadow:0 8px 24px rgba(0,0,0,.4);min-width:140px;`;
      m.innerHTML=`
        <button class="wk-ctx-btn" onclick="document.getElementById('syncMenu').remove();SyncEngine.pull();">☁️ Pull from cloud</button>
        <button class="wk-ctx-btn" onclick="document.getElementById('syncMenu').remove();SyncEngine.push();">⬆️ Push to cloud</button>
        <button class="wk-ctx-btn" onclick="document.getElementById('syncMenu').remove();SyncEngine.forcePull();">⬇️ Force pull (overwrite local)</button>
        <button class="wk-ctx-btn" onclick="document.getElementById('syncMenu').remove();SyncEngine.forcePush();">⬆️ Force push (overwrite cloud)</button>
        <button class="wk-ctx-btn" onclick="document.getElementById('syncMenu').remove();SyncEngine.showPairingModal();">🔧 Change token</button>`;
      document.body.appendChild(m);
      const dismiss=ev=>{if(!m.contains(ev.target)&&ev.target!==el){m.remove();document.removeEventListener('mousedown',dismiss);}};
      setTimeout(()=>document.addEventListener('mousedown',dismiss),10);
    });
    if(!cfg){
      setStatus('disabled','Tap to connect sync');
      return;
    }
    if(paired)setStatus('syncing','Connecting...');
    setTimeout(()=>pull(),800);
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='visible')pull();
    });
  }

  return{init,scheduleSync,pull,push,forcePull,forcePush,showPairingModal,completePairing};
})();

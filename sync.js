// ===== CLOUD SYNC (GitHub Gist) =====
window.SyncEngine=(function(){
  const SK='alex_planner_v6';
  const FILENAME='brain-command-center-data.json';
  const DEBOUNCE_MS=4000;
  let _timer=null;
  let _state='disabled';
  let _pulling=false;

  function getConfig(){
    if(window.SYNC_GIST_ID&&window.SYNC_TOKEN)return{gistId:window.SYNC_GIST_ID,token:window.SYNC_TOKEN};
    try{const s=localStorage.getItem('bcc_sync_cfg');if(s)return JSON.parse(s);}catch(e){}
    return null;
  }

  function setStatus(state,msg){
    _state=state;
    const el=document.getElementById('syncStatusBtn');if(!el)return;
    const icons={idle:'☁️',syncing:'🔄',error:'⚠️',offline:'📴',disabled:'🔗'};
    el.textContent=icons[state]||'☁️';
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
      if(remoteTs>localTs){
        localStorage.setItem(SK,JSON.stringify(remote));
        if(typeof D!=='undefined'&&typeof load==='function'){
          const restored=load();
          Object.keys(D).forEach(k=>delete D[k]);
          Object.assign(D,restored);
          if(typeof renderAll==='function')renderAll();
        }
        setStatus('idle','Synced ✓ pulled '+new Date(remoteTs).toLocaleTimeString());
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
      localStorage.setItem(SK,JSON.stringify(payload));
      if(typeof D!=='undefined')D._syncedAt=payload._syncedAt;
      await gistPut(cfg,payload);
      setStatus('idle','Synced ✓ '+new Date().toLocaleTimeString());
    }catch(e){
      setStatus('error','Cloud save failed: '+e.message);
      window.addEventListener('online',()=>push(),{once:true});
    }
  }

  function showPairingModal(){
    const existing=document.getElementById('syncPairModal');if(existing)existing.remove();
    const modal=document.createElement('div');modal.id='syncPairModal';
    modal.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.7);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML=`<div style="background:var(--card);border-radius:16px;padding:24px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.5);border:1px solid var(--border);">
      <h3 style="margin:0 0 8px;font-size:16px;">☁️ Connect Cloud Sync</h3>
      <p style="font-size:12px;color:var(--dim);margin:0 0 16px;">Paste the pairing code from your laptop's Terminal to sync data between devices.</p>
      <input type="text" id="syncPairInput" placeholder="BCC:xxxxxxxx:ghp_xxxxxxxx" style="width:100%;padding:12px 14px;font-size:13px;background:var(--bg);border:1px solid var(--border);border-radius:10px;color:var(--text);outline:none;font-family:monospace;box-sizing:border-box;">
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
    const val=(inp?inp.value:'').trim();
    if(!val.startsWith('BCC:')){alert('Invalid pairing code. It should start with BCC:');return;}
    const parts=val.split(':');
    if(parts.length<3){alert('Invalid pairing code format.');return;}
    const gistId=parts[1];
    const token=parts.slice(2).join(':');
    localStorage.setItem('bcc_sync_cfg',JSON.stringify({gistId,token}));
    document.getElementById('syncPairModal')?.remove();
    const el=document.getElementById('syncStatusBtn');
    if(el)el.removeEventListener('click',showPairingModal);
    setStatus('syncing','Connecting...');
    pull().then(()=>{
      const toast=document.getElementById('saveToast');
      if(toast){toast.innerHTML='☁️ Sync connected!';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2000);}
    });
  }

  function init(){
    const cfg=getConfig();
    if(!cfg){
      setStatus('disabled','Tap to connect sync');
      const el=document.getElementById('syncStatusBtn');
      if(el)el.addEventListener('click',showPairingModal);
      return;
    }
    setTimeout(()=>pull(),800);
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='visible')pull();
    });
  }

  return{init,scheduleSync,pull,push,showPairingModal,completePairing};
})();

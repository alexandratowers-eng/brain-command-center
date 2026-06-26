// ===== CLOUD SYNC (GitHub Gist) =====
window.SyncEngine=(function(){
  const SK='alex_planner_v6';
  const FILENAME='brain-command-center-data.json';
  const DEBOUNCE_MS=4000;
  let _timer=null;
  let _state='disabled';
  let _pulling=false;
  let _lastSyncAt=0;

  function relTime(ts){
    if(!ts)return 'never';
    const s=Math.floor((Date.now()-ts)/1000);
    if(s<10)return 'just now';
    if(s<60)return s+'s ago';
    const m=Math.floor(s/60);
    if(m<60)return m+'m ago';
    const h=Math.floor(m/60);
    if(h<24)return h+'h ago';
    return new Date(ts).toLocaleDateString();
  }

  function refreshBanner(msg){
    const b=document.getElementById('syncBanner');if(!b)return;
    b.style.display='flex';
    b.dataset.state=_state;
    const txt=document.getElementById('syncBannerText');
    const btn=document.getElementById('syncBannerBtn');
    const connected=!!getConfig();
    if(!connected){
      if(txt)txt.textContent='This device is not synced — your phone and laptop won’t match.';
      if(btn)btn.style.display='inline-block';
      return;
    }
    if(btn)btn.style.display='none';
    let label;
    if(_state==='syncing')label='Syncing…';
    else if(_state==='offline')label='Offline — will sync when back online';
    else if(_state==='error')label='Sync error — tap the cloud icon to retry';
    else label='Synced ✓ · last synced '+relTime(_lastSyncAt)+' · this device is connected';
    if(txt)txt.textContent=msg||label;
  }

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
    if(state==='idle')_lastSyncAt=Date.now();
    const el=document.getElementById('syncStatusBtn');
    if(el){
      const icons={idle:'cloud',syncing:'cloud_sync',error:'cloud_off',offline:'cloud_off',disabled:'cloud_queue'};
      const emoji={idle:'☁️',syncing:'🔄',error:'⚠️',offline:'📴',disabled:'🔗'};
      const ic=el.querySelector('.mi');
      if(ic)ic.textContent=icons[state]||'cloud';
      else el.textContent=emoji[state]||'☁️';
      el.title=msg||state;
      el.dataset.state=state;
    }
    refreshBanner();
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
    // Merge trash — dedupe by task id
    if(Array.isArray(local.trash)||Array.isArray(merged.trash)){
      const byId={};
      (merged.trash||[]).forEach(t=>{if(t&&t.id!=null)byId[t.id]=t;});
      (local.trash||[]).forEach(t=>{
        if(!t||t.id==null)return;
        const prev=byId[t.id];
        if(!prev||(t._trashedAt||0)>(prev._trashedAt||0))byId[t.id]=t;
      });
      merged.trash=Object.values(byId);
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
    const cfg=getConfig();
    const isConnected=!!cfg;
    const modal=document.createElement('div');modal.id='syncPairModal';
    modal.style.cssText='position:fixed;inset:0;background:rgba(15,15,30,.55);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;backdrop-filter:blur(4px);';
    modal.innerHTML=`<div style="background:var(--card);border-radius:16px;padding:24px;max-width:460px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.3);border:1px solid var(--border);">
      <h3 style="margin:0 0 4px;font-size:17px;display:flex;align-items:center;gap:8px;"><span class="mi" style="color:var(--blue);">cloud</span> Cloud Sync ${isConnected?'<span style="font-size:11px;color:var(--green);font-weight:500;margin-left:auto;">● Connected</span>':''}</h3>
      <p style="font-size:12px;color:var(--dim);margin:0 0 14px;">Sync your data between your laptop and phone. Free, private, takes 2 minutes once.</p>

      ${isConnected?`<div style="background:rgba(16,185,129,.06);border:1px solid rgba(16,185,129,.2);border-radius:10px;padding:10px 12px;margin-bottom:14px;">
        <div style="font-size:12px;color:var(--green);font-weight:600;margin-bottom:2px;">✓ You're already synced</div>
        <div style="font-size:11px;color:var(--dim);">To add another device, copy the share link below.</div>
      </div>
      <button onclick="SyncEngine.copyShareLink()" style="width:100%;padding:10px;border-radius:8px;border:1px solid var(--blue);background:rgba(99,102,241,.08);color:var(--blue);cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;margin-bottom:10px;">📋 Copy share link for another device</button>
      <div style="border-top:1px solid var(--border);margin:14px 0;padding-top:14px;"></div>
      `:`
      <details style="margin-bottom:14px;background:var(--bg);border:1px solid var(--border);border-radius:10px;padding:10px 12px;">
        <summary style="cursor:pointer;font-size:12px;font-weight:600;color:var(--text);outline:none;">How does this work? (one-time setup)</summary>
        <ol style="font-size:11px;color:var(--dim);line-height:1.7;margin:10px 0 4px 18px;padding:0;">
          <li>Go to <a href="https://github.com/settings/tokens/new?scopes=gist&description=BCC%20Sync" target="_blank" style="color:var(--blue);text-decoration:underline;">github.com/settings/tokens/new</a> (opens in a new tab)</li>
          <li>Make sure "gist" is the only checkbox ticked</li>
          <li>Click "Generate token" at the bottom</li>
          <li>Copy the token (starts with <code style="background:var(--card);padding:1px 4px;border-radius:3px;">ghp_</code>) and paste below</li>
          <li>That's it — your data lives in a private gist on your GitHub account</li>
        </ol>
      </details>
      `}

      <label style="font-size:11px;color:var(--dim);font-weight:600;display:block;margin-bottom:6px;">${isConnected?'Replace token':'Paste your GitHub token or share link'}</label>
      <input type="password" id="syncPairInput" placeholder="ghp_xxxxxxxxxxxxxxxx" style="width:100%;padding:12px 14px;font-size:13px;background:var(--bg);border:1px solid var(--border);border-radius:10px;color:var(--text);outline:none;font-family:monospace;box-sizing:border-box;">
      <div style="display:flex;gap:8px;margin-top:14px;justify-content:space-between;align-items:center;">
        ${isConnected?`<button onclick="SyncEngine.disconnectSync()" style="padding:8px 14px;border-radius:8px;border:1px solid var(--red);background:none;color:var(--red);cursor:pointer;font-family:inherit;font-size:11px;">Disconnect</button>`:'<span></span>'}
        <div style="display:flex;gap:8px;">
          <button onclick="document.getElementById('syncPairModal').remove()" style="padding:8px 16px;border-radius:8px;border:1px solid var(--border);background:none;color:var(--text);cursor:pointer;font-family:inherit;font-size:12px;">Close</button>
          <button onclick="SyncEngine.completePairing()" style="padding:8px 16px;border-radius:8px;border:none;background:var(--blue);color:white;cursor:pointer;font-family:inherit;font-size:12px;font-weight:600;">${isConnected?'Update':'Connect'}</button>
        </div>
      </div>
    </div>`;
    modal.onclick=e=>{if(e.target===modal)modal.remove();};
    document.body.appendChild(modal);
    setTimeout(()=>{const i=document.getElementById('syncPairInput');if(i)i.focus();},50);
  }

  function copyShareLink(){
    const cfg=getConfig();if(!cfg){alert('Not connected yet.');return;}
    const link=window.location.origin+window.location.pathname+'#BCC:'+cfg.gistId+':'+cfg.token;
    function showLinkModal(){
      if(typeof bccPrompt==='function'){bccPrompt('Copy this link and open it on your other device:',link,()=>{});}
      else {/* last-ditch fallback */ alert(link);}
    }
    if(navigator.clipboard){
      navigator.clipboard.writeText(link).then(()=>{
        const toast=document.getElementById('saveToast');
        if(toast){toast.innerHTML='✓ Share link copied — open on your other device';toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),3000);}
      }).catch(showLinkModal);
    } else {
      showLinkModal();
    }
  }

  function disconnectSync(){
    if(!confirm('Disconnect cloud sync? Your data stays on this device, but will no longer sync.'))return;
    localStorage.removeItem('bcc_sync_cfg');
    localStorage.removeItem('bcc_sync_token');
    document.getElementById('syncPairModal')?.remove();
    setStatus('disabled','Tap to connect sync');
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
      // Not connected → just open pairing
      if(_state==='error'||_state==='disabled'){showPairingModal();return;}
      // Connected → small menu with Sync Now + Settings
      const old=document.getElementById('syncMenu');if(old)old.remove();
      const m=document.createElement('div');m.id='syncMenu';
      const r=el.getBoundingClientRect();
      m.style.cssText=`position:fixed;left:${r.left}px;top:${r.bottom+6}px;z-index:200;background:var(--card);border:1px solid var(--border);border-radius:10px;padding:6px;box-shadow:0 8px 24px rgba(0,0,0,.18);min-width:180px;`;
      m.innerHTML=`
        <div style="font-size:9px;color:var(--green);font-weight:700;text-transform:uppercase;letter-spacing:.5px;padding:4px 10px 6px;">● Synced</div>
        <button class="wk-ctx-btn" onclick="document.getElementById('syncMenu').remove();SyncEngine.pull();">🔄 Sync now</button>
        <button class="wk-ctx-btn" onclick="document.getElementById('syncMenu').remove();SyncEngine.copyShareLink();">📋 Copy share link</button>
        <button class="wk-ctx-btn" onclick="document.getElementById('syncMenu').remove();SyncEngine.showPairingModal();"><span class="mi" style="font-size:13px;vertical-align:-2px;">settings</span> Settings</button>`;
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
    setInterval(()=>{if(_state==='idle')refreshBanner();},30000);
    document.addEventListener('visibilitychange',()=>{
      if(document.visibilityState==='visible')pull();
    });
  }

  return{init,scheduleSync,pull,push,forcePull,forcePush,showPairingModal,completePairing,copyShareLink,disconnectSync,refreshBanner};
})();

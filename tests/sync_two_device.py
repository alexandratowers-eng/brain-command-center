import asyncio, json
from playwright.async_api import async_playwright

GIST={'data':None}   # fake cloud shared by both devices
FN='brain-command-center-data.json'

async def dev(ctx):
    pg=await ctx.new_page()
    pg.on('pageerror',lambda e:print('PAGEERROR',e) if 'addEventListener' not in str(e) and 'buildCatSelects' not in str(e) else None)
    async def route(r):
        req=r.request
        if req.method=='GET' and 'gists?' in req.url:
            await r.fulfill(status=200,content_type='application/json',body='[]'); return
        if req.method=='GET':
            files={FN:{'content':json.dumps(GIST['data']) if GIST['data'] is not None else 'null','truncated':False}}
            await r.fulfill(status=200,content_type='application/json',body=json.dumps({'files':files}))
        elif req.method=='PATCH':
            body=json.loads(req.post_data); GIST['data']=json.loads(body['files'][FN]['content'])
            await r.fulfill(status=200,content_type='application/json',body='{}')
        else: await r.fulfill(status=200,body='{}')
    await pg.route('https://api.github.com/**',route)
    await pg.add_init_script("localStorage.setItem('bcc_sync_cfg',JSON.stringify({gistId:'g',token:'t'}));")
    await pg.goto('http://localhost:8765/'); await pg.wait_for_load_state('load'); await pg.wait_for_function("typeof buildCatSelects==='function' && typeof SyncEngine!=='undefined'",timeout=15000); await pg.wait_for_timeout(2500)
    await pg.evaluate("document.querySelectorAll('.modal-bg.show').forEach(e=>e.classList.remove('show'))")
    return pg

async def sync(pg):   # push then pull, like a device coming to the foreground
    await pg.evaluate("SyncEngine.push()"); await pg.wait_for_timeout(900)
    await pg.evaluate("SyncEngine.pull()"); await pg.wait_for_timeout(900)

async def js(pg,code): return await pg.evaluate(code)

results=[]
def check(name,ok,detail=''):
    results.append((name,ok,detail)); print(('PASS ' if ok else 'FAIL ')+name+(' '+str(detail) if not ok else ''))

async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
        A=await dev(await b.new_context(service_workers='block'))   # computer
        B=await dev(await b.new_context(service_workers='block'))   # phone
        # Baseline: A creates a block, a parked item, a task, a list item; both sync.
        await js(A,"""()=>{const dt='2027-03-02';D.days[dt]=[{_id:'blk1',t:'2:00 PM',end:'3:00 PM',text:'Swim',cls:'exercise'}];
          D.parked=[{id:501,text:'park me'}];
          D.tasks.push({id:9001,text:'Call pharmacy',cat:'personal',done:false,date:dt});
          D.lists=[{id:7,name:'Groceries',items:[{id:71,text:'eggs',done:false},{id:72,text:'milk',done:false}]}];
          D.ideas=[{id:31,text:'idea one',hits:1}];
          save();}""")
        await sync(A); await sync(B)
        hasB=await js(B,"JSON.stringify([D.days['2027-03-02'].length,(D.parked||[]).length,!!D.tasks.find(t=>t.id===9001),D.lists[0].items.length])")
        check('baseline reaches phone',hasB=='[1,1,true,2]',hasB)

        # S1: delete block on A, B still has it, B syncs first then A
        await js(A,"()=>{D.days['2027-03-02']=[];save();}"); await sync(A); await sync(B); await sync(A)
        check('S1 deleted block stays deleted on both',
              await js(A,"D.days['2027-03-02'].length")==0 and await js(B,"D.days['2027-03-02'].length")==0)

        # S2: delete parked on A while B is "offline" with an edit, then both sync
        await js(B,"()=>{D.parked.push({id:502,text:'from phone'});save();}")
        await js(A,"()=>{deleteParked(501);}"); await sync(A); await sync(B); await sync(A)
        pa=await js(A,"JSON.stringify(D.parked.map(p=>p.id).sort())"); pb=await js(B,"JSON.stringify(D.parked.map(p=>p.id).sort())")
        check('S2 parked delete sticks, phone addition kept',pa=='[502]' and pb=='[502]',(pa,pb))

        # S3: edit a block's time on B while A has stale copy; A pushes after B
        await js(A,"()=>{D.days['2027-03-03']=[{_id:'blk2',t:'9:00 AM',end:'10:00 AM',text:'Standup',cls:'work'}];save();}"); await sync(A); await sync(B)
        await js(B,"()=>{editSlotTime('2027-03-03','blk2','11:00 AM');}"); await sync(B)
        await js(A,"()=>{D.notes='touch';save();}"); await sync(A); await sync(B)
        ta=await js(A,"D.days['2027-03-03'][0].t"); tb=await js(B,"D.days['2027-03-03'][0].t")
        check('S3 block time edit wins over stale copy',ta=='11:00 AM' and tb=='11:00 AM',(ta,tb))

        # S4: mark block done on phone; computer later saves something unrelated
        await js(B,"()=>{togSlotDone('2027-03-03','blk2');}"); await sync(B)
        await js(A,"()=>{D.notes='touch2';save();}"); await sync(A); await sync(B)
        check('S4 done tick survives',await js(A,"!!D.days['2027-03-03'][0].done") and await js(B,"!!D.days['2027-03-03'][0].done"))

        # S5: task deleted to trash on A, then trash emptied; B has old copy
        await js(A,"()=>{trashTask(9001);emptyTrash();}"); await sync(A); await sync(B); await sync(A)
        check('S5 emptied-trash task does not resurrect',
              await js(A,"!D.tasks.find(t=>t.id===9001)") and await js(B,"!D.tasks.find(t=>t.id===9001)"))

        # S6: drop task to backlog on B
        await js(A,"()=>{D.tasks.push({id:9002,text:'Email PI',cat:'work',done:false,date:'2027-03-03'});save();}"); await sync(A); await sync(B)
        await js(B,"()=>{dropLaterTask(9002);}"); await sync(B); await sync(A); await sync(B)
        check('S6 backlog-dropped task gone on both',
              await js(A,"!D.tasks.find(t=>t.id===9002)") and await js(B,"!D.tasks.find(t=>t.id===9002)") and await js(A,"!!D.backlog.find(b=>b.text==='Email PI')"))

        # S7: nested list item deleted on A
        await js(A,"()=>{deleteListItem(7,72);}"); await sync(A); await sync(B); await sync(A)
        la=await js(A,"JSON.stringify(D.lists[0].items.map(i=>i.id))"); lb=await js(B,"JSON.stringify(D.lists[0].items.map(i=>i.id))")
        check('S7 list item delete sticks',la=='[71]' and lb=='[71]',(la,lb))

        # S8: idea deleted on B, A adds another idea concurrently
        await js(A,"()=>{D.ideas.push({id:32,text:'idea two',hits:1});save();}")
        await js(B,"()=>{D.ideas=D.ideas.filter(i=>i.id!==31);save();}"); await sync(B); await sync(A); await sync(B)
        ia=await js(A,"JSON.stringify(D.ideas.map(i=>i.id))"); ib=await js(B,"JSON.stringify(D.ideas.map(i=>i.id))")
        check('S8 idea delete sticks, new idea kept',ia=='[32]' and ib=='[32]',(ia,ib))

        # S9: block dragged to another day on A
        await js(A,"()=>{const s=D.days['2027-03-03'][0];D.days['2027-03-03']=[];D.days['2027-03-04']=[s];save();}"); await sync(A); await sync(B); await sync(A)
        m=await js(B,"JSON.stringify([D.days['2027-03-03'].length,(D.days['2027-03-04']||[]).length])")
        check('S9 moved block appears once, on new day',m=='[0,1]',m)

        # S10: undo a block delete on A after it synced
        await js(A,"()=>{D.days['2027-03-05']=[{_id:'blk3',t:'7:00 AM',end:'8:00 AM',text:'Run',cls:'exercise'}];save();}"); await sync(A); await sync(B)
        await js(A,"()=>{D.days['2027-03-05']=[];save();}"); await sync(A); await sync(B)
        await js(A,"()=>{undo();}"); await pg_wait(A); await sync(A); await sync(B)
        check('S10 undo of a delete comes back on both',await js(A,"D.days['2027-03-05'].length")==1 and await js(B,"D.days['2027-03-05'].length")==1)

        # S11: no unbounded growth / JSON stays valid
        sz=await js(A,"JSON.stringify(D).length"); check('S11 payload sane size',sz<400000,sz)
        await b.close()
    print('\n%d/%d passed'%(sum(1 for r in results if r[1]),len(results)))

async def pg_wait(pg): await pg.wait_for_timeout(200)
asyncio.run(main())

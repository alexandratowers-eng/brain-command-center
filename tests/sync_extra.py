import asyncio, json
exec(open('/tmp/two_dev.py').read().split('results=[]')[0])
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
        A=await dev(await b.new_context(service_workers='block')); B=await dev(await b.new_context(service_workers='block'))
        # reverse move: B moves, A has an unrelated edit pending (so A pushes a stale placement after B)
        await js(A,"()=>{D.days['2027-03-10']=[{_id:'mv1',t:'9:00 AM',end:'10:00 AM',text:'Dentist',cls:'personal'}];save();}"); await sync(A); await sync(B)
        await js(A,"()=>{D.notes='pending edit';save();}")           # A dirty, not yet pushed
        await js(B,"()=>{const s=D.days['2027-03-10'][0];D.days['2027-03-10']=[];D.days['2027-03-11']=[s];save();}"); await sync(B)
        await sync(A); await sync(B)
        ra=await js(A,"JSON.stringify([D.days['2027-03-10'].length,(D.days['2027-03-11']||[]).length])")
        rb=await js(B,"JSON.stringify([D.days['2027-03-10'].length,(D.days['2027-03-11']||[]).length])")
        print('reverse move', 'PASS' if ra=='[0,1]' and rb=='[0,1]' else 'FAIL', ra, rb)
        # concurrent edits to the same block: last edit wins, nothing duplicated
        await js(A,"()=>{editSlotText('2027-03-11','mv1','Dentist (moved)');}"); await asyncio.sleep(0.3)
        await js(B,"()=>{editSlotTime('2027-03-11','mv1','2:00 PM');}")
        await sync(A); await sync(B); await sync(A)
        ca=await js(A,"JSON.stringify(D.days['2027-03-11'].map(s=>[s.text,s.t]))"); cb=await js(B,"JSON.stringify(D.days['2027-03-11'].map(s=>[s.text,s.t]))")
        print('concurrent edit converges', 'PASS' if ca==cb and ca.count('mv1')==0 and len(json.loads(ca))==1 else 'FAIL', ca, cb)
        # phone-size smoke: open Day view, no page errors, cloud menu shows build
        await B.set_viewport_size({'width':390,'height':760})
        await js(B,"()=>{D.calView='day';save();renderAll();}"); await B.wait_for_timeout(500)
        await B.screenshot(path='/tmp/phone_day.png',clip={'x':0,'y':0,'width':390,'height':700})
        await b.close()
asyncio.run(main())

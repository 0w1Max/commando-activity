/** Optional visual regression check. Requires Playwright and sharp for QA only.
 * Usage: node tools/verify-rendering.cjs /path/to/v2.8.0-checkout /path/to/results
 * CHROMIUM_EXECUTABLE optionally selects an installed Chromium binary.
 */
const {chromium,webkit}=require('playwright'),sharp=require('sharp'),fs=require('fs'),zlib=require('zlib'),path=require('path');
const root=process.cwd(),reference=path.resolve(process.argv[2]||''),out=path.resolve(process.argv[3]||'generated/visual-check');
if(!process.argv[2])throw Error('Pass a separate v2.8.0 reference checkout');
fs.mkdirSync(out,{recursive:true});
const load=p=>JSON.parse(zlib.gunzipSync(Buffer.from(fs.readFileSync(path.join(root,p),'utf8').trim(),'base64')));
(async()=>{
const old=await import(reference+'/scripts/generate.mjs'),now=await import(root+'/scripts/generate.mjs');
const weeks=load('fixtures/demo-calendar.json.gz.b64').weeks,sprites=load('assets/sprites.json.gz.b64');
const engine=process.env.BROWSER_ENGINE==='webkit'?webkit:chromium;
const browser=await engine.launch(engine===webkit?{headless:true}:{executablePath:process.env.CHROMIUM_EXECUTABLE||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
const missionModule=await import(root+'/scripts/mission.mjs');
const results=[];
try{
for(const location of ['desert','industrial','temple','coast']){
 const input={weeks,sprites,username:'0w1Max',locationOverride:location,seedOverride:5};
 const svgs=[old.renderSvg(input),now.renderSvg(input)];
 fs.writeFileSync(out+'/'+location+'-before.svg',svgs[0]);fs.writeFileSync(out+'/'+location+'-after.svg',svgs[1]);
 for(const [width,dpr]of [[1200,1],[390,3]]){
 const context=await browser.newContext({viewport:{width,height:600},deviceScaleFactor:dpr});
 const pages=await Promise.all(svgs.map(async svg=>{const p=await context.newPage();await p.setContent('<style>body{margin:0}svg{display:block;width:100%;height:auto}</style>'+svg);await p.evaluate(async()=>{document.querySelector('svg').pauseAnimations();await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});return p}));
 const mission=missionModule.createMission(now.normalizeWeeks(weeks),missionModule.buildLevel(now.normalizeWeeks(weeks),'0w1Max',5,location));
 const selected=[mission.shots[0],mission.shots[1],mission.shots.at(-1)].filter(Boolean);
 const times=[0,...selected.flatMap(s=>[(s.start+s.impact)/2,s.impact+.03]),mission.jumps[0]?(mission.jumps[0].start+mission.jumps[0].end)/2:4.1,mission.restoreStart+.2];
 for(const time of times){
  const images=await Promise.all(pages.map(async p=>{await p.evaluate(t=>document.querySelector('svg').setCurrentTime(t),time);return p.screenshot({clip:{x:0,y:0,width,height:Math.ceil(width*469/1200)}})}));
  const raws=await Promise.all(images.map(p=>sharp(p).ensureAlpha().raw().toBuffer()));
  let changed=0,significant=0,abs=0,max=0;for(let i=0;i<raws[0].length;i+=4){let diff=false,large=false;for(let c=0;c<3;c++){const d=Math.abs(raws[0][i+c]-raws[1][i+c]);abs+=d;max=Math.max(max,d);if(d)diff=true;if(d>8)large=true}if(diff)changed++;if(large)significant++}
  const changedPct=changed/(raws[0].length/4)*100,meanAbs=abs/(raws[0].length/4*3);
  const significantPct=significant/(raws[0].length/4)*100;
  results.push({location,width,dpr,time,changedPct,significantPct,meanAbs,max});
  if(significantPct>.05||meanAbs>.025)throw Error('Visual regression: '+JSON.stringify(results.at(-1)));
  if(time===0){fs.writeFileSync(out+'/'+location+'-'+width+'-before.png',images[0]);fs.writeFileSync(out+'/'+location+'-'+width+'-after.png',images[1])}
 }
 await context.close();
 }
}
}finally{await browser.close();}
fs.writeFileSync(out+'/visual-results.json',JSON.stringify(results,null,2));console.log(JSON.stringify({frames:results.length,maxChangedPct:Math.max(...results.map(r=>r.changedPct)),maxMeanAbs:Math.max(...results.map(r=>r.meanAbs))}));
})().catch(e=>{console.error(e);process.exitCode=1});

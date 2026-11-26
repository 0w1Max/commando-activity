/** Reuse effect elements only after their complete visible interval has ended. */
const fmt=n=>Number(n.toFixed(6)).toString();
export function allocateShotPools(shots){
  const pools=[];
  for(let i=0;i<shots.length;i++){
    const shot=shots[i],until=shot.impact+(shot.finalHit?.24:.105);
    let pool=pools.find(p=>p.finalHit===shot.finalHit&&p.until<shot.start-.0004);
    if(!pool){pool={finalHit:shot.finalHit,until:0,shots:[]};pools.push(pool);}
    pool.shots.push({shot,index:i+1});pool.until=until;
  }
  return pools;
}
function track(name,type,mode,duration,initial,events){
  const keys=new Map([[0,initial]]);
  for(const [t,value]of events)keys.set(Math.max(0,Math.min(duration,t)),value);
  keys.set(duration,events.at(-1)?.[1]??initial);
  const entries=[...keys].sort(([a],[b])=>a-b);
  return `<${type?'animateTransform':'animate'} attributeName="${name}"${type?` type="${type}"`:''} calcMode="${mode}" keyTimes="${entries.map(([t])=>fmt(t/duration)).join(';')}" values="${entries.map(([,v])=>v).join(';')}" dur="${fmt(duration)}s" repeatCount="indefinite"/>`;
}
export function pooledBulletMarkup(mission){
  const d=mission.duration;
  return allocateShotPools(mission.shots).map((pool,index)=>{
    const origins=[],angles=[],travel=[],alpha=[],flash=[],positions=[],impactAlpha=[],scales=[];
    const base=pool.finalHit?'.2':'.4',peak=pool.finalHit?'.45':'.65',end=pool.finalHit?'1.5':'1.15';
    for(const{shot:s}of pool.shots){
      const pre=Math.max(0,s.start-.0004),hitPre=Math.max(0,s.impact-.0004),length=s.finalHit?.24:.105;
      origins.push([pre,`${fmt(s.origin.x)} ${fmt(s.origin.y)}`]);
      angles.push([pre,fmt(Math.atan2(s.y-s.origin.y,s.x-s.origin.x)*180/Math.PI)]);
      travel.push([pre,'0 0'],[s.start,'0 0'],[s.impact,`${fmt(Math.hypot(s.x-s.origin.x,s.y-s.origin.y))} 0`],[s.impact+.001,`${fmt(Math.hypot(s.x-s.origin.x,s.y-s.origin.y))} 0`]);
      alpha.push([pre,'0'],[s.start,'1'],[s.impact,'1'],[s.impact+.001,'0']);
      flash.push([pre,'0'],[s.start,'1'],[s.start+.048,'0']);
      positions.push([hitPre,`${fmt(s.x)} ${fmt(s.y)}`]);
      impactAlpha.push([hitPre,'0'],[s.impact,'1'],[s.impact+length,'0']);
      scales.push([hitPre,base],[s.impact,peak],[s.impact+length*.28,'1'],[s.impact+length,end]);
    }
    return `<g id="shot-pool-${index+1}" data-shots="${pool.shots.map(s=>s.index).join(' ')}" aria-label="Pooled aimed shots">
      <g>${track('transform','translate','discrete',d,origins[0][1],origins)}
        <g>${track('transform','rotate','discrete',d,angles[0][1],angles)}
          <g class="muzzle-flash" opacity="0">${track('opacity',null,'linear',d,'0',flash)}<use href="#fx-muzzle"/></g>
          <g class="bullet" opacity="0">${track('opacity',null,'discrete',d,'0',alpha)}
            <g>${track('transform','translate','linear',d,'0 0',travel)}<rect x="-12" y="-2" width="9" height="4" fill="#ffd96d"/><rect x="-3" y="-2" width="4" height="4" fill="#fff4ac"/></g>
          </g>
        </g>
      </g>
      <g opacity="0">${track('transform','translate','discrete',d,positions[0][1],positions)}${track('opacity',null,'linear',d,'0',impactAlpha)}
        <g>${track('transform','scale','linear',d,base,scales)}<use href="#fx-impact-${pool.finalHit?'break':'damage'}"/></g>
      </g>
    </g>`;
  }).join('');
}

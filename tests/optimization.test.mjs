import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {compactPixelPath,compileAtlas,OPTIMIZED_ATLASES} from '../scripts/compile-pixel-art.mjs';
import {allocateShotPools,pooledBulletMarkup} from '../scripts/shot-pool.mjs';
import {normalizeWeeks} from '../scripts/generate.mjs';
import {buildLevel,createMission} from '../scripts/mission.mjs';

test('Contour compiler preserves holes, diagonally touching components and exact integer bounds',()=>{
  assert.equal(compactPixelPath('M0 0h2v1h-2zM0 1h2v1h-2z'),'M0 0h2v2h-2z');
  assert.equal(compactPixelPath('M0 0h1v1h-1zM1 1h1v1h-1z'),'M0 0h1v1h-1zM1 1h1v1h-1z');
  const ring=compactPixelPath('M0 0h3v1h-3zM0 1h1v1h-1zM2 1h1v1h-1zM0 2h3v1h-3z');
  assert.equal((ring.match(/M/g)||[]).length,2);
  const shape='M0 0L1 1z';assert.equal(compactPixelPath(shape),shape);
});
test('Every compiled atlas is reproducible from its original vector source; simple polygons stay vector',()=>{
  for(const biome of OPTIMIZED_ATLASES){
    const read=suffix=>readFileSync(new URL(`../assets/${biome}-${suffix}.json.gz.b64`,import.meta.url),'utf8');
    const source=JSON.parse(gunzipSync(Buffer.from(read('sprites').trim(),'base64')));
    assert.deepEqual(JSON.parse(gunzipSync(Buffer.from(read('optimized').trim(),'base64'))),compileAtlas(source),biome);
  }
  const shape=[2,2,[['ffffff','M0 0h2v2H0z']]];
  assert.deepEqual(compileAtlas({shape}).shape,shape);
});
test('Shot pools retain every shot once and never reuse a still-visible effect, including dense calendars',()=>{
  const fixture=JSON.parse(gunzipSync(Buffer.from(readFileSync('fixtures/demo-calendar.json.gz.b64','utf8').trim(),'base64')));
  for(const dense of [false,true]){
    const weeks=structuredClone(fixture.weeks);
    if(dense)for(const w of weeks)for(const d of w.contributionDays){d.contributionCount=10;d.contributionLevel='FOURTH_QUARTILE';}
    const grid=normalizeWeeks(weeks);
    for(const location of ['desert','industrial','temple','coast']){
      const mission=createMission(grid,buildLevel(grid,'0w1Max',5,location)),pools=allocateShotPools(mission.shots);
      assert.deepEqual(pools.flatMap(p=>p.shots.map(s=>s.index)).sort((a,b)=>a-b),mission.shots.map((_,i)=>i+1));
      assert.ok(pools.length<=6,'Effect concurrency unexpectedly increased');
      for(const p of pools)for(let i=1;i<p.shots.length;i++){
        const previous=p.shots[i-1].shot,next=p.shots[i].shot;
        assert.equal(previous.finalHit,next.finalHit);
        assert.ok(previous.impact+(previous.finalHit?.24:.105)<next.start-.0004);
      }
      const markup=pooledBulletMarkup(mission);
      assert.equal((markup.match(/<(?:animate|animateTransform)\b/g)||[]).length,pools.length*8);
      for(const[,keys]of markup.matchAll(/keyTimes="([^"]+)"/g)){
        const times=keys.split(';').map(Number);assert.equal(times[0],0);assert.equal(times.at(-1),1);
        assert.ok(times.every((t,i)=>i===0||t>=times[i-1]));
      }
    }
  }
  assert.equal(pooledBulletMarkup({shots:[],duration:10}),'');
});

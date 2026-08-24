import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {getMinorElement,createCardEffectProfile,getParticleBudget,getMajorArchetypeCounts} from '../../src/client/effects/minor-effect-profile.js';

test('maps the four minor suits to premium visual families',()=>{
  assert.equal(getMinorElement({type:'minor',suit:'Wands'}),'fire');
  assert.equal(getMinorElement({type:'minor',suit:'Cups'}),'water');
  assert.equal(getMinorElement({type:'minor',suit:'Swords'}),'air');
  assert.equal(getMinorElement({type:'minor',suit:'Pentacles'}),'earth');
  assert.throws(()=>getMinorElement({type:'minor',suit:'Stars'}),/Unknown minor suit/);
});

test('covers all 78 cards and all six major archetypes',async()=>{
  const data=JSON.parse(await readFile(new URL('../../src/data/tarotoo-cards.json',import.meta.url),'utf8'));
  const profiles=data.map(card=>createCardEffectProfile({id:card.id,type:card.arcana,suit:card.name.split(' of ')[1]||null},'upright','low'));
  assert.equal(profiles.length,78);assert.equal(profiles.filter(Boolean).length,78);
  assert.deepEqual(getMajorArchetypeCounts(),{radiance:4,veil:3,order:4,life:4,portal:4,rupture:3});
  assert.equal(new Set(profiles.slice(0,22).map(profile=>profile.family)).size,6);
  assert.equal(new Set(profiles.slice(0,22).map(profile=>`${profile.family}:${profile.speed}:${profile.geometryBias}`)).size,22);
});

test('uses subtle accent budgets and reverses energy direction',()=>{
  assert.deepEqual(['standard','low','reduced'].map(getParticleBudget),[96,42,0]);
  const up=createCardEffectProfile({id:22,type:'minor',suit:'Wands'},'upright','low');
  const rev=createCardEffectProfile({id:22,type:'minor',suit:'Wands'},'reversed','reduced');
  assert.equal(up.flow,'outward');assert.equal(up.verticalDirection,1);assert.equal(up.turbulence,.32);
  assert.equal(rev.flow,'inward');assert.equal(rev.verticalDirection,-1);assert.equal(rev.turbulence,.72);
  assert.equal(up.particleCount,42);assert.equal(rev.particleCount,0);
});

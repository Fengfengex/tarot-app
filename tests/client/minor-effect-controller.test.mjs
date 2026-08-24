import test from 'node:test';
import assert from 'node:assert/strict';
import {createMinorEffectController} from '../../src/client/effects/minor-effect-controller.js';

function factory(calls){return ({profile})=>({reveal:()=>calls.push(['reveal',profile.family]),settle:()=>calls.push(['settle',profile.family]),update:dt=>calls.push(['update',profile.family,dt]),dispose:()=>calls.push(['dispose',profile.family])});}

test('runs a keyed lifecycle for major and minor cards',()=>{
  const calls=[],controller=createMinorEffectController({tier:'low',rendererFactory:factory(calls)}),key={};
  assert.equal(controller.prepare({id:19,type:'major'},'upright',{x:1,y:2,z:0},key),true);
  controller.reveal(key);controller.update(.1);controller.settle(key);controller.dispose(key);
  assert.deepEqual(calls,[['reveal','radiance'],['update','radiance',.1],['settle','radiance'],['dispose','radiance']]);
});

test('keeps three settled cards while a fourth card is prepared',()=>{
  const calls=[],controller=createMinorEffectController({rendererFactory:factory(calls)}),keys=[{},{},{},{}];
  controller.prepare({id:22,type:'minor',suit:'Wands'},'upright',{},keys[0]);controller.settle(keys[0]);
  controller.prepare({id:36,type:'minor',suit:'Cups'},'upright',{},keys[1]);controller.settle(keys[1]);
  controller.prepare({id:50,type:'minor',suit:'Swords'},'upright',{},keys[2]);controller.settle(keys[2]);
  controller.prepare({id:4,type:'major'},'upright',{},keys[3]);
  assert.equal(controller.getSnapshot().count,4);
  assert.equal(calls.filter(([name])=>name==='dispose').length,0);
  controller.dispose();assert.equal(calls.filter(([name])=>name==='dispose').length,4);
});

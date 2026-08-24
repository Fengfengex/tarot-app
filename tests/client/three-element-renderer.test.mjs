import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createThreeElementRenderer } from '../../src/client/effects/three-element-renderer.js';

function createAnimeHarness() {
  const animations=[];
  const animate=(target,options)=>{
    const animation={cancelled:false,cancel(){this.cancelled=true;}};
    animations.push(animation);
    for (const [key,value] of Object.entries(options)) {
      if (['duration','ease','onUpdate','onComplete'].includes(key)) continue;
      target[key]=Array.isArray(value)?value.at(-1):value;
    }
    options.onUpdate?.();
    options.onComplete?.();
    return animation;
  };
  return {animate,animations};
}

test('creates a shader field and follows lifecycle phases', () => {
  const scene=new THREE.Scene(); const anchor=new THREE.Vector3(1,2,0);
  const profile={element:'water',palette:['#D9FAFF','#42C8E8','#2464C7'],particleCount:80,flow:'outward',verticalDirection:1,turbulence:.45};
  const effect=createThreeElementRenderer({THREE,scene,profile,anchor});
  assert.equal(scene.children.length,1); assert.equal(effect.getSnapshot().particleCount,80);
  effect.reveal(); effect.update(.25); assert.equal(effect.getSnapshot().phase,'revealing');
  effect.settle(); effect.update(.25); assert.equal(effect.getSnapshot().phase,'settled');
  effect.dispose(); effect.dispose();
  assert.equal(scene.children.length,0); assert.equal(effect.getSnapshot().disposed,true);
});

test('updates positions for every element and reversed flow', () => {
  for (const element of ['fire','water','air','earth']) {
    const scene=new THREE.Scene();
    const profile={element,palette:['#fff','#888','#000'],particleCount:8,flow:'inward',verticalDirection:-1,turbulence:.8};
    const effect=createThreeElementRenderer({THREE,scene,profile,anchor:{x:0,y:0,z:0}});
    const particles=scene.children[0].children.find(child=>child.isPoints);
    const before=particles.geometry.attributes.position.array.slice();
    effect.reveal(); effect.update(.2);
    const after=particles.geometry.attributes.position.array;
    assert.notDeepEqual([...after],[...before],`${element} particles should move`);
    effect.dispose();
  }
});

test('builds a shader field, geometry and subtle accents for all ten families', () => {
  for (const element of ['fire','water','air','earth','radiance','veil','order','life','portal','rupture']) {
    const scene=new THREE.Scene();
    const profile={family:element,element,palette:['#fff','#888','#000'],particleCount:24,flow:'outward',verticalDirection:1,turbulence:.45};
    const effect=createThreeElementRenderer({THREE,scene,profile,anchor:{x:0,y:0,z:0}});
    const names=[];
    scene.children[0].traverse(child=>{if(child.name)names.push(child.name);});
    assert.ok(names.includes(`card-effect-${element}`));
    assert.ok(names.includes(`${element}-field`));
    assert.ok(names.includes(`${element}-geometry`));
    assert.ok(names.includes(`${element}-accents`));
    effect.dispose();
  }
});

test('uses anime timelines to drive reveal and settle presentation', () => {
  const scene=new THREE.Scene();
  const anime=createAnimeHarness();
  const profile={element:'water',palette:['#D9FAFF','#42C8E8','#2464C7'],particleCount:24,flow:'outward',verticalDirection:1,turbulence:.45};
  const effect=createThreeElementRenderer({THREE,scene,profile,anchor:{x:0,y:0,z:0},anime:anime.animate});

  effect.reveal();
  const reveal=effect.getSnapshot();
  assert.equal(reveal.phase,'revealing');
  assert.equal(reveal.intensity,1);
  assert.equal(reveal.burst,1);

  effect.settle();
  const settled=effect.getSnapshot();
  assert.equal(settled.phase,'settled');
  assert.equal(settled.intensity,.24);
  assert.equal(settled.burst,0);
  assert.equal(anime.animations[0].cancelled,true);
  effect.dispose();
  assert.equal(anime.animations[1].cancelled,true);
});

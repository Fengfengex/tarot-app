import { createCardEffectProfile } from './minor-effect-profile.js';

export function createMinorEffectController({rendererFactory,tier='standard'}){
  if(typeof rendererFactory!=='function')throw new TypeError('rendererFactory is required');
  const effects=new Map();
  let lastKey='held',state='idle';
  const resolveKey=key=>key??lastKey;
  const disposeOne=key=>{const effect=effects.get(key);if(!effect)return false;effect.dispose();effects.delete(key);return true;};
  return {
    prepare(card,orientation,anchor,key='held'){
      const profile=createCardEffectProfile(card,orientation,tier);
      disposeOne(key);effects.set(key,rendererFactory({profile,anchor}));lastKey=key;state='prepared';return true;
    },
    reveal(key){const effect=effects.get(resolveKey(key));if(!effect)return false;effect.reveal();state='revealing';return true;},
    settle(key){const effect=effects.get(resolveKey(key));if(!effect)return false;effect.settle();state='settled';return true;},
    update(dt){effects.forEach(effect=>effect.update(dt));},
    dispose(key){if(key!==undefined){const removed=disposeOne(key);state=effects.size?'settled':'idle';return removed;}effects.forEach(effect=>effect.dispose());effects.clear();state='disposed';return true;},
    getState(){return state;},
    getSnapshot(){return {state,count:effects.size,keys:[...effects.keys()]};}
  };
}

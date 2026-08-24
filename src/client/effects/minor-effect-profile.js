const SUITS=Object.freeze({
  Wands:Object.freeze({family:'fire',variant:'ember-flow',palette:Object.freeze(['#FFF1C7','#FF9B42','#B92E20'])}),
  Cups:Object.freeze({family:'water',variant:'liquid-ether',palette:Object.freeze(['#E4FDFF','#58D6EA','#3455B9'])}),
  Swords:Object.freeze({family:'air',variant:'silk-rays',palette:Object.freeze(['#FFFFFF','#A9E4FF','#7774A8'])}),
  Pentacles:Object.freeze({family:'earth',variant:'gold-topography',palette:Object.freeze(['#FFE68A','#B7A34B','#3E6F4B'])})
});

const ARCHETYPES=Object.freeze({
  radiance:Object.freeze({ids:[1,17,19,21],variant:'solar-oracle',palette:Object.freeze(['#FFF9D9','#FFD66B','#A878FF'])}),
  veil:Object.freeze({ids:[2,9,18],variant:'lunar-veil',palette:Object.freeze(['#EDF4FF','#88A7E8','#6B4C91'])}),
  order:Object.freeze({ids:[4,5,7,11],variant:'sacred-order',palette:Object.freeze(['#FFF1C1','#D2A84E','#6FA7C8'])}),
  life:Object.freeze({ids:[3,6,8,14],variant:'living-current',palette:Object.freeze(['#FFF0D7','#E49DAF','#70B894'])}),
  portal:Object.freeze({ids:[0,10,12,20],variant:'fate-portal',palette:Object.freeze(['#F7F0FF','#A985E8','#55C9C0'])}),
  rupture:Object.freeze({ids:[13,15,16],variant:'shadow-rift',palette:Object.freeze(['#FFD8C5','#D54B58','#55204F'])})
});

const MAJOR_BY_ID=new Map(Object.entries(ARCHETYPES).flatMap(([family,definition])=>definition.ids.map(id=>[id,{family,...definition}])));
const BUDGETS=Object.freeze({standard:96,low:42,reduced:0});

export function getParticleBudget(tier){if(!(tier in BUDGETS))throw new Error(`Unknown performance tier: ${tier}`);return BUDGETS[tier];}

export function getMinorElement(card){
  if(!card||card.type!=='minor')return null;
  const definition=SUITS[card.suit];
  if(!definition)throw new Error(`Unknown minor suit: ${card.suit}`);
  return definition.family;
}

export function getCardEffectFamily(card){
  if(!card||!['minor','major'].includes(card.type))throw new Error('Unknown tarot card type');
  if(card.type==='minor')return getMinorElement(card);
  const definition=MAJOR_BY_ID.get(Number(card.id));
  if(!definition)throw new Error(`Unknown major arcana id: ${card.id}`);
  return definition.family;
}

export function createCardEffectProfile(card,orientation='upright',tier='standard'){
  if(!['upright','reversed'].includes(orientation))throw new Error(`Unknown orientation: ${orientation}`);
  const definition=card?.type==='minor'?SUITS[card.suit]:MAJOR_BY_ID.get(Number(card?.id));
  if(!definition){getCardEffectFamily(card);throw new Error('Missing card effect definition');}
  const reversed=orientation==='reversed',cardSeed=Number(card.id)||0;
  return Object.freeze({
    family:definition.family,element:definition.family,variant:definition.variant,cardSeed,orientation,
    palette:definition.palette,particleCount:getParticleBudget(tier),quality:tier,
    flow:reversed?'inward':'outward',verticalDirection:reversed?-1:1,turbulence:reversed?.72:.32,
    speed:.78+(cardSeed%5)*.07,geometryBias:.85+(cardSeed%7)*.045
  });
}

export const createMinorEffectProfile=createCardEffectProfile;
export function getMajorArchetypeCounts(){return Object.fromEntries(Object.entries(ARCHETYPES).map(([family,value])=>[family,value.ids.length]));}

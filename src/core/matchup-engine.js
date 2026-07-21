import { DATA, OWN, ATTACK_MOVES, IDS, GRADE_LABEL } from '../data/pokemon-data.js';
import { CURRENT_VERIFIED, MEGA_STATS_V43, AXIS_LABEL, DIRECT_GRADE_OVERRIDES, ABILITY_GROUPS } from '../data/meta-data.js';
import { battleTypes, eff } from './type-system.js';
import { defenseProfile, axisMultiplier } from './defense-engine.js';
import { abilityContext, abilitySummary, plausibleAbilityIds, abilityMoveFactor, moveAbilityScore, bestAbilityMove, applyAbilityMatchup as applyAbilityMatchupBase } from './ability-engine.js';

let combatAudit = null;
const caches={profile:new Map(),fallback:new Map(),best:new Map(),wall:new Map(),direct:new Map()};
const key=(p,megaName='',suffix='')=>`${p.name}|${megaName||''}|${suffix}`;
export function clearMatchupCaches(){ Object.values(caches).forEach(cache=>cache.clear()); }
export function configureCombatAudit(engine){ combatAudit = engine; clearMatchupCaches(); }
export function applyAbilityMatchup(p,id,m,megaName=''){
  const out=applyAbilityMatchupBase(p,id,m,megaName);
  if(!combatAudit)return out;
  const a=combatAudit.exchangeAudit(p,id,megaName,{recommendedMove:out.move,proteanState:'fresh',speedState:'auto',itemState:'ready'});
  out.grade=Math.min(out.grade,a.gradeCap);
  if(a.summary)out.note=`[행동순서] ${a.summary}. ${out.note||''}`;
  out.entry=out.grade>=4?'후출 가능':out.grade===3?'선대면만':out.grade===2?'복수 처리':out.grade===1?'비상용':'후출 금지';
  return out;
}

function wallBreakPressureBase(p,id,megaName=''){
 let best=bestAbilityMove(p,id,megaName),d=defenseProfile(p,megaName),fit=axisMultiplier(d,best.meta?.cat||'status');
 let score=Math.max(0,best.score-.55);if(d.kind==='physicalWall'||d.kind==='specialWall')score+=(fit>1?0.55:fit<1?-0.45:0);if(d.kind==='mixedWall')score-=.12;if(d.kind==='variable'||d.kind==='unknown')score*=.85;
 return{score,move:best.move,cat:best.meta?.cat||'status',def:d,fit};
}

export function wallBreakPressure(p,id,megaName=''){
  const k=key(p,megaName,id); if(caches.wall.has(k))return caches.wall.get(k);
  const value=wallBreakPressureBase(p,id,megaName); caches.wall.set(k,value); return value;
}

export function axisGapForCombo(combo,p,megaName=''){
 let d=defenseProfile(p,megaName);if(!['physicalWall','specialWall'].includes(d.kind))return null;
 let arr=combo.map(id=>({id,...wallBreakPressure(p,id,megaName)})).sort((a,b)=>b.score-a.score),best=arr[0];
 let wanted=d.recommendation,hasWanted=arr.some(x=>x.cat===wanted&&x.score>=.65);
 return{d,best,hasWanted,wanted,warning:hasWanted?'':`${d.label}인데 추천 ${AXIS_LABEL[wanted]}축의 실질 타점이 부족함`};
}


// === v4.0 특성·복합 타입·메가 폼 감사 데이터: 235개 전투 항목의 기본/메가 특성 ===

function fallbackBase(p,megaName=''){
 let targetTypes=battleTypes(p,megaName),ma={},def=defenseProfile(p,megaName);
 for(const id of IDS){let o=OWN[id],attacks=ATTACK_MOVES[id]||[],ranked=attacks.map(([move])=>moveAbilityScore(p,id,move,megaName)).sort((a,b)=>b.score-a.score),best=ranked[0],atk=best?.score||1,incoming=Math.max(...targetTypes.map(t=>eff(t,o.types)));if(id==='rotomh'&&targetTypes.includes('땅'))incoming=0;let g=1;if(incoming===0&&atk>=1.65)g=3;else if(incoming<=.5&&atk>=1.55)g=3;else if(incoming<=1&&atk>=1.75)g=3;else if(atk>=1.65)g=2;else if(incoming<=.5)g=3;else g=1;g=Math.min(g,3);if(id==='mimi')g=Math.max(g,1);let axis=best?.axisNote?` ${best.axisNote}.`:'';ma[id]={grade:g,move:best?.move||o.moves[0],entry:g===3?'선대면 가설':g===2?'복수 가설':'비상용',note:`타입·특성·기술 위력과 ${def.label} 추정을 함께 반영한 일반 가설입니다.${axis} 실제 주류 기술·도구·성격 분포를 확인하기 전에는 후출 카운터로 취급하지 않습니다.`}}
 return{pattern:`${targetTypes.join('·')} 타입 · ${def.label} 가설.`,commonMoves:[],winPlan:`정밀 프로필이 없는 상대다. ${def.note} 표시 기술은 현재 정보에서 가장 나은 공격 후보이며, 첫 기술·도구·피해량을 확인한 뒤 현재 대면 복구에서 다시 판단한다.`,matchups:ma,lead:0,precision:'일반 가설'}
}

function profileBase(p,megaName){
 let raw=DATA.profiles[p.name],base=raw?JSON.parse(JSON.stringify(raw)):fallback(p,megaName);
 if(raw){
   if(CURRENT_VERIFIED.has(p.name)){base.precision='최신 검증'}
   else{
     base.precision='수동 프로필';
     for(const m of Object.values(base.matchups||{})){
       if(m.grade===5){m.grade=4;m.entry='후출 가능';m.note='[최신 표본 미검증] '+m.note+' 등급 5로 단정하지 않습니다.'}
       else m.note='[최신 표본 미검증] '+m.note;
     }
     base.winPlan='[수동 프로필] '+base.winPlan+' 최신 채용률과 직접 대조 전에는 카운터로 단정하지 않는다.';
   }
 }
 let pr=base;
 if(megaName==='메가플라엣테'){
  pr.precision='랭크 표본 없음';pr.pattern='종족값·페어리 타입·페어리오라는 확인됐지만 현재 싱글 랭크 기술·도구·성격·노력치 표본이 없다.';pr.commonMoves=[];
  for(const m of Object.values(pr.matchups||{})){m.grade=Math.min(m.grade,3);m.entry=m.grade===3?'선대면 가설':m.grade===2?'복수 가설':'비상용';m.note='[메가플라엣테 랭크 표본 없음] '+m.note+' 기본 폼의 기술 구성을 메가폼 표준형으로 간주하지 않는다.'}
  pr.winPlan='메가플라엣테의 실전 샘플은 확인되지 않았다. 페어리오라 강화와 높은 특공·특방·스피드만 반영하고, 기술 공개 전에는 후출 카운터나 확정 선공을 단정하지 않는다.';
 }
 if(p.name==='그우린차'){
   pr.pattern='내열 중심 풀·고스트 회복형. 불꽃 약점이 내열로 실전상 중립이 되고, 휘적휘적포·힘흡수로 장기전을 만든다.';
   pr.commonMoves=['휘적휘적포','힘흡수','섀도볼','명상'];
   pr.winPlan='내열을 기본값으로 두고 불꽃기 원킬을 가정하지 않는다. 어흥염은 DD래리어트로 고스트 약점을 찌르고, 히트로토무는 오버히트를 단독 돌파기로 보지 말고 볼트체인지로 체력을 누적한다.';
   pr.matchups.incin={grade:4,move:'DD래리어트',note:'풀·고스트를 모두 반감하고 악으로 2배. 내열 때문에 플레어드라이브보다 DD래리어트 우선. 화상·회복 때문에 반복 완봉은 아님.',entry:'후출 가능'};
   pr.matchups.rotomh={grade:3,move:'오버히트',note:'내열로 오버히트가 중립 수준. 선대면 압박은 가능하지만 후출 카운터로 단정하지 않음.',entry:'선대면만'};
 }
 if(p.name==='캥카'&&megaName==='메가캥카'){
   pr.pattern='메가진화 전 배짱/정신력으로 위협을 무효화한 뒤, 메가 후 부자유친 2타로 압박하는 물리형.';
   pr.commonMoves=['속이기','지진','기습','냉동펀치'];
   pr.winPlan='어흥염의 위협을 전제로 삼지 않는다. 부자유친 때문에 한카리아스의 기합의띠와 따라큐의 탈은 한 턴 보장이 아니므로, 누리레느·메가이상해꽃의 실제 내구와 직접 화력으로 교환해야 한다.';
   pr.matchups.incin={grade:3,move:'DD래리어트',note:'메가 전 배짱/정신력으로 위협이 막힐 수 있다. 격투 커버리지까지 있어 반복 후출 불가.',entry:'선대면만'};
   pr.matchups.mimi={grade:1,move:'치근거리기',note:'노말·격투 면역 자체는 유효해도 부자유친 2타가 탈을 깨고 본체를 타격할 수 있어 비상용.',entry:'비상용'};
   pr.matchups.garchomp={grade:1,move:'지진',note:'부자유친 2타로 기합의띠가 한 턴을 보장하지 않음.',entry:'비상용'};
 }
 if(p.name!=='리자몽')return pr;
 if(megaName==='메가리자몽Y'){
   pr.pattern='메가Y 쾌청 특수형. 불꽃·비행·솔라빔을 기본으로 본다.';pr.commonMoves=['솔라빔','화염방사','에어슬래시','오버히트'];
   pr.winPlan='히트로토무를 보존해 세 주력 타입을 모두 반감하고 스카프 10만볼트로 압박한다. 누리레느는 솔라빔에 후출하지 않는다.';
   pr.matchups.rotomh={grade:5,move:'10만볼트',note:'불꽃·비행·솔라빔을 모두 반감하고 2배 약점 공격. 표준 Y형의 주 대응.',entry:'후출 가능'};
   pr.matchups.prim={grade:1,move:'아쿠아제트',note:'쾌청 솔라빔 약점. 낮은 체력 마무리만.',entry:'비상용'};
 }
 if(megaName==='메가리자몽X'){
   pr.pattern='메가X 용의춤 물리형. 불꽃·드래곤＋지진 계열을 기본으로 본다.';pr.commonMoves=['플레어드라이브','드래곤클로','용의춤','지진'];
   pr.winPlan='누리레느의 드래곤 무효와 따라큐의 탈을 보조축으로 둔다. 히트로토무는 불꽃·지진에는 강하지만 드래곤 공격을 반복해서 못 받고 전기·불꽃 타점도 반감되므로 완전 카운터가 아니다.';
   pr.matchups.rotomh={grade:3,move:'트릭 또는 볼트체인지',note:'불꽃 1/4·지진 무효지만 드래곤클로는 중립이고 공격 타점이 반감된다. 선대면에서 구애로 전개를 끊는 역할.',entry:'선대면만'};
   pr.matchups.prim={grade:4,move:'문포스 또는 앙코르',note:'드래곤 무효·불꽃 반감. 지진은 중립이며 번개펀치가 확인되면 반복 후출 금지.',entry:'후출 가능'};
   pr.matchups.mimi={grade:3,move:'치근거리기',note:'탈로 용의춤 이후도 한 번 제동하지만 반복 후출 카운터는 아니다.',entry:'선대면만'};
   pr.matchups.garchomp={grade:3,move:'지진 또는 스케일샷',note:'서로 약점 타점이 있어 선대면 승부. 드래곤 기술에 후출 금지.',entry:'선대면만'};
 }
 return pr;
}

export function fallback(p,megaName=''){
  const k=key(p,megaName); if(caches.fallback.has(k))return caches.fallback.get(k);
  const value=fallbackBase(p,megaName); caches.fallback.set(k,value); return value;
}
export function profile(p,megaName=''){
  const k=key(p,megaName); if(caches.profile.has(k))return caches.profile.get(k);
  const value=profileBase(p,megaName); caches.profile.set(k,value); return value;
}

export function gradeBadge(g){return `<span class="grade g${g}">${GRADE_LABEL[g]}</span>`}

function bestForBase(p,megaName){let pr=profile(p,megaName),fb=fallback(p,megaName),arr=IDS.map(id=>({id,...applyAbilityMatchup(p,id,(pr.matchups[id]||fb.matchups[id]),megaName)})).sort((a,b)=>b.grade-a.grade||bestAbilityMove(p,b.id,megaName).score-bestAbilityMove(p,a.id,megaName).score);return{pr,arr,best:arr[0],second:arr[1],ability:abilityContext(p,megaName)}}

export function bestFor(p,megaName=''){
  const k=key(p,megaName); if(caches.best.has(k))return caches.best.get(k);
  const value=bestForBase(p,megaName); caches.best.set(k,value); return value;
}

export function matchupGrade(p,id,megaName){return (bestFor(p,megaName).arr.find(x=>x.id===id)||{grade:0}).grade}

export function directGradeBase(p,id,megaName){
 let g=matchupGrade(p,id,megaName);
 if(p.name==='리자몽'){
   const byForm=megaName==='메가리자몽Y'?{rotomh:5,garchomp:3,prim:1}:megaName==='메가리자몽X'?{rotomh:3,garchomp:3,prim:4,mimi:3}:null;
   if(byForm&&byForm[id]!=null)g=byForm[id];
 }
 let o=(DIRECT_GRADE_OVERRIDES[p.name]||{})[id];if(o!=null)g=Math.max(g,o);
 let tr=OWN[id].traits,ctx=abilityContext(p,megaName),ids=plausibleAbilityIds(ctx);
 if(g<=2&&tr.includes('sash'))g=Math.max(g,2);if(g<=2&&tr.includes('disguise'))g=Math.max(g,2);
 if((ids.has('parental-bond')||ids.has('skill-link'))&&(tr.includes('sash')||tr.includes('disguise')))g=Math.min(g,1);
 if(ids.has('mold-breaker')&&(id==='rotomh'||(id==='mimi'&&megaName!=='메가갸라도스')))g=Math.min(g,id==='rotomh'?2:1);
 if([...ABILITY_GROUPS.fullShield].some(x=>ids.has(x))||[...ABILITY_GROUPS.oneHit].some(x=>ids.has(x)))g=Math.max(1,g-1);
 return g
}


export function directGrade(p,id,megaName=''){
  const k=key(p,megaName,id); if(caches.direct.has(k))return caches.direct.get(k);
  const g=directGradeBase(p,id,megaName);
  const value=!combatAudit?g:Math.min(g,combatAudit.exchangeAudit(p,id,megaName,{recommendedMove:bestAbilityMove(p,id,megaName).move,proteanState:'fresh',speedState:'auto',itemState:'ready'}).gradeCap);
  caches.direct.set(k,value); return value;
}
export class MatchupEngine {
  profile(...args){ return profile(...args); }
  bestFor(...args){ return bestFor(...args); }
  matchupGrade(...args){ return matchupGrade(...args); }
  directGrade(...args){ return directGrade(...args); }
  wallBreakPressure(...args){ return wallBreakPressure(...args); }
  axisGap(...args){ return axisGapForCombo(...args); }
}
export const matchupEngine = new MatchupEngine();

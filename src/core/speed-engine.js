import { DATA, OWN } from '../data/pokemon-data.js';
import { MOVE_META, ABILITY_GROUPS, AUTO_MEGA_PRIOR, BASE_SPEED_V42, MEGA_STATS_V43, MEGA_SPEED_V43, ENEMY_MOVE_META_V42, SET_META_V42, OWN_PRIORITY_V42, OWN_SPEED_V42, PRIORITY_BLOCK_ABILITIES_V42, SPEED_SETUP_HINTS_V42 } from '../data/meta-data.js';
import { battleTypes, eff } from './type-system.js';
import { defenseProfile } from './defense-engine.js';
import { abilityContext, plausibleAbilityIds, abilityMoveFactor, bestAbilityMove } from './ability-engine.js';
import { profile } from './matchup-engine.js';

function megaBaseFor(form){
  for(const p of DATA.roster)if((DATA.megaOptions[p.name]||[]).includes(form))return p.name;
  return '';
}
function tagsOf(p){
  const out=[...(DATA.tags[p.name]||[])];
  const ids=plausibleAbilityIds(abilityContext(p,''));
  if([...ABILITY_GROUPS.weatherSpeed].some(x=>ids.has(x))&&!out.includes('fast'))out.push('fast');
  return [...new Set(out)];
}

export function enemyMoveMetaV42(name){return ENEMY_MOVE_META_V42[name]||MOVE_META[name]||null}

export function priorityV42(meta,move=''){if(OWN_PRIORITY_V42[move]!=null)return OWN_PRIORITY_V42[move];let p=meta?.priority;return p===true?1:(Number.isFinite(p)?p:0)}

export function speedAbilityIdsV42(p,megaName=''){return plausibleAbilityIds(abilityContext(p,megaName))}

export function statSpeedV42(base,sp=0,nature=1){return Math.floor((base+20+sp)*nature)}

export function applySpeedMultiplierV42(v,m){return Math.floor(v*m)}

export function speedProfileV42(p,megaName='',state='auto'){
 let baseStat=BASE_SPEED_V42[p.name],legalMega=megaName&&megaBaseFor(megaName)===p.name,confidence='중간',form=legalMega?megaName:p.name,notes=[],unknownMega=false;
 if(legalMega){if(MEGA_SPEED_V43[megaName]!=null)baseStat=MEGA_SPEED_V43[megaName];else{unknownMega=true;confidence='낮음';notes.push('메가폼 스피드 데이터 내부 누락—고신뢰 판정 금지')}}
 if(baseStat==null){baseStat=tagsOf(p).includes('fast')?105:70;confidence='낮음';notes.push('기본 스피드 추정')}
 const set=SET_META_V42[p.name]||{},spRange=set.speedSP||[0,32],natureRange=set.speedNature||[.9,1.1];
 let min=statSpeedV42(baseStat,spRange[0],natureRange[0]),max=statSpeedV42(baseStat,spRange[1],natureRange[1]);
 if(set.speedSP){confidence='높음';notes.push(`대표 스피드 투자 ${spRange[0]}~${spRange[1]}`)}else notes.push('성격·스피드 투자 불명 범위');
 if(unknownMega){min=statSpeedV42(Math.max(1,baseStat-15),0,.9);max=statSpeedV42(baseStat+45,32,1.1)}
 if(p.name==='메타몽'&&speedAbilityIdsV42(p,megaName).has('imposter')){min=80;max=226;confidence='낮음';notes=['괴짜로 현재 상대 스피드 복사','구애스카프 가능'];return{base:baseStat,min,max,form,confidence,notes,state,label:'변신 후 스피드 80~226 추정'}}
 if(!legalMega&&state==='auto'&&set.mega>=30){let prior=AUTO_MEGA_PRIOR[p.name],ms=prior&&MEGA_SPEED_V43[prior.name];if(ms!=null){let mmin=statSpeedV42(ms,spRange[0],natureRange[0]),mmax=statSpeedV42(ms,spRange[1],natureRange[1]);min=Math.min(min,mmin);max=Math.max(max,mmax);notes.push(`기본/메가 ${Math.round(set.mega)}% 혼재`)}}
 let mult=1;
 if(state==='scarf')mult=1.5;else if(state==='plus1')mult=1.5;else if(state==='plus2')mult=2;else if(state==='weather'||state==='unburden')mult=2;else if(state==='minus1')mult=2/3;else if(state==='paralyzed')mult=.5;
 if(state!=='auto'){min=applySpeedMultiplierV42(min,mult);max=applySpeedMultiplierV42(max,mult)}
 else{
   const ids=speedAbilityIdsV42(p,megaName),tags=tagsOf(p),pr=profile(p,megaName);
   if((set.scarf||0)>=25){max=applySpeedMultiplierV42(max,1.5);notes.push(`구애스카프 ${set.scarf}%`)}else if(tags.includes('scarf')){max=applySpeedMultiplierV42(max,1.5);notes.push('구애스카프형 가능')}
   if(ids.has('speed-boost')){max=applySpeedMultiplierV42(max,1.5);notes.push('턴 종료 후 가속 +1 가능')}
   if([...ABILITY_GROUPS.weatherSpeed].some(x=>ids.has(x))){max=applySpeedMultiplierV42(max,2);notes.push('날씨·필드 활성 시 2배')}
   if(ids.has('unburden')){max=applySpeedMultiplierV42(max,2);notes.push('곡예 발동 시 2배')}
   if(ids.has('weak-armor')){max=applySpeedMultiplierV42(max,2);notes.push('물리 피격 후 깨어진갑옷 +2')}
   if(ids.has('quick-feet')){max=applySpeedMultiplierV42(max,1.5);notes.push('상태이상 시 속보 1.5배')}
   if(ids.has('motor-drive')){max=applySpeedMultiplierV42(max,1.5);notes.push('전기엔진 발동 시 +1')}
   let setupFactor=SPEED_SETUP_HINTS_V42[p.name]||1,known=(pr.commonMoves||[]).map(enemyMoveMetaV42).filter(Boolean).reduce((m,x)=>Math.max(m,x.speedStages===2?2:x.speedStages===1?1.5:1),1);setupFactor=Math.max(setupFactor,known);if(setupFactor>1){max=applySpeedMultiplierV42(max,setupFactor);notes.push(setupFactor===2?'스피드 +2 전개 가능':'스피드 +1 전개 가능')}
 }
 return{base:baseStat,min,max,form,confidence,notes:[...new Set(notes)],state,label:min===max?`${form} 실수치 ${Math.round(min)}`:`${form} 실수치 범위 ${Math.round(min)}~${Math.round(max)}`};
}

export function enemyMoveScenariosV42(p,megaName='',revealed=''){
 const set=SET_META_V42[p.name],pr=profile(p,megaName),raw=revealed?[{name:revealed,usage:100}]:(set?.moves||((pr.commonMoves||[]).map((name,i)=>[name,Math.max(25,85-i*12)])));
 return raw.map(x=>{let name=Array.isArray(x)?x[0]:x.name,usage=Array.isArray(x)?x[1]:x.usage,meta=enemyMoveMetaV42(name);return meta?{name,usage,...meta}:null}).filter(Boolean);
}

export function incomingFactorV42(p,id,move,itemState='ready',megaName=''){
 let f=1;if(id==='rotomh'&&move.type==='땅')return 0;if(id==='venusaur'&&['불꽃','얼음'].includes(move.type))f*=.5;if(id==='prim'&&move.type==='전기'&&itemState==='ready')f*=.5;
 if(id==='incin'&&move.cat==='physical'){let ids=plausibleAbilityIds(abilityContext(p,megaName));if(![...ABILITY_GROUPS.intimidateImmune].some(x=>ids.has(x)))f*=.67}
 return f;
}

export function proteanPossibleV42(p,megaName=''){let ids=speedAbilityIdsV42(p,megaName);return ids.has('protean')||ids.has('libero')}

export function typeAfterMoveV42(p,move,megaName='',proteanState='fresh'){if(move?.type&&proteanPossibleV42(p,megaName)&&proteanState!=='spent')return[move.type];return battleTypes(p,megaName)}

export function priorityBlockedV42(p,megaName=''){let ids=speedAbilityIdsV42(p,megaName);return [...PRIORITY_BLOCK_ABILITIES_V42].some(x=>ids.has(x))}

export function speedRelationV42(p,id,megaName='',opts={}){
 let sp=speedProfileV42(p,megaName,opts.speedState||'auto'),ownData=OWN_SPEED_V42[id]||{base:OWN[id].speed,item:OWN[id].speed},own=(id==='rotomh'&&opts.itemState==='spent')?ownData.base:ownData.item,enemyPr=priorityV42(opts.enemyMove,opts.enemyMove?.name),ownMeta=MOVE_META[opts.ownMove]||enemyMoveMetaV42(opts.ownMove)||{},ownPr=priorityV42(ownMeta,opts.ownMove),blocked=false,result='uncertain',field=opts.fieldState||'normal';
 if(ownPr>0&&priorityBlockedV42(p,megaName)){ownPr=0;blocked=true}
 if(field==='enemyTailwind'){sp={...sp,min:sp.min*2,max:sp.max*2,notes:[...sp.notes,'상대 순풍 2배']}}else if(field==='ourTailwind')own*=2;
 if(enemyPr>ownPr)result='enemy';else if(ownPr>enemyPr)result='own';else if(field==='trickroom'){if(sp.max<own)result='enemy';else if(sp.min>own)result='own'}else{if(sp.min>own)result='enemy';else if(sp.max<own)result='own'}
 let label=result==='enemy'?'상대 선공':result==='own'?'우리 선공':'선공권 불명',fieldNote=field==='trickroom'?' · 트릭룸 역순':field==='enemyTailwind'?' · 상대 순풍':field==='ourTailwind'?' · 우리 순풍':'';
 return{result,label,enemy:sp,own,enemyPriority:enemyPr,ownPriority:ownPr,priorityBlocked:blocked,field,note:`${label} · 상대 ${Math.round(sp.min)}${sp.min===sp.max?'':'~'+Math.round(sp.max)} / 우리 ${Math.round(own)}${fieldNote}${blocked?' · 상대 특성이 우리 우선기 차단':''}${sp.notes.length?' · '+sp.notes.join(', '):''}`};
}

export function enemyAbilityMoveV43(p,m,megaName='',types=[]){
 const ids=speedAbilityIdsV42(p,megaName),out={...m},notes=[];let powerFactor=1,forcedStab=null;
 if(ids.has('dragon-skin')&&out.type==='노말'){out.type='드래곤';powerFactor*=1.2;notes.push('드래곤스킨: 노말→드래곤·1.2배')}
 if(ids.has('fire-mane')&&out.type==='불꽃'){powerFactor*=1.5;notes.push('불꽃의갈기 1.5배')}
 if(ids.has('fairy-aura')&&out.type==='페어리'){powerFactor*=1.33;notes.push('페어리오라 1.33배')}
 if(ids.has('electric-surge')&&out.type==='전기'){powerFactor*=1.3;notes.push('일렉트릭필드 전기 1.3배')}
 if((ids.has('huge-power')||ids.has('pure-power'))&&out.cat==='physical'){powerFactor*=2;notes.push('천하장사/순수한힘 물리 2배')}
 if(ids.has('tough-claws')&&out.contact){powerFactor*=1.3;notes.push('단단한발톱 접촉 1.3배')}
 if(ids.has('adaptability')&&types.includes(out.type))forcedStab=2;
 return{...out,powerFactor,forcedStab,abilityNotes:notes};
}

export function bestEnemyPressureV42(p,id,megaName='',opts={}){
 let moves=enemyMoveScenariosV42(p,megaName,opts.revealedMove||''),types=battleTypes(p,megaName),protean=proteanPossibleV42(p,megaName)&&opts.proteanState!=='spent';
 let rows=moves.filter(m=>m.type&&m.cat!=='status').map(raw=>{let m=enemyAbilityMoveV43(p,raw,megaName,types),mult=eff(m.type,OWN[id].types)*incomingFactorV42(p,id,m,opts.itemState||'ready',megaName),stab=m.forcedStab||((types.includes(m.type)||protean)?1.5:1),power=(m.power||70)*(m.powerFactor||1),score=mult*(power/90)*stab*(.72+.28*Math.min(1,(m.usage||50)/100));if(priorityV42(m,m.name)>0)score+=.22;if(m.multi)score+=.15;return{...m,mult,stab,effectivePower:power,score}}).sort((a,b)=>b.score-a.score);
 return{best:rows[0]||null,rows};
}

export function exchangeAudit(p,id,megaName='',opts={}){
 let ownMove=opts.recommendedMove||bestAbilityMove(p,id,megaName).move,pressure=bestEnemyPressureV42(p,id,megaName,opts),enemyMove=pressure.best,rel=speedRelationV42(p,id,megaName,{...opts,enemyMove,ownMove}),originalTypes=battleTypes(p,megaName),afterTypes=originalTypes,responseMult=null,originalMult=null,typeShift=false,gradeCap=5,reasons=[];
 if(enemyMove){
  let enemyActs=rel.result==='enemy'||rel.result==='uncertain'||priorityV42(enemyMove,enemyMove.name)>priorityV42(MOVE_META[ownMove]||{},ownMove);
  if(enemyActs&&proteanPossibleV42(p,megaName)&&opts.proteanState!=='spent'){afterTypes=typeAfterMoveV42(p,enemyMove,megaName,opts.proteanState||'fresh');typeShift=afterTypes.join('/')!==originalTypes.join('/')}
  let om=MOVE_META[ownMove]||enemyMoveMetaV42(ownMove);if(om?.type){originalMult=eff(om.type,originalTypes);responseMult=eff(om.type,afterTypes)*abilityMoveFactor(p,ownMove,megaName).factor}
  let severe=(enemyMove.mult>=2&&(enemyMove.power||0)>=80)||enemyMove.mult>=4||enemyMove.score>=2.15,heavyNeutral=enemyMove.mult>=1&&(enemyMove.power||0)>=120;
  let insurance=opts.itemState!=='spent'&&(OWN[id].traits.includes('sash')||OWN[id].traits.includes('disguise'));
  let multiInsuranceRisk=pressure.rows.some(m=>m.multi&&priorityV42(m,m.name)>0&&(m.usage||0)>=20&&m.mult>=1);
  if(rel.result==='enemy'&&severe){gradeCap=Math.min(gradeCap,insurance&&!enemyMove.multi?2:1);reasons.push(`${enemyMove.name} 선공 ${enemyMove.mult}배 고화력`)}
  else if(rel.result==='uncertain'&&severe){gradeCap=Math.min(gradeCap,2);reasons.push(`${enemyMove.name} 선공 가능성을 배제할 수 없음`)}
  else if(rel.result==='enemy'&&heavyNeutral){gradeCap=Math.min(gradeCap,2);reasons.push('선공 고위력 중립기')}
  if(multiInsuranceRisk&&insurance){gradeCap=Math.min(gradeCap,1);reasons.push('우선 다단타가 기띠·탈 보험을 연속 타격')}
  if(typeShift&&responseMult!=null&&originalMult!=null&&responseMult<originalMult){gradeCap=Math.min(gradeCap,responseMult<=.5?1:2);reasons.push(`변환 후 ${afterTypes.join('/')} 타입: ${ownMove} ${responseMult}배`)}
  if(rel.result==='enemy'&&responseMult===0){gradeCap=0;reasons.push('상대가 먼저 타입을 바꿔 반격 무효')}
 } else {reasons.push('공격기 표본 불명—속도만 보수적으로 표시');let pr=profile(p,megaName);if(rel.result==='enemy')gradeCap=Math.min(gradeCap,2);else if(rel.result==='uncertain')gradeCap=Math.min(gradeCap,3);if(pr.precision==='일반 가설')gradeCap=Math.min(gradeCap,3);if(proteanPossibleV42(p,megaName)&&opts.proteanState!=='spent'){gradeCap=Math.min(gradeCap,2);reasons.push('변환자재 기술 타입 불명')}}
 if(rel.priorityBlocked){gradeCap=Math.min(gradeCap,2);reasons.push('여왕의위엄·테일아머 계열로 우리 우선기 차단')}
 if(rel.enemy.notes.some(x=>x.includes('가속'))&&rel.result!=='own')gradeCap=Math.min(gradeCap,3);
 let summary=`${rel.note}`;
 if(enemyMove)summary+=` · 예상 첫 타 ${enemyMove.name}(${enemyMove.mult}배${enemyMove.abilityNotes?.length?' · '+enemyMove.abilityNotes.join('·'):''})`;
 if(typeShift)summary+=` → ${afterTypes.join('/')} 타입 → ${ownMove} ${responseMult}배`;
 if(reasons.length)summary+=` · 경고: ${reasons.join(' / ')}`;
 return{gradeCap,ownMove,enemyMove,relation:rel,afterTypes,responseMult,originalMult,typeShift,reasons,summary,pressure};
}


export const exchangeAuditV42 = exchangeAudit;
export class SpeedEngine {
  profile(...args){ return speedProfileV42(...args); }
  relation(...args){ return speedRelationV42(...args); }
  enemyPressure(...args){ return bestEnemyPressureV42(...args); }
  exchangeAudit(...args){ return exchangeAudit(...args); }
}
export const speedEngine = new SpeedEngine();

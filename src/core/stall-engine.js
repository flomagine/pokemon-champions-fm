import { DATA, OWN } from '../data/pokemon-data.js';
import { defenseProfile } from './defense-engine-v2.js';
import { moveAbilityScore } from './ability-engine.js';
import { STALL_META, RELIABLE_RECOVERY_MOVES, DRAIN_RECOVERY_MOVES, CLOCK_MOVES, ANTI_STALL_MOVES } from '../data/stall-data.js';

const intersects=(moves,set)=>moves.some(move=>set.has(move));
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function moveSetFor(p){
  const raw=DATA.profiles[p.name]||{};
  const exact=STALL_META[p.name]||{};
  return [...new Set([...(raw.commonMoves||[]),...Object.values(exact).map(x=>x&&typeof x==='object'&&x.move).filter(Boolean)])];
}

export function antiStallTools(id){
  const own=OWN[id];
  const moves=new Set(own.moves||[]);
  const tools=[];
  for(const [move,meta] of Object.entries(ANTI_STALL_MOVES))if(moves.has(move))tools.push({move,...meta});
  if((own.traits||[]).includes('setup'))tools.push({move:'랭크업',kind:'setup',weight:.38});
  return tools;
}

export function toxicImmune(id){
  return (OWN[id].types||[]).some(type=>type==='독'||type==='강철');
}

export function sustainProfile(p,megaName=''){
  const exact=STALL_META[megaName]||STALL_META[p.name]||null;
  const moves=moveSetFor(p);
  const tags=DATA.tags[p.name]||[];
  const reliableRate=exact?.reliableRecovery?.usage??(intersects(moves,RELIABLE_RECOVERY_MOVES)?.7:0);
  const drainRate=exact?.drainRecovery?.usage??(intersects(moves,DRAIN_RECOVERY_MOVES)?.35:0);
  const passiveRate=exact?.passiveRecovery?.usage??(tags.includes('recovery')?.35:0);
  const statusRate=exact?.statusClock?.usage??(intersects(moves,CLOCK_MOVES)?.55:0);
  const typeControlRate=exact?.typeControl?.usage??0;
  const pivotRate=exact?.pivot?.usage??(tags.includes('pivot')?.35:0);
  const toxicThreat=exact?.statusClock?.kind==='toxic'||moves.includes('맹독');
  const stallThreat=reliableRate>=.55&&(statusRate>=.4||passiveRate>=.3||drainRate>=.3||tags.includes('stall'));
  const recoveryLoad=clamp(reliableRate*.72+passiveRate*.18+drainRate*.18,0,1.2);
  const clockLoad=clamp(statusRate*.35+typeControlRate*.12+pivotRate*.08,0,.65);
  return{
    name:megaName||p.name,
    stallThreat,
    reliableRate,
    drainRate,
    passiveRate,
    statusRate,
    typeControlRate,
    pivotRate,
    toxicThreat,
    recoveryLoad,
    clockLoad,
    requiredAxis:exact?.requiredAxis||'',
    requiredTypes:exact?.requiredTypes||[],
    breakerThreshold:exact?.breakerThreshold??1.15,
    breakGradeCap:exact?.breakGradeCap??4,
    threatBonus:exact?.threatBonus??(stallThreat?.65:0),
    confidence:exact?.confidence||(stallThreat?'중간':'낮음'),
    updated:exact?.updated||'프로필 기반 추정',
    note:exact?.note||'회복과 상태이상 기술이 함께 확인되면 단순 상성보다 매턴 회복량을 넘는 진전이 있는지를 우선한다.',
    moves
  };
}

export function sustainAssessment(p,id,megaName='',context={}){
  const target=sustainProfile(p,megaName);
  const own=OWN[id];
  const def=defenseProfile(p,megaName);
  const moveResult=context.moveResult||moveAbilityScore(p,id,context.move||own.moves?.[0],megaName);
  const rawScore=Math.max(0,context.rawScore??moveResult.score??0);
  const tools=antiStallTools(id);
  const nativeToxicImmune=toxicImmune(id);
  const effectiveToxicImmune=nativeToxicImmune&&target.typeControlRate<.5;
  const cat=moveResult.meta?.cat||'status';
  const type=moveResult.meta?.type||'';
  const correctAxis=!['physical','special'].includes(def.recommendation)||cat===def.recommendation;
  const requiredTypeOK=!target.requiredTypes.length||target.requiredTypes.includes(type)||rawScore>=2.8;
  const weakness=(moveResult.base||0)>1;
  const recoveryTax=target.recoveryLoad;
  const statusTax=target.toxicThreat&&!effectiveToxicImmune?target.statusRate*.35:target.statusRate*.1;
  const controlTax=target.typeControlRate*.12+target.pivotRate*.08;
  const stabRemovalTax=target.typeControlRate>.5&&(own.types||[]).includes(type)?.12:0;
  let adjustedScore=Math.max(0,rawScore-recoveryTax-statusTax-controlTax-stabRemovalTax);
  if(target.reliableRate>.6&&!weakness&&!tools.some(x=>x.kind==='hardControl'))adjustedScore=Math.min(adjustedScore,.85);
  const overwhelming=rawScore>=2.55;
  const canBreak=!target.stallThreat||(
    adjustedScore>=target.breakerThreshold&&
    (weakness||overwhelming)&&
    (correctAxis||overwhelming)&&
    requiredTypeOK
  );
  const controlTool=tools.filter(x=>x.kind!=='setup').sort((a,b)=>b.weight-a.weight)[0]||null;
  const setupTool=tools.find(x=>x.kind==='setup')||null;
  const canControl=!!controlTool;
  const gradeCap=!target.stallThreat?5:canBreak?target.breakGradeCap:canControl?3:2;
  const canRepeat=canBreak&&(!target.toxicThreat||effectiveToxicImmune)&&target.typeControlRate<.45;
  let label='일반 대면';
  if(target.stallThreat&&canBreak)label=canRepeat?'지속 돌파 가능':'즉시 돌파 가능·반복 후출 불가';
  else if(target.stallThreat&&canControl)label=`${controlTool.move}로 일시 제어만 가능`;
  else if(target.stallThreat&&setupTool)label='랭크업 가능성은 있으나 회복·상태이상 앞에서 안정 돌파 아님';
  else if(target.stallThreat)label='회복량을 넘는 실질 타점 없음';
  const note=target.stallThreat
    ?`${label}. 원시 돌파 ${rawScore.toFixed(2)} → 회복·맹독·제어 부담 반영 ${adjustedScore.toFixed(2)}. ${target.note}`
    :'';
  return{target,moveResult,rawScore,adjustedScore,tools,controlTool,setupTool,nativeToxicImmune,effectiveToxicImmune,correctAxis,requiredTypeOK,weakness,canBreak,canControl,canRepeat,gradeCap,label,note};
}

export class StallEngine{
  profile(...args){return sustainProfile(...args)}
  assess(...args){return sustainAssessment(...args)}
  tools(...args){return antiStallTools(...args)}
}

export const stallEngine=new StallEngine();

import * as base from './matchup-engine.js';
import { OWN, GRADE_LABEL } from '../data/pokemon-data.js';
import { AXIS_LABEL } from '../data/meta-data.js';
import { sustainAssessment } from './stall-engine.js';
import { defenseProfile } from './defense-engine-v2.js';

export * from './matchup-engine.js';

const clone=value=>JSON.parse(JSON.stringify(value));

export function wallBreakPressure(p,id,megaName=''){
  const original=base.wallBreakPressure(p,id,megaName);
  const rawScore=original.rawScore??original.score??0;
  const sustain=sustainAssessment(p,id,megaName,{move:original.move,rawScore});
  return{...original,rawScore,score:sustain.adjustedScore,sustain};
}

function belliboltProfile(pr){
  pr.precision='최신 검증';
  pr.pattern='물붓기 93.7%＋게으름피우기 90.6%＋맹독 83.0%를 중심으로 한 회복막이. 먹다남은음식 66.5%와 파라볼라차지 52.3%까지 있어 약한 중립타는 진전이 되지 않는다.';
  pr.commonMoves=['물붓기','게으름피우기','맹독','볼트체인지','파라볼라차지'];
  pr.winPlan='회복량을 넘는 물리 땅 타점이 선출에 반드시 포함됐는지 검사한다. 히트로토무 트릭은 회복 선택을 묶는 제어 수단이지 직접 돌파 타점이 아니다. 한카리아스는 지진으로 즉시 압박하되 물붓기·맹독 때문에 반복 후출 카운터로 보지 않는다.';
  pr.matchups.garchomp={grade:4,move:'지진',note:'물리 땅 2배로 회복 전에 가장 큰 진전을 만든다. 물붓기·맹독과 슈캐열매 소수 표본 때문에 반복 후출 완봉은 아니다.',entry:'안전 투입 후 즉시 돌파'};
  pr.matchups.rotomh={grade:3,move:'트릭',note:'구애스카프로 회복·맹독 선택을 묶을 수 있지만 전기기는 반감되고 오버히트는 특수막이에 중립이라 직접 돌파는 못 한다.',entry:'선대면 제어만'};
  pr.matchups.venusaur={grade:2,move:'대지의힘',note:'맹독 면역과 땅 약점 공격은 유효하지만 특수막이의 게으름피우기를 안정적으로 넘지 못한다.',entry:'버티기만 가능'};
  pr.matchups.prim={grade:1,move:'앙코르',note:'앙코르로 회복을 묶을 여지는 있으나 전기 약점이며 특수 화력으로 직접 돌파하지 못한다.',entry:'비상용'};
  pr.matchups.mimi={grade:2,move:'칼춤 후 치근거리기',note:'물리축이지만 중립타이고 맹독 시계 안에서 칼춤과 공격 턴을 모두 확보해야 해 안정 돌파가 아니다.',entry:'조건부 복수'};
  pr.matchups.incin={grade:2,move:'DD래리어트',note:'물리 중립타만으로는 게으름피우기와 파라볼라차지 회복을 넘기 어렵고 맹독에도 막힌다.',entry:'피벗·칩 역할'};
  return pr;
}

export function profile(p,megaName=''){
  const pr=clone(base.profile(p,megaName));
  return !megaName&&p.name==='찌리배리'?belliboltProfile(pr):pr;
}

function capRow(p,row,megaName=''){
  const pressure=wallBreakPressure(p,row.id,megaName);
  const sustain=pressure.sustain;
  if(!sustain.target.stallThreat)return{...row};
  const grade=Math.min(row.grade,sustain.gradeCap);
  const note=`[회복막이] ${sustain.note} ${row.note||''}`;
  const entry=grade>=4?'후출 가능':grade===3?'선대면만':grade===2?'복수 처리':grade===1?'비상용':'후출 금지';
  return{...row,grade,note,entry};
}

export function bestFor(p,megaName=''){
  const original=base.bestFor(p,megaName);
  const arr=original.arr.map(row=>capRow(p,row,megaName)).sort((a,b)=>b.grade-a.grade||wallBreakPressure(p,b.id,megaName).score-wallBreakPressure(p,a.id,megaName).score);
  return{...original,pr:profile(p,megaName),arr,best:arr[0],second:arr[1]};
}

export function matchupGrade(p,id,megaName=''){
  return bestFor(p,megaName).arr.find(row=>row.id===id)?.grade??0;
}

export function directGrade(p,id,megaName=''){
  const raw=base.directGrade(p,id,megaName);
  return Math.min(raw,wallBreakPressure(p,id,megaName).sustain.gradeCap);
}

export function axisGapForCombo(combo,p,megaName=''){
  const d=defenseProfile(p,megaName);
  if(!['physicalWall','specialWall'].includes(d.kind))return null;
  const arr=combo.map(id=>({id,...wallBreakPressure(p,id,megaName)})).sort((a,b)=>b.score-a.score);
  const wanted=d.recommendation;
  const hasWanted=arr.some(x=>x.cat===wanted&&x.score>=.65);
  return{d,best:arr[0],hasWanted,wanted,warning:hasWanted?'':`${d.label}인데 추천 ${AXIS_LABEL[wanted]}축의 실질 타점이 부족함`};
}

export function sustainGapForCombo(combo,p,megaName=''){
  const arr=combo.map(id=>({id,...wallBreakPressure(p,id,megaName)})).sort((a,b)=>b.score-a.score);
  const target=arr[0]?.sustain?.target;
  if(!target?.stallThreat)return null;
  const breakers=arr.filter(x=>x.sustain.canBreak);
  const controllers=arr.filter(x=>!x.sustain.canBreak&&x.sustain.canControl);
  const hasBreaker=breakers.length>0;
  const controlText=controllers.length?` ${controllers.map(x=>`${OWN[x.id].name}(${x.sustain.controlTool?.move})`).join('·')}은 일시 제어만 가능.`:'';
  const warning=hasBreaker
    ?breakers.length===1?`실질 돌파가 ${OWN[breakers[0].id].name} 한 마리에 집중됨`:''
    :`회복과 상태이상 누적을 넘는 지속 타점이 없음.${controlText}`;
  return{target,arr,breakers,controllers,hasBreaker,warning};
}

export function gradeBadge(g){return `<span class="grade g${g}">${GRADE_LABEL[g]}</span>`}

export class MatchupEngine{
  profile(...args){return profile(...args)}
  bestFor(...args){return bestFor(...args)}
  matchupGrade(...args){return matchupGrade(...args)}
  directGrade(...args){return directGrade(...args)}
  wallBreakPressure(...args){return wallBreakPressure(...args)}
  axisGap(...args){return axisGapForCombo(...args)}
  sustainGap(...args){return sustainGapForCombo(...args)}
}

export const matchupEngine=new MatchupEngine();

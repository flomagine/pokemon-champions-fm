import * as base from './defense-engine.js';

export * from './defense-engine.js';

const BELLIBOLT_DEFENSE=Object.freeze({
  kind:'specialWall',
  label:'특수막이＋회복·맹독',
  recommendation:'physical',
  confidence:'높음',
  nature:'차분 73.8%',
  ev:'HP31 / 방어4 / 특방28 / 스피드3 30.8%',
  updated:'2026-07-24 11:30 KST',
  note:'물붓기 93.7%, 게으름피우기 90.6%, 맹독 83.0%가 동시에 주류다. 물리축 보유 여부가 아니라 회복량을 넘는 물리 땅 타점이 있는지를 검사한다.',
  source:'OP.GG Pokémon Champions M-B 싱글 최신 표본'
});

export function defenseProfile(p,megaName=''){
  if(!megaName&&p.name==='찌리배리')return{...BELLIBOLT_DEFENSE};
  return base.defenseProfile(p,megaName);
}

export function defenseAxisText(p,megaName=''){
  const d=defenseProfile(p,megaName);
  const rec=d.recommendation==='physical'?'물리 공격 우선':d.recommendation==='special'?'특수 공격 우선':d.recommendation==='either'?'타입·기술 위력 우선':'공개 전 판단 보류';
  return `<span class="axisbadge ${base.axisClass(d)}">${d.label}</span><span class="axisbadge ${d.recommendation==='physical'?'axis-physical':d.recommendation==='special'?'axis-special':'axis-variable'}">${rec}</span><div class="axisdetail"><b>성격:</b> ${d.nature}<br><b>노력치:</b> ${d.ev}<br><b>신뢰:</b> ${d.confidence} · ${d.updated}<br>${d.note}</div>`;
}

export class DefenseEngine{
  profile(...args){return defenseProfile(...args)}
  axisMultiplier(...args){return base.axisMultiplier(...args)}
  axisClass(...args){return base.axisClass(...args)}
  describe(...args){return defenseAxisText(...args)}
}

export const defenseEngine=new DefenseEngine();

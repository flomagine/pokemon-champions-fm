import { DATA } from '../data/pokemon-data.js';
import { DEFENSE_META, DEFENSE_HINTS, MEGA_DEFENSE_META, AXIS_LABEL, MEGA_STATS_V43 } from '../data/meta-data.js';
import { battleTypes } from './type-system.js';

export function defenseProfile(p,megaName=''){
 const exact=(megaName&&MEGA_DEFENSE_META[megaName])||DEFENSE_META[p.name];if(exact)return{...exact,source:'OP.GG M-B 싱글 성격·노력치 또는 메가 수동 검증'};
 if(megaName&&typeof MEGA_STATS_V43!=='undefined'&&MEGA_STATS_V43[megaName]){
  const s=MEGA_STATS_V43[megaName],gap=s.def-s.spd,high=Math.max(s.def,s.spd),low=Math.min(s.def,s.spd);let kind='offense',label='공격형·분배 미확인',recommendation='either',note='성격·노력치 표본이 충분하지 않아 종족값만으로 막이 방향을 확정하지 않는다.';
  if(gap>=28&&s.def>=120){kind='physicalWall';label='종족값 물리내구 우세';recommendation='special';note='방어 종족값이 특방보다 크게 높다. 특수축을 약하게 우선하되 실제 노력치 공개 전 카운터로 단정하지 않는다.'}
  else if(gap<=-28&&s.spd>=120){kind='specialWall';label='종족값 특수내구 우세';recommendation='physical';note='특방 종족값이 방어보다 크게 높다. 물리축을 약하게 우선하되 실제 노력치 공개 전 카운터로 단정하지 않는다.'}
  else if(high>=110&&low>=100){kind='mixedWall';label='종족값 혼합내구';recommendation='either';note='양쪽 방어 종족값이 모두 높아 단일 공격축 보정보다 약점·화력·회복 여부를 우선한다.'}
  return{kind,label,recommendation,confidence:'낮음',nature:'랭크 성격 분배 미확인',ev:'랭크 노력치 분배 미확인',updated:'2026-07-20 종족값 확인',note:`${note} [HP ${s.hp} / 방어 ${s.def} / 특방 ${s.spd}]`,source:'Pokémon Champions 메가폼 종족값 기반 보수 판정'};
 }
 const raw=DATA.profiles[p.name],pattern=((raw&&raw.pattern)||''),tags=DATA.tags[p.name]||[];
 let kind='unknown',label='투자 방향 불명',recommendation='unknown',confidence='낮음',note='최신 성격·노력치 표본을 직접 확인하지 못했다. 공격 분류 보정을 주지 않고 타입·특성·공개 기술을 우선한다.';
 if(DEFENSE_HINTS.physicalWall.has(p.name)){kind='physicalWall';label='물리막이 추정';recommendation='special';note='회복·철벽·높은 방어 기반의 수동 프로필에서 추정. 최신 분배가 다를 수 있어 보정은 약하게 적용한다.'}
 else if(DEFENSE_HINTS.specialWall.has(p.name)){kind='specialWall';label='특수막이 추정';recommendation='physical';note='높은 특수내구·회복 기반의 수동 프로필에서 추정. 최신 분배가 다를 수 있어 보정은 약하게 적용한다.'}
 else if(DEFENSE_HINTS.mixedWall.has(p.name)){kind='mixedWall';label='혼합내구 추정';recommendation='either';note='물리·특수 어느 한쪽만으로 단정하지 않는다. 약점·회복 차단·트릭·앙코르를 함께 본다.'}
 else if(DEFENSE_HINTS.variable.has(p.name)){kind='variable';label='형태 혼재';recommendation='either';note='공격형·내구형 또는 물리·특수 형태가 공존한다. 첫 기술·도구·피해량 공개 전 축 보정 없음.'}
 else if(tags.some(x=>['physical','special','specialFire','fast','setup','cleanup'].includes(x))||/고화력|고속|공격형|물리형|특수형/.test(pattern)){kind='offense';label='공격형 추정';recommendation='either';note='내구 집중형으로 볼 근거가 약해 공격 분류보다 타입·속도·기합의띠를 우선한다.'}
 return{kind,label,recommendation,confidence,nature:'확정 표본 없음',ev:'확정 표본 없음',updated:'수동 추정',note,source:'프로필·역할 기반 보수 추정'};
}

export function axisMultiplier(def,cat){
 if(!cat||cat==='status'||def.recommendation==='either'||def.recommendation==='unknown')return 1;
 let strong=def.confidence==='높음'?1.28:def.confidence==='중간'?1.18:1.10,weak=def.confidence==='높음'?.72:def.confidence==='중간'?.82:.90;
 if(def.recommendation===cat)return strong;return weak;
}

export function axisClass(def){if(def.kind==='physicalWall')return'axis-special';if(def.kind==='specialWall')return'axis-physical';if(def.kind==='mixedWall')return'axis-mixed';if(def.kind==='variable'||def.kind==='offense')return'axis-variable';return'axis-unknown'}

export function defenseAxisText(p,megaName=''){
 let d=defenseProfile(p,megaName),rec=d.recommendation==='physical'?'물리 공격 우선':d.recommendation==='special'?'특수 공격 우선':d.recommendation==='either'?'타입·기술 위력 우선':'공개 전 판단 보류';
 return `<span class="axisbadge ${axisClass(d)}">${d.label}</span><span class="axisbadge ${d.recommendation==='physical'?'axis-physical':d.recommendation==='special'?'axis-special':'axis-variable'}">${rec}</span><div class="axisdetail"><b>성격:</b> ${d.nature}<br><b>노력치:</b> ${d.ev}<br><b>신뢰:</b> ${d.confidence} · ${d.updated}<br>${d.note}</div>`;
}


export class DefenseEngine {
  profile(...args){ return defenseProfile(...args); }
  axisMultiplier(...args){ return axisMultiplier(...args); }
  axisClass(...args){ return axisClass(...args); }
  describe(...args){ return defenseAxisText(...args); }
}
export const defenseEngine = new DefenseEngine();

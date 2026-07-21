import { DATA, OWN, ATTACK_MOVES, MEGA_TYPES } from '../data/pokemon-data.js';
import { ABILITY_DB, ABILITY_USAGE, MOVE_META, ABILITY_GROUPS, AXIS_LABEL } from '../data/meta-data.js';
import { battleTypes, eff } from './type-system.js';
import { defenseProfile, axisMultiplier } from './defense-engine.js';

export function abilityRecord(p){return ABILITY_DB[p.name]||{a:[]}}

export function abilityContext(p,megaName=''){
 const d=abilityRecord(p),base=(d.a||[]).map(x=>({id:x[0],name:x[1],slot:x[2],hidden:!!x[3]})),mega=d.m&&megaName&&d.m[megaName]?d.m[megaName].map(x=>({id:x[0],name:x[1],slot:x[2],hidden:!!x[3]})):null;
 let active=mega&&mega.length?mega:base,unknown=!!(megaName&&d.m&&d.m[megaName]&&!d.m[megaName].length),usage=ABILITY_USAGE[megaName]||ABILITY_USAGE[p.name]||null;
 if(usage){let ordered=[...active].sort((a,b)=>(usage[b.id]||0)-(usage[a.id]||0));if((usage[ordered[0]?.id]||0)>=70)active=ordered.slice(0,1)}
 return{base,active,entry:base,megaName:mega?megaName:'',unknown,usage}
}

export function abilityIds(ctx,key='active'){return new Set((ctx[key]||[]).map(a=>a.id))}

export function hasAbility(ctx,id,key='active'){return abilityIds(ctx,key).has(id)}

export function abilityNameList(arr,usage){return arr.map(a=>{let u=usage&&usage[a.id];return a.name+(u!=null?` ${u}%`:(a.hidden?'(숨특)':''))}).join(' · ')||'자료 없음'}

export function abilitySummary(p,megaName=''){let c=abilityContext(p,megaName),base=abilityNameList(c.base,ABILITY_USAGE[p.name]);if(c.megaName)return `진입 전 ${base} → ${c.megaName} 후 ${abilityNameList(c.active,ABILITY_USAGE[c.megaName])}${c.unknown?' (효과 미확인)':''}`;return `가능 특성: ${base}`}

export function plausibleAbilityIds(ctx){return abilityIds(ctx,'active')}

export function abilityMoveFactor(p,move,megaName=''){
 const meta=MOVE_META[move]||{},ctx=abilityContext(p,megaName),ids=plausibleAbilityIds(ctx);let f=1,reasons=[];
 const t=meta.type;if(!t)return{factor:1,reasons,blocked:false};
 if((t==='불꽃'&&[...ABILITY_GROUPS.fireImmune].some(x=>ids.has(x)))||(t==='물'&&[...ABILITY_GROUPS.waterImmune].some(x=>ids.has(x)))||(t==='풀'&&[...ABILITY_GROUPS.grassImmune].some(x=>ids.has(x)))||(t==='전기'&&[...ABILITY_GROUPS.electricImmune].some(x=>ids.has(x)))||(t==='땅'&&[...ABILITY_GROUPS.groundImmune].some(x=>ids.has(x))))return{factor:0,reasons:['특성으로 해당 타입 무효'],blocked:true};
 if(t==='불꽃'&&[...ABILITY_GROUPS.fireHalf].some(x=>ids.has(x))){f*=.5;reasons.push('불꽃 피해 1/2')}
 if(t==='얼음'&&[...ABILITY_GROUPS.iceHalf].some(x=>ids.has(x))){f*=.5;reasons.push('얼음 피해 1/2')}
 if(ids.has('dry-skin')&&t==='불꽃'){f*=1.25;reasons.push('건조피부로 불꽃 피해 증가')}
 if(ids.has('fluffy')){if(meta.contact){f*=.5;reasons.push('접촉 피해 1/2')}if(t==='불꽃'){f*=2;reasons.push('불꽃 피해 2배')}}
 if(meta.cat==='physical'&&ids.has('fur-coat')){f*=.5;reasons.push('물리 피해 1/2')}
 if(meta.cat==='special'&&ids.has('ice-scales')){f*=.5;reasons.push('특수 피해 1/2')}
 if(t==='고스트'&&ids.has('purifying-salt')){f*=.5;reasons.push('정화의소금으로 고스트 피해 1/2')}
 if(meta.ball&&ids.has('bulletproof'))return{factor:0,reasons:['방탄으로 구슬·폭탄 기술 무효'],blocked:true};
 if(meta.sound&&ids.has('soundproof'))return{factor:0,reasons:['방음으로 소리 기술 무효'],blocked:true};
 if(meta.priority&&[...ABILITY_GROUPS.priorityBlock].some(x=>ids.has(x)))return{factor:0,reasons:['우선기 차단'],blocked:true};
 if(meta.cat==='status'&&!meta.hazard&&ids.has('good-as-gold'))return{factor:0,reasons:['황금몸으로 대상 변화기 무효'],blocked:true};
 if(move==='앙코르'&&ids.has('aroma-veil'))return{factor:0,reasons:['아로마베일로 앙코르 무효'],blocked:true};
 if(move==='트릭'&&ids.has('sticky-hold'))return{factor:0,reasons:['점착으로 트릭·도구 이동 실패'],blocked:true};
 if((move==='앙코르'||move==='막말내뱉기'||move==='스텔스록')&&ids.has('magic-bounce'))return{factor:0,reasons:['매직미러로 변화기·함정 반사'],blocked:true};
 if(meta.flinch&&(ids.has('inner-focus')||ids.has('shield-dust')))reasons.push('풀죽음 효과 무효');
 return{factor:f,reasons,blocked:f===0}
}

export function moveAbilityScore(p,id,move,megaName=''){
 let meta=MOVE_META[move]||{},base=meta.type?eff(meta.type,battleTypes(p,megaName)):0,ab=abilityMoveFactor(p,move,megaName),score=base*ab.factor,ctx=abilityContext(p,megaName),ids=plausibleAbilityIds(ctx),def=defenseProfile(p,megaName);
 if(meta.type){let powerWeight=Math.pow((meta.power||85)/90,.38);score*=powerWeight;score*=axisMultiplier(def,meta.cat)}
 if(base>1&&[...ABILITY_GROUPS.superReduce].some(x=>ids.has(x)))score*=.75;if(ids.has('multiscale'))score*=.5;if((ids.has('sturdy')||ids.has('disguise'))&&!meta.multi)score=Math.min(score,1.75);
 let axisNote='';if(meta.cat==='physical'||meta.cat==='special'){if(def.recommendation===meta.cat)axisNote=`${def.label}: ${AXIS_LABEL[meta.cat]}축 우선`;else if(['physical','special'].includes(def.recommendation))axisNote=`${def.label}: 이 기술은 비추천 ${AXIS_LABEL[meta.cat]}축`}
 return{move,base,score,ab,meta,defense:def,axisNote}
}

export function bestAbilityMove(p,id,megaName=''){return (ATTACK_MOVES[id]||[]).map(x=>moveAbilityScore(p,id,x[0],megaName)).sort((a,b)=>b.score-a.score)[0]||{move:OWN[id].moves[0],base:1,score:1,ab:{reasons:[]},meta:{}}}

export function abilityImpact(p,megaName=''){
 const c=abilityContext(p,megaName),ids=plausibleAbilityIds(c),notes=[];
 if(ids.has('heatproof'))notes.push('내열: 불꽃 피해를 절반으로 줄여 불꽃 약점이 실전상 중립이 될 수 있음');
 if(ids.has('multiscale'))notes.push('멀티스케일: 풀피 첫 피해 절반, 원킬 전제 금지');
 if(ids.has('sturdy'))notes.push('옹골참: 풀피 원킬 불가');if(ids.has('disguise'))notes.push('탈: 첫 공격을 막음');
 if(ids.has('mold-breaker'))notes.push(megaName==='메가갸라도스'?'틀깨기: 부유 등 일부 방어 특성을 무시하지만 포챔스의 메가갸라도스 대 따라큐에서는 탈을 무시하지 않는 것으로 별도 처리':'틀깨기: 부유·두꺼운지방 등 방어 특성을 무시하며, 탈 상호작용은 포챔스 예외 규칙을 별도 적용');
 if(ids.has('spicy-spray'))notes.push('하바네로분출: 접촉 여부와 무관하게 공격으로 피해를 주면 공격자가 화상');
 if(ids.has('parental-bond'))notes.push('부자유친: 2회 타격(챔피언스에서는 두 번째 타격 25%)으로 기합의띠·탈 보험을 붕괴');
 if([...ABILITY_GROUPS.intimidateImmune].some(x=>ids.has(x))||[...ABILITY_GROUPS.intimidateImmune].some(x=>abilityIds(c,'entry').has(x)))notes.push('위협 무효 가능');
 if([...ABILITY_GROUPS.statDropPunish].some(x=>ids.has(x)))notes.push('능력 하락을 역이용하므로 위협·막말내뱉기 위험');
 if([...ABILITY_GROUPS.statDropImmune].some(x=>ids.has(x)))notes.push('능력 하락 무효/반사 가능');
 if(ids.has('good-as-gold'))notes.push('황금몸: 앙코르·트릭·막말내뱉기 등 변화기 차단');if(ids.has('magic-bounce'))notes.push('매직미러: 변화기·함정 반사');
 if(ids.has('shadow-tag'))notes.push('그림자밟기: 고스트 이외 교체 봉쇄');if(ids.has('arena-trap'))notes.push('개미지옥: 땅에 붙은 포켓몬 교체 봉쇄');
 if([...ABILITY_GROUPS.contactPunish].some(x=>ids.has(x)))notes.push('접촉 시 반동·화상·마비·독·스피드 저하 가능');
 if(ids.has('unaware'))notes.push('천진: 칼춤·스케일샷 등 랭크업 돌파력 무시');if(ids.has('stamina'))notes.push('지구력: 맞을 때마다 방어 상승, 물리 연타 장기전 불리');
 if(ids.has('intimidate'))notes.push('위협: 등장 시 우리 물리 공격수의 공격 하락');if(ids.has('scrappy'))notes.push('배짱: 노말·격투 기술이 고스트에 명중하고 위협을 무효화');
 if(ids.has('pixilate'))notes.push('페어리스킨: 노말 기술을 페어리로 바꾸고 강화');if(ids.has('refrigerate'))notes.push('프리즈스킨: 노말 기술을 얼음으로 바꾸고 강화');if(ids.has('liquid-voice'))notes.push('촉촉보이스: 소리 기술을 물 타입으로 변경');
 if(ids.has('huge-power')||ids.has('pure-power'))notes.push('공격 실수치 2배 계열—일반 물리내구 기준을 한 단계 엄격하게 적용');if(ids.has('adaptability'))notes.push('적응력: 자속 보정 강화');
 if(ids.has('prankster'))notes.push('짓궂은마음: 변화기 우선도 상승');if(ids.has('no-guard'))notes.push('노가드: 양쪽 기술이 필중');if(ids.has('imposter'))notes.push('괴짜: 등장 즉시 현재 포켓몬으로 변신');
 if(ids.has('trace'))notes.push('트레이스: 우리 특성을 복사할 수 있어 대면별 재판정 필요');if(ids.has('zero-to-hero'))notes.push('마이티체인지: 한 번 교체 후 히어로폼으로 강화');if(ids.has('opportunist'))notes.push('편승: 우리 랭크 상승을 복사');
 if(ids.has('cloud-nine'))notes.push('날씨부정: 비·쾌청·모래·눈 효과 무효화');if(ids.has('screen-cleaner'))notes.push('배리어프리: 양쪽 벽 제거');if(ids.has('infiltrator'))notes.push('틈새포착: 대타·벽을 무시');
 if(ids.has('regenerator'))notes.push('재생력: 교체할 때 HP 회복, 단발성 칩만으로 처리하기 어려움');if(ids.has('poison-heal'))notes.push('포이즌힐: 독 상태라면 매턴 회복');if(ids.has('magic-guard'))notes.push('매직가드: 직접 공격 외 피해 무효');
 if(ids.has('sticky-hold'))notes.push('점착: 트릭·탁쳐서떨구기 등 도구 제거/교환 제한');if(ids.has('unnerve'))notes.push('긴장감: 우리 초나열매·자뭉열매 발동 봉쇄');
 if(ids.has('mummy')||ids.has('wandering-spirit'))notes.push('접촉 시 우리 특성을 미라/떠도는영혼으로 변경 가능');if(ids.has('battle-armor')||ids.has('shell-armor'))notes.push('급소 무효—섀도클로 급소 플랜 제외');
 if(ids.has('shield-dust'))notes.push('인분: 속이기 풀죽음 등 공격기의 추가 효과 차단');if(ids.has('inner-focus'))notes.push('정신력: 풀죽음과 위협 무효');
 if(ids.has('mega-sol'))notes.push('메가솔라: 날씨와 무관하게 기술을 강한 햇빛처럼 사용');if(ids.has('piercing-drill'))notes.push('관통드릴: 접촉 기술이 방어 효과를 관통해 본래 피해의 1/4을 주므로 방어를 완전 무피해 수단으로 계산하지 않음');if(ids.has('electric-surge'))notes.push('일렉트릭메이커: 등장 시 일렉트릭필드, 전기 기술 강화와 지면 포켓몬 수면 방지');if(ids.has('dragon-skin'))notes.push('드래곤스킨: 노말 기술을 드래곤으로 바꾸고 1.2배 강화');if(ids.has('sky-high'))notes.push('천정부지: 땅 기술·지면 함정 무효, 상대를 쓰러뜨리면 가장 높은 능력 +1');if(ids.has('fire-mane'))notes.push('불꽃의갈기: 불꽃 기술 1.5배 강화');if(ids.has('water-bubble'))notes.push('수포: 물 기술 강화·불꽃 피해 반감·화상 방지');
 if(['friend-guard','healer','telepathy','symbiosis','receiver'].some(x=>ids.has(x)))notes.push('더블 중심 특성으로 챔피언스 싱글에서는 직접 효과가 없거나 매우 제한적');
 if(ids.has('toxic-debris'))notes.push('독치장: 물리 공격 시 독압정 전개 가능');if(ids.has('illusion'))notes.push('일루전: 선봉·대면 예측 신뢰도 하락');
 if(c.unknown)notes.push(`${c.megaName} 특성 효과 미확인—고신뢰 판정 금지`);
 return notes.length?notes.join(' / '):'현재 우리 6마리의 핵심 대면 계산을 직접 뒤집는 특성 효과는 없음'
}

export function applyAbilityMatchup(p,id,m,megaName=''){
 let out={...m},ctx=abilityContext(p,megaName),ids=plausibleAbilityIds(ctx),entryIds=abilityIds(ctx,'entry'),best=bestAbilityMove(p,id,megaName),original=MOVE_META[out.move]?moveAbilityScore(p,id,out.move,megaName):null,notes=[],def=defenseProfile(p,megaName);
 if(best.move&&(!original||best.score>original.score+.18)){out.move=best.move;notes.push(`타입·특성·내구축 반영 추천기 ${best.move}`)}if(best.axisNote)notes.push(best.axisNote);if(def.kind==='variable')notes.push('물리/특수 투자 혼재—피해량 확인 전 단정 금지');
 if(original&&original.ab.reasons.length)notes.push(original.ab.reasons.join('·'));
 let baseBest=Math.max(...(ATTACK_MOVES[id]||[]).map(x=>eff(x[1],battleTypes(p,megaName))),1),abilityBest=best.score;
 if(abilityBest===0)out.grade=Math.min(out.grade,1);else if(baseBest>=2&&abilityBest<1.75)out.grade=Math.max(0,out.grade-1);
 if([...ABILITY_GROUPS.fullShield].some(x=>ids.has(x))||[...ABILITY_GROUPS.oneHit].some(x=>ids.has(x))){out.grade=Math.max(1,out.grade-1);notes.push('풀피 1회 생존 특성 때문에 즉시 처리 등급 하향')}
 if(id==='incin'){
   if([...ABILITY_GROUPS.statDropPunish].some(x=>ids.has(x))){out.grade=Math.min(out.grade,1);out.move=best.move||'플레어드라이브';notes.push('위협·막말내뱉기 금지')}
   else if([...ABILITY_GROUPS.intimidateImmune].some(x=>ids.has(x))||[...ABILITY_GROUPS.intimidateImmune].some(x=>entryIds.has(x))){out.grade=Math.max(0,out.grade-1);notes.push('진입 전 특성으로 위협이 통하지 않음')}
   if([...ABILITY_GROUPS.statDropImmune].some(x=>ids.has(x))||ids.has('good-as-gold')||ids.has('soundproof'))notes.push('막말내뱉기 실패 가능');
 }
 if(ids.has('parental-bond')||ids.has('skill-link')){if(id==='garchomp'||id==='mimi'){out.grade=Math.min(out.grade,1);notes.push('다단 타격으로 기합의띠·탈 보험 불성립')}}
 if(ids.has('mold-breaker')){if(id==='rotomh'){out.grade=Math.min(out.grade,2);notes.push('틀깨기로 부유 무시 가능')}if(id==='mimi'&&megaName!=='메가갸라도스'){out.grade=Math.min(out.grade,1);notes.push('틀깨기로 탈 무시 가능')}if(id==='mimi'&&megaName==='메가갸라도스'){notes.push('포챔스 예외: 메가갸라도스의 틀깨기는 따라큐의 탈을 무시하지 않는 것으로 처리')}if(id==='venusaur')notes.push('틀깨기로 두꺼운지방 무시 가능')}
 if(ids.has('unaware')&&(id==='mimi'||id==='garchomp')){out.grade=Math.max(0,out.grade-1);notes.push('랭크업 승리 플랜 무효화')}
 if(ids.has('stamina')&&['garchomp','mimi','incin'].includes(id)){out.grade=Math.max(0,out.grade-1);notes.push('물리 타격마다 방어 상승')}
 if(ids.has('armor-tail')||ids.has('queenly-majesty')||ids.has('dazzling')){if(['mimi','prim','incin'].includes(id))notes.push('야습·아쿠아제트·속이기 차단 가능')}
 if(ids.has('flame-body')||ids.has('static')||ids.has('poison-point')||ids.has('effect-spore')||ids.has('rough-skin')){if((MOVE_META[out.move]||{}).contact)notes.push('접촉기 사용 시 상태이상·반동 위험')}
 if(ids.has('spicy-spray')&&(MOVE_META[out.move]||{}).type){notes.push('피해를 주면 하바네로분출로 화상');if((MOVE_META[out.move]||{}).cat==='physical'){out.grade=Math.max(0,out.grade-1);notes.push('첫 타 이후 물리 화력 저하')}}
 if(ids.has('intimidate')&&['garchomp','mimi','incin'].includes(id)){out.grade=Math.max(0,out.grade-1);notes.push('상대 위협으로 우리 물리 화력 하락')}
 if(ids.has('scrappy')&&id==='mimi'){out.grade=Math.min(out.grade,2);notes.push('배짱으로 따라큐의 노말·격투 면역이 성립하지 않음')}
 if((ids.has('huge-power')||ids.has('pure-power'))&&['venusaur','incin','prim'].includes(id)){out.grade=Math.max(0,out.grade-1);notes.push('공격 실수치 2배를 고려해 물리 후출 등급 하향')}
 if(ids.has('opportunist')&&(id==='mimi'||id==='garchomp')){out.grade=Math.max(0,out.grade-1);notes.push('편승으로 랭크 상승을 복사')}
 if(ids.has('magic-bounce')&&['rotomh','prim','incin','garchomp'].includes(id))notes.push('앙코르·막말내뱉기·스텔스록 반사 주의');
 if(ids.has('cursed-body'))notes.push('피격 후 사용 기술 봉인 가능');if(ids.has('weak-armor'))notes.push('물리 피격 뒤 스피드 상승 가능');if(ids.has('electromorphosis'))notes.push('한 번 맞으면 다음 전기 기술 2배');
 if(ids.has('unnerve')&&(id==='prim'||id==='incin')){out.grade=Math.max(0,out.grade-1);notes.push(id==='prim'?'긴장감으로 초나열매 발동 불가':'긴장감으로 자뭉열매 발동 불가')}
 if((ids.has('inner-focus')||ids.has('shield-dust'))&&id==='incin'&&out.move==='속이기'){out.move='DD래리어트';notes.push('속이기 풀죽음이 통하지 않아 직접 공격으로 변경')}
 if((ids.has('mummy')||ids.has('wandering-spirit'))&&(MOVE_META[out.move]||{}).contact)notes.push('접촉 후 우리 특성이 변경될 수 있음');
 if((ids.has('battle-armor')||ids.has('shell-armor'))&&out.move==='섀도클로')notes.push('급소 보정은 무효');
 if(ctx.unknown)out.grade=Math.min(out.grade,3);
 if(notes.length)out.note=`[특성] ${notes.join(' / ')}. ${out.note||''}`;
 out.entry=out.grade>=4?'후출 가능':out.grade===3?'선대면만':out.grade===2?'복수 처리':out.grade===1?'비상용':'후출 금지';
 return out
}

export function canSwitchOutAgainst(p,id,megaName=''){let c=abilityContext(p,megaName),ids=plausibleAbilityIds(c),own=OWN[id];if(ids.has('shadow-tag')&&!own.types.includes('고스트'))return false;if(ids.has('arena-trap')&&!own.types.includes('비행')&&!own.traits.includes('groundImmune'))return false;if(ids.has('magnet-pull')&&own.types.includes('강철'))return false;return true}

export function abilityThreatBonus(p,megaName=''){let ids=plausibleAbilityIds(abilityContext(p,megaName)),v=0;if([...ABILITY_GROUPS.offense].some(x=>ids.has(x)))v+=1.0;if([...ABILITY_GROUPS.weatherSpeed].some(x=>ids.has(x)))v+=.8;if([...ABILITY_GROUPS.weather].some(x=>ids.has(x)))v+=.55;if(ids.has('shadow-tag')||ids.has('arena-trap'))v+=1.1;if(ids.has('illusion'))v+=.45;if(ids.has('parental-bond'))v+=1.2;if(ids.has('mold-breaker'))v+=.65;return v}

export function abilityLeadMultiplier(p,megaName=''){let ids=plausibleAbilityIds(abilityContext(p,megaName)),v=1;if([...ABILITY_GROUPS.weather].some(x=>ids.has(x)))v*=1.45;if(ids.has('prankster'))v*=1.22;if(ids.has('toxic-debris'))v*=1.12;if(ids.has('supersweet-syrup'))v*=1.08;if(ids.has('illusion'))v*=1.08;return v}


export class AbilityEngine {
  context(...args){ return abilityContext(...args); }
  summary(...args){ return abilitySummary(...args); }
  impact(...args){ return abilityImpact(...args); }
  moveFactor(...args){ return abilityMoveFactor(...args); }
  bestMove(...args){ return bestAbilityMove(...args); }
  applyMatchup(...args){ return applyAbilityMatchup(...args); }
  canSwitchOut(...args){ return canSwitchOutAgainst(...args); }
}
export const abilityEngine = new AbilityEngine();

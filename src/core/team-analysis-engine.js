import { DATA, OWN, IDS, ATTACK_MOVES } from '../data/pokemon-data.js';
import { MOVE_META } from '../data/meta-data.js';
import { defenseProfile } from './defense-engine.js';
import { sustainProfile } from './stall-engine.js';
import { abilityContext, plausibleAbilityIds } from './ability-engine.js';
import { profile, matchupGrade, directGrade, wallBreakPressure, sustainGapForCombo } from './matchup-engine-v2.js';
import { ROLE_LABELS, ROLE_MOVES, EXACT_ROLE_SNAPSHOTS, ARCHETYPE_LABELS, ROLE_WEIGHTS } from '../data/team-archetype-data.js';

const clamp=(value,min=0,max=1)=>Math.max(min,Math.min(max,value));
const hasMove=(moves,set)=>moves.some(move=>set.has(move));
const namesOf=rows=>rows.map(row=>row.p.name);
const roleCount=(rows,role,threshold=.55)=>rows.filter(row=>(row.roles[role]||0)>=threshold).length;
const roleSum=(rows,role)=>rows.reduce((sum,row)=>sum+(row.roles[role]||0),0);

function mergedMoves(p,megaName=''){
  const exact=EXACT_ROLE_SNAPSHOTS[megaName]||EXACT_ROLE_SNAPSHOTS[p.name];
  const pr=profile(p,megaName);
  const sustain=sustainProfile(p,megaName);
  return [...new Set([...(exact?.moves||[]),...(pr.commonMoves||[]),...(sustain.moves||[])])];
}

function addRole(roles,evidence,role,score,reason){
  if(score<=0)return;
  roles[role]=Math.max(roles[role]||0,clamp(score));
  if(reason)evidence.push({role,score:roles[role],reason});
}

export function inferPokemonRoles(p,megaName=''){
  const roles={};
  const evidence=[];
  const exact=EXACT_ROLE_SNAPSHOTS[megaName]||EXACT_ROLE_SNAPSHOTS[p.name];
  const moves=mergedMoves(p,megaName);
  const tags=DATA.tags[p.name]||[];
  const def=defenseProfile(p,megaName);
  const sustain=sustainProfile(p,megaName);
  const abilities=plausibleAbilityIds(abilityContext(p,megaName));
  if(exact)for(const [role,score] of Object.entries(exact.roles||{}))addRole(roles,evidence,role,score,`최신 표본: ${exact.note}`);
  if(def.kind==='physicalWall')addRole(roles,evidence,'physicalWall',def.confidence==='높음'?.9:.68,def.label);
  if(def.kind==='specialWall')addRole(roles,evidence,'specialWall',def.confidence==='높음'?.9:.68,def.label);
  if(def.kind==='mixedWall')addRole(roles,evidence,'mixedWall',def.confidence==='높음'?.88:.66,def.label);
  if(sustain.stallThreat)addRole(roles,evidence,'recoveryWall',Math.max(.65,sustain.reliableRate),`회복 부하 ${sustain.recoveryLoad.toFixed(2)}`);
  if(hasMove(moves,ROLE_MOVES.status)||sustain.statusRate>=.4)addRole(roles,evidence,'statusSpreader',Math.max(.55,sustain.statusRate),moves.filter(x=>ROLE_MOVES.status.has(x)).join('·'));
  if(hasMove(moves,ROLE_MOVES.sleep))addRole(roles,evidence,'sleepForcer',.78,moves.filter(x=>ROLE_MOVES.sleep.has(x)).join('·'));
  if(hasMove(moves,ROLE_MOVES.hazards)||tags.includes('hazard'))addRole(roles,evidence,'hazardSetter',tags.includes('hazard')?.82:.68,moves.filter(x=>ROLE_MOVES.hazards.has(x)).join('·'));
  if(hasMove(moves,ROLE_MOVES.removal))addRole(roles,evidence,'hazardRemover',.78,moves.filter(x=>ROLE_MOVES.removal.has(x)).join('·'));
  if(hasMove(moves,ROLE_MOVES.pivot)||tags.includes('pivot'))addRole(roles,evidence,'pivot',tags.includes('pivot')?.78:.65,moves.filter(x=>ROLE_MOVES.pivot.has(x)).join('·'));
  if(abilities.has('regenerator'))addRole(roles,evidence,'regenerator',.92,'재생력');
  if(hasMove(moves,ROLE_MOVES.trap)||abilities.has('shadow-tag')||abilities.has('arena-trap'))addRole(roles,evidence,'trapper',(abilities.has('shadow-tag')||abilities.has('arena-trap'))?.95:.68,'교체 억제');
  if(hasMove(moves,ROLE_MOVES.antiSetup)||abilities.has('unaware'))addRole(roles,evidence,'antiSetup',abilities.has('unaware')?.94:.72,moves.filter(x=>ROLE_MOVES.antiSetup.has(x)).join('·')||'천진');
  if(hasMove(moves,ROLE_MOVES.phaze))addRole(roles,evidence,'phazer',.78,moves.filter(x=>ROLE_MOVES.phaze.has(x)).join('·'));
  if(hasMove(moves,ROLE_MOVES.protect))addRole(roles,evidence,'protector',.64,moves.filter(x=>ROLE_MOVES.protect.has(x)).join('·'));
  if(hasMove(moves,ROLE_MOVES.cleric))addRole(roles,evidence,'cleric',.72,moves.filter(x=>ROLE_MOVES.cleric.has(x)).join('·'));
  if(hasMove(moves,ROLE_MOVES.itemControl))addRole(roles,evidence,'itemControl',.68,moves.filter(x=>ROLE_MOVES.itemControl.has(x)).join('·'));
  if(hasMove(moves,ROLE_MOVES.setup)||tags.includes('setup'))addRole(roles,evidence,'setupWincon',tags.includes('setup')?.8:.62,moves.filter(x=>ROLE_MOVES.setup.has(x)).join('·'));
  if(hasMove(moves,ROLE_MOVES.screens))addRole(roles,evidence,'screenSetter',.9,moves.filter(x=>ROLE_MOVES.screens.has(x)).join('·'));
  if(hasMove(moves,ROLE_MOVES.weather)||tags.includes('weather'))addRole(roles,evidence,'weatherSetter',.8,moves.filter(x=>ROLE_MOVES.weather.has(x)).join('·'));
  if(p.types.includes('고스트'))addRole(roles,evidence,'spinBlocker',.55,'고스트 타입');
  if(tags.includes('physical'))addRole(roles,evidence,'physicalBreaker',.72,'물리 공격형 태그');
  if(tags.includes('special')||tags.includes('specialFire'))addRole(roles,evidence,'specialBreaker',.72,'특수 공격형 태그');
  if(tags.includes('fast')||tags.includes('priority'))addRole(roles,evidence,'revengeKiller',.68,'스피드·우선기 태그');
  const confidence=exact?.confidence||((Object.keys(roles).length>=3&&profile(p,megaName).precision==='최신 검증')?'중간':'낮음');
  return{p,megaName,roles,evidence,moves,defense:def,sustain,confidence,updated:exact?.updated||'프로필·기술 기반 추론',note:exact?.note||''};
}

function archetypeScores(rows){
  const rec=roleSum(rows,'recoveryWall'),walls=roleSum(rows,'physicalWall')+roleSum(rows,'specialWall')+roleSum(rows,'mixedWall');
  const status=roleSum(rows,'statusSpreader')+roleSum(rows,'sleepForcer')*.65;
  const hazard=roleSum(rows,'hazardSetter'),remove=roleSum(rows,'hazardRemover'),regen=roleSum(rows,'regenerator');
  const anti=roleSum(rows,'antiSetup')+roleSum(rows,'phazer')*.55,cleric=roleSum(rows,'cleric'),trap=roleSum(rows,'trapper');
  const setup=roleSum(rows,'setupWincon'),breakers=roleSum(rows,'physicalBreaker')+roleSum(rows,'specialBreaker'),revenge=roleSum(rows,'revengeKiller');
  const pivot=roleSum(rows,'pivot'),screen=roleSum(rows,'screenSetter'),weather=roleSum(rows,'weatherSetter');
  const recN=roleCount(rows,'recoveryWall'),wallN=rows.filter(r=>Math.max(r.roles.physicalWall||0,r.roles.specialWall||0,r.roles.mixedWall||0)>=.55).length;
  const scores={
    fullStall:recN>=2?rec*2.8+walls*1.35+status*1.5+anti+cleric+regen*.8+trap*.5-breakers*.75-setup*.45:-8,
    semiStall:recN>=2?rec*2+walls+status+anti*.7+setup*1.3+breakers*.45:-5,
    regenStall:regen>=1.4?regen*2.7+rec*1.8+pivot+status+walls*.7:-6,
    hazardStall:hazard>=.6&&recN>=1?hazard*2.1+status*1.25+roleSum(rows,'phazer')*1.4+trap+rec+walls*.55:-5,
    bulkyBalance:wallN>=2?walls*1.25+pivot+breakers+setup*.7+rec*.6+remove*.4:-2,
    pivotBalance:pivot>=1.1?pivot*2+breakers+walls*.65+regen*.7:-2,
    hazardOffense:hazard>=.6?hazard*2+setup+breakers+revenge+roleSum(rows,'spinBlocker')*.5-rec*.4:-3,
    screenOffense:screen>=.6?screen*2.5+setup*1.5+breakers+revenge:-5,
    weatherOffense:weather>=.6?weather*2.5+setup+breakers+revenge:-5,
    hyperOffense:setup*1.6+breakers+revenge*1.2-walls*.35-rec*.6,
    standardBalance:2+walls*.55+pivot*.45+breakers*.55+setup*.4
  };
  return{scores,features:{rec,walls,status,hazard,remove,regen,anti,cleric,trap,setup,breakers,revenge,pivot,screen,weather,recN,wallN}};
}

function complementaryPairs(rows){
  const edges=[];
  for(let i=0;i<rows.length;i++)for(let j=i+1;j<rows.length;j++){
    const a=rows[i],b=rows[j];
    let weight=0,reasons=[];
    if((a.roles.physicalWall||0)>=.55&&(b.roles.specialWall||0)>=.55||(b.roles.physicalWall||0)>=.55&&(a.roles.specialWall||0)>=.55){weight+=2;reasons.push('물리·특수 막이 보완')}
    if((a.roles.statusSpreader||0)>=.55&&(b.roles.protector||0)>=.5||(b.roles.statusSpreader||0)>=.55&&(a.roles.protector||0)>=.5){weight+=1.2;reasons.push('상태이상＋방어 턴')}
    if((a.roles.hazardSetter||0)>=.55&&((b.roles.phazer||0)>=.55||(b.roles.trapper||0)>=.55)||(b.roles.hazardSetter||0)>=.55&&((a.roles.phazer||0)>=.55||(a.roles.trapper||0)>=.55)){weight+=1.5;reasons.push('함정＋강제 교체')}
    if((a.roles.regenerator||0)>=.55&&(b.roles.pivot||0)>=.55||(b.roles.regenerator||0)>=.55&&(a.roles.pivot||0)>=.55){weight+=1.25;reasons.push('재생력＋피벗')}
    if((a.roles.cleric||0)>=.55&&Math.max(b.roles.recoveryWall||0,b.roles.physicalWall||0,b.roles.specialWall||0)>=.55||(b.roles.cleric||0)>=.55&&Math.max(a.roles.recoveryWall||0,a.roles.physicalWall||0,a.roles.specialWall||0)>=.55){weight+=1;reasons.push('희망사항·치유 지원')}
    if((a.roles.antiSetup||0)>=.55&&(b.roles.recoveryWall||0)>=.55||(b.roles.antiSetup||0)>=.55&&(a.roles.recoveryWall||0)>=.55){weight+=1.1;reasons.push('랭크업 차단으로 막이 보호')}
    if(weight)edges.push({a:a.p.name,b:b.p.name,weight,reasons});
  }
  return edges.sort((a,b)=>b.weight-a.weight);
}

function centrality(rows,edges,model){
  return rows.map(row=>{
    let score=Object.entries(row.roles).reduce((sum,[role,value])=>sum+(ROLE_WEIGHTS[role]||.45)*value,0);
    score+=edges.filter(edge=>edge.a===row.p.name||edge.b===row.p.name).reduce((sum,edge)=>sum+edge.weight*.65,0);
    score+=(model?.probs?.[row.p.name]||0)*2.5;
    if((row.roles.antiSetup||0)>=.55)score+=.7;
    if((row.roles.hazardSetter||0)>=.55)score+=.55;
    return{...row,centrality:score};
  }).sort((a,b)=>b.centrality-a.centrality);
}

function roleText(row){
  const roles=Object.entries(row.roles).filter(([,score])=>score>=.55).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([role])=>ROLE_LABELS[role]).join('·');
  return `${row.p.name}(${roles||'역할 불명'})`;
}

function genericBreakPrinciples(primary,features,keyTargets){
  const targets=keyTargets.slice(0,3).map(x=>x.p.name).join(' → ');
  const principles=[];
  if(['fullStall','semiStall','regenStall','hazardStall'].includes(primary))principles.push('약한 칩을 분산하지 말고 한 포켓몬을 집중해 회복 루프를 끊는다');
  if(features.regen>=1.2)principles.push('재생력 코어에는 단발성 피해보다 스텔스록·교체 제한·연속 압박이 필요하다');
  if(features.hazard>=.6)principles.push('제거 수단이 없는 우리 파티는 불필요한 교체를 줄이고 함정 설치자를 초반에 압박한다');
  if(features.status>=1)principles.push('맹독·화상·하품을 맞으며 장기전하지 말고 트릭·앙코르 또는 즉시 화력으로 턴 수를 줄인다');
  if(features.anti>=.6)principles.push('흑안개·천진·날려버리기 담당이 남아 있으면 따라큐 칼춤을 승리축으로 확정하지 않는다');
  return{targets,principles};
}

export function analyzeEnemyTeam(team,megaName='',model=null){
  const rows=team.map(p=>inferPokemonRoles(p,(DATA.megaOptions[p.name]||[]).includes(megaName)?megaName:''));
  const {scores,features}=archetypeScores(rows);
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  const primary=ranked[0][0],secondary=ranked.slice(1,3).filter(([,score])=>score>0).map(([key])=>key);
  const edges=complementaryPairs(rows);
  const keyTargets=centrality(rows,edges,model);
  const gap=ranked[0][1]-(ranked[1]?.[1]||0);
  const confidence=gap>=3?'높음':gap>=1.2?'중간':'낮음';
  const {targets,principles}=genericBreakPrinciples(primary,features,keyTargets);
  const roleSummary=keyTargets.slice(0,5).map(roleText).join(' / ');
  const note=`<b>역할 구조:</b> ${roleSummary}<br><b>해체 우선순위:</b> ${targets||'역할 공개 후 결정'}<br><b>파훼 원칙:</b> ${principles.join(' · ')||'개별 대면과 선봉 복구를 우선'}<br><small>아키타입 신뢰 ${confidence}; 역할이 불명확한 포켓몬은 확정하지 않습니다.</small>`;
  return{primary,name:ARCHETYPE_LABELS[primary],secondary:secondary.map(key=>ARCHETYPE_LABELS[key]),scores,features,rows:keyTargets,edges,keyTargets,confidence,note,principles};
}

export function ownToolProfile(id){
  const own=OWN[id],moves=own.moves||[],attacks=(ATTACK_MOVES[id]||[]).map(([move])=>MOVE_META[move]||{});
  return{
    id,name:own.name,moves,traits:own.traits||[],types:own.types||[],
    physical:attacks.some(meta=>meta.cat==='physical'),special:attacks.some(meta=>meta.cat==='special'),
    denial:moves.filter(move=>ROLE_MOVES.itemControl.has(move)||move==='앙코르'||move==='도발'),
    hazard:moves.filter(move=>ROLE_MOVES.hazards.has(move)),removal:moves.filter(move=>ROLE_MOVES.removal.has(move)),
    pivot:moves.filter(move=>ROLE_MOVES.pivot.has(move)),setup:moves.filter(move=>ROLE_MOVES.setup.has(move)),
    toxicImmune:(own.types||[]).some(type=>type==='독'||type==='강철')
  };
}

function bestMissionOwner(enemy,combo,megaName,role){
  return combo.map(id=>{
    const bp=wallBreakPressure(enemy.p,id,megaName),grade=matchupGrade(enemy.p,id,megaName),tools=ownToolProfile(id);
    let score=grade*1.2+bp.score;
    if(role==='recoveryWall'&&tools.denial.length)score+=1.2;
    if(role==='physicalWall'&&bp.cat==='special')score+=1.1;
    if(role==='specialWall'&&bp.cat==='physical')score+=1.1;
    if(role==='hazardSetter'&&directGrade(enemy.p,id,megaName)>=3)score+=.8;
    if(role==='statusSpreader'&&(tools.toxicImmune||tools.denial.length))score+=.8;
    return{id,score,bp,grade,tools};
  }).sort((a,b)=>b.score-a.score)[0];
}

function primaryRole(row){
  return Object.entries(row.roles).sort((a,b)=>b[1]-a[1])[0]?.[0]||'unknown';
}

export function statusPlanFor(row,tools,hasDenial=false){
  const moves=row.moves||[],typeControl=(row.sustain?.typeControlRate||0)>=.5;
  const toxic=moves.some(move=>['맹독','독가루','독압정'].includes(move));
  const burn=moves.some(move=>['도깨비불','열탕'].includes(move));
  const sleep=moves.some(move=>['하품','수면가루','버섯포자','최면술'].includes(move));
  const paralysis=moves.some(move=>['전기자석파','뱀눈초리'].includes(move));
  const hasPivot=tools.some(tool=>(tool.pivot||[]).length);
  const toxicCovered=tools.some(tool=>tool.toxicImmune)&&!typeControl;
  const burnCovered=tools.some(tool=>(tool.types||[]).includes('불꽃')||tool.special);
  const paralysisCovered=tools.some(tool=>(tool.types||[]).includes('전기')||(tool.types||[]).includes('땅'));
  let severity=0;const reasons=[];
  if(toxic&&!toxicCovered&&!hasDenial){severity+=3;reasons.push(typeControl?'타입 변경 뒤 맹독에 노출':'맹독 내성·제어 수단 없음')}
  if(sleep&&!hasDenial){if(hasPivot){severity+=1.1;reasons.push('피벗으로 수면은 피하지만 함정·교체 손해가 누적')}else{severity+=3;reasons.push('하품·수면 강제교체를 끊을 수단 없음')}}
  if(burn&&!burnCovered&&!hasDenial){severity+=2.5;reasons.push('화상으로 물리 돌파축이 무력화')}
  if(paralysis&&!paralysisCovered&&!hasDenial){severity+=1.8;reasons.push('마비 속도 제어 대책 없음')}
  const covered=severity<2.5,partial=severity>0&&covered;
  return{covered,partial,severity,reason:reasons.join(' · ')||'상태이상 대응 가능',toxic,burn,sleep,paralysis,typeControl};
}

export function evaluateTeamCounterPlan(team,combo,lead,model,megaName=''){
  const analysis=model?.teamAnalysis||analyzeEnemyTeam(team,megaName,model);
  const tools=combo.map(ownToolProfile),hasRemoval=tools.some(x=>x.removal.length),hasHazard=tools.some(x=>x.hazard.length),hasDenial=tools.some(x=>x.denial.length);
  let penalty=0,reward=0;
  const warnings=[],hardGaps=[],missions={};combo.forEach(id=>missions[id]=[]);
  const priority=[];
  for(const row of analysis.rows){
    const prob=model?.probs?.[row.p.name]??1/team.length;
    if(prob<.12)continue;
    const mega=(DATA.megaOptions[row.p.name]||[]).includes(megaName)?megaName:'';
    let targetPriority=row.centrality||0;
    if((row.roles.recoveryWall||0)>=.55){
      const gap=sustainGapForCombo(combo,row.p,mega);
      if(gap&&!gap.hasBreaker){penalty+=prob*(analysis.confidence==='높음'?13:9);hardGaps.push(`${row.p.name}: 회복 루프를 넘는 실질 돌파 없음`);warnings.push(`${row.p.name}: ${gap.warning}`);targetPriority+=4}
      else if(gap?.breakers.length===1){penalty+=prob*2.2;warnings.push(`${row.p.name}: ${gap.warning}`);targetPriority+=2}
      else if(gap?.hasBreaker){reward+=prob*2.2}
    }
    if((row.roles.physicalWall||0)>=.55){
      const answers=combo.map(id=>wallBreakPressure(row.p,id,mega)).filter(x=>x.cat==='special'&&x.score>=.65);
      if(!answers.length){penalty+=prob*5;warnings.push(`${row.p.name}: 물리막이인데 특수 실질 타점 부족`);targetPriority+=1.5}else reward+=prob*.8;
    }
    if((row.roles.specialWall||0)>=.55){
      const answers=combo.map(id=>wallBreakPressure(row.p,id,mega)).filter(x=>x.cat==='physical'&&x.score>=.65);
      if(!answers.length){penalty+=prob*5;warnings.push(`${row.p.name}: 특수막이인데 물리 실질 타점 부족`);targetPriority+=1.5}else reward+=prob*.8;
    }
    if((row.roles.antiSetup||0)>=.55&&combo.includes('mimi')){
      const helper=combo.filter(id=>id!=='mimi').map(id=>({id,g:matchupGrade(row.p,id,mega),bp:wallBreakPressure(row.p,id,mega)})).sort((a,b)=>b.g-a.g||b.bp.score-a.bp.score)[0];
      if(!helper||helper.g<3){penalty+=prob*6;hardGaps.push(`${row.p.name}: 따라큐 전개 차단자를 먼저 제거할 카드 없음`)}else{reward+=prob;warnings.push(`${row.p.name} 제거 전 따라큐 칼춤 금지`)}
      targetPriority+=3;
    }
    if((row.roles.hazardSetter||0)>=.55&&!hasRemoval){
      const leadPressure=directGrade(row.p,lead,mega),teamPressure=Math.max(...combo.map(id=>directGrade(row.p,id,mega)));
      if(leadPressure<3&&teamPressure<4){penalty+=prob*4.5;warnings.push(`${row.p.name}: 함정 제거가 없고 초반 압박도 약함—교체 누적 손해`);targetPriority+=2.2}else{reward+=prob*.6;warnings.push(`${row.p.name}: 제거 대신 초반 압박으로 함정 턴을 차단`)}
    }
    if((row.roles.statusSpreader||0)>=.55||(row.roles.sleepForcer||0)>=.55){
      const statusPlan=statusPlanFor(row,tools,hasDenial);
      if(!statusPlan.covered){penalty+=prob*(2.5+statusPlan.severity*.55);warnings.push(`${row.p.name}: ${statusPlan.reason}`);targetPriority+=1.2+statusPlan.severity*.25}
      else if(statusPlan.partial){penalty+=prob*1.2;warnings.push(`${row.p.name}: ${statusPlan.reason}`);targetPriority+=.5}
      else reward+=prob*.4;
    }
    if((row.roles.trapper||0)>=.55){warnings.push(`${row.p.name}: 수동 포켓몬을 대면시키면 교체 봉쇄 가능`);targetPriority+=1}
    const role=primaryRole(row),owner=bestMissionOwner(row,combo,mega,role);
    if(owner)missions[owner.id].push({p:row.p,role,prob,score:owner.score});
    priority.push({...row,priority:targetPriority,prob});
  }
  if(analysis.features.regen>=1.3){
    if(!hasHazard&&!hasDenial){penalty+=4;hardGaps.push('재생력 코어에 칩을 고정할 수단 부족');warnings.push('재생력 상대에게 피해를 분산하지 말고 한 마리를 연속 압박')}
    else reward+=1.2;
  }
  if(analysis.features.hazard>=.7&&!hasRemoval&&combo.includes('garchomp'))warnings.push('스텔스록이 깔리기 전에 한카리아스 기합의띠 가치를 사용하거나 함정 설치자를 먼저 압박');
  const ordered=priority.sort((a,b)=>b.priority-a.priority).slice(0,4);
  const targetNames=ordered.map(x=>x.p.name);
  const breakFirst=ordered[0]?.p.name||analysis.keyTargets[0]?.p.name||'';
  const antiSetupTarget=ordered.find(x=>(x.roles.antiSetup||0)>=.55)?.p.name;
  const phase1=analysis.features.hazard>=.7&&!hasRemoval?`초반에는 ${ordered.find(x=>(x.roles.hazardSetter||0)>=.55)?.p.name||breakFirst}의 함정 턴을 막고 불필요한 교체를 줄인다.`:`초반에는 ${breakFirst||'핵심 역할'}의 기술·도구를 확인하고 가장 높은 역할 가설을 확정한다.`;
  const phase2=`중반에는 ${targetNames.slice(0,3).join(' → ')||'핵심 막이'} 순으로 역할 연결을 끊는다. 회복기는 트릭·앙코르로 묶거나 회복량보다 큰 반대 공격축으로 압박한다.`;
  const phase3=combo.includes('mimi')?`${antiSetupTarget?antiSetupTarget+'를 제거한 뒤에만 ':''}따라큐 칼춤을 최종 승리축으로 사용한다.`:`상대 회복·상태이상 담당이 약해진 뒤 가장 높은 직접 대면 등급의 포켓몬으로 마무리한다.`;
  const missionRows=Object.entries(missions).map(([id,rows])=>({id,targets:rows.sort((a,b)=>b.prob*b.score-a.prob*a.score).slice(0,3)}));
  return{
    analysis,penalty,reward,scoreDelta:reward-penalty,warnings:[...new Set(warnings)],hardGaps:[...new Set(hardGaps)],
    priority:ordered,blockers:ordered.map(x=>({p:x.p,prob:x.prob,helper:0})),missions:missionRows,
    phases:[phase1,phase2,phase3],summary:`${analysis.name}: ${targetNames.slice(0,3).join(' → ')||'역할 공개 후 결정'} 순으로 해체`
  };
}

export class TeamAnalysisEngine{
  inferRoles(...args){return inferPokemonRoles(...args)}
  analyze(...args){return analyzeEnemyTeam(...args)}
  evaluate(...args){return evaluateTeamCounterPlan(...args)}
}

export const teamAnalysisEngine=new TeamAnalysisEngine();

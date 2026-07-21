import { DATA, OWN, IDS, GRADE_LABEL } from '../data/pokemon-data.js';
import { ABILITY_GROUPS, LEAD_PRIOR, SELECTION_UTILITY, RAIN_PARTNER_WEIGHT, RAIN_PARTNERS, SUN_PARTNERS, SNOW_PARTNERS, SAND_PARTNERS, DEDICATED_LEADS, OUR_NATURAL_LEADS, PARTNER_LINKS, AUTO_MEGA_PRIOR, OWN_LEAD_FIT, PAIR_SYNERGY, ROLE_GROUPS } from '../data/meta-data.js';
import { battleTypes, eff } from './type-system.js';
import { defenseProfile } from './defense-engine.js';
import { abilityContext, plausibleAbilityIds, abilityThreatBonus, abilityLeadMultiplier, bestAbilityMove, canSwitchOutAgainst } from './ability-engine.js';
import { profile, bestFor, matchupGrade, directGrade, wallBreakPressure, axisGapForCombo } from './matchup-engine.js';
import { exchangeAudit } from './speed-engine.js';

export function combos(a,k=3){let out=[];function r(start,c){if(c.length===k){out.push([...c]);return}for(let i=start;i<a.length;i++){c.push(a[i]);r(i+1,c);c.pop()}}r(0,[]);return out}

export function tagsOf(p){
 const out=[...(DATA.tags[p.name]||[])];
 if((DATA.megaOptions[p.name]||[]).length&&!out.includes('mega'))out.push('mega');
 const ctx=abilityContext(p,'');
 const ids=plausibleAbilityIds(ctx);
 if([...ABILITY_GROUPS.weather].some(x=>ids.has(x))&&!out.includes('weather'))out.push('weather');
 if([...ABILITY_GROUPS.weatherSpeed].some(x=>ids.has(x))&&!out.includes('fast'))out.push('fast');
 if(ids.has('prankster')&&!out.includes('support'))out.push('support');
 if(ids.has('regenerator')&&!out.includes('stall'))out.push('stall');
 if(ids.has('defiant')||ids.has('competitive')||ids.has('contrary'))out.push('dropPunish');
 return [...new Set(out)];
}

export function hasAny(a,xs){return xs.some(x=>a.includes(x))}
// 선봉 성향은 단순 타입이 아니라 실제 역할을 반영한다. 1은 평균, 숫자가 높을수록 선봉 우선도가 높다.

export function partnerLink(a,b){let aa=PARTNER_LINKS[a]||[],bb=PARTNER_LINKS[b]||[],ia=aa.indexOf(b),ib=bb.indexOf(a),v=0;if(ia>=0)v+=Math.max(.15,1-ia*.075);if(ib>=0)v+=Math.max(.15,1-ib*.075);return v}

export function archetypeInfo(t){
 const names=t.map(x=>x.name), allTags=t.map(tagsOf), setup=allTags.filter(x=>x.includes('setup')).length,piv=allTags.filter(x=>x.includes('pivot')).length,bulky=allTags.filter(x=>hasAny(x,['stall','bulky','recovery'])).length;
 if(names.some(x=>['패리퍼','왕구리'].includes(x))&&names.some(x=>RAIN_PARTNERS.includes(x)))return{name:'비 전개',key:'rain',note:'날씨 시동기＋비 에이스를 한 묶음으로 예상'};
 const trueSunStarter=names.some(x=>['코터스','나인테일'].includes(x)),charYCore=names.includes('리자몽')&&names.some(x=>SUN_PARTNERS.includes(x)&&x!=='리자몽');
 if((trueSunStarter&&names.some(x=>SUN_PARTNERS.includes(x)))||charYCore)return{name:'쾌청 전개',key:'sun',note:'쾌청 시동 후 엽록소·불꽃 에이스 연결'};
 if(names.some(x=>['알로라 나인테일','오롱털'].includes(x))&&setup>=1)return{name:'벽 전개 공격',key:'screen',note:'벽 선봉＋후발 랭크업 에이스'};
 if(names.some(x=>['킬라플로르','히스이 대검귀','눈여아','사마자르'].includes(x)))return{name:'함정 공격',key:'hazard',note:'기띠·함정 선봉으로 후속 정리권 생성'};
 const sandStarter=names.find(x=>['하마돈','마기라스'].includes(x)),sandPartner=names.some(x=>SAND_PARTNERS.includes(x)&&x!==sandStarter&&!['하마돈','마기라스'].includes(x));
 if(sandStarter&&sandPartner)return{name:'모래 전개',key:'sand',note:'모래 시동기와 별도의 모래 수혜 에이스 연결'};
 if(piv>=2)return{name:'피벗 밸런스',key:'pivot',note:'유턴·볼트체인지로 유리 대면을 반복 생성'};
 if(bulky>=2)return{name:'사이클 밸런스',key:'balance',note:'후출 가능한 쿠션과 회복으로 장기 우위'};
 if(setup>=2)return{name:'대면 공격',key:'offense',note:'기띠·탈·랭크업을 이어 붙이는 공격형'};
 return{name:'표준 밸런스',key:'standard',note:'선봉 정보전＋중간 완충＋후반 마무리'};
}

export function setArchetypeFit(set,arch){let n=set.map(x=>x.name),tags=set.map(tagsOf),v=0;
 if(arch.key==='rain'){if(n.some(x=>['패리퍼','왕구리'].includes(x)))v+=2.7;v+=n.filter(x=>RAIN_PARTNERS.includes(x)).length*1.45}
 if(arch.key==='sun'){let starter=n.some(x=>['코터스','나인테일'].includes(x)),charCore=n.includes('리자몽')&&n.some(x=>SUN_PARTNERS.includes(x)&&x!=='리자몽');if(starter||charCore)v+=2.1;if(starter||charCore)v+=n.filter(x=>SUN_PARTNERS.includes(x)).length*1.15}
 if(arch.key==='screen'){if(n.some(x=>['알로라 나인테일','오롱털'].includes(x)))v+=2.5;v+=tags.filter(x=>x.includes('setup')).length*1.1}
 if(arch.key==='hazard'){if(n.some(x=>['킬라플로르','히스이 대검귀','눈여아','사마자르'].includes(x)))v+=2.4;v+=tags.filter(x=>hasAny(x,['fast','setup','priority'])).length*.65}
 if(arch.key==='sand'){let starter=n.find(x=>['하마돈','마기라스'].includes(x)),partners=n.filter(x=>SAND_PARTNERS.includes(x)&&x!==starter&&!['하마돈','마기라스'].includes(x)).length;if(starter&&partners){v+=2.0+partners*1.1}}
 if(arch.key==='pivot')v+=tags.filter(x=>x.includes('pivot')).length*.9;
 if(arch.key==='balance')v+=tags.filter(x=>hasAny(x,['stall','bulky','recovery'])).length*.75;
 return v}

export function setPartnerScore(set){let v=0;for(let i=0;i<set.length;i++)for(let j=i+1;j<set.length;j++)v+=partnerLink(set[i].name,set[j].name)*.8;return v}

export function inferMega(t,chosen=''){
 if(chosen)return {name:chosen,reason:'사용자 지정',confidence:'확정',alternatives:[]};
 const names=t.map(x=>x.name),c=[];
 for(const p of t){
  const opts=DATA.megaOptions[p.name]||[];
  if(!opts.length)continue;
  const prior=AUTO_MEGA_PRIOR[p.name];
  for(const form of opts){
   let sc=(prior&&prior.name===form?prior.p:Math.max(.42,.68-Math.log2((p.rank||235)+1)*.025));
   let reason=prior&&prior.name===form?`${p.name}의 최신 메가스톤 경향`:`${p.name}의 M-B 합법 메가 후보`;
   if(p.name==='리자몽'){
    const sun=names.some(x=>['코터스','나인테일','스코빌런','이상해꽃'].includes(x));
    if(form==='메가리자몽Y'&&sun){sc+=.24;reason='쾌청 코어와 Y형 시너지';}
    if(form==='메가리자몽X'&&names.some(x=>['오롱털','알로라 나인테일'].includes(x)))sc+=.14;
   }
   if(p.name==='라이츄'&&form==='메가라이츄Y')sc+=.22;
   if(p.name==='대짱이'&&names.some(x=>['패리퍼','왕구리'].includes(x)))sc+=.28;
   if(p.name==='메가니움'&&form==='메가메가니움')sc+=.10;
   c.push({name:form,score:sc,reason,base:p.name});
  }
 }
 c.sort((a,b)=>b.score-a.score);
 if(!c.length)return {name:'',reason:'합법 메가 후보 없음',confidence:'낮음',alternatives:[]};
 return {name:c[0].name,reason:c[0].reason,confidence:(c.length===1||c[0].score-(c[1]?.score||0)>.22)?'높음':'경합',alternatives:c.slice(1,4)};
}

export function hasDedicatedLead(t,except=''){return t.some(x=>x.name!==except&&DEDICATED_LEADS.includes(x.name))}

export function leadPressureMultiplier(p,megaName){
  let gs=OUR_NATURAL_LEADS.map(id=>directGrade(p,id,megaName));
  let favorable=gs.filter(g=>g<=2).length, checked=gs.filter(g=>g>=4).length;
  let noHard=Math.max(...IDS.map(id=>matchupGrade(p,id,megaName)))<4;
  return Math.max(.72,1+favorable*.11-checked*.08+(noHard?.16:0));
}

export function leadContextMultiplier(p,t,megaName){
  let m=LEAD_PRIOR[p.name]||1, names=t.map(x=>x.name);
  if(p.name==='패리퍼'){let rainPower=names.reduce((v,x)=>v+(RAIN_PARTNER_WEIGHT[x]||0),0);m*=1+Math.min(.95,rainPower*.105);}
  if(['코터스','나인테일'].includes(p.name)){let n=names.filter(x=>SUN_PARTNERS.includes(x)).length;m*=1+Math.min(.6,n*.18);}
  if(['알로라 나인테일','배바닐라','눈설왕'].includes(p.name)){let n=names.filter(x=>SNOW_PARTNERS.includes(x)&&x!==p.name).length;m*=1+Math.min(.55,n*.18);}
  if(['하마돈','마기라스'].includes(p.name)){let n=names.filter(x=>SAND_PARTNERS.includes(x)&&x!==p.name).length;m*=1+Math.min(.45,n*.15);}
  if(p.name==='망나뇽'){
    m*=hasDedicatedLead(t,p.name)?.76:1.42;
    if(Math.max(...IDS.map(id=>matchupGrade(p,id,megaName)))<4)m*=1.18;
  }
  return m*leadPressureMultiplier(p,megaName);
}

export function leadReason(p,t){
  let tags=tagsOf(p), names=t.map(x=>x.name);
  if(p.name==='패리퍼')return `잔비 즉시 전개${names.some(x=>RAIN_PARTNERS.includes(x))?'＋비 에이스 연결':''}＋유턴`;
  if(p.name==='망나뇽')return hasDedicatedLead(t,p.name)?'전용 시동기 뒤에서 나올 가능성도 크지만, 풀피 멀티스케일과 넓은 특수 커버리지로 공격 선봉도 가능':'풀피 멀티스케일로 최소 한 번 행동하며 특수 커버리지로 역선봉을 노림';
  if(['알로라 나인테일','오롱털'].includes(p.name))return '벽 전개 후 후속 에이스 연결';
  if(['킬라플로르','눈여아','히스이 대검귀','사마자르'].includes(p.name))return '공격과 동시에 함정·전개 압박';
  if(['하마돈','한카리아스'].includes(p.name))return '스텔스록·상태이상·기합의띠 선봉';
  if(['코터스','나인테일','배바닐라','눈설왕','마기라스'].includes(p.name))return '날씨를 먼저 확보하는 선봉 후보';
  if(tags.includes('pivot'))return '유턴·볼트체인지로 대면 확인';
  if(tags.includes('fast'))return '빠른 공격으로 선봉 압박';
  return '상대 조합과 우리 예상 선봉에 대한 대면 점수 기반';
}

export function leadFirstAction(p){
  const map={
    '패리퍼':'비를 연 뒤 유턴 또는 비 강화 물 기술','알로라 나인테일':'오로라베일','오롱털':'리플렉터·빛의장막 또는 전기자석파',
    '킬라플로르':'스텔스록·독압정 또는 공격','히스이 대검귀':'비검천중파로 압정 전개','눈여아':'압정·도깨비불·길동무',
    '하마돈':'스텔스록 또는 하품','한카리아스':'스텔스록·암석봉인 또는 즉시 지진','마스카나':'유턴 또는 약점 공격',
    '망나뇽':'풀피 멀티스케일을 이용한 용성군·에어슬래시, 불리하면 날개쉬기','코터스':'쾌청 전개 후 스텔스록·하품',
    '사마자르':'암석액스 계열의 공격＋함정 압박','캥카':'속이기로 기합의띠·탈을 확인한 뒤 지진·기습·노말 자속기로 압박'
  };
  return map[p.name]||((tagsOf(p).includes('pivot'))?'유턴·볼트체인지로 정찰':'가장 잘 통하는 자속기 또는 전개기');
}

export function leadConfidence(model){
  let a=model.leadPredicted[0],b=model.leadPredicted[1],av=model.leads[a?.name]||0,bv=model.leads[b?.name]||0,gap=av-bv;
  if(av>=.45&&gap>=.16)return{label:'높음',note:'전용 시동 역할과 점수 격차가 모두 큼'};
  if(av>=.33&&gap>=.08)return{label:'중간',note:'1순위가 우세하지만 공격 역선봉 가능성 존재'};
  return{label:'낮음',note:'선봉 후보가 분산됨. 1순위만 맞히는 선출보다 2·3순위 복구를 우선'};
}

export function leadCounterPlan(p,combo,megaName,recommendedLead){
  let arr=combo.map(id=>({id,g:matchupGrade(p,id,megaName),fit:OWN_LEAD_FIT[id]||1})).sort((a,b)=>b.g-a.g||b.fit-a.fit),best=arr[0];
  let direct=best.g>=4?`${OWN[best.id].name}: 한 대를 맞고 시작해도 되는 후출급 답`:best.g===3?`${OWN[best.id].name}: 이미 마주쳤을 때 즉시 공격·피벗하는 선대면 체크`:best.g===2?`${OWN[best.id].name}: 안전 투입 뒤 복수 처리`:`직접 맞설 안정 카드 없음`;
  let current=arr.find(x=>x.id===recommendedLead),currentDirect=directGrade(p,recommendedLead,megaName),safe=arr.find(x=>x.g>=4&&x.id!==recommendedLead),recover='';
  if(current&&currentDirect>=4)recover=`${subjectJosa(OWN[recommendedLead].name)} 만나면 그대로 유지 가능`;
  else if(current&&currentDirect===3)recover=`${subjectJosa(OWN[recommendedLead].name)} 만나면 즉시 공격·피벗. 장기전이나 재후출은 금지`;
  else if(safe)recover=`추천 선봉이 잘못 만나면 ${OWN[safe.id].name}으로 교체 가능`;
  else recover='추천 선봉이 잘못 만나면 무상 교체 불가—기띠·탈·피벗 또는 희생 교환 필요';
  return{direct,recover,best};
}

export function pairKey(a,b){return [a,b].sort().join('|')}

export function opponentThreat(p,megaName){
  let {arr,best}=bestFor(p,megaName), gs=arr.map(x=>x.grade), tags=tagsOf(p);
  let weak=gs.filter(g=>g<=2).length, strong=gs.filter(g=>g>=4).length;
  let rankPrior=Math.max(.35,3.1-Math.log2(p.rank+1)*.38);
  let pressure=weak*.72+(best.grade<4?2.6:0)+(strong===1?1.0:0);
  let role=(hasAny(tags,['setup','fast','priority','mega'])?1.0:0)+(hasAny(tags,['hazard','lead','pivot'])?.55:0)+(SELECTION_UTILITY[p.name]||0);
  if((DATA.megaOptions[p.name]||[]).includes(megaName))role+=1.4;
  return rankPrior+pressure+role+abilityThreatBonus(p,megaName);
}

export function opponentSetScore(set,megaName,fullTeam=null,arch=null){
  let score=set.reduce((v,p)=>v+opponentThreat(p,megaName),0), tags=set.map(tagsOf),names=set.map(p=>p.name);
  let hasLead=tags.some(t=>hasAny(t,['lead','hazard','pivot','sash'])),hasWin=tags.some(t=>hasAny(t,['setup','fast','priority','mega']));
  let physical=tags.filter(t=>t.includes('physical')).length,special=tags.filter(t=>t.includes('special')).length,passive=tags.filter(t=>t.includes('stall')&&!hasAny(t,['setup','fast'])).length;
  if(hasLead)score+=1.25;if(hasWin)score+=1.55;if(physical&&special)score+=.85;if(passive>=2&&!hasWin)score-=1.7;
  if(set.some(p=>(DATA.megaOptions[p.name]||[]).length))score+=.45;
  score+=setPartnerScore(set);
  if(arch)score+=setArchetypeFit(set,arch);
  if(names.some(n=>['패리퍼','왕구리'].includes(n))){let rp=names.filter(x=>RAIN_PARTNERS.includes(x)),power=rp.reduce((v,x)=>v+(RAIN_PARTNER_WEIGHT[x]||0),0);if(rp.length){score+=power*1.3;if(rp.length>=2)score+=1.25}}
  const weatherCores=[{starters:['코터스','나인테일'],partners:SUN_PARTNERS,bonus:1.8},{starters:['알로라 나인테일','배바닐라','눈설왕'],partners:SNOW_PARTNERS,bonus:1.55},{starters:['하마돈','마기라스'],partners:SAND_PARTNERS,bonus:1.45}];
  for(const w of weatherCores)if(names.some(n=>w.starters.includes(n))){let c=names.filter(x=>w.partners.includes(x)&&!w.starters.includes(x)).length;if(c){score+=c*w.bonus;if(c>=2)score+=1}}
  let screen=names.some(n=>['알로라 나인테일','오롱털'].includes(n)),setupCount=tags.filter(t=>t.includes('setup')).length;if(screen&&setupCount)score+=Math.min(2.2,setupCount*.8);
  if(names.includes('패리퍼')&&names.includes('망나뇽'))score-=.5;
  return score;
}

export function leadScoreInSet(p,set,fullTeam,megaName,style){
  let pr=profile(p,megaName),tags=tagsOf(p),base=(1.05+(pr.lead||0)*.25)*leadContextMultiplier(p,fullTeam,megaName)*abilityLeadMultiplier(p,megaName);
  let names=set.map(x=>x.name),dedicated=names.some(x=>x!==p.name&&DEDICATED_LEADS.includes(x));
  if(hasAny(tags,['lead','hazard','pivot','sash','fast']))base*=1.18;
  if(DEDICATED_LEADS.includes(p.name))base*=1.3;
  if(dedicated&&hasAny(tags,['setup','priority','mega']))base*=.72;
  if(p.name==='망나뇽'&&dedicated)base*=.68;
  if(p.name==='따라큐'&&dedicated)base*=.76;
  if(style==='hazard'&&hasAny(tags,['hazard','lead']))base*=1.65;
  if(style==='attack'&&hasAny(tags,['fast','setup','physical','special']))base*=1.42;
  if(style==='pivot'&&tags.includes('pivot'))base*=1.7;
  return Math.max(.01,base);
}

export function megaBaseFor(form){
 for(const p of DATA.roster)if((DATA.megaOptions[p.name]||[]).includes(form))return p.name;
 return '';
}

export function megaCandidatesForSet(set,chosen=''){
 if(chosen){
  const base=megaBaseFor(chosen);
  return !base||set.some(p=>p.name===base)?[{name:chosen,prior:1,reason:'사용자 지정'}]:[];
 }
 const hyp=inferMega(set,'');
 if(!hyp.name)return [{name:'',prior:1,reason:'메가 없음'}];
 const rows=[{name:hyp.name,prior:1,reason:hyp.reason},...(hyp.alternatives||[]).map((x,i)=>({name:x.name,prior:Math.max(.28,.68-i*.14),reason:x.reason}))];
 const sum=rows.reduce((v,x)=>v+x.prior,0)||1;
 return rows.slice(0,4).map(x=>({...x,prior:x.prior/sum}));
}

export function estimateOpponent(t,megaName,forcedLead='',style='auto'){
  let arch=archetypeInfo(t),raw=combos(t).flatMap(set=>megaCandidatesForSet(set,megaName).map(mc=>({set,megaName:mc.name,megaPrior:mc.prior,megaReason:mc.reason,score:opponentSetScore(set,mc.name,t,arch)+Math.log(Math.max(.03,mc.prior))*1.35}))).sort((a,b)=>b.score-a.score),max=raw[0]?.score||0;
  let weights=raw.map(x=>Math.exp((x.score-max)/2.45)),den=weights.reduce((a,b)=>a+b,0)||1,probs={},leads={};t.forEach(p=>{probs[p.name]=0;leads[p.name]=0});
  let setHypotheses=raw.map((x,i)=>{let weight=weights[i]/den,ls=x.set.map(p=>({p,score:leadScoreInSet(p,x.set,t,x.megaName,style)})),ld=ls.reduce((v,z)=>v+z.score,0)||1;ls.forEach(z=>z.prob=z.score/ld);x.set.forEach(p=>probs[p.name]+=weight);return{...x,weight,leads:ls.sort((a,b)=>b.prob-a.prob)}});
  if(forcedLead){
    let filtered=setHypotheses.filter(h=>h.set.some(p=>p.name===forcedLead));
    let fden=filtered.reduce((v,h)=>v+h.weight,0)||1;Object.keys(probs).forEach(k=>probs[k]=0);Object.keys(leads).forEach(k=>leads[k]=0);
    filtered=filtered.map(h=>{let weight=h.weight/fden,p=h.set.find(x=>x.name===forcedLead);h.set.forEach(x=>probs[x.name]+=weight);return{...h,weight,leads:[{p,score:1,prob:1}]}}).sort((a,b)=>b.weight-a.weight);
    let scenarios=filtered.map(h=>({set:h.set,lead:h.leads[0].p,megaName:h.megaName,weight:h.weight,setWeight:h.weight,leadWeight:1,score:h.score}));leads[forcedLead]=1;
    return{sets:raw,setHypotheses:filtered.slice(0,6),scenarios:scenarios.slice(0,24),probs,leads,arch,predicted:[...t].sort((a,b)=>(probs[b.name]||0)-(probs[a.name]||0)).slice(0,3),leadPredicted:t.filter(p=>p.name===forcedLead),forcedLead};
  }
  let scenarios=[];for(const h of setHypotheses){for(const l of h.leads){let w=h.weight*l.prob;leads[l.p.name]+=w;scenarios.push({set:h.set,lead:l.p,megaName:h.megaName,weight:w,setWeight:h.weight,leadWeight:l.prob,score:h.score})}}
  scenarios.sort((a,b)=>b.weight-a.weight);let lden=Object.values(leads).reduce((a,b)=>a+b,0)||1;Object.keys(leads).forEach(k=>leads[k]/=lden);
  return{sets:raw,setHypotheses:setHypotheses.slice(0,6),scenarios:scenarios.slice(0,24),probs,leads,arch,predicted:[...t].sort((a,b)=>(probs[b.name]||0)-(probs[a.name]||0)).slice(0,3),leadPredicted:[...t].sort((a,b)=>(leads[b.name]||0)-(leads[a.name]||0)).slice(0,3),forcedLead:''};
}

export function scenarioMegaForLead(model,name,fallback=''){let sc=model.scenarios.find(x=>x.lead.name===name);return sc?.megaName||fallback}

export function scenarioMegaForPokemon(model,name,fallback=''){let h=model.setHypotheses.find(x=>x.set.some(p=>p.name===name)&&x.megaName);return h?.megaName||fallback}

export function ownWinScore(id,t,model,megaName){
 let score=0;for(const p of t){let prob=model.probs[p.name]||0,g=matchupGrade(p,id,megaName),bp=wallBreakPressure(p,id,megaName);score+=prob*([-.5,0,.8,1.5,2.0,2.4][g]+Math.min(1.2,bp.score*.42));}
 if(id==='mimi')score+=1.4;if(id==='garchomp')score+=1.35;if(id==='rotomh')score+=.65;if(id==='prim')score+=.55;return score;
}

export function soleAnchorBurden(combo,t,model,megaName){let burden={};combo.forEach(x=>burden[x]=0);for(const p of t){let prob=model.probs[p.name]||0;if(prob<.28)continue;let strong=combo.filter(id=>matchupGrade(p,id,megaName)>=4);if(strong.length===1)burden[strong[0]]+=prob;}return burden}

export function coverageReward(g){return[-16,-7,-1,5,11,14][g]}

export function marginalContribution(combo,id,t,model,megaName){let others=combo.filter(x=>x!==id),v=0,jobs=[];for(const p of t){let prob=model.probs[p.name]||0,withG=Math.max(...combo.map(x=>matchupGrade(p,x,megaName))),withoutG=Math.max(...others.map(x=>matchupGrade(p,x,megaName)));let d=Math.max(0,coverageReward(withG)-coverageReward(withoutG));if(d>0){v+=prob*d;jobs.push({p,delta:d,prob})}}return{value:v,jobs:jobs.sort((a,b)=>b.prob*b.delta-a.prob*a.delta)}}

export function comboScore(combo,t,megaName,model){
 let s=0,strongExpected=0,hardGaps=[],backup=0,axisWarnings=[];
 for(const p of t){let prob=model.probs[p.name]||0,arr=combo.map(id=>({id,g:matchupGrade(p,id,megaName),bp:wallBreakPressure(p,id,megaName)})).sort((a,b)=>b.g-a.g||b.bp.score-a.bp.score),b=arr[0].g,sec=arr[1].g;s+=prob*coverageReward(b);if(b>=4)strongExpected+=prob;if(b>=4&&sec>=2){s+=prob*1.2;backup+=prob}if(prob>=.38&&b<4){s-=13*prob;hardGaps.push(p.name)}let press=Math.max(...arr.map(x=>x.bp.score));s+=prob*Math.min(3,press*.85);let gap=axisGapForCombo(combo,p,megaName);if(gap&&!gap.hasWanted){s-=prob*(gap.d.confidence==='높음'?4.2:2.2);axisWarnings.push(`${p.name}: ${gap.warning}`)}}
 let maker=combo.some(x=>ROLE_GROUPS.maker.includes(x)),anchor=combo.some(x=>ROLE_GROUPS.anchor.includes(x)),closer=combo.some(x=>ROLE_GROUPS.closer.includes(x));if(maker)s+=2;else s-=4;if(anchor)s+=2;else s-=5;if(closer)s+=2.5;else s-=6;
 for(let i=0;i<combo.length;i++)for(let j=i+1;j<combo.length;j++)s+=PAIR_SYNERGY[pairKey(combo[i],combo[j])]||0;
 let contributions={};for(const id of combo){contributions[id]=marginalContribution(combo,id,t,model,megaName);if(contributions[id].value<.4)s-=12;else s+=Math.min(3,contributions[id].value*.2)}
 let winPool=combo.filter(id=>ROLE_GROUPS.closer.includes(id));if(!winPool.length)winPool=[...combo];let win=winPool.map(id=>({id,score:ownWinScore(id,t,model,megaName)+(contributions[id]?.value||0)*.35})).sort((a,b)=>b.score-a.score)[0];let blockers=[];for(const p of t){let prob=model.probs[p.name]||0,wg=matchupGrade(p,win.id,megaName);if(wg<=2){let helper=Math.max(...combo.filter(x=>x!==win.id).map(x=>matchupGrade(p,x,megaName)));blockers.push({p,helper,prob});if(helper>=4)s+=prob*2.4;else s-=prob*5}}
 return{s,strongExpected,backup,hardGaps:[...new Set(hardGaps)],axisWarnings:[...new Set(axisWarnings)],win:win.id,contributions,blockers:blockers.sort((a,b)=>b.prob-a.prob)};
}

export function scenarioCoverage(combo,set,megaName){let score=0,gaps=[],sole={},axisWarnings=[];combo.forEach(x=>sole[x]=0);for(const p of set){let gs=combo.map(id=>({id,g:matchupGrade(p,id,megaName),bp:wallBreakPressure(p,id,megaName)})).sort((a,b)=>b.g-a.g||b.bp.score-a.bp.score),b=gs[0].g,sec=gs[1].g;score+=({0:-15,1:-9,2:-3,3:3.5,4:9,5:12})[b];score+=Math.min(2.5,Math.max(...gs.map(x=>x.bp.score))*.55);if(sec>=3)score+=2;else if(b>=4&&sec<=1){score-=3;sole[gs[0].id]++}if(b<3)gaps.push(p.name);if(b===3&&sec<2)score-=2.5;let gap=axisGapForCombo(combo,p,megaName);if(gap&&!gap.hasWanted){score-=2.5;axisWarnings.push(`${p.name}: ${gap.warning}`)}}for(const id of combo)if(sole[id]>=2)score-=5*(sole[id]-1);return{score,gaps,sole,axisWarnings}}

export function scenarioWinAxis(combo,set,megaName){let pool=combo.map(id=>{let gs=set.map(p=>matchupGrade(p,id,megaName)),traits=OWN[id].traits,s=gs.reduce((v,g)=>v+({0:-5,1:-3,2:0,3:2,4:3.5,5:4.5})[g],0);s+=set.reduce((v,p)=>v+Math.min(1.4,wallBreakPressure(p,id,megaName).score*.32),0);if(traits.includes('setup'))s+=2.1;if(traits.includes('priority'))s+=1.1;if(traits.includes('scarf'))s+=1.4;return{id,s,gs}}).sort((a,b)=>b.s-a.s);return pool[0]}

export function evaluateScenario(combo,lead,sc,megaName){let sm=sc.megaName||megaName,opening=openingState(lead,combo,sc.lead,sm),coverage=scenarioCoverage(combo,sc.set,sm),win=scenarioWinAxis(combo,sc.set,sm),score=opening.score+coverage.score+win.s*.55;let leadSole=coverage.sole[lead]||0;if(leadSole&&opening.kind!=='stay'&&opening.kind!=='check')score-=leadSole*4;return{score,opening,coverage,win,sc,megaName:sm}}

export function rankFMPlans(t,megaName,model){let plans=[];for(const combo of combos(IDS)){let base=comboScore(combo,t,megaName,model);for(const lead of combo){let outcomes=model.scenarios.map(sc=>evaluateScenario(combo,lead,sc,megaName)),wden=outcomes.reduce((v,x)=>v+x.sc.weight,0)||1,mean=outcomes.reduce((v,x)=>v+x.score*x.sc.weight,0)/wden,meaningful=outcomes.filter(x=>x.sc.weight>=.025).sort((a,b)=>a.score-b.score),worst=meaningful[0]?.score??mean,catWeight=outcomes.filter(x=>x.opening.catastrophic).reduce((v,x)=>v+x.sc.weight,0)/wden,robust=mean+Math.min(0,worst)*.58-catWeight*22+base.s*.16;plans.push({combo,lead,robust,mean,worst,catWeight,outcomes,base,win:base.win})}}return plans.sort((a,b)=>b.robust-a.robust)}

export function forcedLeadPlanScore(plan,enemy,megaName){let dg=directGrade(enemy,plan.lead,megaName),eg=matchupGrade(enemy,plan.lead,megaName),op=openingState(plan.lead,plan.combo,enemy,megaName),tempo=op.kind==='stay'?1.8:op.kind==='check'?1.0:op.kind==='switch'?-1.0:op.kind==='trade'?-2.0:op.kind==='collapse'?-7:0;return plan.robust+dg*1.25+eg*.9+tempo}

export function orderCombo(combo,lead,win,t,model,megaName){let rest=combo.filter(x=>x!==lead);if(rest.length<2)return combo;let bad=model.leadPredicted.filter(p=>matchupGrade(p,lead,megaName)<3),bridge=rest.map(id=>({id,s:bad.reduce((v,p)=>v+(model.leads[p.name]||0)*matchupGrade(p,id,megaName),0)+(OWN[id].traits.includes('pivot')?1:0)})).sort((a,b)=>b.s-a.s)[0].id,last=rest.find(x=>x!==bridge);if(win!==lead&&rest.includes(win)){last=win;bridge=rest.find(x=>x!==win)}return[lead,bridge,last]}

export function planMode(top,t,model,megaName){let h=model.setHypotheses[0],good=h?h.set.filter(p=>matchupGrade(p,top.win,megaName)>=3).length:0;return good>=2?'집중형':'분업형'}

export function likelyBackPlan(enemyLead,opening,ourLead,combo,model,megaName){
 let rel=model.scenarios.filter(x=>x.lead.name===enemyLead.name).sort((a,b)=>b.weight-a.weight),sc=rel[0];if(!sc)return'';megaName=sc.megaName||megaName;
 let active=(opening.kind==='switch'||opening.kind==='fastpivot')&&opening.safe?opening.safe.id:ourLead,backs=sc.set.filter(x=>x.name!==enemyLead.name);
 if(!backs.length)return'';
 let threat=backs.map(p=>({p,v:(5-directGrade(p,active,megaName))*2+opponentThreat(p,megaName)*.3})).sort((a,b)=>b.v-a.v)[0].p;
 let dg=directGrade(threat,active,megaName),safe=combo.filter(x=>x!==active).map(id=>({id,g:matchupGrade(threat,id,megaName)})).sort((a,b)=>b.g-a.g)[0],move=(bestFor(threat,megaName).arr.find(x=>x.id===active)||{}).move||'가장 큰 피해';
 if(active==='rotomh'&&opening.kind==='stay'&&['알로라 나인테일','핫삼','메타그로스','마스카나'].includes(enemyLead.name)){
   if(threat.name==='망나뇽')return `후발 ${objectJosa(threat.name)} 가장 경계. 오버히트 고정 상태에서 누리레느로 바로 교체하면 10만볼트에 걸릴 수 있으므로, 히트로토무로 멀티스케일을 먼저 깨고 쓰러진 뒤 누리레느를 안전 투입하는 교환 플랜을 우선한다.`;
   if(safe&&safe.g>=4)return `후발 ${objectJosa(threat.name)} 가장 경계. 오버히트 사용 후에는 구애 고정과 특공 하락 때문에 즉시 ${OWN[safe.id].name}으로 넘긴다.`;
   return `후발 ${objectJosa(threat.name)} 가장 경계. 오버히트 고정 뒤 안전한 후출처가 없으므로 히트로토무로 피해를 남기고 복수 처리한다.`;
 }
 if(dg>=3)return `후발 ${threat.name}이 가장 자연스럽다. ${OWN[active].name}이 계속 대면 가능하므로 ${move}로 압박하되, 등급 3이면 재후출은 금지한다.`;
 if(safe&&safe.g>=4)return `후발 ${objectJosa(threat.name)} 가장 경계. 등장하면 ${OWN[safe.id].name}으로 전환해 ${GRADE_LABEL[safe.g]} 구도를 만든다.`;
 if(OWN[active].traits.includes('pivot')&&dg>=2)return `후발 ${threat.name}에는 ${move}로 피벗해 가장 높은 담당 카드 ${safe?OWN[safe.id].name:'후속'}을 안전 투입한다.`;
 return `후발 ${threat.name}에는 무상 교체가 없다. 현재 포켓몬으로 피해를 남긴 뒤 ${safe?objectJosa(OWN[safe.id].name):'후속 복수 카드를'} 안전 투입한다.`;
}

export function turnLine(enemy,lead,combo,megaName){let st=openingState(lead,combo,enemy,megaName),cur=bestFor(enemy,megaName).arr.find(x=>x.id===lead),safe=st.safe,action='';
 if(st.kind==='stay')action=`유지 → ${cur.move}. ${cur.note}`;
 else if(st.kind==='check')action=`유지 → ${cur.move}. 이 대면에서만 처리하고 이후 같은 공격에 재후출하지 않는다.`;
 else if(st.kind==='switch'){if(st.tempoType==='setup')action=`${OWN[safe.id].name}으로 교체는 가능하지만 벽·함정 전개를 공짜로 허용한다. 이 후보가 높으면 처음부터 ${OWN[safe.id].name} 선봉을 우선한다.`;else if(st.tempoType==='pivot')action=`${OWN[safe.id].name}으로 교체 가능하지만 상대 유턴·볼트체인지의 주도권은 내준다. 후속까지 보고 교체한다.`;else action=`즉시 ${OWN[safe.id].name}으로 교체. ${GRADE_LABEL[safe.g]}이므로 예상 주력기를 맞고 역할을 시작할 수 있다.`;}
 else if(st.kind==='fastpivot')action=`선공 ${cur.move}로 멀티스케일·기합의띠를 깨거나 정보를 얻고 ${safe?OWN[safe.id].name:'후속 담당'}을 안전하게 투입한다.`;
 else if(st.kind==='trade'){let item=OWN[lead].traits.includes('sash')?'기합의띠':'탈',mv=tradeMove(lead,cur.move);action=`무상 교체가 없다. ${item} 효과로 한 번 버티고 ${instrumentJosa(mv)} 피해·스피드 제어를 남긴 뒤 후속으로 복수 처리한다.`;}
 else action=`안전한 경로가 없다. 억지 교체보다 ${cur.move||'가장 큰 피해'}를 남기거나 희생해 후속을 안전 투입한다.`;
 return{...st,action};
}

export function finalJong(name){let c=name.charCodeAt(name.length-1);return c>=0xAC00&&c<=0xD7A3?(c-0xAC00)%28:0}export function hasBatchim(name){return finalJong(name)!==0}export function subjectJosa(name){return name+(hasBatchim(name)?'이':'가')}export function objectJosa(name){return name+(hasBatchim(name)?'을':'를')}export function withJosa(name){return name+(hasBatchim(name)?'과':'와')}export function instrumentJosa(name){let j=finalJong(name);return name+(!j||j===8?'로':'으로')}export function tradeMove(id,move){if(move&&move!=='—')return move;if(id==='garchomp')return'암석봉인';if(id==='mimi')return'치근거리기';return'가장 큰 피해'}

export function openingStateBase(lead,combo,enemy,megaName){
 let g=directGrade(enemy,lead,megaName),backs=combo.filter(x=>x!==lead).map(id=>({id,g:matchupGrade(enemy,id,megaName)})).sort((a,b)=>b.g-a.g),safe=backs.find(x=>x.g>=4),traits=OWN[lead].traits,et=tagsOf(enemy);
 let hardTempo=['알로라 나인테일','오롱털','킬라플로르','히스이 대검귀','눈여아','사마자르'].includes(enemy.name),softTempo=['하마돈','한카리아스','클레스퍼트라'].includes(enemy.name),tempoCost=hardTempo?6.5:softTempo?2.8:(et.includes('pivot')?1.2:0);
 if(g>=4)return{kind:'stay',score:g===5?13:10,g,safe:null,label:'유지',catastrophic:false,tempoLoss:false};
 if(g===3)return{kind:'check',score:6.5,g,safe:null,label:'선대면 처리',catastrophic:false,tempoLoss:false};
 if(safe&&canSwitchOutAgainst(enemy,lead,megaName)){let score=(g===0?2.5:4.5)-tempoCost;return{kind:'switch',score,g,safe,label:hardTempo?'교체 가능하지만 전개 허용':softTempo?'교체하며 템포 손실':et.includes('pivot')?'교체하며 유턴 주도권 허용':'즉시 교체',catastrophic:hardTempo&&score<0,tempoType:hardTempo?'setup':softTempo?'soft':et.includes('pivot')?'pivot':''}}
 if(safe&&!canSwitchOutAgainst(enemy,lead,megaName))return{kind:'collapse',score:-16,g,safe:null,label:'특성으로 교체 봉쇄',catastrophic:true,tempoLoss:false};
 if(traits.includes('pivot')&&g>=3){let target=backs[0];return{kind:'fastpivot',score:5,g,safe:target,label:'선공 피벗',catastrophic:false,tempoType:''}}
 if(traits.includes('sash')||traits.includes('disguise'))return{kind:'trade',score:-2.5,g,safe:null,label:'기띠·탈 교환',catastrophic:false,tempoType:''};
 if(traits.includes('pivot')&&g>=2)return{kind:'pivot',score:-3,g,safe:backs[0]||null,label:'피벗 시도',catastrophic:false,tempoType:''};
 return{kind:'collapse',score:-15,g,safe:null,label:'복구 불가',catastrophic:true,tempoLoss:false};
}


export function openingState(lead,combo,enemy,megaName){
  let st=openingStateBase(lead,combo,enemy,megaName),cur=bestAbilityMove(enemy,lead,megaName).move,
      a=exchangeAudit(enemy,lead,megaName,{recommendedMove:cur,proteanState:'fresh',speedState:'auto',itemState:'ready'}),
      backs=combo.filter(x=>x!==lead).map(id=>({id,g:matchupGrade(enemy,id,megaName)})).sort((x,y)=>y.g-x.g),safe=backs.find(x=>x.g>=4);
  st.speedAudit=a;
  if((st.kind==='fastpivot'||st.kind==='stay'||st.kind==='check')&&a.gradeCap<=1){
    if(safe&&canSwitchOutAgainst(enemy,lead,megaName))st={kind:'switch',score:-1.5,g:Math.min(st.g,1),safe,label:'선공 피격을 피해 즉시 교체',catastrophic:false,tempoType:'speed',speedAudit:a};
    else if((OWN[lead].traits.includes('sash')||OWN[lead].traits.includes('disguise'))&&!a.reasons.some(x=>x.includes('다단타')))st={kind:'trade',score:-5,g:1,safe:null,label:'선공 피격 후 보험 교환',catastrophic:false,tempoType:'speed',speedAudit:a};
    else st={kind:'collapse',score:-17,g:0,safe:null,label:'상대 선공·타입변화로 복구 불가',catastrophic:true,tempoLoss:false,speedAudit:a};
  } else if(st.kind==='fastpivot'&&a.relation.result!=='own'){
    st.kind=safe?'switch':'pivot';st.score-=5;st.label='선공 피벗 불가';st.safe=safe||st.safe;
  }
  return st;
}
export class SelectionEngine {
  estimateOpponent(...args){ return estimateOpponent(...args); }
  rankPlans(...args){ return rankFMPlans(...args); }
  openingState(...args){ return openingState(...args); }
  inferMega(...args){ return inferMega(...args); }
}
export const selectionEngine = new SelectionEngine();

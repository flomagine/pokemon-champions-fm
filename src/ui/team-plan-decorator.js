import { DATA, OWN } from '../data/pokemon-data.js';
import { ROLE_LABELS } from '../data/team-archetype-data.js';
import { estimateOpponent, rankFMPlans, forcedLeadPlanScore, scenarioMegaForLead } from '../core/selection-engine-v3.js';

const $=id=>document.getElementById(id);

function selectedTeam(){
  const names=[...document.querySelectorAll('#slots input.poke')].map(input=>input.value.trim());
  if(names.length!==6||names.some(name=>!name))return null;
  const team=names.map(name=>DATA.roster.find(p=>p.name===name));
  return team.every(Boolean)?team:null;
}

function topRoles(row){
  return Object.entries(row.roles||{}).filter(([,score])=>score>=.55).sort((a,b)=>b[1]-a[1]).slice(0,4).map(([role])=>ROLE_LABELS[role]).join('·')||'역할 불명';
}

function renderRoleStructure(analysis){
  return analysis.keyTargets.slice(0,6).map((row,index)=>`<div class="audit"><b>${index+1}. ${row.p.name}</b><p><b>역할:</b> ${topRoles(row)}<br><b>구조 중요도:</b> ${row.centrality.toFixed(1)} · <b>판정 신뢰:</b> ${row.confidence}<br>${row.note||row.defense.note||''}</p></div>`).join('');
}

function renderMissions(plan){
  return (plan.missions||[]).filter(row=>row.targets.length).map(row=>{
    const targets=row.targets.map(target=>`${target.p.name}(${ROLE_LABELS[target.role]||target.role})`).join('·');
    return `<b>${OWN[row.id].name}</b> → ${targets}`;
  }).join('<br>');
}

export function renderTeamCounterPlan(){
  const team=selectedTeam();if(!team)return;
  const megaName=$('megaSelect')?.value||'',manualLeadName=$('manualLeadSelect')?.value||'',style=$('leadStyle')?.value||'auto';
  const model=estimateOpponent(team,megaName,manualLeadName,style);
  const plans=rankFMPlans(team,megaName,model);
  if(manualLeadName){
    const enemy=team.find(p=>p.name===manualLeadName),forcedMega=scenarioMegaForLead(model,manualLeadName,megaName);
    plans.sort((a,b)=>forcedLeadPlanScore(b,enemy,forcedMega)-forcedLeadPlanScore(a,enemy,forcedMega));
  }
  const top=plans[0],plan=top?.teamPlan;if(!plan)return;
  const phases=$('phases');
  if(phases)phases.innerHTML=plan.phases.map((text,index)=>`<div class="phase"><b>${['구조 확인','핵심 해체','승리축 실행'][index]||`단계 ${index+1}`}</b><p>${text}</p></div>`).join('');
  const order=$('order');
  if(order){
    $('teamStructureOrder')?.remove();
    const box=document.createElement('div');box.id='teamStructureOrder';box.className='team-audit';
    box.innerHTML=`<div class="audit"><b>상대 구조 해체</b><p><b>${plan.summary}</b><br>${plan.warnings.slice(0,4).join('<br>')||'구조상 추가 경고 없음'}</p></div>`;
    order.appendChild(box);
  }
  const winAxis=$('winAxis');
  if(winAxis){
    $('teamMissionPlan')?.remove();
    const box=document.createElement('div');box.id='teamMissionPlan';
    const missions=renderMissions(plan);
    box.innerHTML=`<p><b>선출 3마리의 역할별 임무</b><br>${missions||'개별 대면 복구를 우선'}</p>`;
    winAxis.appendChild(box);
  }
  const leadForecast=$('leadForecast');
  if(leadForecast){
    $('teamRoleStructure')?.remove();
    const section=document.createElement('div');section.id='teamRoleStructure';
    section.innerHTML=`<div class="audit"><b>${model.teamAnalysis.name} · 역할 의존관계</b><p><b>보조 형태:</b> ${model.teamAnalysis.secondary.join(' / ')||'뚜렷한 보조 형태 없음'}<br><b>판정 신뢰:</b> ${model.teamAnalysis.confidence}<br><b>핵심 연결:</b> ${model.teamAnalysis.edges.slice(0,3).map(edge=>`${edge.a}↔${edge.b}(${edge.reasons.join('·')})`).join(' / ')||'강한 역할 연결 미확인'}</p></div>${renderRoleStructure(model.teamAnalysis)}`;
    leadForecast.prepend(section);
  }
}

export function installTeamPlanDecorator(){
  const button=$('analyzeBtn');if(!button)return;
  button.addEventListener('click',()=>queueMicrotask(renderTeamCounterPlan));
}

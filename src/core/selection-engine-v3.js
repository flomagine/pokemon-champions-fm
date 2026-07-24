import * as base from './selection-engine-v2.js';
import { analyzeEnemyTeam, evaluateTeamCounterPlan } from './team-analysis-engine.js';

export * from './selection-engine-v2.js';

export function estimateOpponent(team,megaName='',forcedLead='',style='auto'){
  const model=base.estimateOpponent(team,megaName,forcedLead,style);
  const teamAnalysis=analyzeEnemyTeam(team,megaName,model);
  return{
    ...model,
    teamAnalysis,
    arch:{
      name:teamAnalysis.name,
      key:teamAnalysis.primary,
      note:teamAnalysis.note,
      confidence:teamAnalysis.confidence,
      secondary:teamAnalysis.secondary
    }
  };
}

function mergeBlockers(existing=[],priority=[]){
  const rows=[...priority,...existing],seen=new Set();
  return rows.filter(row=>{
    const name=row?.p?.name;
    if(!name||seen.has(name))return false;
    seen.add(name);return true;
  });
}

function mergeMissionJobs(contributions,missionRows){
  const out={...contributions};
  for(const mission of missionRows){
    const current=out[mission.id]||{value:0,jobs:[]};
    const additions=mission.targets.map(target=>({p:target.p,delta:Math.max(1,target.score),prob:target.prob,role:target.role,teamMission:true}));
    const seen=new Set();
    const jobs=[...additions,...(current.jobs||[])].filter(job=>{
      const name=job?.p?.name;
      if(!name||seen.has(name))return false;
      seen.add(name);return true;
    });
    out[mission.id]={...current,jobs};
  }
  return out;
}

export function rankFMPlans(team,megaName,model){
  const enrichedModel=model.teamAnalysis?model:{...model,teamAnalysis:analyzeEnemyTeam(team,megaName,model)};
  const plans=base.rankFMPlans(team,megaName,enrichedModel).map(plan=>{
    const teamPlan=evaluateTeamCounterPlan(team,plan.combo,plan.lead,enrichedModel,megaName);
    const delta=teamPlan.scoreDelta;
    const baseInfo={
      ...plan.base,
      blockers:mergeBlockers(plan.base.blockers||[],teamPlan.blockers||[]),
      hardGaps:[...new Set([...(plan.base.hardGaps||[]),...teamPlan.hardGaps])],
      axisWarnings:[...new Set([...(plan.base.axisWarnings||[]),...teamPlan.warnings])],
      contributions:mergeMissionJobs(plan.base.contributions||{},teamPlan.missions||[])
    };
    const mean=plan.mean+delta*.55;
    const worst=plan.worst+Math.min(delta*.75,delta*.45);
    const robust=plan.robust+delta;
    return{...plan,base:baseInfo,mean,worst,robust,teamPlan};
  });
  return plans.sort((a,b)=>b.robust-a.robust);
}

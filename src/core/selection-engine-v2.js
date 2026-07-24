import { rankFMPlans as baseRankFMPlans } from './selection-engine.js';
import { sustainGapForCombo } from './matchup-engine-v2.js';

export * from './selection-engine.js';

export function sustainSelectionPenalty(combo,t,model,megaName=''){
  let penalty=0;
  const warnings=[];
  const hardGaps=[];
  for(const p of t){
    const prob=model.probs[p.name]||0;
    const gap=sustainGapForCombo(combo,p,megaName);
    if(!gap)continue;
    if(!gap.hasBreaker){
      const confidenceWeight=gap.target.confidence==='높음'?16:10;
      const fixed=prob>=.2?5:0;
      penalty+=prob*confidenceWeight+fixed;
      warnings.push(`${p.name}: ${gap.warning}`);
      if(prob>=.2)hardGaps.push(`${p.name}(회복막이 돌파 없음)`);
    }else if(gap.breakers.length===1){
      penalty+=prob*2.5;
      warnings.push(`${p.name}: ${gap.warning}`);
    }
  }
  return{penalty,warnings:[...new Set(warnings)],hardGaps:[...new Set(hardGaps)]};
}

export function rankFMPlans(t,megaName,model){
  const plans=baseRankFMPlans(t,megaName,model).map(plan=>{
    const sustain=sustainSelectionPenalty(plan.combo,t,model,megaName);
    const base={
      ...plan.base,
      axisWarnings:[...new Set([...(plan.base.axisWarnings||[]),...sustain.warnings])],
      hardGaps:[...new Set([...(plan.base.hardGaps||[]),...sustain.hardGaps])]
    };
    const scenarioPenalty=sustain.penalty;
    const outcomes=(plan.outcomes||[]).map(outcome=>{
      let local=0;
      for(const p of outcome.sc.set){
        const gap=sustainGapForCombo(plan.combo,p,outcome.megaName||megaName);
        if(gap&&!gap.hasBreaker)local+=gap.target.confidence==='높음'?8:5;
        else if(gap&&gap.breakers.length===1)local+=1.5;
      }
      return{...outcome,score:outcome.score-local};
    });
    const wden=outcomes.reduce((sum,x)=>sum+(x.sc.weight||0),0)||1;
    const mean=outcomes.length?outcomes.reduce((sum,x)=>sum+x.score*(x.sc.weight||0),0)/wden:plan.mean-scenarioPenalty*.55;
    const meaningful=outcomes.filter(x=>(x.sc.weight||0)>=.025).sort((a,b)=>a.score-b.score);
    const worst=meaningful[0]?.score??(plan.worst-scenarioPenalty);
    const robust=plan.robust-scenarioPenalty+(mean-plan.mean)*.45+Math.min(0,worst-plan.worst)*.35;
    return{...plan,base,outcomes,mean,worst,robust,sustain};
  });
  return plans.sort((a,b)=>b.robust-a.robust);
}

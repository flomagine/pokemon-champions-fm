import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA } from '../src/data/pokemon-data.js';
import { speedEngine } from '../src/core/speed-engine.js';
import { configureCombatAudit } from '../src/core/matchup-engine-v2.js';
import { inferPokemonRoles, analyzeEnemyTeam, evaluateTeamCounterPlan } from '../src/core/team-analysis-engine.js';
import { estimateOpponent, rankFMPlans } from '../src/core/selection-engine-v3.js';

configureCombatAudit(speedEngine);
const mon=name=>DATA.roster.find(p=>p.name===name);

test('Toxapex is recognized as a multi-role stall core',()=>{
  const row=inferPokemonRoles(mon('더시마사리'));
  assert.ok(row.roles.recoveryWall>=.9);
  assert.ok(row.roles.statusSpreader>=.9);
  assert.ok(row.roles.regenerator>=.9);
  assert.ok(row.roles.trapper>=.5);
  assert.ok(row.roles.antiSetup>=.5);
});

test('stall team is classified from role structure, not one Pokemon',()=>{
  const team=['더시마사리','하마돈','블래키','야도란','아머까오','따라큐'].map(mon);
  const analysis=analyzeEnemyTeam(team);
  assert.ok(['fullStall','semiStall','regenStall','hazardStall'].includes(analysis.primary));
  assert.ok(analysis.features.recN>=3);
  assert.ok(analysis.edges.some(edge=>edge.reasons.some(reason=>reason.includes('상태이상')||reason.includes('함정'))));
  assert.ok(analysis.keyTargets.length===6);
});

test('Bellibolt role gap changes the counter plan',()=>{
  const team=['찌리배리','마스카나','마폭시','갸라도스','팬텀','따라큐'].map(mon);
  const model=estimateOpponent(team,'');
  model.probs['찌리배리']=.75;
  const noBreaker=evaluateTeamCounterPlan(team,['rotomh','prim','venusaur'],'rotomh',model,'');
  const withBreaker=evaluateTeamCounterPlan(team,['garchomp','rotomh','prim'],'garchomp',model,'');
  assert.ok(noBreaker.hardGaps.some(x=>x.includes('찌리배리')));
  assert.ok(!withBreaker.hardGaps.some(x=>x.includes('찌리배리: 회복 루프')));
  assert.ok(withBreaker.scoreDelta>noBreaker.scoreDelta);
});

test('team-aware selection still produces 60 plans',()=>{
  const team=['더시마사리','하마돈','블래키','마스카나','따라큐','마폭시'].map(mon);
  const model=estimateOpponent(team,'');
  const plans=rankFMPlans(team,'',model);
  assert.equal(plans.length,60);
  assert.ok(plans[0].teamPlan);
  assert.ok(Number.isFinite(plans[0].robust));
  assert.ok(model.arch.note.includes('역할 구조'));
});

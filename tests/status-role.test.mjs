import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA } from '../src/data/pokemon-data.js';
import { analyzeEnemyTeam, inferPokemonRoles, ownToolProfile, statusPlanFor } from '../src/core/team-analysis-engine.js';

const mon=name=>DATA.roster.find(p=>p.name===name);

test('centrality is propagated to analyzed rows',()=>{
  const team=['더시마사리','하마돈','블래키','야도란','아머까오','따라큐'].map(mon);
  const analysis=analyzeEnemyTeam(team);
  assert.equal(analysis.rows.length,6);
  assert.ok(analysis.rows.every(row=>Number.isFinite(row.centrality)&&row.centrality>0));
  assert.ok(analysis.rows[0].centrality>=analysis.rows.at(-1).centrality);
});

test('Water Soak prevents treating native poison typing as a Toxic answer',()=>{
  const bellibolt=inferPokemonRoles(mon('찌리배리'));
  const tools=['venusaur','mimi','incin'].map(ownToolProfile);
  const plan=statusPlanFor(bellibolt,tools,false);
  assert.equal(plan.covered,false);
  assert.ok(plan.reason.includes('타입 변경'));
});

test('Yawn with a pivot is partial mitigation, not a full answer',()=>{
  const hippowdon=inferPokemonRoles(mon('하마돈'));
  const tools=['rotomh','prim','venusaur'].map(ownToolProfile);
  const plan=statusPlanFor(hippowdon,tools,false);
  assert.equal(plan.covered,true);
  assert.equal(plan.partial,true);
  assert.ok(plan.reason.includes('함정'));
});

test('burn punishes a purely physical group without Fire typing or denial',()=>{
  const slowbro=inferPokemonRoles(mon('야도란'));
  const physicalTools=[
    {types:['땅'],special:false,pivot:[],denial:[],toxicImmune:false},
    {types:['고스트'],special:false,pivot:[],denial:[],toxicImmune:false}
  ];
  const plan=statusPlanFor(slowbro,physicalTools,false);
  assert.equal(plan.covered,false);
  assert.ok(plan.reason.includes('화상'));
});


import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA, OWN, MEGA_TYPES } from '../src/data/pokemon-data.js';
import { MEGA_STATS_V43 } from '../src/data/meta-data.js';
import { eff } from '../src/core/type-system.js';
import { defenseProfile } from '../src/core/defense-engine.js';
import { speedEngine } from '../src/core/speed-engine.js';
import { configureCombatAudit, bestFor } from '../src/core/matchup-engine.js';
import { estimateOpponent, rankFMPlans } from '../src/core/selection-engine.js';

configureCombatAudit(speedEngine);

test('catalog integrity',()=>{
  assert.equal(DATA.roster.length,235);
  assert.equal(Object.keys(MEGA_TYPES).length,75);
  assert.equal(Object.keys(MEGA_STATS_V43).length,32);
  assert.equal(Object.keys(OWN).length,6);
});

test('dual type effectiveness',()=>{
  assert.equal(eff('전기',['물','비행']),4);
  assert.equal(eff('페어리',['독']),0.5);
});

test('defense investment direction',()=>{
  const bellibolt=DATA.roster.find(p=>p.name==='찌리배리');
  const d=defenseProfile(bellibolt,'');
  assert.equal(d.recommendation,'physical');
});

test('Greninja sequence penalizes Primarina',()=>{
  const greninja=DATA.roster.find(p=>p.name==='개굴닌자');
  const audit=speedEngine.exchangeAudit(greninja,'prim','',{recommendedMove:'문포스',proteanState:'fresh',speedState:'auto',itemState:'ready'});
  assert.equal(audit.relation.result,'enemy');
  assert.ok(audit.gradeCap<=1);
  assert.ok(audit.typeShift);
  assert.equal(audit.responseMult,0.5);
});

test('all matchup profiles resolve',()=>{
  for(const p of DATA.roster){
    const mega=(DATA.megaOptions[p.name]||[])[0]||'';
    const result=bestFor(p,mega);
    assert.equal(result.arr.length,6,p.name);
  }
});


test('sample team produces 60 ranked plans',()=>{
  const names=['마스카나','파라블레이즈','갸라도스','하마돈','찌리배리','마폭시'];
  const team=names.map(name=>DATA.roster.find(p=>p.name===name));
  const model=estimateOpponent(team,'');
  const plans=rankFMPlans(team,'',model);
  assert.equal(plans.length,60);
  assert.equal(plans[0].combo.length,3);
  assert.ok(Number.isFinite(plans[0].robust));
});

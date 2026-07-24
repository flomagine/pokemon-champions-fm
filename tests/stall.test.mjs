import test from 'node:test';
import assert from 'node:assert/strict';
import { DATA } from '../src/data/pokemon-data.js';
import { speedEngine } from '../src/core/speed-engine.js';
import { configureCombatAudit, wallBreakPressure, sustainGapForCombo } from '../src/core/matchup-engine-v2.js';
import { sustainSelectionPenalty } from '../src/core/selection-engine-v2.js';

configureCombatAudit(speedEngine);
const bellibolt=DATA.roster.find(p=>p.name==='찌리배리');

test('Bellibolt distinguishes a breaker from temporary control',()=>{
  const rotom=wallBreakPressure(bellibolt,'rotomh','');
  const garchomp=wallBreakPressure(bellibolt,'garchomp','');
  assert.equal(rotom.sustain.canBreak,false);
  assert.equal(rotom.sustain.canControl,true);
  assert.equal(garchomp.sustain.canBreak,true);
  assert.ok(garchomp.score>rotom.score);
  assert.ok(rotom.sustain.gradeCap<=3);
});

test('Bellibolt creates a selection gap without sustained damage',()=>{
  const noBreaker=sustainGapForCombo(['rotomh','prim','venusaur'],bellibolt,'');
  const withBreaker=sustainGapForCombo(['rotomh','prim','garchomp'],bellibolt,'');
  assert.equal(noBreaker.hasBreaker,false);
  assert.equal(withBreaker.hasBreaker,true);
  assert.deepEqual(withBreaker.breakers.map(x=>x.id),['garchomp']);
});

test('selection penalty is much larger without Garchomp',()=>{
  const team=[bellibolt];
  const model={probs:{찌리배리:1}};
  const noBreaker=sustainSelectionPenalty(['rotomh','prim','venusaur'],team,model,'');
  const withBreaker=sustainSelectionPenalty(['rotomh','prim','garchomp'],team,model,'');
  assert.ok(noBreaker.penalty>=15);
  assert.ok(noBreaker.penalty>withBreaker.penalty+10);
  assert.ok(noBreaker.hardGaps.some(x=>x.includes('찌리배리')));
});

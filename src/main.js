import { speedEngine } from './core/speed-engine.js';
import { configureCombatAudit } from './core/matchup-engine-v2.js';
import { SimulatorApp } from './ui/simulator-app.js';

configureCombatAudit(speedEngine);
const app = new SimulatorApp();
window.PokemonChampionsFM = { app, version: '5.2.0-team-analysis' };
app.bootstrap();

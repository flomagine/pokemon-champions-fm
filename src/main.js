
import { speedEngine } from './core/speed-engine.js';
import { configureCombatAudit } from './core/matchup-engine.js';
import { SimulatorApp } from './ui/simulator-app.js';

configureCombatAudit(speedEngine);
const app = new SimulatorApp();
window.PokemonChampionsFM = { app, version: '5.0.0-se' };
app.bootstrap();

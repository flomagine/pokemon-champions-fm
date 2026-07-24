
import { MEGA_STATS_V43 } from '../data/meta-data.js';
import { defenseAxisText as baseDefenseAxisText } from '../core/defense-engine-v2.js';
import { speedProfileV42 } from '../core/speed-engine.js';

export function formatDefenseAxis(p,megaName=''){
  const base=baseDefenseAxisText(p,megaName),sp=speedProfileV42(p,megaName,'auto'),s=MEGA_STATS_V43[megaName];
  const statLine=s?`<br><b>메가 종족값:</b> HP ${s.hp} / 공 ${s.atk} / 방 ${s.def} / 특공 ${s.spa} / 특방 ${s.spd} / 스핏 ${s.spe}${s.ranked?'':' · 랭크 표본 없음'}`:'';
  return `${base}<div class="axisdetail"><b>스피드:</b> ${sp.label} · ${sp.confidence} 신뢰${sp.notes.length?' · '+sp.notes.join(' / '):''}${statLine}</div>`;
}

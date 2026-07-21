import { DATA, TYPE_CHART, MEGA_TYPES } from '../data/pokemon-data.js';

export function battleTypes(p,megaName=''){
 const legal=(DATA.megaOptions[p.name]||[]).includes(megaName);
 return legal&&MEGA_TYPES[megaName]?MEGA_TYPES[megaName]:p.types;
}

export function eff(move,types){return types.reduce((v,t)=>v*((TYPE_CHART[move]||{})[t]??1),1)}

export function norm(s){return(s||'').toLowerCase().replace(/^메가\s*/,'').replace(/[\s·()\-_.의모습]/g,'')}

export function cho(s){const f=['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];let o='';for(const ch of s){const c=ch.charCodeAt(0);if(c>=0xAC00&&c<=0xD7A3)o+=f[Math.floor((c-0xAC00)/588)];else if(/[ㄱ-ㅎ]/.test(ch))o+=ch}return o}

export function megaTerms(p){return(DATA.megaOptions[p.name]||[]).map(x=>x.replace(/^메가/,''))}

export function search(q,exclude=[],limit=18){let n=norm(q),c=cho(q.replace(/^메가\s*/,''));return DATA.roster.filter(p=>!exclude.includes(p.name)).map(p=>{let names=[p.name,...(p.aliases||[]),...megaTerms(p)],nn=names.map(norm),s=0;if(!n&&!c)s=1000-p.rank;else{if(nn.some(x=>x===n))s=10000;if(nn.some(x=>x.startsWith(n)))s=Math.max(s,8000);if(nn.some(x=>x.includes(n)))s=Math.max(s,6000);if(c&&names.some(x=>cho(x).startsWith(c)))s=Math.max(s,5000);s-=p.rank/1000}return{p,s}}).filter(x=>x.s>0).sort((a,b)=>b.s-a.s||a.p.rank-b.p.rank).slice(0,limit).map(x=>x.p)}


export class TypeSystem {
  battleTypes(...args){ return battleTypes(...args); }
  effectiveness(...args){ return eff(...args); }
  normalize(...args){ return norm(...args); }
  initials(...args){ return cho(...args); }
  search(...args){ return search(...args); }
}
export const typeSystem = new TypeSystem();

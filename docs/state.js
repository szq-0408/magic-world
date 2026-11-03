import { houses, questions } from './data.js';
export const defaultAudio = () => ({muted:true,music:{enabled:true,volume:12},ambience:{enabled:true,volume:8},effects:{enabled:true,volume:15}});
export const newJourney = () => ({name:'',house:null,scores:[],spells:[],pages:[],keeper:false,answers:{},question:0,revealed:[]});
export const initialState = () => ({lang:'en',journey:newJourney(),audio:defaultAudio()});
export function normalizeState(input) {
 const s=initialState(); if(!input || typeof input!=='object')return s;
 s.lang=input.lang==='zh'?'zh':'en'; const j=input.journey||{};
 s.journey.name=typeof j.name==='string'?j.name.slice(0,24):'';
 s.journey.house=houses.some(h=>h.id===j.house)?j.house:null;
 for(const k of ['pages','revealed'])s.journey[k]=[...new Set(Array.isArray(j[k])?j[k].filter(id=>houses.some(h=>h.id===id)):[])];
 s.journey.spells=[...new Set(Array.isArray(j.spells)?j.spells.filter(id=>['lumos','nox','leviosa','alohomora'].includes(id)):[])];
 s.journey.keeper=j.keeper===true&&s.journey.pages.length===4;
 s.journey.scores=Array.isArray(j.scores)&&j.scores.length===4?j.scores.map(n=>Number.isFinite(n)?n:0):[];
 for(const q of questions)if(q.options.some(o=>o.id===j.answers?.[q.id]))s.journey.answers[q.id]=j.answers[q.id];
 s.journey.question=Number.isInteger(j.question)?Math.min(7,Math.max(0,j.question)):0;
 if(input.audio){s.audio.muted=input.audio.muted!==false;for(const k of ['music','ambience','effects']){const a=input.audio[k];if(a){s.audio[k].enabled=a.enabled!==false;s.audio[k].volume=Number.isFinite(a.volume)?Math.max(0,Math.min(100,a.volume)):s.audio[k].volume;}}}
 return s;
}
export function scoreAnswers(answers){const scores=[0,0,0,0];for(const q of questions){const o=q.options.find(o=>o.id===answers[q.id]);if(o)o.weights.forEach((v,i)=>scores[i]+=v);}return scores;}
export function candidates(scores){return houses.filter((_,i)=>scores[i]===Math.max(...scores)).map(h=>h.id);}
export function collectPage(journey,id){if(houses.some(h=>h.id===id)&&!journey.pages.includes(id))journey.pages.push(id);}

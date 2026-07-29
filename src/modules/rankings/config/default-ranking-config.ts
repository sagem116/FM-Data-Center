export type RankingModule = 'all' | 'superleague' | 'national' | 'continental' | 'international'
export type RankingMode = 'weighted' | 'raw'
export type RankingEntity = 'clubs' | 'coaches' | 'countries' | 'players' | 'competitions'
export interface DecayMultipliers { last:number; age1:number; age2:number; age3:number; older:number }
export interface StageMultipliers { finalist:number; semi:number; quarter:number }
export interface NamedWeight { match:string; label:string; weight:number }
export interface RankingConfig { version:2; name:string; positionPoints:Record<number,number>; divisionWeights:Record<number,number>; competitionWeights:{national:number;continental:number;superleague:number;international:number}; nationalChampionBonus:number; superleagueChampionBonus:number; superleaguePromotionBonus:number; decayMultipliers:DecayMultipliers; stageMultipliers:StageMultipliers; titleWeights:NamedWeight[]; nationalLeagueWeights:NamedWeight[]; internationalWeights:NamedWeight[]; competitionSpecificWeights:NamedWeight[]; competitionAliases:Record<string,string>; hiddenCompetitions:string[] }
const base:Record<number,number>={1:1000,2:800,3:650,4:500,5:400,6:320,7:260,8:210,9:170,10:140,11:115,12:95,13:78,14:64,15:52,16:42,17:34,18:27,19:21,20:16}
export const OLD_APP_DEFAULT_CONFIG:RankingConfig={version:2,name:'Configuração original FM Rankings',positionPoints:(()=>{const out={...base};for(let p=21;p<=100;p++)out[p]=Math.max(1,Math.round(16-(p-20)*.18));return out})(),divisionWeights:{1:2.3,2:1.55,3:1.1,4:.87,5:.75,6:.58,7:.44,8:.32,9:.22,10:.14,11:.08},competitionWeights:{national:1,continental:1.5,superleague:2,international:1.5},nationalChampionBonus:300,superleagueChampionBonus:400,superleaguePromotionBonus:200,decayMultipliers:{last:1,age1:.85,age2:.7,age3:.55,older:.4},stageMultipliers:{finalist:.25,semi:.125,quarter:.06},titleWeights:[],nationalLeagueWeights:[],internationalWeights:[],competitionSpecificWeights:[],competitionAliases:{},hiddenCompetitions:[]}

/** Alias canónico para consumidores e testes. */
export const defaultRankingConfig = OLD_APP_DEFAULT_CONFIG

export function cloneRankingConfig(c:RankingConfig):RankingConfig{return JSON.parse(JSON.stringify(c)) as RankingConfig}
export function positionPoints(c:RankingConfig,p?:number){if(!p||p<1)return 0;return c.positionPoints[p]??Math.max(2,Math.round(16-(p-20)*1.2))}
export function decayMultiplier(c:RankingConfig,end:number,latest:number){const a=Math.max(0,latest-end);return a===0?c.decayMultipliers.last:a===1?c.decayMultipliers.age1:a===2?c.decayMultipliers.age2:a===3?c.decayMultipliers.age3:c.decayMultipliers.older}
export function namedWeight(items:NamedWeight[],name:string,fallback:number){const n=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const found=items.find(i=>n.includes(i.match.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()));return found?.weight??fallback}

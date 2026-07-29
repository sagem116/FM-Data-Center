import { db } from '../../../database/db'
import type { Club, Coach, CoachSeason, Competition, Player, PlayerCompetitionStats, PlayerSeason, Season, Standing } from '../../../shared/types/entities'
import { IMPORT_COMPLETED_EVENT } from '../../imports/services/import-events'

export interface AnalyticsBundle { seasons:Season[]; players:Player[]; playerSeasons:PlayerSeason[]; stats:PlayerCompetitionStats[]; clubs:Club[]; competitions:Competition[]; coaches:Coach[]; coachSeasons:CoachSeason[]; standings:Standing[] }
let cache: AnalyticsBundle | null = null
export async function loadAnalyticsBundle(force=false):Promise<AnalyticsBundle>{
  if(cache&&!force)return cache
  const [seasons,players,playerSeasons,stats,clubs,competitions,coaches,coachSeasons,standings]=await Promise.all([db.seasons.toArray(),db.players.toArray(),db.playerSeasons.toArray(),db.playerCompetitionStats.toArray(),db.clubs.toArray(),db.competitions.toArray(),db.coaches.toArray(),db.coachSeasons.toArray(),db.standings.toArray()])
  cache={seasons:seasons.sort((a,b)=>a.startYear-b.startYear),players,playerSeasons,stats,clubs,competitions,coaches,coachSeasons,standings};return cache
}
export function clearAnalyticsCache(){cache=null}
if(typeof window!=='undefined')window.addEventListener(IMPORT_COMPLETED_EVENT,clearAnalyticsCache)
export const average=(values:Array<number|undefined|null>)=>{const valid=values.filter((v):v is number=>typeof v==='number'&&Number.isFinite(v));return valid.length?valid.reduce((a,b)=>a+b,0)/valid.length:undefined}
export const sum=(values:Array<number|undefined|null>)=>values.reduce<number>((total,value)=>total+(typeof value==='number'&&Number.isFinite(value)?value:0),0)
export const metric=(row:PlayerCompetitionStats,keys:string[])=>{for(const key of keys){const value=row.metrics[key];if(typeof value==='number'&&Number.isFinite(value))return value}return undefined}
export const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('pt-PT').replace(/[^a-z0-9]+/g,' ').trim()
export const money=(value?:number)=>value===undefined?'—':new Intl.NumberFormat('pt-PT',{style:'currency',currency:'EUR',notation:'compact',maximumFractionDigits:1}).format(value)
export const num=(value?:number,digits=1)=>value===undefined?'—':value.toLocaleString('pt-PT',{maximumFractionDigits:digits})

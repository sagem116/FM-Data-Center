import type {Club,Coach,CoachSeason,Competition,Player,PlayerCompetitionStats,Season,Standing} from '../../../shared/types/entities'
import {decayMultiplier,namedWeight,positionPoints,type RankingConfig,type RankingEntity,type RankingMode,type RankingModule} from '../config/default-ranking-config'
import type {Challenge,ChallengeRequirement,ChallengeSubject} from '../../challenges/challenges'
export interface Achievement{seasonId:string;seasonLabel:string;competition:string;kind:'title'|'promotion'|'near-promotion'|'near-title'|'finalist'|'semi'|'quarter';detail:string}
export interface RankingContribution{id:string;seasonId:string;seasonLabel:string;competitionId:string;competitionName:string;module:Exclude<RankingModule,'all'>;stage:string;raw:number;competitionWeight:number;divisionWeight:number;decay:number;weighted:number}
export interface ChallengeAward{name:string;bonus:number;years:number[]}
export interface RankingEntry{rank:number;entityId?:string;name:string;raw:number;weighted:number;competitiveRaw:number;competitiveWeighted:number;challengePoints:number;seasons:number;competitions:number;titles:number;promotions:number;nearPromotions:number;nearTitles:number;achievements:Achievement[];challengeAwards:ChallengeAward[];contributions:RankingContribution[];meta?:Record<string,string|number|null|undefined>}
export interface RankingResult{entries:RankingEntry[];latestSeason?:string;totalContributions:number}
export interface RankingData{standings:Standing[];competitions:Competition[];seasons:Season[];clubs:Club[];coaches:Coach[];coachSeasons:CoachSeason[];players:Player[];playerStats:PlayerCompetitionStats[]}
const norm=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
export function competitionModule(c:Competition|undefined,name:string):Exclude<RankingModule,'all'>{if(c?.type==='super-league')return'superleague';if(c?.type==='national')return'national';if(c?.type==='continental')return'continental';if(c?.type==='international')return'international';const n=norm(name);if(n.includes('super league')||n.includes('superleague'))return'superleague';if(n.includes('champions league')||n.includes('libertadores')||n.includes('confederation')||n.includes('continental'))return'continental';if(n.includes('euro')||n.includes('copa america')||n.includes('world cup')||n.includes('internacional'))return'international';return'national'}
export function divisionNumber(name:string){const n=norm(name);const direct=n.match(/(?:super\s*league|superliga|divisao)[^0-9]{0,12}(\d{1,2})/);if(direct)return Number(direct[1]);const trailing=n.match(/\b(\d{1,2})\b/);return trailing?Number(trailing[1]):undefined}
function isChampion(s:Standing,module:Exclude<RankingModule,'all'>){return module==='superleague'?norm(s.info??'')==='c':s.position===1||norm(s.info??'')==='c'}
function isPromoted(s:Standing,module:Exclude<RankingModule,'all'>){if(module!=='superleague')return false;const info=norm(s.info??'');const division=divisionNumber(s.competitionName)??1;return (division > 1 && s.position === 1) || info === 'p' || info.includes('prom')}
function stageRaw(config:RankingConfig,s:Standing,module:Exclude<RankingModule,'all'>){if(s.format==='league'){const base=positionPoints(config,s.position);if(isChampion(s,module))return base+(module==='superleague'?config.superleagueChampionBonus:config.nationalChampionBonus);return base}const stage=norm(s.stage??'');const base=namedWeight(module==='international'?config.internationalWeights:config.titleWeights,s.competitionName,150);if(stage==='winner')return base;if(stage==='finalist')return base*config.stageMultipliers.finalist;if(stage.includes('semi'))return base*config.stageMultipliers.semi;if(stage.includes('quarter'))return base*config.stageMultipliers.quarter;return 0}
function achievementsFor(s:Standing,module:Exclude<RankingModule,'all'>,label:string):Achievement[]{const out:Achievement[]=[];if(s.format==='league'){if(isChampion(s,module))out.push({seasonId:s.seasonId,seasonLabel:label,competition:s.competitionName,kind:'title',detail:module==='superleague'?'Campeão (Inf=C)':'Campeão'});if(isPromoted(s,module))out.push({seasonId:s.seasonId,seasonLabel:label,competition:s.competitionName,kind:'promotion',detail:`Promoção · 1.º lugar na divisão ${divisionNumber(s.competitionName)??'—'}`});if(module==='superleague'&&s.position&&s.position>=2&&s.position<=5)out.push({seasonId:s.seasonId,seasonLabel:label,competition:s.competitionName,kind:s.position===2?'near-title':'near-promotion',detail:`${s.position}.º lugar`});return out}const st=norm(s.stage??'');const kind=st==='winner'?'title':st==='finalist'?'finalist':st.includes('semi')?'semi':st.includes('quarter')?'quarter':undefined;if(kind)out.push({seasonId:s.seasonId,seasonLabel:label,competition:s.competitionName,kind,detail:s.stage??kind});return out}
function blank(name:string,id?:string):RankingEntry{return{rank:0,entityId:id,name,raw:0,weighted:0,competitiveRaw:0,competitiveWeighted:0,challengePoints:0,seasons:0,competitions:0,titles:0,promotions:0,nearPromotions:0,nearTitles:0,achievements:[],challengeAwards:[],contributions:[]}}
function finish(entries:RankingEntry[],mode:RankingMode){for(const e of entries){e.titles=e.achievements.filter(a=>a.kind==='title').length;e.promotions=e.achievements.filter(a=>a.kind==='promotion').length;e.nearPromotions=e.achievements.filter(a=>a.kind==='near-promotion').length;e.nearTitles=e.achievements.filter(a=>a.kind==='near-title'||a.kind==='finalist').length;e.seasons=new Set(e.contributions.map(c=>c.seasonId)).size;e.competitions=new Set(e.contributions.map(c=>c.competitionId)).size;e.competitiveRaw=e.contributions.reduce((s,c)=>s+c.raw,0);e.competitiveWeighted=e.contributions.reduce((s,c)=>s+c.weighted,0);e.raw=e.competitiveRaw+e.challengePoints;e.weighted=e.competitiveWeighted+e.challengePoints}return entries.sort((a,b)=>(mode==='raw'?b.raw-a.raw:b.weighted-a.weighted)||a.name.localeCompare(b.name)).map((e,i)=>({...e,rank:i+1}))}
function consecutive(years:number[],need:number){const s=[...new Set(years)].sort((a,b)=>a-b);let run=0,last=-99;for(const y of s){run=y===last+1?run+1:1;if(run>=need)return true;last=y}return false}
function reqYears(req:ChallengeRequirement,e:RankingEntry,data:RankingData,moduleByContribution:Map<string,string>,subject:ChallengeSubject){const match=norm(req.match);const years:number[]=[];for(const a of e.achievements){const year=data.seasons.find(s=>s.id===a.seasonId)?.endYear??0;const module=moduleByContribution.get(`${a.seasonId}|${a.competition}`);let ok=false;if(req.type==='superleague-champion')ok=module==='superleague'&&a.kind==='title';if(req.type==='superleague-promotion')ok=module==='superleague'&&(a.kind==='title'||a.kind==='promotion');if(req.type==='national-champion')ok=module==='national'&&a.kind==='title';if(req.type==='continental-winner')ok=module==='continental'&&a.kind==='title';if(req.type==='international-winner')ok=module==='international'&&a.kind==='title';if(match&&!norm(a.competition).includes(match))ok=false;if(ok)years.push(year)}if(req.type==='unbeaten-season'||req.type==='points-record'){const clubNames=subject==='clubs'?[e.name]:[];for(const s of data.standings){if(!clubNames.includes(s.entityName)||s.format!=='league')continue;const m=competitionModule(data.competitions.find(c=>c.id===s.competitionId),s.competitionName);if(req.leagueScope&&req.leagueScope!=='any'&&m!==req.leagueScope)continue;if(req.type==='unbeaten-season'&&s.losses===0&&(s.played??0)>0)years.push(data.seasons.find(x=>x.id===s.seasonId)?.endYear??0);if(req.type==='points-record'&&s.points!=null){const peers=data.standings.filter(x=>x.competitionId===s.competitionId&&x.seasonId!==s.seasonId&&x.points!=null);if(peers.every(x=>(x.points??0)<(s.points??0)))years.push(data.seasons.find(x=>x.id===s.seasonId)?.endYear??0)}}}return years.filter(Boolean)}
function applyChallenges(entries:RankingEntry[],challenges:Challenge[],subject:ChallengeSubject,data:RankingData){const moduleMap=new Map<string,string>();for(const s of data.standings)moduleMap.set(`${s.seasonId}|${s.competitionName}`,competitionModule(data.competitions.find(c=>c.id===s.competitionId),s.competitionName));for(const e of entries)for(const ch of challenges.filter(c=>c.subjects.includes(subject))){const all=ch.requirements.map(r=>reqYears(r,e,data,moduleMap,subject));const passed=all.every((ys,i)=>ch.requirements[i].consecutive?consecutive(ys,ch.requirements[i].count):new Set(ys).size>=ch.requirements[i].count);if(!passed)continue;if(ch.sameYear&&!all[0].some(y=>all.slice(1).every(a=>a.includes(y))))continue;const years=[...new Set(all.flat())].sort((a,b)=>a-b);e.challengePoints+=ch.bonus;e.challengeAwards.push({name:ch.name,bonus:ch.bonus,years})}}
export function computeRankings(input:{data:RankingData;config:RankingConfig;entity:RankingEntity;module:RankingModule;withDecay:boolean;mode:RankingMode;seasonId?:string;seasonFromId?:string;seasonToId?:string;competitionId?:string;challenges:Challenge[]}):RankingResult {
  const d = input.data
  const seasonMap = new Map(d.seasons.map((season) => [season.id, season]))
  const competitionMap = new Map(d.competitions.map((competition) => [competition.id, competition]))
  const clubMap = new Map(d.clubs.map((club) => [club.id, club]))
  const coachMap = new Map(d.coaches.map((coach) => [coach.id, coach]))
  const playerMap = new Map(d.players.map((player) => [player.id, player]))
  const fromYear = input.seasonFromId ? seasonMap.get(input.seasonFromId)?.startYear : undefined
  const toYear = input.seasonToId ? seasonMap.get(input.seasonToId)?.endYear : undefined
  const selected = d.standings.filter((standing) => {
    const season = seasonMap.get(standing.seasonId)
    if (input.seasonId && standing.seasonId !== input.seasonId) return false
    if (fromYear && season && season.startYear < fromYear) return false
    if (toYear && season && season.endYear > toYear) return false
    if (input.competitionId && standing.competitionId !== input.competitionId) return false
    return true
  })
  const latest = Math.max(...selected.map((standing) => seasonMap.get(standing.seasonId)?.endYear ?? 0), 0)
  const clubs = new Map<string, RankingEntry>()
  const contributionsByClubSeason = new Map<string, RankingContribution[]>()
  const achievementsByClubSeason = new Map<string, Achievement[]>()

  for (const standing of selected) {
    const module = competitionModule(competitionMap.get(standing.competitionId), standing.competitionName)
    if (input.module !== 'all' && module !== input.module) continue
    const raw = stageRaw(input.config, standing, module)
    if (raw <= 0) continue
    const baseCompetitionWeight = input.config.competitionWeights[module]
    const moduleWeight = module === 'national'
      ? namedWeight(input.config.nationalLeagueWeights, standing.competitionName, baseCompetitionWeight)
      : baseCompetitionWeight
    const competitionWeight = namedWeight(input.config.competitionSpecificWeights, standing.competitionName, moduleWeight)
    const divisionWeight = module === 'superleague'
      ? input.config.divisionWeights[divisionNumber(standing.competitionName) ?? 0] ?? 1
      : 1
    const season = seasonMap.get(standing.seasonId)
    const decay = input.withDecay && season ? decayMultiplier(input.config, season.endYear, latest) : 1
    const contribution: RankingContribution = {
      id: standing.id,
      seasonId: standing.seasonId,
      seasonLabel: season?.label ?? standing.seasonId,
      competitionId: standing.competitionId,
      competitionName: standing.competitionName,
      module,
      stage: standing.stage ?? (standing.position ? `${standing.position}.º` : '—'),
      raw,
      competitionWeight,
      divisionWeight,
      decay,
      weighted: raw * competitionWeight * divisionWeight * decay,
    }
    const key = standing.entityId ?? norm(standing.entityName)
    const entry = clubs.get(key) ?? blank(standing.entityName, standing.entityId)
    const achievements = achievementsFor(standing, module, contribution.seasonLabel)
    entry.contributions.push(contribution)
    entry.achievements.push(...achievements)
    clubs.set(key, entry)
    if (standing.entityId) {
      const clubSeasonKey = `${standing.entityId}|${standing.seasonId}`
      const contributions = contributionsByClubSeason.get(clubSeasonKey) ?? []
      contributions.push(contribution)
      contributionsByClubSeason.set(clubSeasonKey, contributions)
      const seasonAchievements = achievementsByClubSeason.get(clubSeasonKey) ?? []
      seasonAchievements.push(...achievements)
      achievementsByClubSeason.set(clubSeasonKey, seasonAchievements)
    }
  }

  let entries = [...clubs.values()]

  if (input.entity === 'coaches') {
    const byCoach = new Map<string, RankingEntry>()
    for (const coachSeason of d.coachSeasons) {
      if (!coachSeason.currentClubId) continue
      const contributions = contributionsByClubSeason.get(`${coachSeason.currentClubId}|${coachSeason.seasonId}`)
      if (!contributions?.length) continue
      const coach = coachMap.get(coachSeason.coachId)
      if (!coach) continue
      const entry = byCoach.get(coach.id) ?? blank(coach.name, coach.id)
      entry.contributions.push(...contributions)
      entry.achievements.push(...(achievementsByClubSeason.get(`${coachSeason.currentClubId}|${coachSeason.seasonId}`) ?? []))
      byCoach.set(coach.id, entry)
    }
    entries = [...byCoach.values()]
  }

  if (input.entity === 'countries') {
    const byCountry = new Map<string, RankingEntry>()
    for (const clubEntry of clubs.values()) {
      const country = clubEntry.entityId?.startsWith('country:')
        ? clubEntry.name
        : clubMap.get(clubEntry.entityId ?? '')?.country
      if (!country) continue
      const entry = byCountry.get(country) ?? blank(country, `country:${norm(country)}`)
      entry.contributions.push(...clubEntry.contributions)
      entry.achievements.push(...clubEntry.achievements)
      byCountry.set(country, entry)
    }
    entries = [...byCountry.values()]
  }

  if (input.entity === 'players') {
    const byPlayer = new Map<string, RankingEntry>()
    const seenPlayerClubSeason = new Set<string>()
    for (const stat of d.playerStats) {
      if (!stat.clubId) continue
      const player = playerMap.get(stat.playerId)
      if (!player) continue
      const relationKey = `${player.id}|${stat.clubId}|${stat.seasonId}`
      if (seenPlayerClubSeason.has(relationKey)) continue
      seenPlayerClubSeason.add(relationKey)
      const contributions = contributionsByClubSeason.get(`${stat.clubId}|${stat.seasonId}`)
      if (!contributions?.length) continue
      const entry = byPlayer.get(player.id) ?? blank(player.name, player.id)
      entry.contributions.push(...contributions)
      entry.achievements.push(...(achievementsByClubSeason.get(`${stat.clubId}|${stat.seasonId}`) ?? []))
      byPlayer.set(player.id, entry)
    }
    for (const entry of byPlayer.values()) {
      entry.contributions = [...new Map(entry.contributions.map((contribution) => [contribution.id, contribution])).values()]
      entry.achievements = [...new Map(entry.achievements.map((achievement) => [`${achievement.seasonId}|${achievement.competition}|${achievement.kind}`, achievement])).values()]
    }
    entries = [...byPlayer.values()]
  }

  if (input.entity === 'competitions') {
    const byCompetition = new Map<string, RankingEntry>()
    for (const clubEntry of clubs.values()) {
      for (const contribution of clubEntry.contributions) {
        const entry = byCompetition.get(contribution.competitionId) ?? blank(contribution.competitionName, contribution.competitionId)
        entry.contributions.push(contribution)
        entry.achievements.push(...clubEntry.achievements.filter((achievement) => achievement.seasonId === contribution.seasonId && achievement.competition === contribution.competitionName))
        byCompetition.set(contribution.competitionId, entry)
      }
    }
    entries = [...byCompetition.values()]
  }

  if (input.entity === 'clubs' || input.entity === 'coaches' || input.entity === 'countries') {
    applyChallenges(entries, input.challenges, input.entity, d)
  }
  entries = finish(entries, input.mode)
  return {
    entries,
    latestSeason: d.seasons.find((season) => season.endYear === latest)?.label,
    totalContributions: entries.reduce((sum, entry) => sum + entry.contributions.length, 0),
  }
}

/** Compatibility wrapper retained for the validated v0.5 tests and external consumers. */
export function computeClubRankings(input:{standings:Standing[];competitions:Competition[];seasons:Season[];config:RankingConfig;module:RankingModule;withDecay:boolean;mode:RankingMode;seasonId?:string}):RankingResult{return computeRankings({data:{standings:input.standings,competitions:input.competitions,seasons:input.seasons,clubs:[],coaches:[],coachSeasons:[],players:[],playerStats:[]},config:input.config,entity:'clubs',module:input.module,withDecay:input.withDecay,mode:input.mode,seasonId:input.seasonId,challenges:[]})}

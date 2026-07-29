import {cloneRankingConfig,OLD_APP_DEFAULT_CONFIG,type RankingConfig} from './default-ranking-config'
const KEY='fm-data-center-ranking-config-v2';const PROFILES='fm-data-center-ranking-profiles-v1';const ACTIVE='fm-data-center-ranking-profile-active-v1'
export interface RankingProfile{id:string;name:string;config:RankingConfig;createdAt:string;updatedAt:string}
export function loadRankingConfig():RankingConfig{try{const raw=localStorage.getItem(KEY);if(!raw)return cloneRankingConfig(OLD_APP_DEFAULT_CONFIG);const parsed=JSON.parse(raw) as Partial<RankingConfig>;return {...cloneRankingConfig(OLD_APP_DEFAULT_CONFIG),...parsed,competitionSpecificWeights:parsed.competitionSpecificWeights??[],competitionAliases:parsed.competitionAliases??{},hiddenCompetitions:parsed.hiddenCompetitions??[]} as RankingConfig}catch{return cloneRankingConfig(OLD_APP_DEFAULT_CONFIG)}}
export function saveRankingConfig(config:RankingConfig){localStorage.setItem(KEY,JSON.stringify(config));window.dispatchEvent(new Event('fm-ranking-config-changed'))}
export function resetRankingConfig(){const config=cloneRankingConfig(OLD_APP_DEFAULT_CONFIG);saveRankingConfig(config);return config}
export function loadProfiles():RankingProfile[]{try{return JSON.parse(localStorage.getItem(PROFILES)??'[]') as RankingProfile[]}catch{return[]}}
export function saveProfiles(list:RankingProfile[]){localStorage.setItem(PROFILES,JSON.stringify(list))}
export function activeProfileId(){return localStorage.getItem(ACTIVE)}
export function createProfile(name:string,config:RankingConfig){const now=new Date().toISOString();const p:RankingProfile={id:`profile-${crypto.randomUUID()}`,name,config:cloneRankingConfig(config),createdAt:now,updatedAt:now};const list=[...loadProfiles(),p];saveProfiles(list);return p}
export function activateProfile(id:string){const p=loadProfiles().find(x=>x.id===id);if(!p)return;localStorage.setItem(ACTIVE,id);saveRankingConfig(cloneRankingConfig(p.config))}
export function deleteProfile(id:string){saveProfiles(loadProfiles().filter(x=>x.id!==id));if(activeProfileId()===id)localStorage.removeItem(ACTIVE)}

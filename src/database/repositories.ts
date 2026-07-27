import { db } from './db'
import type { Player, Season } from '../shared/types/entities'
export const seasonRepository = { list: () => db.seasons.orderBy('startYear').toArray(), getByLabel: (label:string) => db.seasons.where('label').equals(label).first(), save:(season:Season)=>db.seasons.put(season) }
export const playerRepository = { list:()=>db.players.orderBy('name').toArray(), getByUid:(uid:string)=>db.players.where('uid').equals(uid).first(), getByIdentityKey:(key:string)=>db.players.where('identityKey').equals(key).first(), save:(player:Player)=>db.players.put(player) }

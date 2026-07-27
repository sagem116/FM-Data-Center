export type EntityId = string
export type IdentityConfidence = 'high' | 'medium' | 'low'

export interface Season { id: EntityId; label: string; startYear: number; endYear: number; createdAt: string }
export interface Player { id: EntityId; uid?: string; name: string; normalizedName: string; birthDate?: string; nationality?: string; identityConfidence: IdentityConfidence; identityKey: string; createdAt: string; updatedAt: string }
export interface PlayerSeason { id: EntityId; playerId: EntityId; seasonId: EntityId; clubId?: EntityId; clubName?: string; age?: number; marketValue?: number; wageAnnual?: number; position?: string; secondaryPosition?: string; personality?: string; status?: string; contractExpiry?: string }
export interface PlayerAttributes { id: EntityId; playerId: EntityId; seasonId: EntityId; attributes: Record<string, number> }
export interface PlayerGeneralMetrics { id: EntityId; playerId: EntityId; seasonId: EntityId; metrics: Record<string, number | null> }
export interface PlayerCompetitionStats { id: EntityId; playerId: EntityId; seasonId: EntityId; competitionId: EntityId; competitionName: string; scope?: string; clubId?: EntityId; clubName?: string; appearances: number; starts: number; substituteAppearances: number; minutes: number; goals: number; assists: number; metrics: Record<string, number | null> }
export interface Club { id: EntityId; uid?: string; name: string; normalizedName: string; country?: string; continent?: string; reputation?: number; averageAttendance?: number; seasonTickets?: number }
export interface ClubSeason { id: EntityId; clubId: EntityId; seasonId: EntityId; reputation?: number; averageAttendance?: number; seasonTickets?: number }
export interface Competition { id: EntityId; uid?: string; name: string; normalizedName: string; country?: string; continent?: string; type: 'national' | 'continental' | 'international' | 'super-league' | 'unknown'; level?: number; reputation?: number }
export interface CompetitionSeason { id: EntityId; competitionId: EntityId; seasonId: EntityId; reputation?: number; level?: number }
export interface Coach { id: EntityId; uid?: string; name: string; normalizedName: string; nationality?: string; identityConfidence: IdentityConfidence; identityKey: string }
export interface CoachSeason { id: EntityId; coachId: EntityId; seasonId: EntityId; currentClubId?: EntityId; currentClubName?: string; role?: string; contractExpiry?: string; winRate?: number; titles?: number; metrics: Record<string, number | null> }
export interface Standing { id: EntityId; seasonId: EntityId; competitionId: EntityId; competitionName: string; format: 'league' | 'knockout'; stage?: string; entityId?: EntityId; entityName: string; position?: number; played?: number; wins?: number; draws?: number; losses?: number; goalsFor?: number; goalsAgainst?: number; goalDifference?: number; points?: number }
export interface Transfer { id: EntityId; seasonId: EntityId; playerId?: EntityId; playerName: string; fromClubId?: EntityId; fromClubName?: string; toClubId?: EntityId; toClubName?: string; transferDate?: string; fee?: number; possibleFee?: number; currency?: string; transferType: 'permanent' | 'loan' | 'free' | 'unknown' }
export type ImportIssueSeverity = 'warning' | 'error'
export interface ImportIssue { id: EntityId; importSessionId: EntityId; severity: ImportIssueSeverity; code: string; message: string; sheet?: string; row?: number; column?: string; entityKey?: string; rawValue?: unknown }
export interface ImportSession { id: EntityId; seasonId: EntityId; fileName: string; importType: string; status: 'staged' | 'completed' | 'failed'; startedAt: string; completedAt?: string; createdCount: number; updatedCount: number; skippedCount: number; warningCount: number; errorCount: number; lowConfidenceCount: number }

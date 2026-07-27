import { z } from 'zod'

export const seasonSchema = z.object({
  id: z.string().min(1),
  label: z.string().regex(/^\d{4}\/\d{2}$/),
  startYear: z.number().int().min(1900),
  endYear: z.number().int().min(1901),
  createdAt: z.string().datetime(),
}).refine((value) => value.endYear === value.startYear + 1, {
  message: 'A época deve abranger dois anos consecutivos.',
  path: ['endYear'],
})

export const playerSchema = z.object({
  id: z.string().min(1),
  uid: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  birthDate: z.string().optional(),
  nationalityId: z.string().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const clubSchema = z.object({
  id: z.string().min(1),
  uid: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  countryId: z.string().optional(),
  reputation: z.number().min(0).optional(),
})

export const competitionSchema = z.object({
  id: z.string().min(1),
  uid: z.string().min(1).optional(),
  name: z.string().trim().min(1),
  countryId: z.string().optional(),
  continentId: z.string().optional(),
  type: z.enum(['national', 'continental', 'international', 'super-league', 'unknown']),
  level: z.number().int().positive().optional(),
  reputation: z.number().min(0).optional(),
})

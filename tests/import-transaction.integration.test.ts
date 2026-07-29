import { beforeEach, describe, expect, it } from 'vitest'
import { db } from '../src/database/db'
import { createPreview } from '../src/modules/imports/parsers'
import { persistPreview } from '../src/modules/imports/services/import-service'
import type { WorkbookSnapshot } from '../src/modules/imports/core/types'

function workbook(fileName: string, sheetName: string, rows: Array<Record<string, string | number | null>>): WorkbookSnapshot {
  return { fileName, sheets: [{ name: sheetName, headers: Object.keys(rows[0] ?? {}), rows }] }
}

const clubs = (names: string[]) => createPreview(workbook('01 Clubes.xlsx', 'reputaçao de clubes', names.map((name, index) => ({ club_name: name, reputacao: 100 + index }))), 'clubs')
const players = (uid: string, name: string) => createPreview(workbook('03 Jogadores.xlsx', 'Perfil dos Jogadores', [{ idu: uid, nome: name, idade: 21, clube: 'Clube A' }]), 'players')

beforeEach(async () => { await db.delete(); await db.open() })

describe('pipeline transacional de importação', () => {
  it('reimporta o mesmo bloco sem duplicar registos', async () => {
    await persistPreview(clubs(['Clube A', 'Clube B']), '2024/25')
    await persistPreview(clubs(['Clube A', 'Clube B']), '2024/25')
    expect(await db.clubSeasons.where('seasonId').equals('season:2024-2025').count()).toBe(2)
  })

  it('substitui apenas a época selecionada', async () => {
    await persistPreview(clubs(['Clube Antigo']), '2023/24')
    await persistPreview(clubs(['Clube A', 'Clube B']), '2024/25')
    await persistPreview(clubs(['Clube C']), '2024/25')
    expect(await db.clubSeasons.where('seasonId').equals('season:2023-2024').count()).toBe(1)
    expect(await db.clubSeasons.where('seasonId').equals('season:2024-2025').count()).toBe(1)
  })

  it('mantém os dados anteriores quando a transação falha', async () => {
    await persistPreview(clubs(['Clube A', 'Clube B']), '2024/25')
    await expect(persistPreview(clubs(['Clube C']), '2024/25', { failAfterClearForTest: true })).rejects.toThrow()
    const seasons = await db.clubSeasons.where('seasonId').equals('season:2024-2025').toArray()
    expect(seasons).toHaveLength(2)
  })

  it('resolve jogadores pelo IDU e não duplica a identidade', async () => {
    await persistPreview(players('123', 'Jogador Um'), '2024/25')
    await persistPreview(players('123', 'Nome Atualizado'), '2025/26')
    expect(await db.players.where('uid').equals('123').count()).toBe(1)
  })

  it('marca fallback sem IDU como baixa confiança', async () => {
    const preview = createPreview(workbook('03 Jogadores.xlsx', 'Perfil dos Jogadores', [{ nome: 'Jogador Sem IDU', idade: 22, clube: 'Clube A' }]), 'players')
    // O parser considera IDU obrigatório no perfil principal e rejeita a linha.
    expect(preview.errorRows).toBe(1)
  })

  it('combina folhas de clubes pelo nome normalizado e não pela linha', () => {
    const preview = createPreview({ fileName: '01 Clubes.xlsx', sheets: [
      { name: 'reputaçao de clubes', headers: ['club_name', 'reputacao'], rows: [{ club_name: 'FC Porto', reputacao: 170 }, { club_name: 'Benfica', reputacao: 175 }] },
      { name: 'pais clubes', headers: ['club_name', 'pais', 'continente'], rows: [{ club_name: 'Benfica', pais: 'Portugal', continente: 'Europa' }, { club_name: 'FC Porto', pais: 'Portugal', continente: 'Europa' }] },
    ] }, 'clubs')
    const porto = preview.rows.find((row) => row.values.name === 'FC Porto')
    expect(porto?.values.reputation).toBe(170)
    expect(porto?.values.country).toBe('Portugal')
  })
})

import { describe, expect, it } from 'vitest'
import { detectImportKind } from '../src/modules/imports/core/detect-import-kind'
import type { WorkbookSnapshot } from '../src/modules/imports/core/types'
const book=(headers:string[],sheet='Folha'):WorkbookSnapshot=>({fileName:'teste.xlsx',sheets:[{name:sheet,headers,rows:[]}]})
describe('deteção estrutural dos importadores',()=>{
  it('não confunde treinadores com estatísticas',()=>expect(detectImportKind(book(['IDU','Nome','Função No Clube','Clube','Jogadores Vendidos','Jogadores Contratados','% Vitórias','Títulos']))).toBe('coaches'))
  it('não confunde jogadores com estatísticas',()=>expect(detectImportKind(book(['IDU','Nome','Idade','Altura','Peso','Posição','Posição Sec.','Personalidade','Nac']))).toBe('players'))
  it('não confunde competições com estatísticas',()=>expect(detectImportKind(book(['Competição','Reputação'],'Reputação Competições'))).toBe('competitions'))
  it('reconhece estatísticas mesmo com folha Ligas Nacionais',()=>expect(detectImportKind(book(['Competição','Nome','Jogos','Gls','Ast','xG','% Passe','Clube','IDU'],'Ligas Nacionais'))).toBe('statistics'))
})

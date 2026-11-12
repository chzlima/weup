// Testes do aviso "Atualizamos a política de privacidade".
import { describe, expect, it } from 'vitest'
import { POLITICA_VERSAO, deveAvisarPolitica } from './privacidade'

describe('aviso de mudança na política de privacidade', () => {
  const antes = new Date(new Date(POLITICA_VERSAO).getTime() - 60_000).toISOString()
  const depois = new Date(new Date(POLITICA_VERSAO).getTime() + 60_000).toISOString()

  it('avisa quem já tinha conta quando a política mudou', () => {
    expect(deveAvisarPolitica(antes, null)).toBe(true)
    expect(deveAvisarPolitica(antes, '2020-01-01T00:00:00-03:00')).toBe(true)
  })

  it('não avisa de novo quem já viu esta versão', () => {
    expect(deveAvisarPolitica(antes, POLITICA_VERSAO)).toBe(false)
  })

  it('não avisa quem criou a conta depois (já aceitou o texto atual) nem quem não está logado', () => {
    expect(deveAvisarPolitica(depois, null)).toBe(false)
    expect(deveAvisarPolitica(undefined, null)).toBe(false)
  })
})

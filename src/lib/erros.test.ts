// Testes do registro de erros: o que é ignorado e o que é limpo antes de ir para o banco.
import { describe, expect, it, vi } from 'vitest'

vi.mock('./supabase', () => ({ supabase: {} }))

import { deveIgnorar, limpar, montarRegistro } from './erros'

describe('registro de erros', () => {
  it('ignora o que não é defeito do app (internet, extensões, aviso de layout)', () => {
    expect(deveIgnorar('TypeError: Failed to fetch')).toBe(true)
    expect(deveIgnorar('ResizeObserver loop limit exceeded')).toBe(true)
    expect(deveIgnorar('Script error.')).toBe(true)
    expect(deveIgnorar('TypeError: x', 'at chrome-extension://abc/content.js:1:1')).toBe(true)
    expect(deveIgnorar("TypeError: Cannot read properties of undefined (reading 'titulo')")).toBe(false)
    expect(montarRegistro('promessa', new TypeError('Failed to fetch'))).toBeNull()
    expect(montarRegistro('erro', undefined)).toBeNull()
  })

  it('tira e-mails e chaves de acesso do texto', () => {
    expect(limpar('falha para maria.silva@exemplo.com.br agora', 500)).toBe('falha para [e-mail] agora')
    expect(limpar('em https://weup.app/#access_token=abc123&type=recovery', 500)).toBe(
      'em https://weup.app/#access_token=[chave]&type=recovery',
    )
    expect(limpar('Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcDEF_123-x', 500)).toBe('Bearer [chave]')
  })

  it('corta textos longos no tamanho que o banco aceita', () => {
    const r = montarRegistro('erro', new Error('x'.repeat(2000)), 'n'.repeat(1000))!
    expect(r.mensagem).toHaveLength(500)
    expect(r.navegador).toHaveLength(300)
    expect(r.detalhe!.length).toBeLessThanOrEqual(4000)
  })

  it('monta o registro com origem, versão e commit', () => {
    const r = montarRegistro('tela', new RangeError('fora do limite'), 'Navegador de teste')!
    expect(r).toMatchObject({
      origem: 'tela',
      mensagem: 'RangeError: fora do limite',
      versao: __APP_VERSION__,
      commit: 'local',
      navegador: 'Navegador de teste',
    })
    expect(r.detalhe).toContain('RangeError')
    expect(montarRegistro('promessa', 'texto solto')).toMatchObject({ mensagem: 'texto solto', detalhe: null })
  })
})

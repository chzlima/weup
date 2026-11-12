// Testes dos atalhos do ícone e do "Compartilhar → WeUp!".
import { describe, expect, it } from 'vitest'
import { lerAcao } from './atalhos'

describe('atalhos e compartilhar', () => {
  it('reconhece os atalhos do ícone', () => {
    expect(lerAcao('?acao=nova-tarefa')).toEqual({ tipo: 'nova-tarefa', titulo: '' })
    expect(lerAcao('?acao=foco')).toEqual({ tipo: 'foco' })
  })

  it('abrir o app normalmente não pede nada', () => {
    expect(lerAcao('')).toBeNull()
    expect(lerAcao('?acao=outra-coisa')).toBeNull()
    expect(lerAcao('?text=%20%20')).toBeNull()
  })

  it('texto compartilhado vira o título da tarefa', () => {
    expect(lerAcao('?text=Estudar%20cap%C3%ADtulo%203%20de%20farmaco')).toEqual({
      tipo: 'nova-tarefa',
      titulo: 'Estudar capítulo 3 de farmaco',
    })
  })

  it('junta título e link do navegador, sem repetir e sem quebras de linha', () => {
    const q = new URLSearchParams({ title: 'Artigo: sepse', text: 'https://ex.com/sepse', url: 'https://ex.com/sepse' })
    expect(lerAcao('?' + q)).toEqual({ tipo: 'nova-tarefa', titulo: 'Artigo: sepse https://ex.com/sepse' })
    expect(lerAcao('?text=' + encodeURIComponent('linha 1\n\nlinha 2'))).toEqual({ tipo: 'nova-tarefa', titulo: 'linha 1 linha 2' })
  })

  it('corta no tamanho que o banco aceita', () => {
    const r = lerAcao('?text=' + 'x'.repeat(500))
    expect(r?.tipo === 'nova-tarefa' && r.titulo.length).toBe(200)
  })
})

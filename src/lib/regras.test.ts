// Testes das regras do app que não dependem do banco: níveis, pet, datas, hábitos e agenda.
// Rodar: npm test
import { describe, expect, it, vi } from 'vitest'

// O cliente do Supabase lê o endereço da página ao ser criado; aqui não há página nem banco.
vi.mock('./supabase', () => ({ supabase: {} }))

import { calcularNivel, tituloDoNivel, xpParaSubir, xpTotalDoNivel } from './xp'
import { estagioDoNivel } from './pets'
import { descreverDias, XP_HABITO } from './habitos'
import { formatarHora, ordemCompromisso, type Compromisso } from './agenda'
import { XP_FOCO } from './foco'
import {
  XP_DIFICULDADE, XP_ETAPA, checar, concluidaHoje, descreverAnterior, diaDaSemana, diaISO, diasEntre, formatarData,
  separarPendentes, somarDias, xpDaTarefa,
  type Tarefa,
} from './tarefas'
import regrasDoBanco from '../../supabase/ciclo7.sql?raw'
import fundacaoPet from '../../supabase/ciclo19-pet-fundacao.sql?raw'

describe('níveis', () => {
  it('segue a curva combinada (30, 85, 155, 240, 335 … 950 no nível 10)', () => {
    expect([1, 2, 3, 4, 5, 10].map(xpParaSubir)).toEqual([30, 85, 155, 240, 335, 950])
  })

  it('começa no nível 1 e sobe exatamente ao atingir o XP pedido', () => {
    expect(calcularNivel(0)).toEqual({ nivel: 1, xpNoNivel: 0, xpDoNivel: 30 })
    expect(calcularNivel(29).nivel).toBe(1)
    expect(calcularNivel(30)).toEqual({ nivel: 2, xpNoNivel: 0, xpDoNivel: 85 })
    expect(calcularNivel(114).nivel).toBe(2)
    expect(calcularNivel(115).nivel).toBe(3)
  })

  it('xpTotalDoNivel e calcularNivel concordam em todos os níveis até o 60', () => {
    for (let n = 1; n <= 60; n++) {
      const total = xpTotalDoNivel(n)
      expect(calcularNivel(total)).toMatchObject({ nivel: n, xpNoNivel: 0 })
      if (n > 1) expect(calcularNivel(total - 1).nivel).toBe(n - 1)
    }
  })

  it('o nível nunca diminui quando o XP aumenta', () => {
    let anterior = 1
    for (let xp = 0; xp <= 20000; xp += 7) {
      const { nivel, xpNoNivel, xpDoNivel } = calcularNivel(xp)
      expect(nivel).toBeGreaterThanOrEqual(anterior)
      expect(xpNoNivel).toBeLessThan(xpDoNivel)
      anterior = nivel
    }
  })

  it('dá o título certo em cada faixa', () => {
    expect([1, 4, 5, 9, 10, 19, 20, 34, 35, 49, 50].map(tituloDoNivel)).toEqual([
      'Iniciante', 'Iniciante', 'Aprendiz', 'Aprendiz', 'Dedicado', 'Dedicado',
      'Persistente', 'Persistente', 'Experiente', 'Experiente', 'Mestre',
    ])
  })
})

describe('pet', () => {
  it('evolui nos níveis 5, 10, 15 e 25 (os três primeiros iguais aos de antes)', () => {
    expect([1, 4, 5, 9, 10, 14, 15, 24, 25, 99].map(estagioDoNivel)).toEqual([1, 1, 2, 2, 3, 3, 4, 4, 5, 5])
  })

  it('o banco usa a mesma curva de nível e os mesmos níveis de evolução', () => {
    // Quem decide o estágio é o banco: se a curva ou os níveis mudarem só de um lado, este teste avisa.
    expect(fundacaoPet).toContain('round((30 * power(n, 1.5) / 5)::numeric)::integer * 5')
    for (const [estagio, nivel] of [[5, 25], [4, 15], [3, 10], [2, 5]])
      expect(fundacaoPet).toContain(`when p_nivel >= ${nivel} then ${estagio}`)
  })
})

describe('XP mostrado no app = XP concedido pelo banco', () => {
  // Quem concede o XP é a função conceder_xp do banco. O app só exibe os valores:
  // se alguém mudar um lado e esquecer o outro, este teste avisa.
  const valorNoBanco = (tipo: string) => {
    const linhaDosValores = regrasDoBanco.match(/valor\s+int := case p_tipo([\s\S]*?) end;/)![1]
    return Number(linhaDosValores.match(new RegExp(`when '${tipo}' then (\\d+)`))![1])
  }

  it('tarefas, etapas, hábitos e foco batem', () => {
    expect(valorNoBanco('tarefa_pequena')).toBe(XP_DIFICULDADE.pequena)
    expect(valorNoBanco('tarefa_media')).toBe(XP_DIFICULDADE.media)
    expect(valorNoBanco('tarefa_complexa')).toBe(XP_DIFICULDADE.complexa)
    expect(valorNoBanco('etapa')).toBe(XP_ETAPA)
    expect(valorNoBanco('habito')).toBe(XP_HABITO)
    expect(valorNoBanco('foco')).toBe(XP_FOCO)
  })

  it('tarefa dentro de projeto vale como etapa', () => {
    expect(xpDaTarefa({ project_id: null, dificuldade: 'media' })).toBe(15)
    expect(xpDaTarefa({ project_id: 'p1', dificuldade: 'pequena' })).toBe(XP_ETAPA)
  })
})

describe('datas', () => {
  it('escreve o dia no formato do banco, no fuso do aparelho', () => {
    expect(diaISO(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
    expect(diaISO(new Date(2026, 10, 11, 0, 0))).toBe('2026-11-11')
  })

  it('soma dias atravessando mês, ano e ano bissexto', () => {
    expect(somarDias(1, new Date(2026, 0, 31))).toBe('2026-02-01')
    expect(somarDias(1, new Date(2026, 11, 31))).toBe('2027-01-01')
    expect(somarDias(-1, new Date(2028, 2, 1))).toBe('2028-02-29')
    expect(somarDias(-6, new Date(2026, 10, 3))).toBe('2026-10-28')
  })

  it('acha o dia da semana (0 = domingo)', () => {
    expect(diaDaSemana('2026-11-08')).toBe(0)
    expect(diaDaSemana('2026-11-11')).toBe(3)
    expect(diaDaSemana('2026-11-14')).toBe(6)
  })

  it('mostra Hoje, Amanhã e Sem data', () => {
    expect(formatarData(null)).toBe('Sem data')
    expect(formatarData(somarDias(0))).toBe('Hoje')
    expect(formatarData(somarDias(1))).toBe('Amanhã')
    expect(formatarData('2020-03-09')).toMatch(/^9 de mar/)
  })

  it('"concluída hoje" só vale para o dia de hoje', () => {
    const tarefa = (concluida_em: string | null) => ({ concluida_em }) as Tarefa
    const ontem = new Date()
    ontem.setDate(ontem.getDate() - 1)
    expect(concluidaHoje(tarefa(new Date().toISOString()))).toBe(true)
    expect(concluidaHoje(tarefa(ontem.toISOString()))).toBe(false)
    expect(concluidaHoje(tarefa(null))).toBe(false)
  })
})

describe('tarefas de dias anteriores', () => {
  const t = (id: string, data: string | null, concluida_em: string | null = null) => ({ id, data, concluida_em }) as Tarefa
  const hoje = '2026-11-11'

  it('separa o que é de hoje do que ficou para trás, sem misturar feitas, futuras e sem data', () => {
    const { deHoje, anteriores } = separarPendentes(
      [
        t('hoje', hoje), t('ontem', '2026-11-10'), t('antiga', '2026-10-01'), t('amanha', '2026-11-12'),
        t('sem-data', null), t('feita', '2026-11-09', '2026-11-09T12:00:00Z'),
      ],
      hoje,
    )
    expect(deHoje.map((x) => x.id)).toEqual(['hoje'])
    expect(anteriores.map((x) => x.id)).toEqual(['antiga', 'ontem']) // a mais antiga primeiro
  })

  it('conta os dias entre duas datas, atravessando mês e ano', () => {
    expect(diasEntre('2026-11-10', '2026-11-11')).toBe(1)
    expect(diasEntre('2026-10-31', '2026-11-02')).toBe(2)
    expect(diasEntre('2025-12-31', '2026-01-01')).toBe(1)
    expect(diasEntre('2026-11-11', '2026-11-11')).toBe(0)
  })

  it('diz de quando é a tarefa, sem tom de cobrança', () => {
    expect(descreverAnterior('2026-11-10', hoje)).toBe('de ontem')
    expect(descreverAnterior('2026-11-08', hoje)).toBe('de 3 dias atrás')
    expect(descreverAnterior('2026-10-01', hoje)).toMatch(/^de 1 de out/)
  })
})

describe('hábitos', () => {
  it('descreve os dias escolhidos', () => {
    expect(descreverDias([0, 1, 2, 3, 4, 5, 6])).toBe('Todo dia')
    expect(descreverDias([5, 1, 3, 2, 4])).toBe('Dias úteis')
    expect(descreverDias([6, 0])).toBe('Fins de semana')
    expect(descreverDias([3, 1])).toBe('seg, qua')
  })
})

describe('agenda', () => {
  const c = (data: string, hora: string | null) => ({ data, hora }) as Compromisso

  it('mostra a hora sem os segundos', () => {
    expect(formatarHora('08:30:00')).toBe('08:30')
    expect(formatarHora(null)).toBe('Dia todo')
  })

  it('ordena por data, com "dia todo" antes dos horários', () => {
    const lista = [c('2026-11-12', '09:00:00'), c('2026-11-11', '14:00:00'), c('2026-11-11', null), c('2026-11-11', '08:00:00')]
    expect(lista.sort(ordemCompromisso).map((x) => `${x.data} ${x.hora ?? 'dia todo'}`)).toEqual([
      '2026-11-11 dia todo', '2026-11-11 08:00:00', '2026-11-11 14:00:00', '2026-11-12 09:00:00',
    ])
  })
})

describe('mensagens de erro', () => {
  const erro = (message: string, code?: string) => () => checar({ data: null, error: { message, code } })

  it('devolve os dados quando deu certo', () => {
    expect(checar({ data: [1, 2], error: null })).toEqual([1, 2])
  })

  it('traduz os erros para uma frase que a pessoa entende, sem vazar detalhe técnico', () => {
    expect(erro('TypeError: Failed to fetch')).toThrow('Sem conexão com o servidor. Verifique sua internet.')
    expect(erro('relation does not exist', '42P01')).toThrow(/Faltam tabelas/)
    expect(erro('duplicate key value violates unique constraint "x"')).toThrow('Não foi possível salvar. Tente de novo.')
  })
})

import { supabase } from './supabase'
import { checar, somarDias, type DadosTarefa, type Tarefa } from './tarefas'

// Revisão espaçada: ao concluir uma tarefa de estudo, o app oferece agendar revisões curtas.
// Cada revisão é uma tarefa comum (pequena, de estudo, sem projeto), ligada à tarefa original.

// Daqui a quantos dias vem cada revisão (revisão 1, 2 e 3).
export const INTERVALOS_REVISAO = [1, 7, 30] as const

const PREFIXO = 'Revisar: '

export type DadosRevisao = DadosTarefa & { revisao_de: string; revisao_n: number }

export function tituloRevisao(titulo: string) {
  const base = titulo.startsWith(PREFIXO) ? titulo.slice(PREFIXO.length) : titulo
  return (PREFIXO + base).slice(0, 200)
}

// Antes de rodar o supabase/ciclo13-revisoes.sql a coluna não existe e a oferta não aparece.
export const temRevisoes = (t: Tarefa) => 'revisao_de' in t

// Oferecer "revisar depois" para esta tarefa?
// Só tarefas de estudo, que não são revisão e que ainda não têm revisões agendadas.
export function podeOferecerRevisao(t: Tarefa, todas: Tarefa[]) {
  return (
    temRevisoes(t) &&
    t.categoria === 'estudo' &&
    !t.revisao_de &&
    !todas.some((x) => x.revisao_de === t.id)
  )
}

// As revisões de uma tarefa, a partir do dia em que ela foi concluída.
// Tarefa de projeto vira revisão avulsa: revisão vale XP de tarefa pequena, nunca de etapa.
export function planejarRevisoes(t: Pick<Tarefa, 'id' | 'titulo'>, base = new Date()): DadosRevisao[] {
  return INTERVALOS_REVISAO.map((dias, i) => ({
    titulo: tituloRevisao(t.titulo),
    dificuldade: 'pequena',
    categoria: 'estudo',
    project_id: null,
    data: somarDias(dias, base),
    revisao_de: t.id,
    revisao_n: i + 1,
  }))
}

export const descreverRevisao = (t: Tarefa) =>
  t.revisao_n ? `revisão ${t.revisao_n} de ${INTERVALOS_REVISAO.length}` : undefined

// Grava as revisões. Se alguma já existir (toque duplo, dois aparelhos), ela é ignorada em vez de duplicar.
export async function agendarRevisoes(t: Tarefa) {
  return checar<Tarefa[]>(
    await supabase
      .from('tasks')
      .upsert(planejarRevisoes(t), { onConflict: 'revisao_de,revisao_n', ignoreDuplicates: true })
      .select(),
  )
}

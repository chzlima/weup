import { somarDias, type Tarefa } from './tarefas'

// Prioridades do dia: até 3 tarefas que a pessoa marca como "o que mais importa hoje", em ordem.
// Ficam no registro do dia (daily_checkins.prioridades); amanhã começa com a lista vazia.

export const MAX_PRIORIDADES = 3

// Tocar na estrela: marca (se ainda couber) ou desmarca.
export function alternarPrioridade(ids: string[], id: string) {
  if (ids.includes(id)) return ids.filter((x) => x !== id)
  if (ids.length >= MAX_PRIORIDADES) return ids
  return [...ids, id]
}

// Sobe (-1) ou desce (+1) uma prioridade na ordem.
export function moverPrioridade(ids: string[], id: string, delta: -1 | 1) {
  const i = ids.indexOf(id)
  const j = i + delta
  if (i < 0 || j < 0 || j >= ids.length) return ids
  const novos = [...ids]
  ;[novos[i], novos[j]] = [novos[j], novos[i]]
  return novos
}

// Separa as tarefas do dia em prioridades (na ordem escolhida) e o resto.
// Uma prioridade que saiu do dia (apagada ou levada para outra data) simplesmente some da lista.
export function separarPrioridades(tarefasDoDia: Tarefa[], ids: string[]) {
  const prioridades = ids.map((id) => tarefasDoDia.find((t) => t.id === id)).filter((t): t is Tarefa => !!t)
  const resto = tarefasDoDia.filter((t) => !ids.includes(t.id))
  return { prioridades, resto }
}

// Tarefas abertas com prazo até amanhã que NÃO estão planejadas para hoje (sem data ou para depois).
// As planejadas para hoje ou dias anteriores já aparecem na tela, com o prazo junto.
export function prazoChegando(tarefas: Tarefa[], hoje: string) {
  const amanha = somarDias(1, new Date(`${hoje}T12:00`))
  return tarefas
    .filter((t) => !t.concluida_em && t.prazo && t.prazo <= amanha && (!t.data || t.data > hoje))
    .sort((a, b) => a.prazo!.localeCompare(b.prazo!))
}

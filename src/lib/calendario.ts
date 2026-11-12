import { ordemCompromisso, type Compromisso } from './agenda'
import { serieCaiEm, type Serie } from './series'
import { somarDias, type Tarefa } from './tarefas'

// Calendário: o que cai em cada dia. Tarefas que se repetem aparecem como "previstas" nos dias futuros
// sem serem criadas no banco (a tarefa de verdade só nasce no próprio dia, ver series.ts).

const dataDe = (iso: string) => {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export const diasDaSemana = (segunda: string) => Array.from({ length: 7 }, (_, i) => somarDias(i, dataDe(segunda)))

export const outraSemana = (segunda: string, delta: number) => somarDias(7 * delta, dataDe(segunda))

export type ItensDoDia = {
  diaTodo: Compromisso[]
  blocos: Compromisso[] // com horário, em ordem
  tarefas: Tarefa[]
  previstas: Serie[] // repetições que vão cair neste dia (só dias futuros)
}

export function itensDoDia(
  dia: string,
  hoje: string,
  dados: { compromissos: Compromisso[]; tarefas: Tarefa[]; series: Serie[] },
): ItensDoDia {
  const doDia = dados.compromissos.filter((c) => c.data === dia).sort(ordemCompromisso)
  const tarefas = dados.tarefas.filter((t) => t.data === dia)
  const previstas =
    dia > hoje
      ? dados.series.filter(
          (s) =>
            s.inicio <= dia &&
            serieCaiEm(s, dia) &&
            !dados.tarefas.some((t) => t.series_id === s.id && t.ocorrencia === dia),
        )
      : []
  return { diaTodo: doDia.filter((c) => !c.hora), blocos: doDia.filter((c) => c.hora), tarefas, previstas }
}

export const totalDoDia = (i: ItensDoDia) => i.diaTodo.length + i.blocos.length + i.tarefas.length + i.previstas.length

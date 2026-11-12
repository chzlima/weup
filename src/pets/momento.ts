import type { Dados } from '../lib/useDados'
import { concluidaHoje, diaDaSemana, hojeISO, separarPendentes } from '../lib/tarefas'
import type { Momento } from './humor'

// Junta o que importa do dia (tarefas, hábitos, prioridades e energia) para o humor do pet.
// Usado pela tela Hoje e pela aba Pets, para o pet estar igual nas duas.
export function momentoDoDia(dados: Dados, plano: { energia: string | null; prioridades: string[] }, agora = new Date()): Momento {
  const hoje = hojeISO()
  const { deHoje } = separarPendentes(dados.tarefas, hoje)
  const habitosHoje = dados.habitos.filter((h) => h.dias.includes(diaDaSemana(hoje)))
  const prioridades = plano.prioridades
    .map((id) => dados.tarefas.find((t) => t.id === id))
    .filter((t) => t && (t.data === hoje || concluidaHoje(t)))
  return {
    feitos: dados.tarefas.filter(concluidaHoje).length + dados.registros.filter((r) => r.dia === hoje).length,
    pendentes: deHoje.length + habitosHoje.filter((h) => !dados.feitoNoDia(h.id, hoje)).length,
    prioridadesAbertas: prioridades.filter((t) => !t!.concluida_em).length,
    prioridadesFeitas: prioridades.filter((t) => t!.concluida_em).length,
    energiaBaixa: plano.energia === 'baixa',
    hora: agora.getHours(),
    diaSemana: agora.getDay(),
  }
}

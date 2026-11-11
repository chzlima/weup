import type { Dados } from '../../lib/useDados'
import { formatarHora, ordemCompromisso, type Compromisso } from '../../lib/agenda'
import { hojeISO, somarDias, type Tarefa } from '../../lib/tarefas'
import { TarefaItem } from '../../components/TarefaItem'
import { IconMais } from '../../components/Icons'
import { Vazio } from './Vazio'

const DIAS = 14

export function nomeDoDia(iso: string) {
  const [a, m, d] = iso.split('-').map(Number)
  const data = new Date(a, m - 1, d)
  const curto = data.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')
  if (iso === hojeISO()) return `Hoje · ${curto}`
  if (iso === somarDias(1)) return `Amanhã · ${curto}`
  return curto.charAt(0).toUpperCase() + curto.slice(1)
}

// Aba Agenda: próximos 14 dias, com compromissos e as tarefas marcadas para cada dia.
export function Agenda(props: {
  dados: Dados
  onEditarCompromisso: (c: Compromisso) => void
  onEditarTarefa: (t: Tarefa) => void
  onNovo: () => void
}) {
  const { dados } = props
  const dias = Array.from({ length: DIAS }, (_, i) => somarDias(i))
  const limite = dias[dias.length - 1]
  const nomeProjeto = (id: string | null) => dados.projetos.find((p) => p.id === id)?.titulo

  const blocos = dias
    .map((dia) => ({
      dia,
      compromissos: dados.compromissos.filter((c) => c.data === dia).sort(ordemCompromisso),
      tarefas: dados.tarefas.filter((t) => t.data === dia),
    }))
    .filter((b) => b.compromissos.length + b.tarefas.length > 0)

  const depois = dados.compromissos.filter((c) => c.data > limite).sort(ordemCompromisso)

  if (blocos.length === 0 && depois.length === 0) {
    return (
      <Vazio>
        Sua agenda está livre. Adicione provas, aulas ou consultas para vê-las aqui e na tela Hoje.
        <button onClick={props.onNovo} className="mt-3 block w-full font-bold text-mint">
          Adicionar compromisso
        </button>
      </Vazio>
    )
  }

  return (
    <div className="space-y-5">
      {blocos.map((b) => (
        <section key={b.dia}>
          <h2 className="mb-2 text-sm font-bold text-muted">{nomeDoDia(b.dia)}</h2>
          <ul className="space-y-2">
            {b.compromissos.map((c) => (
              <LinhaCompromisso key={c.id} c={c} onEditar={() => props.onEditarCompromisso(c)} />
            ))}
            {b.tarefas.map((t) => (
              <TarefaItem
                key={t.id}
                tarefa={t}
                projeto={nomeProjeto(t.project_id)}
                onAlternar={() => dados.alternarTarefa(t)}
                onEditar={() => props.onEditarTarefa(t)}
              />
            ))}
          </ul>
        </section>
      ))}

      {depois.length > 0 && (
        <section>
          <h2 className="mb-2 text-sm font-bold text-muted">Mais adiante</h2>
          <ul className="space-y-2">
            {depois.map((c) => (
              <LinhaCompromisso key={c.id} c={c} mostrarData onEditar={() => props.onEditarCompromisso(c)} />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

export function LinhaCompromisso({ c, onEditar, mostrarData }: { c: Compromisso; onEditar: () => void; mostrarData?: boolean }) {
  return (
    <li>
      <button
        onClick={onEditar}
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface py-3 pr-2 pl-4 text-left transition-colors hover:bg-surface-2"
      >
        <span className="w-16 shrink-0 rounded-lg bg-surface-2 py-1 text-center text-xs font-bold text-mint">
          {formatarHora(c.hora)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">{c.titulo}</span>
          <span className="block text-xs text-muted">{mostrarData ? nomeDoDia(c.data) : 'Compromisso'}</span>
        </span>
        <IconMais className="h-5 w-5 shrink-0 text-muted" />
      </button>
    </li>
  )
}

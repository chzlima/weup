import { useState } from 'react'
import type { Dados } from '../../lib/useDados'
import { descreverFim, formatarHora, type Compromisso } from '../../lib/agenda'
import { descreverAviso } from '../../lib/lembretes'
import { hojeISO, somarDias, type Tarefa } from '../../lib/tarefas'
import { descreverRegra, type Serie } from '../../lib/series'
import { diasDaSemana, itensDoDia, outraSemana, totalDoDia } from '../../lib/calendario'
import { descreverSemana, segundaDaSemana } from '../../lib/revisaoSemanal'
import { TarefaItem } from '../../components/TarefaItem'
import { IconChevron, IconMais } from '../../components/Icons'
import { usePlantoes } from '../../lib/plantao'
import { contagemRegressiva, progressoDaProva, type Prova } from '../../lib/provas'
import { Aviso } from './Vazio'

const LETRAS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export function nomeDoDia(iso: string) {
  const [a, m, d] = iso.split('-').map(Number)
  const data = new Date(a, m - 1, d)
  const curto = data.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' }).replace(/\./g, '')
  if (iso === hojeISO()) return `Hoje · ${curto}`
  if (iso === somarDias(1)) return `Amanhã · ${curto}`
  return curto.charAt(0).toUpperCase() + curto.slice(1)
}

// Aba Agenda: calendário da semana (segunda a domingo) e o dia escolhido em detalhe:
// compromissos do dia todo, blocos de horário (com a tarefa ligada), tarefas e repetições previstas.
export function Agenda(props: {
  dados: Dados
  onEditarCompromisso: (c: Compromisso) => void
  onEditarTarefa: (t: Tarefa) => void
  onEditarSerie: (s: Serie) => void
  onNovo: (data: string) => void
  onNovaProva: (data: string) => void
  onVerProva: (p: Prova) => void
}) {
  const { dados } = props
  const hoje = hojeISO()
  const [semana, setSemana] = useState(segundaDaSemana(hoje))
  const [dia, setDia] = useState(hoje)
  const dias = diasDaSemana(semana)
  const fonte = { compromissos: dados.compromissos, tarefas: dados.tarefas, series: dados.series }
  const itens = itensDoDia(dia, hoje, fonte)
  const provasDo = (d: string) => dados.provas.filter((p) => p.data === d)
  const provasDoDia = provasDo(dia)
  const nomeProjeto = (id: string | null) => dados.projetos.find((p) => p.id === id)?.titulo
  const nomeTarefa = (id?: string | null) => (id ? dados.tarefas.find((t) => t.id === id)?.titulo : undefined)
  // Dias de plantão ou estágio da semana à vista (só dá para marcar de hoje em diante).
  const plantao = usePlantoes(dias[0], dias[6])
  const ehPlantao = plantao.dias.has(dia)

  const irPara = (delta: number) => {
    const nova = outraSemana(semana, delta)
    setSemana(nova)
    setDia(nova === segundaDaSemana(hoje) ? hoje : nova)
  }

  return (
    <div className="space-y-4">
      {/* Semana */}
      <section className="rounded-3xl border border-line bg-surface p-3">
        <div className="mb-2 flex items-center justify-between">
          <button onClick={() => irPara(-1)} aria-label="Semana anterior" className="rounded-xl p-2 text-muted hover:text-ink">
            <IconChevron className="h-5 w-5 rotate-180" />
          </button>
          <button
            onClick={() => {
              setSemana(segundaDaSemana(hoje))
              setDia(hoje)
            }}
            className="text-sm font-bold"
          >
            {descreverSemana(semana)}
          </button>
          <button onClick={() => irPara(1)} aria-label="Próxima semana" className="rounded-xl p-2 text-muted hover:text-ink">
            <IconChevron className="h-5 w-5" />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dias.map((d) => {
            const n = totalDoDia(itensDoDia(d, hoje, fonte)) + provasDo(d).length
            const escolhido = d === dia
            const [, , dd] = d.split('-').map(Number)
            const letra = LETRAS[new Date(`${d}T12:00`).getDay()]
            return (
              <button
                key={d}
                onClick={() => setDia(d)}
                aria-pressed={escolhido}
                aria-label={`${nomeDoDia(d)}${plantao.dias.has(d) ? ', plantão' : ''}${n ? `, ${n} ${n === 1 ? 'item' : 'itens'}` : ''}`}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-2 text-xs transition-colors ${
                  escolhido ? 'bg-brand text-bg' : d === hoje ? 'bg-brand/15 text-mint' : 'text-muted hover:bg-surface-2'
                }`}
              >
                <span className="font-semibold">{letra}</span>
                <span className="text-base font-bold">{dd}</span>
                {plantao.dias.has(d) && (
                  <span aria-hidden className="-my-0.5 text-[10px] leading-none">
                    🩺
                  </span>
                )}
                <span className={`h-1.5 w-1.5 rounded-full ${n ? (escolhido ? 'bg-bg' : 'bg-mint') : 'bg-transparent'}`} />
              </button>
            )
          })}
        </div>
      </section>

      {/* Dia escolhido */}
      <section>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <h2 className="text-sm font-bold text-muted">{nomeDoDia(dia)}</h2>
          <div className="flex gap-3">
            {dados.temProvas && (
              <button onClick={() => props.onNovaProva(dia)} className="text-xs font-bold text-mint">
                + Prova
              </button>
            )}
            <button onClick={() => props.onNovo(dia)} className="text-xs font-bold text-mint">
              + Compromisso
            </button>
          </div>
        </div>

        {/* Provas deste dia */}
        {provasDoDia.map((p) => {
          const { feitas, total } = progressoDaProva(p, dados.tarefas)
          return (
            <button
              key={p.id}
              onClick={() => props.onVerProva(p)}
              className="mb-2 flex w-full items-center gap-3 rounded-2xl border border-gold/40 bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-2"
            >
              <span aria-hidden className="text-lg">
                📝
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-bold">{p.titulo}</span>
                <span className="block text-xs text-muted">
                  {contagemRegressiva(p.data, hoje)}
                  {total > 0 && ` · estudo ${feitas} de ${total}`}
                </span>
              </span>
            </button>
          )
        })}

        {/* Plantão ou estágio: nesse dia a tela Hoje pede só tarefas pequenas e não espera os hábitos */}
        {plantao.disponivel && dia >= hoje && (
          <button
            onClick={() => plantao.alternar(dia)}
            aria-pressed={ehPlantao}
            className={`mb-2 flex w-full items-center gap-3 rounded-2xl border px-4 py-2.5 text-left text-sm transition-colors ${
              ehPlantao ? 'border-brand bg-brand/15' : 'border-dashed border-line hover:bg-surface-2'
            }`}
          >
            <span aria-hidden className="text-lg">
              🩺
            </span>
            <span className="min-w-0 flex-1">
              <span className={`block font-bold ${ehPlantao ? 'text-mint' : ''}`}>
                {ehPlantao ? 'Dia de plantão ou estágio' : 'Marcar como plantão ou estágio'}
              </span>
              <span className="block text-xs text-muted">
                {ehPlantao ? 'Só tarefas pequenas, e os hábitos podem esperar. Toque para desmarcar.' : 'O dia pede só tarefas pequenas e não espera os hábitos.'}
              </span>
            </span>
          </button>
        )}
        {plantao.erro && <Aviso>{plantao.erro}</Aviso>}

        {totalDoDia(itens) === 0 ? (
          <p className="rounded-2xl border border-dashed border-line p-5 text-center text-sm text-muted">
            Dia livre.{' '}
            <button onClick={() => props.onNovo(dia)} className="font-bold text-mint">
              Adicionar compromisso
            </button>
          </p>
        ) : (
          <ul className="space-y-2">
            {[...itens.diaTodo, ...itens.blocos].map((c) => (
              <LinhaCompromisso key={c.id} c={c} tarefa={nomeTarefa(c.task_id)} onEditar={() => props.onEditarCompromisso(c)} />
            ))}
            {itens.tarefas.map((t) => (
              <TarefaItem
                key={t.id}
                tarefa={t}
                projeto={nomeProjeto(t.project_id)}
                nota={t.series_id ? 'repete' : undefined}
                onAlternar={() => dados.alternarTarefa(t)}
                onEditar={() => props.onEditarTarefa(t)}
              />
            ))}
            {itens.previstas.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => props.onEditarSerie(s)}
                  className="flex w-full items-center gap-3 rounded-2xl border border-dashed border-line px-4 py-3 text-left transition-colors hover:bg-surface-2"
                >
                  <span className="h-6 w-6 shrink-0 rounded-full border-2 border-dashed border-line" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold text-muted">{s.titulo}</span>
                    <span className="block truncate text-xs text-muted">Prevista · {descreverRegra(s)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {itens.previstas.length > 0 && (
          <p className="mt-2 text-xs text-muted">As previstas viram tarefa no próprio dia, quando você abrir o app.</p>
        )}
      </section>
    </div>
  )
}

export function LinhaCompromisso({
  c,
  onEditar,
  mostrarData,
  tarefa,
}: {
  c: Compromisso
  onEditar: () => void
  mostrarData?: boolean
  tarefa?: string // título da tarefa ligada ao bloco
}) {
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
          <span className="block truncate text-xs text-muted">
            {[mostrarData ? nomeDoDia(c.data) : 'Compromisso', descreverFim(c), tarefa && `tarefa: ${tarefa}`, c.hora && descreverAviso(c.lembrete_min) && `🔔 ${descreverAviso(c.lembrete_min)}`]
              .filter(Boolean)
              .join(' · ')}
          </span>
        </span>
        <IconMais className="h-5 w-5 shrink-0 text-muted" />
      </button>
    </li>
  )
}

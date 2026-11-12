import type { ReactNode } from 'react'
import { IconCheck, IconMais } from './Icons'
import { descreverPrazo, formatarData, nomeCategoria, xpDaTarefa, type Tarefa } from '../lib/tarefas'
import { XP_HABITO, type Habito } from '../lib/habitos'

// Linha genérica: círculo para concluir + botão "…" para editar. "acoes" são botões extras embaixo da linha.
export function ItemLinha(props: {
  titulo: string
  detalhes: string
  xp: number
  feito: boolean
  onAlternar: () => void
  onEditar: () => void
  acoes?: ReactNode
}) {
  const { titulo, feito } = props
  return (
    <li className="rounded-2xl border border-line bg-surface transition-colors hover:bg-surface-2">
      <div className="flex items-center gap-1 pr-1">
      <button
        onClick={props.onAlternar}
        aria-label={feito ? `Desmarcar "${titulo}"` : `Concluir "${titulo}"`}
        className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left"
      >
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
            feito ? 'border-brand bg-brand text-bg' : 'border-line'
          }`}
        >
          {feito && <IconCheck className="h-3.5 w-3.5" />}
        </span>
        <span className="min-w-0 flex-1">
          <span className={`block truncate font-semibold ${feito ? 'text-muted line-through' : ''}`}>{titulo}</span>
          <span className="block truncate text-xs text-muted">{props.detalhes}</span>
        </span>
        <span className="shrink-0 text-xs font-bold text-gold">+{props.xp} XP</span>
      </button>
      <button
        onClick={props.onEditar}
        aria-label={`Editar "${titulo}"`}
        className="rounded-xl p-2 text-muted transition-colors hover:text-ink"
      >
        <IconMais className="h-5 w-5" />
      </button>
      </div>
      {props.acoes && <div className="flex flex-wrap gap-2 px-4 pb-3">{props.acoes}</div>}
    </li>
  )
}

export function TarefaItem(props: {
  tarefa: Tarefa
  projeto?: string
  mostrarData?: boolean
  nota?: string // texto extra nos detalhes (ex.: "de ontem")
  acoes?: ReactNode
  onAlternar: () => void
  onEditar: () => void
}) {
  const t = props.tarefa
  const prazo = t.prazo && !t.concluida_em ? descreverPrazo(t.prazo) : null
  const detalhes = [props.projeto ?? nomeCategoria(t.categoria), props.mostrarData ? formatarData(t.data) : null, props.nota, prazo]
    .filter(Boolean)
    .join(' · ')
  return (
    <ItemLinha
      titulo={t.titulo}
      detalhes={detalhes}
      xp={xpDaTarefa(t)}
      feito={!!t.concluida_em}
      onAlternar={props.onAlternar}
      onEditar={props.onEditar}
      acoes={props.acoes}
    />
  )
}

export function HabitoItem(props: {
  habito: Habito
  feito: boolean
  vezesNaSemana: number
  onAlternar: () => void
  onEditar: () => void
}) {
  const n = props.vezesNaSemana
  return (
    <ItemLinha
      titulo={props.habito.titulo}
      detalhes={`Hábito · ${n === 0 ? 'primeira vez na semana' : `${n}× nos últimos 7 dias`}`}
      xp={XP_HABITO}
      feito={props.feito}
      onAlternar={props.onAlternar}
      onEditar={props.onEditar}
    />
  )
}

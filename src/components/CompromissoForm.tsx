import { useState, type FormEvent } from 'react'
import { Rotulo, Sheet } from './Sheet'
import { CampoData } from './CampoData'
import { hojeISO } from '../lib/tarefas'
import { descreverFim, validarHorario, type Compromisso, type DadosCompromisso } from '../lib/agenda'
import type { Tarefa } from '../lib/tarefas'

export function CompromissoForm(props: {
  compromisso?: Compromisso
  dataInicial?: string // dia escolhido no calendário
  tarefas?: Tarefa[] // tarefas abertas que podem ser ligadas ao bloco
  onSalvar: (dados: DadosCompromisso) => void
  onExcluir?: () => void
  onFechar: () => void
}) {
  const c = props.compromisso
  const [titulo, setTitulo] = useState(c?.titulo ?? '')
  const [data, setData] = useState<string>(c?.data ?? props.dataInicial ?? hojeISO())
  const [hora, setHora] = useState(c?.hora?.slice(0, 5) ?? '')
  const [horaFim, setHoraFim] = useState(c?.hora_fim?.slice(0, 5) ?? '')
  const [taskId, setTaskId] = useState(c?.task_id ?? '')
  const abertas = (props.tarefas ?? []).filter((t) => !t.concluida_em || t.id === c?.task_id)
  const [erro, setErro] = useState('')

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return setErro('Dê um nome para o compromisso.')
    const problema = validarHorario(hora, horaFim)
    if (problema) return setErro(problema)
    const dados: DadosCompromisso = {
      titulo: titulo.trim(),
      data,
      hora: hora || null,
      hora_fim: (hora && horaFim) || null,
      task_id: taskId || null,
    }
    // Sem fim num compromisso novo: não manda o campo (assim funciona mesmo antes do ciclo15-agenda.sql).
    if (!dados.hora_fim && !(c && 'hora_fim' in c)) delete dados.hora_fim
    props.onSalvar(dados)
    props.onFechar()
  }

  return (
    <Sheet titulo={c ? 'Editar compromisso' : 'Novo compromisso'} onFechar={props.onFechar}>
      <form onSubmit={enviar} className="space-y-4">
        <label className="block">
          <Rotulo>O que é?</Rotulo>
          <input
            autoFocus
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={120}
            placeholder="Ex.: Prova de anatomia"
            className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>

        <CampoData valor={data} onChange={(v) => setData(v ?? hojeISO())} />

        <label className="block">
          <Rotulo>Horário (opcional)</Rotulo>
          <div className="flex gap-2">
            <input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="min-w-0 flex-1 rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none [color-scheme:dark] focus:border-brand"
            />
            {hora && (
              <button
                type="button"
                onClick={() => {
                  setHora('')
                  setHoraFim('')
                }}
                className="rounded-xl px-3 text-sm font-semibold text-muted"
              >
                Dia todo
              </button>
            )}
          </div>
        </label>

        {hora && (
          <label className="block">
            <Rotulo>Até (opcional)</Rotulo>
            <input
              type="time"
              value={horaFim}
              onChange={(e) => setHoraFim(e.target.value)}
              aria-label="Horário de fim"
              className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none [color-scheme:dark] focus:border-brand"
            />
            {horaFim && (
              <span className="mt-1 block text-xs text-muted">{descreverFim({ hora, hora_fim: horaFim })}</span>
            )}
          </label>
        )}

        {abertas.length > 0 && (
          <label className="block">
            <Rotulo>O que vai fazer nesse horário? (opcional)</Rotulo>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              aria-label="Tarefa ligada ao compromisso"
              className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none focus:border-brand"
            >
              <option value="">Nenhuma tarefa</option>
              {abertas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titulo}
                </option>
              ))}
            </select>
          </label>
        )}

        {erro && <p className="text-sm text-red-300">{erro}</p>}

        <button type="submit" className="w-full rounded-2xl bg-brand py-3 font-bold text-bg">
          {c ? 'Salvar' : 'Adicionar'}
        </button>

        {props.onExcluir && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Excluir este compromisso?')) {
                props.onExcluir!()
                props.onFechar()
              }
            }}
            className="w-full rounded-2xl py-2 text-sm font-bold text-red-300 hover:bg-red-500/10"
          >
            Excluir compromisso
          </button>
        )}
      </form>
    </Sheet>
  )
}

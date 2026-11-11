import { useState, type FormEvent } from 'react'
import { Rotulo, Sheet } from './Sheet'
import { CampoData } from './CampoData'
import { hojeISO } from '../lib/tarefas'
import type { Compromisso, DadosCompromisso } from '../lib/agenda'

export function CompromissoForm(props: {
  compromisso?: Compromisso
  onSalvar: (dados: DadosCompromisso) => void
  onExcluir?: () => void
  onFechar: () => void
}) {
  const c = props.compromisso
  const [titulo, setTitulo] = useState(c?.titulo ?? '')
  const [data, setData] = useState<string>(c?.data ?? hojeISO())
  const [hora, setHora] = useState(c?.hora?.slice(0, 5) ?? '')
  const [erro, setErro] = useState('')

  const enviar = (e: FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return setErro('Dê um nome para o compromisso.')
    props.onSalvar({ titulo: titulo.trim(), data, hora: hora || null })
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
              <button type="button" onClick={() => setHora('')} className="rounded-xl px-3 text-sm font-semibold text-muted">
                Dia todo
              </button>
            )}
          </div>
        </label>

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

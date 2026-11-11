import { useState } from 'react'
import { Opcoes, Rotulo } from './Sheet'
import { amanhaISO, hojeISO } from '../lib/tarefas'

type Modo = 'hoje' | 'amanha' | 'sem' | 'outro'

function modoDaData(d: string | null): Modo {
  if (!d) return 'sem'
  if (d === hojeISO()) return 'hoje'
  if (d === amanhaISO()) return 'amanha'
  return 'outro'
}

// Escolha de data: Hoje / Amanhã / Outro dia (calendário) / Sem data (opcional).
export function CampoData(props: { valor: string | null; onChange: (v: string | null) => void; permitirSemData?: boolean }) {
  const [modo, setModo] = useState<Modo>(modoDaData(props.valor))

  const trocar = (m: Modo) => {
    setModo(m)
    if (m === 'hoje') props.onChange(hojeISO())
    if (m === 'amanha') props.onChange(amanhaISO())
    if (m === 'sem') props.onChange(null)
    if (m === 'outro') props.onChange(props.valor ?? hojeISO())
  }

  const opcoes: { id: Modo; nome: string }[] = [
    { id: 'hoje', nome: 'Hoje' },
    { id: 'amanha', nome: 'Amanhã' },
    { id: 'outro', nome: 'Outro dia' },
  ]
  if (props.permitirSemData) opcoes.push({ id: 'sem', nome: 'Sem data' })

  return (
    <div>
      <Rotulo>Quando</Rotulo>
      <Opcoes valor={modo} onChange={trocar} opcoes={opcoes} />
      {modo === 'outro' && (
        <input
          type="date"
          value={props.valor ?? ''}
          min={props.permitirSemData ? undefined : hojeISO()}
          onChange={(e) => props.onChange(e.target.value || (props.permitirSemData ? null : hojeISO()))}
          className="mt-2 w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none [color-scheme:dark] focus:border-brand"
        />
      )}
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { Rotulo, Sheet } from './Sheet'
import { CampoData } from './CampoData'
import { formatarData, hojeISO, somarDias, type Tarefa } from '../lib/tarefas'
import {
  MAX_ASSUNTOS, contagemRegressiva, distribuirEstudo, lerAssuntos, progressoDaProva, type Prova,
} from '../lib/provas'

const campo = 'w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none focus:border-brand'

// Modo prova. Sem prova: cadastra (nome, data e assuntos) e mostra o plano antes de salvar.
// Com prova: mostra a contagem, o progresso e as tarefas, e permite excluir.
type Props = {
  prova?: Prova
  dataInicial?: string
  tarefas: Tarefa[]
  onCriar: (titulo: string, data: string, assuntos: string[]) => Promise<string>
  onExcluir?: () => void
  onFechar: () => void
}

export function ProvaForm(props: Props) {
  return props.prova ? <VerProva {...props} prova={props.prova} /> : <NovaProva {...props} />
}

function NovaProva(props: Props) {
  const hoje = hojeISO()
  const [titulo, setTitulo] = useState('')
  const [data, setData] = useState(props.dataInicial && props.dataInicial > hoje ? props.dataInicial : somarDias(7))
  const [texto, setTexto] = useState('')
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)
  const assuntos = lerAssuntos(texto)

  let plano: ReturnType<typeof distribuirEstudo> = []
  let problema = ''
  try {
    if (assuntos.length) plano = distribuirEstudo(data, assuntos, hoje)
  } catch (e) {
    problema = (e as Error).message
  }

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!titulo.trim()) return setErro('Dê um nome para a prova.')
    if (!assuntos.length) return setErro('Escreva pelo menos um assunto.')
    if (problema) return setErro(problema)
    setSalvando(true)
    const falha = await props.onCriar(titulo.trim(), data, assuntos)
    setSalvando(false)
    if (falha) return setErro(falha)
    props.onFechar()
  }

  return (
    <Sheet titulo="Nova prova" onFechar={props.onFechar}>
      <form onSubmit={enviar} className="space-y-4">
        <label className="block">
          <Rotulo>Qual prova?</Rotulo>
          <input
            autoFocus
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={120}
            placeholder="Ex.: Prova de Clínica Médica"
            className={campo}
          />
        </label>

        <CampoData valor={data} onChange={(v) => setData(v ?? somarDias(7))} />

        <label className="block">
          <Rotulo>Assuntos (um por linha)</Rotulo>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={5}
            placeholder={'Cardiologia\nPneumologia\nNefrologia'}
            className={`${campo} resize-none`}
          />
          <span className="mt-1 block text-xs text-muted">
            {assuntos.length}/{MAX_ASSUNTOS} assuntos
          </span>
        </label>

        {plano.length > 0 && (
          <div className="rounded-2xl border border-line bg-surface-2 p-3">
            <p className="mb-2 text-xs font-bold text-muted">
              O plano · {contagemRegressiva(data, hoje).toLowerCase()}
            </p>
            <ul className="space-y-1 text-sm">
              {plano.map((e, i) => (
                <li key={i} className="flex justify-between gap-3">
                  <span className="truncate">{e.titulo}</span>
                  <span className="shrink-0 text-muted">{formatarData(e.data)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">
              Viram tarefas comuns de estudo, com o prazo na data da prova. Dá para mudar o dia de cada uma depois.
            </p>
          </div>
        )}
        {problema && assuntos.length > 0 && <p className="text-sm text-red-300">{problema}</p>}
        {erro && <p className="text-sm text-red-300">{erro}</p>}

        <button
          type="submit"
          disabled={salvando}
          className="w-full rounded-2xl bg-brand py-3 font-bold text-bg disabled:opacity-50"
        >
          {salvando ? 'Criando…' : 'Criar plano de estudo'}
        </button>
      </form>
    </Sheet>
  )
}

function VerProva(props: { prova: Prova; tarefas: Tarefa[]; onExcluir?: () => void; onFechar: () => void }) {
  const { prova } = props
  const hoje = hojeISO()
  const daProva = props.tarefas
    .filter((t) => t.exam_id === prova.id)
    .sort((a, b) => (a.data ?? '').localeCompare(b.data ?? ''))
  const { feitas, total } = progressoDaProva(prova, props.tarefas)
  const abertas = total - feitas

  return (
    <Sheet titulo={prova.titulo} onFechar={props.onFechar}>
      <p className="text-sm">
        <span className="font-bold text-mint">{contagemRegressiva(prova.data, hoje)}</span>
        <span className="text-muted"> · {formatarData(prova.data)}</span>
      </p>
      {total > 0 && (
        <>
          <p className="mt-3 text-xs font-bold text-muted">
            Estudo · {feitas} de {total} feitos
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {daProva.map((t) => (
              <li key={t.id} className="flex justify-between gap-3">
                <span className={`truncate ${t.concluida_em ? 'text-muted line-through' : ''}`}>{t.titulo}</span>
                <span className="shrink-0 text-muted">{formatarData(t.data)}</span>
              </li>
            ))}
          </ul>
        </>
      )}
      {props.onExcluir && (
        <button
          onClick={() => {
            const aviso = abertas
              ? `Excluir a prova e as ${abertas} tarefas de estudo que ainda estão abertas? As já feitas continuam.`
              : 'Excluir a prova?'
            if (!confirm(aviso)) return
            props.onExcluir!()
            props.onFechar()
          }}
          className="mt-5 w-full rounded-2xl border border-line py-3 text-sm font-bold text-red-300"
        >
          Excluir prova
        </button>
      )}
    </Sheet>
  )
}

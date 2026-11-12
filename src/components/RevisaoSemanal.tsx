import { useEffect, useState } from 'react'
import { Pet } from './Pet'
import { useAuth } from '../lib/auth'
import { usePet } from '../lib/pet'
import {
  PERGUNTAS, buscarFatos, buscarRevisao, cartaDoPet, descreverSemana, diaDeRevisar, formatarMinutos, salvarRevisao,
  semanaRevisada, type Fatos, type Respostas,
} from '../lib/revisaoSemanal'

const VAZIO: Respostas = { avancou: '', travou: '', muda: '', prioridades: '' }

// Cartão que abre a revisão. "sempre": aparece todo dia (Evoluir); senão, só no domingo e na segunda
// e enquanto a revisão da semana não foi feita (Hoje).
export function EntradaRevisao({ sempre }: { sempre?: boolean }) {
  const semana = semanaRevisada()
  const [estado, setEstado] = useState<{ disponivel: boolean; feita: boolean } | null>(null)
  const [aberta, setAberta] = useState(false)

  useEffect(() => {
    buscarRevisao(semana)
      // Revisão salva toda em branco não conta como feita.
      .then((r) => setEstado({ disponivel: r.disponivel, feita: !!r.revisao && Object.values(r.revisao).some(Boolean) }))
      .catch(() => setEstado(null))
  }, [semana, aberta])

  if (!estado?.disponivel) return null
  if (!sempre && (!diaDeRevisar() || estado.feita)) return null

  return (
    <>
      <button
        onClick={() => setAberta(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-brand/40 bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-2"
      >
        <span aria-hidden className="text-2xl">
          📬
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-bold">Revisão da semana</span>
          <span className="block text-xs text-muted">
            {estado.feita
              ? `${descreverSemana(semana)} · feita. Toque para ver ou editar.`
              : `${descreverSemana(semana)} · uns 2 minutos, com uma carta do seu pet.`}
          </span>
        </span>
        <span className="text-sm font-bold text-mint">{estado.feita ? 'Ver' : 'Abrir'}</span>
      </button>
      {aberta && <RevisaoSemanal semana={semana} onFechar={() => setAberta(false)} />}
    </>
  )
}

export function RevisaoSemanal({ semana, onFechar }: { semana: string; onFechar: () => void }) {
  const { nome } = useAuth()
  const { pet } = usePet()
  const [fatos, setFatos] = useState<Fatos | null>(null)
  const [respostas, setRespostas] = useState<Respostas>(VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    Promise.all([buscarFatos(semana), buscarRevisao(semana)])
      .then(([f, r]) => {
        setFatos(f)
        if (r.revisao) {
          const v = r.revisao
          setRespostas({ avancou: v.avancou ?? '', travou: v.travou ?? '', muda: v.muda ?? '', prioridades: v.prioridades ?? '' })
        }
      })
      .catch((e) => setErro((e as Error).message))
  }, [semana])

  const salvar = async () => {
    setSalvando(true)
    setErro('')
    try {
      await salvarRevisao(semana, respostas)
      setSalvo(true)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Revisão da semana" className="fixed inset-0 z-50 overflow-y-auto bg-bg">
      <div className="mx-auto max-w-md space-y-5 px-4 py-6">
        <header className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold">Revisão da semana</h1>
            <p className="text-sm text-muted">{descreverSemana(semana)}</p>
          </div>
          <button onClick={onFechar} className="rounded-xl px-3 py-1.5 text-sm font-semibold text-muted hover:text-ink">
            Fechar
          </button>
        </header>

        {!fatos && !erro && <p className="py-10 text-center text-sm text-muted">Juntando a sua semana…</p>}

        {fatos && (
          <>
            {/* Os fatos: só números, sem julgamento */}
            <section>
              <h2 className="mb-2 text-sm font-bold text-muted">Os fatos</h2>
              <div className="grid grid-cols-2 gap-2">
                <Numero rotulo="Tarefas concluídas" valor={String(fatos.tarefas)} />
                <Numero rotulo="Hábitos feitos" valor={String(fatos.habitos)} />
                <Numero
                  rotulo={`Foco (${fatos.sessoesFoco} ${fatos.sessoesFoco === 1 ? 'sessão' : 'sessões'})`}
                  valor={fatos.minutosFoco ? formatarMinutos(fatos.minutosFoco) : '0 min'}
                />
                <Numero rotulo="XP ganho" valor={`+${fatos.xp}`} />
              </div>
            </section>

            {/* A carta do pet */}
            <section className="flex gap-3 rounded-3xl border border-line bg-surface p-4">
              <div className="shrink-0">
                <Pet especie={pet?.especie} estagio={pet?.estagio} caminho={pet?.caminho} feliz size={64} nome={pet?.nome} />
              </div>
              <div className="space-y-2 text-sm">
                {cartaDoPet(fatos, nome, pet?.nome ?? 'Seu companheiro').map((p, i, todos) => (
                  <p key={i} className={i === todos.length - 1 ? 'font-bold text-mint' : ''}>
                    {p}
                  </p>
                ))}
              </div>
            </section>

            {/* As perguntas: todas opcionais */}
            <section className="space-y-3">
              <h2 className="text-sm font-bold text-muted">Para você pensar (tudo opcional)</h2>
              {PERGUNTAS.map((q) => (
                <label key={q.id} className="block">
                  <span className="mb-1 block text-sm font-semibold">{q.pergunta}</span>
                  <textarea
                    value={respostas[q.id]}
                    onChange={(e) => {
                      setRespostas((r) => ({ ...r, [q.id]: e.target.value }))
                      setSalvo(false)
                    }}
                    maxLength={1000}
                    rows={2}
                    placeholder={q.exemplo}
                    className="w-full resize-y rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand"
                  />
                </label>
              ))}
            </section>

            {erro && <p className="text-sm text-red-300">{erro}</p>}

            <button
              onClick={salvar}
              disabled={salvando}
              className="w-full rounded-2xl bg-brand py-3 font-bold text-bg disabled:opacity-60"
            >
              {salvando ? 'Salvando…' : salvo ? 'Salvo 🌱' : 'Salvar revisão'}
            </button>
            <p className="text-center text-xs text-muted">Dá para voltar e editar até a semana virar.</p>
          </>
        )}

        {erro && !fatos && <p className="text-sm text-red-300">{erro}</p>}
      </div>
    </div>
  )
}

function Numero({ rotulo, valor }: { rotulo: string; valor: string }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-3">
      <p className="text-xs text-muted">{rotulo}</p>
      <p className="mt-0.5 text-xl font-bold">{valor}</p>
    </div>
  )
}

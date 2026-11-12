import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Opcoes, Rotulo, Sheet } from './Sheet'
import { Pet } from './Pet'
import { usePet } from '../lib/pet'
import {
  DURACOES, INTERVALO_MIN, MAX_MINUTOS, MIN_MINUTOS, MIN_MINUTOS_XP, XP_FOCO, buscarFocoAtivo, concluirFoco,
  desistirFoco, iniciarFoco, lerDuracao, pausarFoco, retomarFoco, tempoRestanteMs, type SessaoFoco,
} from '../lib/foco'
import type { Tarefa } from '../lib/tarefas'

type Estado = 'parado' | 'rodando' | 'pausado' | 'concluindo' | 'fim' | 'intervalo'

// Cartão "Foco" da tela Hoje + a tela cheia com a contagem regressiva.
export function Foco(props: { tarefas: Tarefa[]; sessoesHoje: number; onConcluiu: () => void; abrir?: boolean }) {
  const { pet } = usePet()
  const [estado, setEstado] = useState<Estado>('parado')
  const [sessao, setSessao] = useState<SessaoFoco | null>(null)
  const [fim, setFim] = useState(0) // horário (no relógio do celular) em que a sessão termina
  const [restantePausa, setRestantePausa] = useState(0) // ms que faltavam quando a sessão foi pausada
  const [fimIntervalo, setFimIntervalo] = useState(0) // fim da pausa curta depois da sessão
  const [agora, setAgora] = useState(Date.now())
  const [configurando, setConfigurando] = useState(false)
  const [xpGanho, setXpGanho] = useState<number | null>(null)
  const [erro, setErro] = useState('')

  // Retoma uma sessão que já estava rodando (ex.: a pessoa fechou e abriu o app).
  useEffect(() => {
    buscarFocoAtivo()
      .then((s) => {
        // Veio do atalho "Iniciar foco": sem sessão rodando, já abre a escolha da duração.
        if (!s) {
          if (props.abrir) setConfigurando(true)
          return
        }
        setSessao(s)
        // Os horários vêm do relógio do servidor. Converte para o do celular usando a diferença medida
        // quando a sessão começou. O tempo pausado não conta, e o restante nunca passa da duração.
        const restante = tempoRestanteMs(s, Date.now() + lerDiferencaRelogio())
        if (s.pausada_em) {
          setRestantePausa(restante)
          setEstado('pausado')
        } else {
          setFim(Date.now() + restante)
          setEstado('rodando')
        }
      })
      .catch(() => {})
  }, [])

  // Relógio: atualiza a cada segundo e também quando o app volta para a tela.
  useEffect(() => {
    if (estado !== 'rodando' && estado !== 'intervalo') return
    const tic = () => setAgora(Date.now())
    const id = setInterval(tic, 1000)
    document.addEventListener('visibilitychange', tic)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', tic)
    }
  }, [estado])

  const concluir = useCallback(async () => {
    if (!sessao) return
    setEstado('concluindo')
    setErro('')
    try {
      const xp = await concluirFoco(sessao.id)
      setXpGanho(xp)
      setEstado('fim')
      tocarSom()
      navigator.vibrate?.([120, 80, 120])
      props.onConcluiu()
    } catch (e) {
      if ((e as Error).message === 'cedo') {
        // Relógio do celular um pouco adiantado: espera mais um pouco e tenta de novo.
        setEstado('rodando')
        setFim(Date.now() + 10_000)
      } else {
        setErro('Não foi possível registrar a sessão. Verifique a internet.')
        setEstado('rodando')
        setFim(Number.POSITIVE_INFINITY)
      }
    }
  }, [sessao, props])

  useEffect(() => {
    if (estado === 'rodando' && agora >= fim) concluir()
  }, [estado, agora, fim, concluir])

  // Fim da pausa curta: avisa e volta ao normal.
  useEffect(() => {
    if (estado === 'intervalo' && agora >= fimIntervalo) {
      tocarSom()
      navigator.vibrate?.([120, 80, 120])
      setEstado('parado')
      setSessao(null)
    }
  }, [estado, agora, fimIntervalo])

  const pausar = async () => {
    if (!sessao) return
    const faltava = Math.max(0, fim - Date.now())
    setRestantePausa(faltava)
    setEstado('pausado')
    try {
      await pausarFoco(sessao.id)
      setErro('')
    } catch {
      setErro('Não foi possível pausar. Verifique a internet.')
      setEstado('rodando')
    }
  }

  const continuar = async () => {
    if (!sessao) return
    setFim(Date.now() + restantePausa)
    setAgora(Date.now())
    setEstado('rodando')
    try {
      await retomarFoco(sessao.id)
      setErro('')
    } catch {
      setErro('Não foi possível continuar. Verifique a internet.')
      setEstado('pausado')
    }
  }

  // Título da aba com o tempo restante.
  const restante = estado === 'pausado' ? Math.ceil(restantePausa / 1000) : Math.max(0, Math.ceil((fim - agora) / 1000))
  useEffect(() => {
    if (estado !== 'rodando' || !Number.isFinite(fim)) return
    const antigo = document.title
    document.title = `${formatar(restante)} · Foco`
    return () => {
      document.title = antigo
    }
  }, [estado, restante, fim])

  const comecar = async (minutos: number, taskId: string | null) => {
    const s = await iniciarFoco(minutos, taskId)
    salvarDiferencaRelogio(Date.parse(s.inicio) - Date.now())
    setSessao(s)
    setFim(Date.now() + minutos * 60_000)
    setAgora(Date.now())
    setXpGanho(null)
    setEstado('rodando')
  }

  const desistir = async () => {
    if (!sessao) return
    if (!confirm('Parar agora? Tudo bem, nada se perde. Esta sessão só não conta XP.')) return
    try {
      await desistirFoco(sessao.id)
    } catch {
      /* se falhar, a sessão só fica esquecida no banco */
    }
    setSessao(null)
    setEstado('parado')
  }

  const tarefaFoco = props.tarefas.find((t) => t.id === sessao?.task_id)

  return (
    <>
      <button
        onClick={() => setConfigurando(true)}
        className="flex w-full items-center gap-3 rounded-2xl border border-line bg-surface px-4 py-3 text-left transition-colors hover:bg-surface-2"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand/15 text-mint">
          <IconTimer className="h-5 w-5" />
        </span>
        <span className="flex-1">
          <span className="block font-bold">Sessão de foco</span>
          <span className="text-xs text-muted">
            {props.sessoesHoje === 0
              ? `Concentre-se por um tempo · +${XP_FOCO} XP`
              : `${props.sessoesHoje} ${props.sessoesHoje === 1 ? 'sessão' : 'sessões'} hoje · +${XP_FOCO} XP cada`}
          </span>
        </span>
        <span className="text-sm font-bold text-mint">Iniciar</span>
      </button>

      {configurando && (
        <ConfigurarFoco
          tarefas={props.tarefas}
          onComecar={comecar}
          onFechar={() => setConfigurando(false)}
        />
      )}

      {(estado === 'rodando' || estado === 'pausado' || estado === 'concluindo') && sessao && (
        <TelaCheia>
          <div className="flex min-h-14 items-end text-center">
            <p className="text-sm text-muted">
              {tarefaFoco ? (
                <>
                  Focando em <span className="font-bold text-ink">{tarefaFoco.titulo}</span>
                </>
              ) : (
                'Foco livre'
              )}
            </p>
          </div>
          <Anel fracao={estado === 'pausado' || Number.isFinite(fim) ? 1 - restante / (sessao.minutos * 60) : 0}>
            <Pet especie={pet?.especie} estagio={pet?.estagio} caminho={pet?.caminho} visual={pet ?? undefined} size={110} nome={pet?.nome} />
            <p className="mt-1 text-4xl font-extrabold tabular-nums" aria-live="off">
              {estado === 'concluindo'
                ? '00:00'
                : estado === 'pausado' || Number.isFinite(fim)
                  ? formatar(restante)
                  : '--:--'}
            </p>
            {estado === 'pausado' && <p className="text-xs font-bold uppercase tracking-wider text-gold">Pausado</p>}
          </Anel>
          {erro ? (
            <div className="space-y-2 text-center">
              <p className="text-sm text-red-300">{erro}</p>
              <button onClick={concluir} className="rounded-2xl bg-brand px-6 py-2.5 font-bold text-bg">
                Tentar de novo
              </button>
            </div>
          ) : (
            <p className="max-w-xs text-center text-xs text-muted">
              {estado === 'pausado'
                ? 'O tempo pausado não conta. Continue quando quiser, mesmo fechando o app.'
                : `Pode bloquear a tela: o tempo continua contando. ${pet?.nome ?? 'Seu companheiro'} está focando junto.`}
            </p>
          )}
          {estado !== 'concluindo' && (
            <button
              onClick={estado === 'pausado' ? continuar : pausar}
              className="rounded-2xl bg-brand px-8 py-3 font-bold text-bg"
            >
              {estado === 'pausado' ? 'Continuar' : 'Pausar'}
            </button>
          )}
          <button
            onClick={desistir}
            disabled={estado === 'concluindo'}
            className="rounded-2xl border border-line px-6 py-2.5 text-sm font-bold text-muted hover:text-ink disabled:opacity-50"
          >
            Parar sessão
          </button>
        </TelaCheia>
      )}

      {estado === 'fim' && (
        <TelaCheia>
          <div className="animate-[pulinho_0.8s_ease-in-out_2]">
            <Pet especie={pet?.especie} estagio={pet?.estagio} caminho={pet?.caminho} visual={pet ?? undefined} feliz size={140} nome={pet?.nome} />
          </div>
          <p className="text-2xl font-extrabold">Sessão concluída!</p>
          {xpGanho ? (
            <p className="text-lg font-bold text-gold">+{xpGanho} XP</p>
          ) : (
            <p className="max-w-xs text-center text-sm text-muted">
              {sessao && sessao.minutos < MIN_MINUTOS_XP
                ? `Sessões a partir de ${MIN_MINUTOS_XP} minutos valem XP. O tempo focado conta do mesmo jeito.`
                : 'Você chegou ao limite diário de XP de foco, mas o tempo focado continua valendo muito.'}
            </p>
          )}
          <button
            onClick={() => {
              setFimIntervalo(Date.now() + INTERVALO_MIN * 60_000)
              setAgora(Date.now())
              setEstado('intervalo')
            }}
            className="rounded-2xl bg-brand px-8 py-3 font-bold text-bg"
          >
            Pausa de {INTERVALO_MIN} min
          </button>
          <button
            onClick={() => {
              setEstado('parado')
              setSessao(null)
            }}
            className="rounded-2xl border border-line px-6 py-2.5 text-sm font-bold text-muted hover:text-ink"
          >
            Voltar
          </button>
        </TelaCheia>
      )}

      {estado === 'intervalo' && (
        <TelaCheia>
          <Pet especie={pet?.especie} estagio={pet?.estagio} caminho={pet?.caminho} visual={pet ?? undefined} feliz size={110} nome={pet?.nome} />
          <p className="text-xl font-extrabold">Pausa</p>
          <p className="text-4xl font-extrabold tabular-nums">
            {formatar(Math.max(0, Math.ceil((fimIntervalo - agora) / 1000)))}
          </p>
          <p className="max-w-xs text-center text-sm text-muted">Levante, beba água, olhe para longe. Quando acabar, o app avisa.</p>
          <button
            onClick={() => {
              setEstado('parado')
              setSessao(null)
            }}
            className="rounded-2xl border border-line px-6 py-2.5 text-sm font-bold text-muted hover:text-ink"
          >
            Encerrar pausa
          </button>
        </TelaCheia>
      )}
    </>
  )
}

function ConfigurarFoco(props: {
  tarefas: Tarefa[]
  onComecar: (minutos: number, taskId: string | null) => Promise<void>
  onFechar: () => void
}) {
  const [duracao, setDuracao] = useState<'15' | '25' | '50' | 'outra'>('25')
  const [outra, setOutra] = useState('30')
  const [taskId, setTaskId] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')

  const minutos = duracao === 'outra' ? lerDuracao(outra) : Number(duracao)

  const comecar = async () => {
    if (!minutos) return setErro(`Escolha de ${MIN_MINUTOS} a ${MAX_MINUTOS} minutos.`)
    setEnviando(true)
    setErro('')
    try {
      await props.onComecar(minutos, taskId || null)
      props.onFechar()
    } catch {
      setErro('Não foi possível começar. Verifique a internet.')
      setEnviando(false)
    }
  }

  return (
    <Sheet titulo="Sessão de foco" onFechar={props.onFechar}>
      <div className="space-y-4">
        <div>
          <Rotulo>Duração</Rotulo>
          <Opcoes opcoes={DURACOES} valor={duracao} onChange={setDuracao} />
          {duracao === 'outra' && (
            <label className="mt-2 flex items-center gap-2 text-sm text-muted">
              <input
                type="number"
                inputMode="numeric"
                min={MIN_MINUTOS}
                max={MAX_MINUTOS}
                value={outra}
                onChange={(e) => setOutra(e.target.value)}
                aria-label="Minutos de foco"
                className="w-24 rounded-xl border border-line bg-surface-2 px-3 py-2.5 text-ink outline-none focus:border-brand"
              />
              minutos ({MIN_MINUTOS} a {MAX_MINUTOS})
            </label>
          )}
        </div>
        {props.tarefas.length > 0 && (
          <label className="block">
            <Rotulo>No que vai focar? (opcional)</Rotulo>
            <select
              value={taskId}
              onChange={(e) => setTaskId(e.target.value)}
              className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none focus:border-brand"
            >
              <option value="">Foco livre</option>
              {props.tarefas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.titulo}
                </option>
              ))}
            </select>
          </label>
        )}
        <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">
          {minutos && minutos < MIN_MINUTOS_XP ? (
            <>Sessões a partir de {MIN_MINUTOS_XP} minutos valem XP; esta conta como tempo focado. </>
          ) : (
            <>
              Ao terminar: <span className="font-bold text-gold">+{XP_FOCO} XP</span>.{' '}
            </>
          )}
          Dá para pausar no meio. Parar antes não tira nada, só não conta XP.
        </p>
        {erro && <p className="text-sm text-red-300">{erro}</p>}
        <button
          onClick={comecar}
          disabled={enviando}
          className="w-full rounded-2xl bg-brand py-3 font-bold text-bg disabled:opacity-60"
        >
          {enviando ? 'Começando…' : 'Começar'}
        </button>
      </div>
    </Sheet>
  )
}

function TelaCheia({ children }: { children: ReactNode }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sessão de foco"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg px-6"
    >
      {children}
    </div>
  )
}

// Anel de progresso (traço verde sobre trilha do mesmo verde, mais claro).
function Anel({ fracao, children }: { fracao: number; children: ReactNode }) {
  const R = 120
  const C = 2 * Math.PI * R
  const f = Math.min(1, Math.max(0, fracao))
  return (
    <div className="relative flex h-72 w-72 items-center justify-center">
      <svg viewBox="0 0 264 264" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden="true">
        <circle cx="132" cy="132" r={R} fill="none" stroke="currentColor" strokeWidth="8" className="text-brand/20" />
        <circle
          cx="132"
          cy="132"
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C * (1 - f)}
          className="text-brand transition-[stroke-dashoffset] duration-1000 ease-linear"
        />
      </svg>
      <div className="relative flex flex-col items-center">{children}</div>
    </div>
  )
}

// Diferença entre o relógio do servidor e o do celular (servidor − celular), em ms.
const CHAVE_RELOGIO = 'weup-foco-relogio'
function salvarDiferencaRelogio(ms: number) {
  try {
    localStorage.setItem(CHAVE_RELOGIO, String(ms))
  } catch {
    /* sem armazenamento: usa 0 */
  }
}
function lerDiferencaRelogio() {
  try {
    const v = Number(localStorage.getItem(CHAVE_RELOGIO))
    return Number.isFinite(v) ? v : 0
  } catch {
    return 0
  }
}

function formatar(seg: number) {
  const m = Math.floor(seg / 60)
  const s = seg % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

// Sininho curto ao terminar (sem arquivo de áudio).
function tocarSom() {
  try {
    const ctx = new AudioContext()
    ;[660, 880].forEach((freq, i) => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.frequency.value = freq
      o.connect(g)
      g.connect(ctx.destination)
      const t = ctx.currentTime + i * 0.18
      g.gain.setValueAtTime(0.0001, t)
      g.gain.exponentialRampToValueAtTime(0.2, t + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.5)
      o.start(t)
      o.stop(t + 0.55)
    })
  } catch {
    /* sem som, tudo bem */
  }
}

function IconTimer({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="13.5" r="7.5" />
      <path d="M12 9.5v4l2.5 2M9.5 2.5h5M12 2.5V6" />
    </svg>
  )
}

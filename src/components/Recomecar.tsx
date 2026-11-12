import { useState, type ReactNode } from 'react'
import { Pet } from './Pet'
import { Opcoes } from './Sheet'
import { IconCheck } from './Icons'
import { usePet } from '../lib/pet'
import type { Dados } from '../lib/useDados'
import { MOTIVOS, registrarRecomeco, type Motivo } from '../lib/recomecar'
import { formatarData, hojeISO, somarDias, type Tarefa } from '../lib/tarefas'

type Passo = 1 | 2 | 3 | 4 | 'fim'
type Adiar = 'amanha' | '3dias' | 'sem'

// Modo Recomeçar: 4 passos para quem travou.
// 1. Identificar o que travou → 2. Reduzir a carga → 3. Escolher UMA ação pequena → 4. Retomar aos poucos.
export function Recomecar({ dados, onFechar }: { dados: Dados; onFechar: () => void }) {
  const { pet } = usePet()
  const [passo, setPasso] = useState<Passo>(1)
  const [motivo, setMotivo] = useState<Motivo | null>(null)
  const hoje = hojeISO()

  // O que está pesando hoje (pendente até hoje).
  const pendentes = dados.tarefas.filter((t) => !t.concluida_em && t.data && t.data <= hoje)
  const [manter, setManter] = useState<Set<string>>(new Set())
  const [adiar, setAdiar] = useState<Adiar>('3dias')
  const [salvando, setSalvando] = useState(false)

  const [acao, setAcao] = useState('')
  const [acaoPropria, setAcaoPropria] = useState('')
  const [tarefaAcao, setTarefaAcao] = useState<Tarefa | null>(null)
  const [fila, setFila] = useState<string[]>([]) // ids das tarefas mantidas, uma de cada vez
  const [feitasNoFluxo, setFeitasNoFluxo] = useState(0)

  const info = MOTIVOS.find((m) => m.id === motivo)

  // Passo 2 → adia o que não foi mantido.
  const aliviar = async () => {
    setSalvando(true)
    const novaData = adiar === 'amanha' ? somarDias(1) : adiar === '3dias' ? somarDias(3) : null
    const adiadas = pendentes.filter((t) => !manter.has(t.id))
    await Promise.all(
      adiadas.map((t) =>
        dados.salvarTarefa(
          { titulo: t.titulo, dificuldade: t.dificuldade, categoria: t.categoria, project_id: t.project_id, data: novaData },
          t.id,
        ),
      ),
    )
    setFila(pendentes.filter((t) => manter.has(t.id)).map((t) => t.id))
    setSalvando(false)
    setPasso(3)
  }

  // Passo 3 → cria a ação pequena como tarefa de hoje.
  const escolherAcao = async () => {
    const titulo = (acao === '__propria' ? acaoPropria : acao).trim()
    if (!titulo) return
    setSalvando(true)
    const t = await dados.criarTarefa({ titulo, dificuldade: 'pequena', categoria: 'rotina', project_id: null, data: hoje })
    setSalvando(false)
    if (!t) return
    setTarefaAcao(t)
    setPasso(4)
  }

  // Passo 4 → marcar a ação pequena (e depois as mantidas, uma por vez).
  const fazerAcao = async () => {
    if (!tarefaAcao) return
    setSalvando(true)
    await dados.alternarTarefa(tarefaAcao)
    if (motivo) await registrarRecomeco(motivo).catch(() => {})
    setTarefaAcao(null)
    setFeitasNoFluxo((n) => n + 1)
    setSalvando(false)
  }

  const proxima = fila.map((id) => dados.tarefas.find((t) => t.id === id)).find((t) => t && !t.concluida_em)

  const fazerProxima = async () => {
    if (!proxima) return
    setSalvando(true)
    await dados.alternarTarefa(proxima)
    setFeitasNoFluxo((n) => n + 1)
    setSalvando(false)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Modo Recomeçar"
      className="fixed inset-0 z-50 overflow-y-auto bg-bg"
    >
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-6">
        <header className="flex items-center justify-between">
          <Pontos passo={passo} />
          <button onClick={onFechar} className="rounded-xl px-3 py-1.5 text-sm font-semibold text-muted hover:text-ink">
            {passo === 'fim' ? 'Fechar' : 'Sair'}
          </button>
        </header>

        <div className="flex flex-1 flex-col justify-center gap-5 py-6">
          {passo === 1 && (
            <>
              <Titulo pet={pet} feliz={false} titulo="Vamos recomeçar juntos" sub="Sem pressa e sem culpa. O que travou?" />
              <div className="space-y-2">
                {MOTIVOS.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => {
                      setMotivo(m.id)
                      setAcao(m.sugestoes[0])
                      setPasso(2)
                    }}
                    className="w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-left font-semibold transition-colors hover:border-brand hover:bg-surface-2"
                  >
                    {m.nome}
                  </button>
                ))}
              </div>
              <p className="text-center text-xs text-muted">
                Se for algo além do cansaço do dia a dia, conversar com alguém de confiança ajuda. No Brasil, o CVV atende
                de graça pelo 188, a qualquer hora.
              </p>
            </>
          )}

          {passo === 2 && info && (
            <>
              <Titulo pet={pet} feliz={false} titulo="Vamos tirar peso" sub={info.acolhimento} />
              {pendentes.length === 0 ? (
                <Caixa>Sua lista de hoje já está leve. Nada para adiar.</Caixa>
              ) : (
                <>
                  <p className="text-sm text-muted">
                    Marque só o que é <b className="text-ink">realmente urgente</b> hoje. O resto sai da frente por um
                    tempo e volta sozinho depois.
                  </p>
                  <ul className="space-y-2">
                    {pendentes.map((t) => {
                      const on = manter.has(t.id)
                      return (
                        <li key={t.id}>
                          <button
                            onClick={() =>
                              setManter((s) => {
                                const n = new Set(s)
                                if (on) n.delete(t.id)
                                else n.add(t.id)
                                return n
                              })
                            }
                            aria-pressed={on}
                            className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                              on ? 'border-brand bg-brand/10' : 'border-line bg-surface'
                            }`}
                          >
                            <span
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 ${
                                on ? 'border-brand bg-brand text-bg' : 'border-line'
                              }`}
                            >
                              {on && <IconCheck className="h-3 w-3" />}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate font-semibold">{t.titulo}</span>
                              <span className="text-xs text-muted">{on ? 'Fica para hoje' : 'Sai da frente'}</span>
                            </span>
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                  <div>
                    <p className="mb-1.5 text-xs font-semibold text-muted">O que sair da frente volta…</p>
                    <Opcoes
                      valor={adiar}
                      onChange={setAdiar}
                      opcoes={[
                        { id: 'amanha', nome: 'Amanhã' },
                        { id: '3dias', nome: 'Em 3 dias' },
                        { id: 'sem', nome: 'Sem data' },
                      ]}
                    />
                  </div>
                </>
              )}
              <BotaoPrincipal onClick={aliviar} disabled={salvando}>
                {salvando
                  ? 'Aliviando…'
                  : pendentes.length - manter.size > 0
                    ? `Tirar ${pendentes.length - manter.size} da frente`
                    : 'Continuar'}
              </BotaoPrincipal>
            </>
          )}

          {passo === 3 && info && (
            <>
              <Titulo pet={pet} feliz={false} titulo="Um passo bem pequeno" sub="Escolha uma única coisa. Pequena mesmo." />
              <div className="space-y-2">
                {[...info.sugestoes, '__propria'].map((s) => {
                  const on = acao === s
                  return (
                    <button
                      key={s}
                      onClick={() => setAcao(s)}
                      aria-pressed={on}
                      className={`w-full rounded-2xl border px-4 py-3 text-left font-semibold transition-colors ${
                        on ? 'border-brand bg-brand/10 text-ink' : 'border-line bg-surface text-muted hover:text-ink'
                      }`}
                    >
                      {s === '__propria' ? 'Escrever a minha' : s}
                    </button>
                  )
                })}
                {acao === '__propria' && (
                  <input
                    autoFocus
                    value={acaoPropria}
                    onChange={(e) => setAcaoPropria(e.target.value)}
                    maxLength={120}
                    placeholder="Algo que leve poucos minutos"
                    className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none focus:border-brand"
                  />
                )}
              </div>
              <BotaoPrincipal
                onClick={escolherAcao}
                disabled={salvando || (acao === '__propria' && !acaoPropria.trim())}
              >
                {salvando ? 'Preparando…' : 'É essa'}
              </BotaoPrincipal>
            </>
          )}

          {passo === 4 && (
            <>
              {tarefaAcao ? (
                <>
                  <Titulo pet={pet} feliz={false} titulo="Só isso agora" sub="Faça no seu tempo e volte aqui para marcar." />
                  <Caixa destaque>{tarefaAcao.titulo}</Caixa>
                  <BotaoPrincipal onClick={fazerAcao} disabled={salvando}>
                    {salvando ? 'Marcando…' : 'Fiz!'}
                  </BotaoPrincipal>
                </>
              ) : proxima ? (
                <>
                  <Titulo
                    pet={pet}
                    feliz
                    titulo={feitasNoFluxo === 1 ? 'Você recomeçou! 🌱' : 'Mais um passo dado!'}
                    sub="Quer dar o próximo passo? Só um, sem olhar o resto."
                  />
                  <Caixa destaque>
                    {proxima.titulo}
                    <span className="mt-1 block text-xs font-normal text-muted">{formatarData(proxima.data)}</span>
                  </Caixa>
                  <BotaoPrincipal onClick={fazerProxima} disabled={salvando}>
                    {salvando ? 'Marcando…' : 'Fiz este também'}
                  </BotaoPrincipal>
                  <button onClick={() => setPasso('fim')} className="py-2 text-sm font-semibold text-muted hover:text-ink">
                    Por hoje está ótimo
                  </button>
                </>
              ) : (
                <Fim pet={pet} feitas={feitasNoFluxo} onFechar={onFechar} />
              )}
            </>
          )}

          {passo === 'fim' && <Fim pet={pet} feitas={feitasNoFluxo} onFechar={onFechar} />}
        </div>
      </div>
    </div>
  )
}

function Fim({ pet, feitas, onFechar }: { pet: ReturnType<typeof usePet>['pet']; feitas: number; onFechar: () => void }) {
  return (
    <>
      <Titulo
        pet={pet}
        feliz
        titulo="Você recomeçou."
        sub={`${feitas === 1 ? '1 passo dado' : `${feitas} passos dados`}. Isso conta como conquista, e fica registrado em Evoluir.`}
      />
      <BotaoPrincipal onClick={onFechar}>Voltar para o dia</BotaoPrincipal>
    </>
  )
}

function Titulo(props: { pet: ReturnType<typeof usePet>['pet']; feliz: boolean; titulo: string; sub: string }) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className={props.feliz ? 'animate-[pulinho_0.8s_ease-in-out]' : ''}>
        <Pet especie={props.pet?.especie} estagio={props.pet?.estagio} caminho={props.pet?.caminho} feliz={props.feliz} size={110} nome={props.pet?.nome} />
      </div>
      <h2 className="mt-2 text-2xl font-extrabold">{props.titulo}</h2>
      <p className="mt-1 text-sm text-muted">{props.sub}</p>
    </div>
  )
}

function Caixa({ children, destaque }: { children: ReactNode; destaque?: boolean }) {
  return (
    <div
      className={`rounded-2xl border p-4 text-center ${
        destaque ? 'border-brand bg-brand/10 text-lg font-bold' : 'border-dashed border-line text-sm text-muted'
      }`}
    >
      {children}
    </div>
  )
}

function BotaoPrincipal(props: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      className="w-full rounded-2xl bg-brand py-3.5 font-bold text-bg disabled:opacity-60"
    >
      {props.children}
    </button>
  )
}

function Pontos({ passo }: { passo: Passo }) {
  const n = passo === 'fim' ? 5 : passo
  return (
    <div className="flex gap-1.5" aria-label={passo === 'fim' ? 'Concluído' : `Passo ${passo} de 4`}>
      {[1, 2, 3, 4].map((i) => (
        <span key={i} className={`h-1.5 w-8 rounded-full ${i <= n ? 'bg-brand' : 'bg-surface-2'}`} />
      ))}
    </div>
  )
}

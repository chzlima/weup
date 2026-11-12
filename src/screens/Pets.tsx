import { useEffect, useState, type FormEvent } from 'react'
import { Pet } from '../components/Pet'
import { Rotulo, Sheet } from '../components/Sheet'
import { usePet } from '../lib/pet'
import { useDados } from '../lib/useDados'
import { usePlanoDeHoje } from '../lib/energia'
import { ESTAGIOS, especie, NIVEL_DO_ESTAGIO, type Especie, type Estagio } from '../lib/pets'
import { calcularNivel, xpTotalDoNivel } from '../lib/xp'
import { contextoDoMomento, escolherFala, expressaoDoMomento, NOME_EXPRESSAO } from '../pets/humor'
import { momentoDoDia } from '../pets/momento'
import { EscolherPet } from './EscolherPet'
import { EscolherCaminho } from '../pets/EscolherCaminho'
import { Diario } from '../pets/Diario'
import { AbaVisual } from '../pets/AbaVisual'
import { CenaHabitat } from '../pets/CenaHabitat'
import { decoracoesDe, periodoDoDia } from '../pets/habitat'
import { buscarMemorias, textoDaMemoria, type Memoria } from '../pets/memorias'
import { BRINQUEDO, jaTeveSurpresaHoje, marcarSurpresaHoje } from '../pets/brincar'
import { caminhoSugerido, nomeDaForma, type Caminho } from '../pets/caminhos'
import { useAuth } from '../lib/auth'
import { hojeISO, somarDias } from '../lib/tarefas'
import { ordemCompromisso } from '../lib/agenda'
import { INTERACOES, assuntosDoDia, progressoDoLaco, useLaco } from '../pets/laco'

type Aba = 'companheiro' | 'evolucao' | 'visual' | 'diario'


// Aba Pets: o pet é o protagonista. Em cima, o palco com o pet, a fala e o nome;
// embaixo, duas abas discretas: Companheiro (interações) e Evolução (o caminho das formas).
export function Pets() {
  const { pet, escolher, escolherCaminho, vestir, renomear, acompanharNivel } = usePet()
  const dados = useDados()
  const plano = usePlanoDeHoje()
  const { nome } = useAuth()
  const { laco, cuidar } = useLaco()
  const [observando, setObservando] = useState(false)
  const [escolhendoCaminho, setEscolhendoCaminho] = useState(false)
  const [memorias, setMemorias] = useState<Memoria[]>([]) // diário: decora o habitat e alimenta a surpresa
  const chaves = memorias.map((m) => m.chave)
  const [brincando, setBrincando] = useState(false)
  useEffect(() => {
    buscarMemorias()
      .then((m) => setMemorias(m ?? []))
      .catch(() => {})
  }, [])
  const [aba, setAba] = useState<Aba>('companheiro')
  const [fala, setFala] = useState<string | null>(null)
  const [pulando, setPulando] = useState(0)
  const [renomeando, setRenomeando] = useState(false)
  const [trocando, setTrocando] = useState(false)

  const total = dados.resumoXP.total
  const { nivel } = calcularNivel(total)

  useEffect(() => {
    if (!dados.carregando) acompanharNivel(nivel)
  }, [nivel, dados.carregando, acompanharNivel])

  if (!pet) return null

  if (trocando)
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-bg">
        <EscolherPet
          atual={pet}
          onEscolher={async (e, n) => {
            await escolher(e, n)
            setTrocando(false)
          }}
          onCancelar={() => setTrocando(false)}
        />
      </div>
    )

  const info = especie(pet.especie)
  const momento = momentoDoDia(dados, plano)
  const expressao = dados.carregando ? 'feliz' : expressaoDoMomento(momento)

  const acariciar = () => {
    setPulando((n) => n + 1)
    setFala((anterior) => escolherFala(pet.especie, contextoDoMomento(momento), anterior ?? undefined))
    cuidar() // o primeiro carinho do dia conta 1 ponto de laço
  }

  // Conversar: o pet comenta o seu dia de verdade (compromisso, prioridade, prazo, o que já foi feito).
  const conversar = () => {
    const hoje = hojeISO()
    const assuntos = assuntosDoDia({
      nomePessoa: nome,
      feitos: momento.feitos,
      prioridadeAberta: plano.prioridades
        .map((id) => dados.tarefas.find((t) => t.id === id))
        .find((t) => t && !t.concluida_em && t.data === hoje),
      proximoCompromisso: dados.compromissos
        .filter((c) => c.data >= hoje && c.data <= somarDias(1))
        .sort(ordemCompromisso)[0],
      prazoHoje: dados.tarefas.find((t) => !t.concluida_em && t.prazo === hoje),
    })
    setPulando((n) => n + 1)
    setFala((anterior) => {
      const novos = assuntos.filter((a) => a !== anterior)
      return (novos.length ? novos : assuntos)[Math.floor(Math.random() * (novos.length || assuntos.length))]
    })
    cuidar()
  }

  const nivelLaco = laco ? progressoDoLaco(laco.pontos) : null
  // Brincar: alguns segundos correndo atrás do brinquedo da espécie. Sem pontos, sem placar.
  const brincar = () => {
    if (brincando) return
    setBrincando(true)
    setFala(null)
    setPulando((n) => n + 1)
    cuidar()
    setTimeout(() => setPulando((n) => n + 1), 1300)
    setTimeout(() => setPulando((n) => n + 1), 2600)
    setTimeout(() => setBrincando(false), 4000)
  }

  // Surpresa: uma vez por dia, o pet lembra um momento do diário.
  const surpresa = () => {
    setPulando((n) => n + 1)
    cuidar()
    if (jaTeveSurpresaHoje()) return setFala('A surpresa de hoje já foi. Amanhã eu guardo outra!')
    marcarSurpresaHoje()
    if (!memorias.length) return setFala('Ainda estou juntando lembranças nossas. Amanhã eu te conto uma!')
    const m = memorias[Math.floor(Math.random() * memorias.length)]
    const [a, mm, d] = m.dia.split('-').map(Number)
    const quando = new Date(a, mm - 1, d).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
    setFala(`Lembra? ${textoDaMemoria(m, pet).titulo}, em ${quando}. Eu guardei esse momento.`)
  }

  const acoes = { acariciar, conversar, observar: () => setObservando(true), brincar, surpresa }

  return (
    <div className="space-y-5">
      {/* Palco: o pet em destaque */}
      <section
        className="relative isolate overflow-hidden rounded-[2rem] border border-line px-5 pt-5 pb-6"
      >
        <div className="absolute inset-0 -z-10">
          <CenaHabitat especie={pet.especie} estagio={pet.estagio} periodo={periodoDoDia(new Date().getHours())} decoracoes={decoracoesDe(chaves)} />
        </div>
        <div className="flex min-h-16 items-end justify-center">
          {fala && (
            <p
              key={fala}
              role="status"
              className="relative max-w-[85%] animate-[aparecer_0.25s_ease-out] rounded-2xl bg-surface-2 px-4 py-2.5 text-center text-sm"
            >
              {fala}
              <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-surface-2" />
            </p>
          )}
        </div>
        <div className="flex justify-center">
          <button
            key={pulando}
            onClick={acariciar}
            aria-label={`Fazer carinho em ${pet.nome}`}
            className={`rounded-full ${pulando ? 'animate-[pulinho_0.6s_ease-in-out]' : ''}`}
          >
            <Pet especie={pet.especie} estagio={pet.estagio} caminho={pet.caminho} visual={pet} expressao={brincando ? 'animado' : expressao} size={200} nome={pet.nome} />
          </button>
        </div>
        <div className="mt-1 text-center">
          <h1 className="text-2xl font-extrabold">{pet.nome}</h1>
          <p className="text-sm text-muted">
            {nomeDaForma(pet.especie, pet.estagio, pet.caminho)} · {info.nome}
            {!dados.carregando && <> · {NOME_EXPRESSAO[expressao]}</>}
          </p>
        </div>
        {brincando && (
          <span aria-hidden className="pointer-events-none absolute top-1/3 left-0 animate-[brinquedo_4s_ease-in-out_forwards] text-3xl">
            {BRINQUEDO[pet.especie]}
          </span>
        )}
        {!fala && <p className="mt-3 text-center text-xs text-muted">Toque em {pet.nome} para conversar.</p>}
      </section>

      {/* Estágio 4 sem caminho: a escolha fica em destaque até ser feita */}
      {pet.estagio >= 4 && !pet.caminho && (
        <button
          onClick={() => setEscolhendoCaminho(true)}
          className="flex w-full items-center gap-3 rounded-2xl border border-gold/50 bg-surface px-4 py-3 text-left"
        >
          <span aria-hidden className="text-2xl">
            ✨
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-bold">Hora de escolher um caminho</span>
            <span className="block text-xs text-muted">{pet.nome} chegou ao estágio 4. Para onde vocês vão crescer?</span>
          </span>
          <span className="text-sm font-bold text-gold">Escolher</span>
        </button>
      )}

      {/* Abas */}
      <div role="tablist" className="flex gap-1 rounded-2xl bg-surface p-1">
        {(
          [
            ['companheiro', 'Companheiro'],
            ['evolucao', 'Evolução'],
            ['visual', 'Visual'],
            ['diario', 'Diário'],
          ] as [Aba, string][]
        ).map(([id, nome]) => (
          <button
            key={id}
            role="tab"
            aria-selected={aba === id}
            onClick={() => setAba(id)}
            className={`flex-1 rounded-xl py-2 text-sm font-bold transition-colors ${
              aba === id ? 'bg-surface-2 text-ink' : 'text-muted hover:text-ink'
            }`}
          >
            {nome}
          </button>
        ))}
      </div>

      {aba === 'companheiro' ? (
        <section className="space-y-4">
          {nivelLaco && (
            <div>
              <div className="mb-1.5 flex items-baseline justify-between">
                <p className="text-sm font-bold">Laço {nivelLaco.nivel}</p>
                <p className="text-xs text-muted">
                  {nivelLaco.faltam === null ? 'Laço máximo' : `faltam ${nivelLaco.faltam} para o laço ${nivelLaco.nivel + 1}`}
                </p>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-gold/20">
                <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${nivelLaco.fracao * 100}%` }} />
              </div>
              <p className="mt-1.5 text-xs text-muted">
                O laço cresce com os dias em que vocês caminham juntos. Descansar nunca diminui.
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-2">
            {INTERACOES.map((i) => {
              const liberada = !!nivelLaco && nivelLaco.nivel >= i.laco
              return (
                <button
                  key={i.id}
                  onClick={liberada ? acoes[i.id] : undefined}
                  disabled={!liberada}
                  className={`flex flex-col items-center gap-1 rounded-2xl border px-2 py-3 text-sm font-semibold transition-colors ${
                    liberada ? 'border-line hover:bg-surface' : 'border-dashed border-line text-muted'
                  }`}
                >
                  <span aria-hidden className="text-xl">
                    {liberada ? i.emoji : '🔒'}
                  </span>
                  {i.nome}
                  {!liberada && <span className="text-[11px] font-normal">Laço {i.laco}</span>}
                </button>
              )
            })}
          </div>

          <p className="text-sm text-muted">{info.descricao}</p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setRenomeando(true)}
              className="rounded-2xl border border-line py-2.5 text-sm font-bold hover:bg-surface"
            >
              Mudar nome
            </button>
            <button
              onClick={() => setTrocando(true)}
              className="rounded-2xl border border-line py-2.5 text-sm font-bold hover:bg-surface"
            >
              Trocar espécie
            </button>
          </div>
          <p className="text-center text-xs text-muted">
            Brincar e Surpresa se abrem com o laço. Nada aqui dá XP: é só o tempo de vocês dois.
          </p>
        </section>
      ) : aba === 'evolucao' ? (
        <Evolucao especie={pet.especie} estagio={pet.estagio} caminho={pet.caminho} total={total} />
      ) : aba === 'visual' ? (
        <AbaVisual pet={pet} onVestir={vestir} />
      ) : (
        <Diario pet={pet} />
      )}

      {/* Observar: um momento de calma, só o pet, sem texto. Toque para sair. */}
      {observando && (
        <button
          onClick={() => setObservando(false)}
          aria-label="Parar de observar"
          className="fixed inset-0 isolate z-50 flex animate-[aparecer_0.4s_ease-out] items-center justify-center bg-bg"
        >
          <span className="absolute inset-0 -z-10">
            <CenaHabitat especie={pet.especie} estagio={pet.estagio} periodo={periodoDoDia(new Date().getHours())} decoracoes={decoracoesDe(chaves)} />
          </span>
          <Pet especie={pet.especie} estagio={pet.estagio} caminho={pet.caminho} visual={pet} expressao="tranquilo" size={260} nome={pet.nome} />
        </button>
      )}

      {escolhendoCaminho && (
        <EscolherCaminho
          pet={pet}
          sugerido={caminhoSugerido(dados.resumoXP)}
          onEscolher={escolherCaminho}
          onFechar={() => setEscolhendoCaminho(false)}
        />
      )}

      {renomeando && <Renomear atual={pet.nome} onSalvar={renomear} onFechar={() => setRenomeando(false)} />}
    </div>
  )
}

// O caminho das 5 formas, de cima para baixo, com o progresso até a próxima.
function Evolucao(props: { especie: Especie; estagio: Estagio; caminho: Caminho | null; total: number }) {
  const { especie: esp, estagio, caminho, total } = props
  const proximo = estagio < 5 ? ((estagio + 1) as Estagio) : null
  let pct = 100
  let faltam = 0
  if (proximo) {
    const inicio = xpTotalDoNivel(NIVEL_DO_ESTAGIO[estagio])
    const fim = xpTotalDoNivel(NIVEL_DO_ESTAGIO[proximo])
    pct = Math.min(100, Math.max(0, Math.round(((total - inicio) / (fim - inicio)) * 100)))
    faltam = Math.max(0, fim - total)
  }

  return (
    <section>
      <ol className="relative space-y-3 before:absolute before:top-6 before:bottom-6 before:left-[31px] before:w-0.5 before:bg-line">
        {ESTAGIOS.map((e) => {
          const alcancado = e <= estagio
          const atual = e === estagio
          return (
            <li key={e} className="relative flex items-center gap-3">
              <span
                className={`relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border ${
                  atual ? 'border-brand bg-brand/15' : 'border-line bg-surface'
                }`}
              >
                <Pet especie={esp} estagio={e} caminho={caminho} silhueta={!alcancado} parado size={52} />
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block font-bold ${alcancado ? '' : 'text-muted'}`}>
                  {alcancado ? nomeDaForma(esp, e, caminho) : 'Forma misteriosa'}
                </span>
                <span className="block text-xs text-muted">
                  Nível {NIVEL_DO_ESTAGIO[e]}
                  {e === 4 && !caminho && ' · aqui você escolhe um caminho'}
                  {atual && ' · forma atual'}
                </span>
                {atual && proximo && (
                  <span className="mt-2 block">
                    <span className="block h-1.5 overflow-hidden rounded-full bg-brand/20">
                      <span className="block h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${pct}%` }} />
                    </span>
                    <span className="mt-1 block text-xs text-muted">
                      Faltam {faltam.toLocaleString('pt-BR')} XP para a próxima forma
                    </span>
                  </span>
                )}
              </span>
            </li>
          )
        })}
      </ol>
      {!proximo && <p className="mt-4 text-center text-sm text-gold">Forma lendária! Vocês chegaram ao topo juntos.</p>}
    </section>
  )
}

function Renomear(props: { atual: string; onSalvar: (nome: string) => Promise<void>; onFechar: () => void }) {
  const [nome, setNome] = useState(props.atual)
  const [erro, setErro] = useState('')

  const enviar = async (e: FormEvent) => {
    e.preventDefault()
    if (!nome.trim()) return
    try {
      await props.onSalvar(nome.trim())
      props.onFechar()
    } catch {
      setErro('Não foi possível salvar. Tente de novo.')
    }
  }

  return (
    <Sheet titulo="Mudar nome" onFechar={props.onFechar}>
      <form onSubmit={enviar} className="space-y-4">
        <label className="block">
          <Rotulo>Novo nome</Rotulo>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            maxLength={30}
            className="w-full rounded-xl border border-line bg-surface-2 px-3 py-2.5 outline-none focus:border-brand"
          />
        </label>
        {erro && <p className="text-sm text-red-300">{erro}</p>}
        <button type="submit" disabled={!nome.trim()} className="w-full rounded-2xl bg-brand py-3 font-bold text-bg disabled:opacity-50">
          Salvar
        </button>
      </form>
    </Sheet>
  )
}

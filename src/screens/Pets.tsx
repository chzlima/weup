import { useEffect, useState, type FormEvent } from 'react'
import { Pet } from '../components/Pet'
import { Rotulo, Sheet } from '../components/Sheet'
import { usePet } from '../lib/pet'
import { useDados } from '../lib/useDados'
import { ESTAGIOS, especie, FRASES, NIVEL_DO_ESTAGIO, type Estagio } from '../lib/pets'
import { calcularNivel, xpTotalDoNivel } from '../lib/xp'
import { concluidaHoje, diaDaSemana, hojeISO } from '../lib/tarefas'
import { EscolherPet } from './EscolherPet'

export function Pets() {
  const { pet, escolher, renomear, acompanharNivel } = usePet()
  const dados = useDados()
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
  const proximo = pet.estagio < 5 ? ((pet.estagio + 1) as Estagio) : null

  // Progresso até a próxima evolução (em XP, do início do estágio atual até o nível da próxima).
  let pct = 100
  let faltam = 0
  if (proximo) {
    const inicio = xpTotalDoNivel(NIVEL_DO_ESTAGIO[pet.estagio])
    const fim = xpTotalDoNivel(NIVEL_DO_ESTAGIO[proximo])
    pct = Math.min(100, Math.max(0, Math.round(((total - inicio) / (fim - inicio)) * 100)))
    faltam = Math.max(0, fim - total)
  }

  // Humor do dia (só para escolher a frase; o pet nunca fica triste).
  const hoje = hojeISO()
  const pendentes =
    dados.tarefas.filter((t) => !t.concluida_em && t.data && t.data <= hoje).length +
    dados.habitos.filter((h) => h.dias.includes(diaDaSemana(hoje)) && !dados.feitoNoDia(h.id, hoje)).length
  const feitos =
    dados.tarefas.filter(concluidaHoje).length + dados.registros.filter((r) => r.dia === hoje).length
  const frases = feitos === 0 ? FRASES.semNada : pendentes === 0 ? FRASES.completo : FRASES.andamento

  const tocar = () => {
    setPulando((n) => n + 1)
    setFala(frases[Math.floor(Math.random() * frases.length)])
  }

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">Companheiro</h1>
        <p className="text-sm text-muted">Ele cresce junto com você.</p>
      </header>

      {/* Pet ativo */}
      <section className="flex flex-col items-center rounded-3xl border border-line bg-surface p-6">
        <div className="flex min-h-12 items-end">
          {fala && (
            <p role="status" className="relative rounded-2xl bg-surface-2 px-4 py-2 text-center text-sm">
              {fala}
              <span className="absolute -bottom-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 bg-surface-2" />
            </p>
          )}
        </div>
        <button
          key={pulando}
          onClick={tocar}
          aria-label={`Fazer carinho em ${pet.nome}`}
          className={`mt-2 rounded-full ${pulando ? 'animate-[pulinho_0.6s_ease-in-out]' : ''}`}
        >
          <Pet especie={pet.especie} estagio={pet.estagio} feliz={feitos > 0} size={170} nome={pet.nome} />
        </button>
        <p className="mt-2 text-2xl font-extrabold">{pet.nome}</p>
        <p className="text-sm text-muted">
          {info.estagios[pet.estagio - 1]} · estágio {pet.estagio} de 5
        </p>

        <div className="mt-4 w-full">
          <div className="h-2 overflow-hidden rounded-full bg-brand/20">
            <div className="h-full rounded-full bg-brand transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-center text-xs text-muted">
            {proximo
              ? `Vira ${info.estagios[proximo - 1]} no nível ${NIVEL_DO_ESTAGIO[proximo]} · faltam ${faltam.toLocaleString('pt-BR')} XP`
              : 'Forma lendária! Vocês chegaram ao último estágio juntos.'}
          </p>
        </div>
      </section>

      {/* Caminho de evolução */}
      <section>
        <h2 className="mb-2 text-sm font-bold text-muted">Evoluções</h2>
        <div className="grid grid-cols-5 gap-1.5">
          {ESTAGIOS.map((e) => {
            const alcancado = e <= pet.estagio
            return (
              <div
                key={e}
                className={`flex flex-col items-center rounded-2xl border px-1 py-2 ${
                  e === pet.estagio ? 'border-brand bg-brand/10' : 'border-line bg-surface'
                }`}
              >
                <Pet especie={pet.especie} estagio={e} silhueta={!alcancado} parado size={52} />
                <p className={`mt-1 text-center text-[11px] font-bold leading-tight ${alcancado ? '' : 'text-muted'}`}>
                  {alcancado ? info.estagios[e - 1] : '???'}
                </p>
                <p className="text-[11px] text-muted">Nível {NIVEL_DO_ESTAGIO[e]}</p>
              </div>
            )
          })}
        </div>
      </section>

      <div className="flex gap-2">
        <button
          onClick={() => setRenomeando(true)}
          className="flex-1 rounded-2xl border border-line py-2.5 text-sm font-bold hover:bg-surface"
        >
          Mudar nome
        </button>
        <button
          onClick={() => setTrocando(true)}
          className="flex-1 rounded-2xl border border-line py-2.5 text-sm font-bold hover:bg-surface"
        >
          Trocar espécie
        </button>
      </div>

      <p className="text-center text-xs text-muted">
        Arte provisória. A coleção completa, com raridades e habitat, chega na Etapa 2.
      </p>

      {renomeando && (
        <Renomear
          atual={pet.nome}
          onSalvar={renomear}
          onFechar={() => setRenomeando(false)}
        />
      )}
    </div>
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

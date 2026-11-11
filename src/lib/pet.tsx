import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import * as api from './pets'
import { especie, estagioDoNivel, type Especie, type MeuPet } from './pets'
import { Pet } from '../components/Pet'

type PetState = {
  pet: MeuPet | null
  carregando: boolean
  erro: string
  escolher: (especie: Especie, nome: string) => Promise<void>
  renomear: (nome: string) => Promise<void>
  // Chamado pelas telas que conhecem o nível: se o pet já pode evoluir, evolui.
  acompanharNivel: (nivel: number) => void
  recarregar: () => void
}

const PetContext = createContext<PetState | null>(null)

export function PetProvider({ children }: { children: ReactNode }) {
  const [pet, setPet] = useState<MeuPet | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState('')
  const [evoluiu, setEvoluiu] = useState<MeuPet | null>(null)
  const subindo = useRef(false)

  const recarregar = useCallback(async () => {
    setCarregando(true)
    try {
      setPet(await api.buscarPet())
      setErro('')
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    recarregar()
  }, [recarregar])

  const escolher = async (esp: Especie, nome: string) => {
    setPet(await api.salvarPet({ especie: esp, nome }))
  }

  const renomear = async (nome: string) => {
    setPet(await api.renomearPet(nome))
  }

  const acompanharNivel = useCallback(
    (nivel: number) => {
      if (!pet || subindo.current) return
      const alvo = estagioDoNivel(nivel)
      if (alvo <= pet.estagio) return // nunca regride
      subindo.current = true
      api
        .subirEstagio(alvo)
        .then((novo) => {
          setPet(novo)
          setEvoluiu(novo)
        })
        .catch(() => {})
        .finally(() => (subindo.current = false))
    },
    [pet],
  )

  return (
    <PetContext.Provider value={{ pet, carregando, erro, escolher, renomear, acompanharNivel, recarregar }}>
      {children}
      {evoluiu && <Evolucao pet={evoluiu} onFechar={() => setEvoluiu(null)} />}
    </PetContext.Provider>
  )
}

export function usePet() {
  const ctx = useContext(PetContext)
  if (!ctx) throw new Error('usePet precisa estar dentro de <PetProvider>')
  return ctx
}

// Comemoração de evolução.
function Evolucao({ pet, onFechar }: { pet: MeuPet; onFechar: () => void }) {
  const nomeEstagio = especie(pet.especie).estagios[pet.estagio - 1]
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-6" onClick={onFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Seu companheiro evoluiu"
        className="w-full max-w-sm rounded-3xl border border-gold/40 bg-surface p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-xs font-bold uppercase tracking-wider text-gold">Evolução!</p>
        <div className="mx-auto my-3 w-fit animate-[pulinho_0.8s_ease-in-out_3]">
          <Pet especie={pet.especie} estagio={pet.estagio} feliz size={140} nome={pet.nome} />
        </div>
        <p className="text-xl font-extrabold">
          {pet.nome} virou {nomeEstagio}!
        </p>
        <p className="mt-1 text-sm text-muted">Vocês cresceram juntos. Isso é evolução de verdade.</p>
        <button onClick={onFechar} className="mt-5 w-full rounded-2xl bg-brand py-3 font-bold text-bg">
          Que demais!
        </button>
      </div>
    </div>
  )
}

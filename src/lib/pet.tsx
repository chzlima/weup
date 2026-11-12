import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import * as api from './pets'
import { estagioDoNivel, type Especie, type MeuPet } from './pets'
import { Transformacao } from '../pets/Transformacao'
import { escolherCaminho as escolherCaminhoNoBanco, type Caminho } from '../pets/caminhos'
import { salvarVisual, type Visual } from '../pets/visual'

type PetState = {
  pet: MeuPet | null
  carregando: boolean
  erro: string
  escolher: (especie: Especie, nome: string) => Promise<void>
  escolherCaminho: (c: Caminho) => Promise<void>
  vestir: (v: Visual) => Promise<void>
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
  const [evoluiu, setEvoluiu] = useState<{ antes: MeuPet; depois: MeuPet } | null>(null)
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

  // Caminho do estágio 4: o banco confere e grava uma vez só.
  const escolherCaminho = async (c: Caminho) => {
    const gravado = await escolherCaminhoNoBanco(c)
    setPet((p) => (p ? { ...p, caminho: gravado } : p))
  }

  // Visual: o banco recusa item bloqueado; se der certo, o pet aparece vestido em todo o app.
  const vestir = async (v: Visual) => {
    const salvo = await salvarVisual(v)
    setPet((p) => (p ? { ...p, ...salvo } : p))
  }

  const renomear = async (nome: string) => {
    setPet(await api.renomearPet(nome))
  }

  // O nível vem do XP mostrado na tela; se já dá para evoluir, pede ao banco (que confere o XP de verdade).
  const acompanharNivel = useCallback(
    (nivel: number) => {
      if (!pet || subindo.current) return
      if (estagioDoNivel(nivel) <= pet.estagio) return // nada a fazer (e nunca regride)
      subindo.current = true
      api
        .sincronizarPet()
        .then((estagio) => {
          if (estagio && estagio > pet.estagio) {
            const novo = { ...pet, estagio }
            setPet(novo)
            setEvoluiu({ antes: pet, depois: novo })
          }
        })
        .catch(() => {})
        .finally(() => (subindo.current = false))
    },
    [pet],
  )

  return (
    <PetContext.Provider value={{ pet, carregando, erro, escolher, escolherCaminho, vestir, renomear, acompanharNivel, recarregar }}>
      {children}
      {evoluiu && <Transformacao antes={evoluiu.antes} depois={evoluiu.depois} onFechar={() => setEvoluiu(null)} />}
    </PetContext.Provider>
  )
}

export function usePet() {
  const ctx = useContext(PetContext)
  if (!ctx) throw new Error('usePet precisa estar dentro de <PetProvider>')
  return ctx
}

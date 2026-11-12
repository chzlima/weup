import { supabase } from '../lib/supabase'
import { checar } from '../lib/tarefas'
import { especie as dadosDaEspecie, type Especie, type Estagio } from '../lib/pets'

// Caminhos de evolução: no estágio 4 (nível 15) o pet segue um de três caminhos, um por atributo do XP.
// A pessoa escolhe; o app sugere o atributo em que ela mais evoluiu. Vale também para a forma lendária.

export type Caminho = 'conhecimento' | 'saude' | 'organizacao'

export const CAMINHOS: { id: Caminho; nome: string; cor: string; ideia: string }[] = [
  { id: 'conhecimento', nome: 'Conhecimento', cor: '#9b8cff', ideia: 'Para quem cresceu estudando e aprendendo.' },
  { id: 'saude', nome: 'Saúde', cor: '#ff8fa3', ideia: 'Para quem cresceu cuidando do corpo e da energia.' },
  { id: 'organizacao', nome: 'Organização', cor: '#7fd6e8', ideia: 'Para quem cresceu com rotina e constância.' },
]

export const caminho = (id: Caminho) => CAMINHOS.find((c) => c.id === id)!

// Nome das formas de cada caminho: [estágio 4, estágio 5 (lendária)].
export const FORMAS: Record<Especie, Record<Caminho, [string, string]>> = {
  broto: {
    conhecimento: ['Árvore do Saber', 'Árvore Ancestral'],
    saude: ['Árvore Florida', 'Jardim Eterno'],
    organizacao: ['Bonsai', 'Bonsai Milenar'],
  },
  faisca: {
    conhecimento: ['Fênix Sábia', 'Fênix Astral'],
    saude: ['Fênix Vital', 'Fênix Solar'],
    organizacao: ['Fênix Guardiã', 'Fênix Imperial'],
  },
  gota: {
    conhecimento: ['Nuvem Estrelada', 'Céu Infinito'],
    saude: ['Fonte Viva', 'Oceano Vital'],
    organizacao: ['Cristal de Gelo', 'Geleira Ancestral'],
  },
}

// Nome da forma atual: com caminho escolhido, o nome do caminho; antes disso, o nome padrão da espécie.
export function nomeDaForma(esp: Especie, estagio: Estagio, cam?: Caminho | null) {
  if (estagio >= 4 && cam) return FORMAS[esp][cam][estagio - 4]
  return dadosDaEspecie(esp).estagios[estagio - 1]
}

// Sugestão: o atributo com mais XP. Empate (ou nada ainda) fica na ordem da lista.
export function caminhoSugerido(xp: { conhecimento: number; saude: number; organizacao: number }): Caminho {
  return CAMINHOS.map((c) => c.id).reduce((melhor, c) => (xp[c] > xp[melhor] ? c : melhor), 'conhecimento' as Caminho)
}

// Escolha feita uma vez só, conferida pelo banco (estágio 4 ou mais, sem caminho ainda).
export async function escolherCaminho(c: Caminho) {
  return checar<Caminho>(await supabase.rpc('escolher_caminho', { p_caminho: c }))
}

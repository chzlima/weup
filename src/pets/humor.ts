import type { Especie } from '../lib/pets'
import type { Expressao } from './arte'

// Humor do pet: a expressão e a fala do momento saem do seu dia de verdade.
// Nunca existe expressão triste ou cobrança: no máximo o pet está curioso, tranquilo ou pensativo.

export type Momento = {
  feitos: number // tarefas e hábitos concluídos hoje
  pendentes: number // o que ainda está planejado para hoje
  prioridadesAbertas: number // prioridades do dia ainda não feitas (0 se não escolheu nenhuma)
  prioridadesFeitas: number
  energiaBaixa: boolean // check-in de energia "baixa" (dia leve)
  hora: number // 0 a 23, no relógio do aparelho
  diaSemana: number // 0 = domingo
}

export type Contexto = 'comecar' | 'andamento' | 'completo' | 'descanso' | 'revisao'

// Qual expressão o pet mostra agora. A ordem importa: a primeira regra que bate vence.
export function expressaoDoMomento(m: Momento): Expressao {
  const tudoFeito = m.feitos > 0 && m.pendentes === 0
  const prioridadesCumpridas = m.prioridadesFeitas > 0 && m.prioridadesAbertas === 0
  if (tudoFeito || prioridadesCumpridas) return 'orgulhoso'
  if (m.energiaBaixa || m.hora >= 22 || m.hora < 6) return 'tranquilo'
  if (m.feitos >= 3) return 'animado'
  if (m.feitos > 0) return 'feliz'
  if (m.diaSemana === 0 || m.diaSemana === 1) return 'pensativo'
  return 'curioso'
}

export function contextoDoMomento(m: Momento): Contexto {
  const e = expressaoDoMomento(m)
  if (e === 'orgulhoso') return 'completo'
  if (e === 'tranquilo') return 'descanso'
  if (e === 'animado' || e === 'feliz') return 'andamento'
  if (e === 'pensativo') return 'revisao'
  return 'comecar'
}

export const NOME_EXPRESSAO: Record<Expressao, string> = {
  feliz: 'feliz',
  animado: 'animado',
  curioso: 'curioso',
  tranquilo: 'tranquilo',
  orgulhoso: 'orgulhoso',
  pensativo: 'pensativo',
}

// Falas por espécie e contexto. Cada espécie tem o seu jeito:
// Broto fala devagar e sobre crescer; Faísca é intensa e cheia de energia; Gota observa e pergunta.
export const FALAS: Record<Especie, Record<Contexto, string[]>> = {
  broto: {
    comecar: [
      'Toda árvore começou com uma folhinha. Qual é a sua de hoje?',
      'Sem pressa. Um passo pequeno já é raiz.',
      'Bom dia. Vamos crescer um pouquinho juntos?',
    ],
    andamento: [
      'Senti isso nas minhas folhas. Você está crescendo.',
      'Devagar e firme. É assim que a gente fica forte.',
      'Mais um galho novo. Gosto do nosso ritmo.',
    ],
    completo: [
      'Dia inteiro cuidado. Agora é hora de descansar à sombra.',
      'Você plantou tudo o que queria hoje. Que orgulho.',
      'Raízes fundas, coração tranquilo. Dia completo.',
    ],
    descanso: [
      'Árvores também descansam. Amanhã a gente continua.',
      'Hoje é dia de crescer por dentro. Tudo bem ir devagar.',
      'Respira. A seiva corre mesmo quando a gente para.',
    ],
    revisao: [
      'Olhando para trás, dá para ver quanto a gente cresceu.',
      'Toda estação ensina alguma coisa. O que essa te ensinou?',
      'Uma semana nova é como uma primavera.',
    ],
  },
  faisca: {
    comecar: [
      'Bora acender o dia? Uma tarefinha e eu já pego fogo!',
      'Tô pronta! Qual é o primeiro desafio?',
      'Uma faísca é tudo que a gente precisa pra começar!',
    ],
    andamento: [
      'Isso! Tô brilhando mais forte!',
      'Mais uma! Que calor bom de sentir!',
      'A gente tá pegando ritmo, não para não!',
    ],
    completo: [
      'Dia em chamas! Você mandou muito bem!',
      'Tudo feito! Bora comemorar com uma faísca extra!',
      'Que dia! Agora até eu posso descansar na brasa.',
    ],
    descanso: [
      'Até o fogo precisa de lenha nova. Descansa!',
      'Hoje é brasa baixinha, e tá tudo certo.',
      'Recarregando o calor pra amanhã!',
    ],
    revisao: [
      'Semana nova, fogo novo! O que vem por aí?',
      'Olha quanta coisa a gente queimou de pendência!',
      'Bora planejar a próxima aventura?',
    ],
  },
  gota: {
    comecar: [
      'O que será que hoje traz? Fiquei curiosa.',
      'Uma gotinha de cada vez enche o rio, sabia?',
      'Vamos ver por onde o dia corre?',
    ],
    andamento: [
      'Senti a correnteza mudar. Você começou!',
      'Tudo fluindo. Gosto de ver você assim.',
      'Cada coisa feita é uma ondinha boa.',
    ],
    completo: [
      'O rio chegou ao mar hoje. Dia completo!',
      'Você fluiu por tudo. Que bonito de ver.',
      'Calmaria merecida. Tudo feito.',
    ],
    descanso: [
      'Água parada também reflete o céu. Descansa.',
      'Hoje a gente só flutua. Está tudo bem.',
      'Até a nuvem para um pouco antes de chover.',
    ],
    revisao: [
      'Pensando aqui no caminho que a gente fez...',
      'Que corrente você quer seguir na próxima semana?',
      'Olhando o reflexo da semana: teve coisa boa, né?',
    ],
  },
}

// Escolhe uma fala sem repetir a anterior (quando dá).
export function escolherFala(especie: Especie, contexto: Contexto, anterior?: string, sorteio = Math.random()) {
  const opcoes = FALAS[especie][contexto].filter((f) => f !== anterior)
  return opcoes[Math.floor(sorteio * opcoes.length) % opcoes.length]
}

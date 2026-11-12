import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { checar, hojeISO, type Dificuldade, type Tarefa } from './tarefas'

// Check-in de energia: um toque por dia, opcional, que ajusta a tela Hoje.
// Energia baixa vira "dia leve": só 3 coisas, das menores para as maiores, e o progresso conta só essas 3.
// Energia alta coloca as tarefas maiores primeiro. Não vale XP: não é uma ação, é um ajuste.

export type Energia = 'baixa' | 'normal' | 'alta'

export const ENERGIAS: { id: Energia; emoji: string; nome: string; modo: string; dica: string }[] = [
  { id: 'baixa', emoji: '😴', nome: 'Baixa', modo: 'Dia leve', dica: 'só 3 coisas, das menores para as maiores' },
  { id: 'normal', emoji: '🙂', nome: 'Normal', modo: 'Dia normal', dica: 'a lista do jeito de sempre' },
  { id: 'alta', emoji: '⚡', nome: 'Alta', modo: 'Dia de energia', dica: 'as tarefas maiores primeiro' },
]

// Quantas coisas o dia leve pede (tarefas e hábitos somados).
export const META_DIA_LEVE = 3

const PESO: Record<Dificuldade, number> = { pequena: 0, media: 1, complexa: 2 }

// Energia baixa: menores primeiro. Energia alta: maiores primeiro. Empates mantêm a ordem de antes.
export function ordenarPorEnergia(tarefas: Tarefa[], energia: Energia | null) {
  if (energia === 'baixa') return [...tarefas].sort((a, b) => PESO[a.dificuldade] - PESO[b.dificuldade])
  if (energia === 'alta') return [...tarefas].sort((a, b) => PESO[b.dificuldade] - PESO[a.dificuldade])
  return tarefas
}

// No dia leve, mostra só o que falta para chegar a 3 (o que já foi feito, inclusive hábitos, conta).
// O resto fica guardado atrás de um "ver mais": nada some de verdade.
export function separarDiaLeve(tarefas: Tarefa[], energia: Energia | null, feitos = 0) {
  if (energia !== 'baixa') return { visiveis: tarefas, guardadas: [] as Tarefa[] }
  const vagas = Math.max(0, META_DIA_LEVE - feitos)
  return { visiveis: tarefas.slice(0, vagas), guardadas: tarefas.slice(vagas) }
}

export const metaDoDia = (total: number, energia: Energia | null) =>
  energia === 'baixa' ? Math.min(total, META_DIA_LEVE) : total

// Texto e barra do "Progresso de hoje".
export function progressoDoDia(feitos: number, total: number, energia: Energia | null) {
  const meta = metaDoDia(total, energia)
  const pct = meta ? Math.min(100, Math.round((feitos / meta) * 100)) : 0
  let texto = `${feitos} de ${total} concluídos`
  if (total === 0) texto = 'Dia livre por enquanto'
  else if (energia === 'baixa') texto = feitos >= meta ? 'Dia leve cumprido 🌱' : `${feitos} de ${meta} no dia leve`
  return { pct, texto }
}

// ---------- Banco ----------

// Antes de rodar o supabase/ciclo14-energia.sql a tabela não existe: o check-in só não aparece.
const faltaOBanco = (e: { message: string; code?: string } | null) =>
  !!e && (e.code === '42P01' || e.code === 'PGRST205' || /could not find/i.test(e.message))

export async function buscarEnergia(dia: string) {
  const res = await supabase.from('daily_checkins').select('energia').eq('dia', dia).maybeSingle()
  if (faltaOBanco(res.error)) return { energia: null, disponivel: false }
  const linha = checar<{ energia: Energia } | null>(res)
  return { energia: linha?.energia ?? null, disponivel: true }
}

// Responder de novo no mesmo dia troca a resposta (uma linha por pessoa por dia).
export async function salvarEnergia(dia: string, energia: Energia) {
  const { data } = await supabase.auth.getSession()
  const user_id = data.session?.user.id
  if (!user_id) throw new Error('Entre de novo para continuar.')
  checar(await supabase.from('daily_checkins').upsert({ user_id, dia, energia }, { onConflict: 'user_id,dia' }))
}

// A energia de hoje, para a tela Hoje. A tela muda na hora; se o servidor recusar, volta e mostra o erro.
export function useEnergiaDeHoje() {
  const hoje = hojeISO()
  const [energia, setEnergia] = useState<Energia | null>(null)
  const [disponivel, setDisponivel] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    buscarEnergia(hoje)
      .then((r) => {
        if (!ativo) return
        setEnergia(r.energia)
        setDisponivel(r.disponivel)
      })
      .catch(() => {
        /* sem conexão: o check-in só não aparece */
      })
    return () => {
      ativo = false
    }
  }, [hoje])

  const escolher = async (nova: Energia) => {
    const antes = energia
    setEnergia(nova)
    try {
      await salvarEnergia(hoje, nova)
      setErro('')
    } catch (e) {
      setEnergia(antes)
      setErro((e as Error).message)
    }
  }

  return { energia, disponivel, erro, escolher }
}

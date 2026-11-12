import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { checar, type Tarefa } from './tarefas'
import { META_DIA_LEVE } from './energia'

// Semana de plantão: dias de plantão ou estágio marcados na Agenda. Nesses dias a tela Hoje
// sugere só tarefas pequenas (até 3) e não espera os hábitos. Nada some: o resto fica atrás de um "ver mais".
// Não vale XP e não mexe em nada do pet: é um ajuste do dia, guardado em daily_checkins.plantao.

// Só as pequenas aparecem, até completar 3 coisas no dia (o que já foi feito conta).
export function separarPlantao(tarefas: Tarefa[], feitos = 0) {
  const vagas = Math.max(0, META_DIA_LEVE - feitos)
  const visiveis = tarefas.filter((t) => t.dificuldade === 'pequena').slice(0, vagas)
  return { visiveis, guardadas: tarefas.filter((t) => !visiveis.includes(t)) }
}

// Progresso do dia de plantão: os hábitos só contam se foram feitos (não pesam no total).
export function progressoDoPlantao(feitos: number, total: number) {
  const meta = Math.min(total, META_DIA_LEVE)
  if (meta === 0) return { pct: feitos ? 100 : 0, texto: feitos ? 'Plantão cumprido 🩺' : 'Plantão: nada pendente' }
  const pct = Math.min(100, Math.round((feitos / meta) * 100))
  return { pct, texto: feitos >= meta ? 'Plantão cumprido 🩺' : `${feitos} de ${meta} no plantão` }
}

// ---------- Banco ----------

// Antes de rodar o supabase/ciclo24-plantao.sql a coluna não existe: a opção só não aparece.
const faltaOBanco = (e: { message: string; code?: string } | null) =>
  !!e && (e.code === '42703' || e.code === '42P01' || e.code === 'PGRST204' || /could not find|does not exist/i.test(e.message))

export async function buscarPlantoes(de: string, ate: string) {
  const r = await supabase.from('daily_checkins').select('dia').eq('plantao', true).gte('dia', de).lte('dia', ate)
  if (faltaOBanco(r.error)) return { dias: [] as string[], disponivel: false }
  const linhas = checar<{ dia: string }[]>(r)
  return { dias: linhas.map((l) => l.dia), disponivel: true }
}

export async function marcarPlantao(dia: string, plantao: boolean) {
  const { data } = await supabase.auth.getSession()
  const user_id = data.session?.user.id
  if (!user_id) throw new Error('Entre de novo para continuar.')
  // Só a marcação muda: a energia e as prioridades do dia ficam como estão.
  checar(await supabase.from('daily_checkins').upsert({ user_id, dia, plantao }, { onConflict: 'user_id,dia' }))
}

// Dias de plantão num intervalo. A tela muda na hora; se o servidor recusar, volta e mostra o erro.
export function usePlantoes(de: string, ate: string) {
  const [dias, setDias] = useState<Set<string>>(new Set())
  const [disponivel, setDisponivel] = useState(false)
  const [erro, setErro] = useState('')

  useEffect(() => {
    let ativo = true
    buscarPlantoes(de, ate)
      .then((r) => {
        if (!ativo) return
        setDias(new Set(r.dias))
        setDisponivel(r.disponivel)
      })
      .catch(() => {
        /* sem conexão: a opção só não aparece */
      })
    return () => {
      ativo = false
    }
  }, [de, ate])

  const alternar = useCallback(
    async (dia: string) => {
      const sim = !dias.has(dia)
      const antes = dias
      const novos = new Set(dias)
      if (sim) novos.add(dia)
      else novos.delete(dia)
      setDias(novos)
      try {
        await marcarPlantao(dia, sim)
        setErro('')
      } catch (e) {
        setDias(antes)
        setErro((e as Error).message)
      }
    },
    [dias],
  )

  return { dias, disponivel, erro, alternar }
}

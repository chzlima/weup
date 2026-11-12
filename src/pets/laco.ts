import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { checar, hojeISO } from '../lib/tarefas'
import type { Compromisso } from '../lib/agenda'
import type { Tarefa } from '../lib/tarefas'
import { formatarHora } from '../lib/agenda'

// O laço com o pet: conta DIAS de cuidado, não quantidade (ver supabase/ciclo20-laco.sql).
// Não dá XP nem acelera evolução; desbloqueia interações.

// Pontos mínimos de cada nível de laço (1 a 10). Mesma lista da função nivel_do_laco do banco.
export const MINIMOS_LACO = [0, 7, 20, 40, 70, 110, 160, 220, 300, 400] as const

export function nivelDoLaco(pontos: number) {
  return MINIMOS_LACO.filter((m) => pontos >= m).length
}

// Quanto falta para o próximo nível (null no nível máximo) e a fração já percorrida.
export function progressoDoLaco(pontos: number) {
  const nivel = nivelDoLaco(pontos)
  if (nivel >= MINIMOS_LACO.length) return { nivel, faltam: null, fracao: 1 }
  const ini = MINIMOS_LACO[nivel - 1]
  const fim = MINIMOS_LACO[nivel]
  return { nivel, faltam: fim - pontos, fracao: (pontos - ini) / (fim - ini) }
}

// Interações e o laço que cada uma pede.
export const INTERACOES = [
  { id: 'acariciar', nome: 'Acariciar', emoji: '🤲', laco: 1 },
  { id: 'conversar', nome: 'Conversar', emoji: '💬', laco: 2 },
  { id: 'observar', nome: 'Observar', emoji: '🌙', laco: 3 },
  { id: 'brincar', nome: 'Brincar', emoji: '🎈', laco: 4 },
  { id: 'surpresa', nome: 'Surpresa', emoji: '🎁', laco: 5 },
] as const

// "Conversar": o pet comenta o seu dia de verdade. Só fatos; nada de cobrança.
export function assuntosDoDia(d: {
  nomePessoa: string
  feitos: number
  prioridadeAberta?: Pick<Tarefa, 'titulo'>
  proximoCompromisso?: Pick<Compromisso, 'titulo' | 'hora' | 'data'>
  prazoHoje?: Pick<Tarefa, 'titulo'>
}) {
  const hoje = hojeISO()
  const assuntos: string[] = []
  if (d.proximoCompromisso)
    assuntos.push(
      d.proximoCompromisso.data === hoje
        ? `Hoje tem ${d.proximoCompromisso.titulo}${d.proximoCompromisso.hora ? ` às ${formatarHora(d.proximoCompromisso.hora)}` : ''}. Estou junto.`
        : `Amanhã tem ${d.proximoCompromisso.titulo}. Que tal deixar algo pronto hoje?`,
    )
  if (d.prioridadeAberta) assuntos.push(`Sua prioridade de hoje é "${d.prioridadeAberta.titulo}". Quer começar por ela?`)
  if (d.prazoHoje) assuntos.push(`O prazo de "${d.prazoHoje.titulo}" é hoje. Um pedacinho já ajuda.`)
  if (d.feitos >= 3) assuntos.push(`${d.feitos} coisas feitas hoje, ${d.nomePessoa}! Eu vi tudo.`)
  else if (d.feitos > 0) assuntos.push(`Já são ${d.feitos} hoje. Gosto de acompanhar você.`)
  if (!assuntos.length) assuntos.push(`Me conta, ${d.nomePessoa}: o que seria uma coisa pequena para hoje?`)
  return assuntos
}

// ---------- Banco ----------

const faltaOBanco = (e: { message: string; code?: string } | null) =>
  !!e && (e.code === '42883' || e.code === 'PGRST202' || /could not find/i.test(e.message))

export async function buscarLaco() {
  const res = await supabase.rpc('laco_do_pet')
  if (faltaOBanco(res.error)) return null
  const linha = checar<{ pontos: number; nivel: number }[]>(res)[0]
  return linha ? { pontos: linha.pontos, nivel: linha.nivel } : { pontos: 0, nivel: 1 }
}

// Marca que hoje vocês interagiram (conta 1 ponto de laço no dia, uma vez só).
export async function marcarCuidado() {
  const { data } = await supabase.auth.getSession()
  const user_id = data.session?.user.id
  if (!user_id) return
  checar(await supabase.from('daily_checkins').upsert({ user_id, dia: hojeISO(), cuidou_do_pet: true }, { onConflict: 'user_id,dia' }))
}

// O laço para a tela: carrega, e ao primeiro carinho do dia marca o cuidado e recarrega.
export function useLaco() {
  const [laco, setLaco] = useState<{ pontos: number; nivel: number } | null>(null)
  const [cuidouHoje, setCuidouHoje] = useState(false)

  const recarregar = useCallback(() => {
    buscarLaco().then(setLaco).catch(() => {})
  }, [])

  useEffect(recarregar, [recarregar])

  const cuidar = useCallback(async () => {
    if (cuidouHoje || !laco) return
    setCuidouHoje(true)
    try {
      await marcarCuidado()
      recarregar()
    } catch {
      setCuidouHoje(false)
    }
  }, [cuidouHoje, laco, recarregar])

  return { laco, cuidar }
}

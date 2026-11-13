import type { Compromisso } from './agenda'
import type { Tarefa } from './tarefas'

// Lembretes, primeira parte: avisos com o app aberto.
// Compromisso com horário pode "avisar X min antes"; tarefa com dia pode "lembrar às HH:MM".
// Nada aqui vale XP nem cobra: o aviso some com um "Ok" e não volta no mesmo dia.

export const OPCOES_AVISO: { min: number | null; nome: string }[] = [
  { min: null, nome: 'Sem aviso' },
  { min: 0, nome: 'Na hora' },
  { min: 10, nome: '10 min antes' },
  { min: 30, nome: '30 min antes' },
  { min: 60, nome: '1 hora antes' },
  { min: 120, nome: '2 horas antes' },
]

export const descreverAviso = (min: number | null | undefined) =>
  min == null ? null : (OPCOES_AVISO.find((o) => o.min === min)?.nome ?? `${min} min antes`).toLowerCase()

export type Lembrete = {
  chave: string // muda se o horário mudar: aviso remarcado volta a aparecer
  titulo: string
  detalhe: string
  quando: number // ms
}

const momento = (dia: string, hora: string) => {
  const [a, m, d] = dia.split('-').map(Number)
  const [hh, mm] = hora.split(':').map(Number)
  return new Date(a, m - 1, d, hh, mm).getTime()
}

// Os lembretes de hoje, em ordem de horário.
export function lembretesDoDia(compromissos: Compromisso[], tarefas: Tarefa[], hoje: string): Lembrete[] {
  const lista: Lembrete[] = []
  for (const c of compromissos) {
    if (c.data !== hoje || !c.hora || c.lembrete_min == null) continue
    const hora = c.hora.slice(0, 5)
    lista.push({
      chave: `c:${c.id}:${hoje}:${hora}:${c.lembrete_min}`,
      titulo: c.titulo,
      detalhe: c.lembrete_min === 0 ? `Agora · ${hora}` : `Às ${hora} · compromisso`,
      quando: momento(hoje, hora) - c.lembrete_min * 60_000,
    })
  }
  for (const t of tarefas) {
    if (t.data !== hoje || !t.lembrete || t.concluida_em) continue
    const hora = t.lembrete.slice(0, 5)
    lista.push({ chave: `t:${t.id}:${hoje}:${hora}`, titulo: t.titulo, detalhe: `Tarefa de hoje · ${hora}`, quando: momento(hoje, hora) })
  }
  return lista.sort((a, b) => a.quando - b.quando)
}

// Os que já chegaram e ainda não foram vistos.
export const lembretesPendentes = (lista: Lembrete[], agora: number, vistos: Set<string>) =>
  lista.filter((l) => l.quando <= agora && !vistos.has(l.chave))

// ---------- O que já foi visto (fica no aparelho) ----------

const CHAVE_VISTOS = 'weup-lembretes-vistos'

export function lerVistos(hoje: string): Set<string> {
  try {
    const salvo = JSON.parse(localStorage.getItem(CHAVE_VISTOS) ?? '[]') as string[]
    // Só os de hoje importam: os de outros dias caem fora sozinhos.
    return new Set(salvo.filter((k) => k.includes(`:${hoje}:`)))
  } catch {
    return new Set()
  }
}

export function salvarVistos(vistos: Set<string>) {
  try {
    localStorage.setItem(CHAVE_VISTOS, JSON.stringify([...vistos]))
  } catch {
    /* sem armazenamento: o aviso pode aparecer de novo ao recarregar */
  }
}

// ---------- Aviso do sistema (com o app aberto) ----------

export const avisoDoSistemaSuportado = () => typeof window !== 'undefined' && 'Notification' in window

export async function mostrarAvisoDoSistema(l: Lembrete) {
  if (!avisoDoSistemaSuportado() || Notification.permission !== 'granted') return
  try {
    const reg = await navigator.serviceWorker?.getRegistration()
    if (reg) await reg.showNotification(l.titulo, { body: l.detalhe, tag: l.chave, icon: '/pwa-192.png' })
    else new Notification(l.titulo, { body: l.detalhe, tag: l.chave })
  } catch {
    /* o sistema recusou: o aviso continua na tela Hoje */
  }
}

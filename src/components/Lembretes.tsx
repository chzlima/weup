import { useEffect, useRef, useState } from 'react'
import type { Compromisso } from '../lib/agenda'
import type { Tarefa } from '../lib/tarefas'
import {
  lembretesDoDia, lembretesPendentes, lerVistos, mostrarAvisoDoSistema, salvarVistos,
} from '../lib/lembretes'

// Avisos que já chegaram hoje, no topo da tela Hoje. Confere a cada 30 s enquanto o app está aberto.
// Se a pessoa permitiu os avisos do sistema (Perfil), cada lembrete também aparece como notificação, uma vez.
export function Lembretes({ compromissos, tarefas, hoje }: { compromissos: Compromisso[]; tarefas: Tarefa[]; hoje: string }) {
  const [agora, setAgora] = useState(() => Date.now())
  const [vistos, setVistos] = useState(() => lerVistos(hoje))
  const notificados = useRef(new Set<string>())

  useEffect(() => {
    const id = setInterval(() => setAgora(Date.now()), 30_000)
    const voltou = () => document.visibilityState === 'visible' && setAgora(Date.now())
    document.addEventListener('visibilitychange', voltou)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', voltou)
    }
  }, [])

  const pendentes = lembretesPendentes(lembretesDoDia(compromissos, tarefas, hoje), agora, vistos)

  // Aviso do sistema só para o que chegou agora (até 15 min atrás), não para o que já passou faz tempo.
  useEffect(() => {
    for (const l of pendentes) {
      if (notificados.current.has(l.chave) || agora - l.quando > 15 * 60_000) continue
      notificados.current.add(l.chave)
      mostrarAvisoDoSistema(l)
    }
  }, [pendentes, agora])

  if (pendentes.length === 0) return null

  const ok = (chaves: string[]) => {
    const novos = new Set(vistos)
    chaves.forEach((c) => novos.add(c))
    setVistos(novos)
    salvarVistos(novos)
  }

  return (
    <section aria-label="Lembretes" className="space-y-2">
      {pendentes.map((l) => (
        <div key={l.chave} role="status" className="flex items-center gap-3 rounded-2xl border border-brand/50 bg-brand/10 px-4 py-3">
          <span aria-hidden className="text-xl">
            🔔
          </span>
          <p className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold">{l.titulo}</span>
            <span className="block text-xs text-muted">{l.detalhe}</span>
          </p>
          <button onClick={() => ok([l.chave])} className="shrink-0 rounded-full px-3 py-1 text-xs font-bold text-mint">
            Ok
          </button>
        </div>
      ))}
      {pendentes.length > 2 && (
        <button onClick={() => ok(pendentes.map((l) => l.chave))} className="w-full text-center text-xs font-bold text-muted">
          Dispensar todos
        </button>
      )}
    </section>
  )
}

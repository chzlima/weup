import { useEffect, type ReactNode } from 'react'

// Painel que sobe de baixo da tela (usado nos formulários).
export function Sheet({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: ReactNode }) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && onFechar()
    window.addEventListener('keydown', esc)
    return () => window.removeEventListener('keydown', esc)
  }, [onFechar])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-line bg-surface p-5"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom))' }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line" />
        <h2 className="mb-4 text-lg font-extrabold">{titulo}</h2>
        {children}
      </div>
    </div>
  )
}

// Grupo de botões em que só um fica selecionado.
export function Opcoes<T extends string>(props: {
  opcoes: { id: T; nome: string }[]
  valor: T
  onChange: (v: T) => void
}) {
  return (
    <div className="flex gap-2">
      {props.opcoes.map((o) => {
        const on = o.id === props.valor
        return (
          <button
            key={o.id}
            type="button"
            onClick={() => props.onChange(o.id)}
            aria-pressed={on}
            className={`flex-1 rounded-xl border px-2 py-2 text-sm font-semibold transition-colors ${
              on ? 'border-brand bg-brand/15 text-mint' : 'border-line text-muted hover:text-ink'
            }`}
          >
            {o.nome}
          </button>
        )
      })}
    </div>
  )
}

export function Rotulo({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-xs font-semibold text-muted">{children}</span>
}

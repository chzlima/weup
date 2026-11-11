import type { ReactNode } from 'react'

export function Vazio({ children }: { children: ReactNode }) {
  return <div className="rounded-3xl border border-dashed border-line p-6 text-center text-sm text-muted">{children}</div>
}

export function Aviso({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-300">
      {children}
    </p>
  )
}

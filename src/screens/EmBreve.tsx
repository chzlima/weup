import type { ReactNode } from 'react'

// Molde para as telas que ainda serão construídas.
export function EmBreve({
  title,
  desc,
  aviso = 'Em construção — chega nos próximos ciclos.',
  children,
}: {
  title: string
  desc: string
  aviso?: string
  children?: ReactNode
}) {
  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-2xl font-extrabold">{title}</h1>
        <p className="text-sm text-muted">{desc}</p>
      </header>
      {children}
      <div className="rounded-3xl border border-dashed border-line p-6 text-center text-sm text-muted">
        {aviso}
      </div>
    </div>
  )
}

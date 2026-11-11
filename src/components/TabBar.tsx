import type { ComponentType } from 'react'
import { IconEvoluir, IconHoje, IconPerfil, IconPets, IconPlanejar } from './Icons'

export type Tab = 'hoje' | 'planejar' | 'evoluir' | 'pets' | 'perfil'

const TABS: { id: Tab; label: string; Icon: ComponentType<{ className?: string }> }[] = [
  { id: 'hoje', label: 'Hoje', Icon: IconHoje },
  { id: 'planejar', label: 'Planejar', Icon: IconPlanejar },
  { id: 'evoluir', label: 'Evoluir', Icon: IconEvoluir },
  { id: 'pets', label: 'Pets', Icon: IconPets },
  { id: 'perfil', label: 'Perfil', Icon: IconPerfil },
]

export function TabBar({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-bg/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-md">
        {TABS.map(({ id, label, Icon }) => {
          const on = id === active
          return (
            <li key={id} className="flex-1">
              <button
                onClick={() => onChange(id)}
                aria-current={on ? 'page' : undefined}
                className={`flex w-full flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition-colors ${
                  on ? 'text-mint' : 'text-muted hover:text-ink'
                }`}
              >
                <Icon className="h-6 w-6" />
                {label}
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

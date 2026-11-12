import { useId } from 'react'
import type { Especie, Estagio } from '../lib/pets'
import { nivelDoHabitat, type Decoracao, type Periodo } from './habitat'

// A cena atrás do pet, em SVG que preenche o fundo do palco (360 × 240).
// Céu pela hora do dia, chão pela espécie, mais elementos conforme o estágio, e decorações das conquistas.

const CEU: Record<Periodo, [string, string]> = {
  manha: ['#24414a', '#1b1e1d'],
  tarde: ['#4a3324', '#1b1e1d'],
  noite: ['#141c2e', '#151817'],
}

export function CenaHabitat(props: { especie: Especie; estagio: Estagio; periodo: Periodo; decoracoes: Decoracao[] }) {
  const { especie, periodo, decoracoes } = props
  const nivel = nivelDoHabitat(props.estagio)
  const id = useId().replace(/:/g, '')
  const [topo, base] = CEU[periodo]

  return (
    <svg viewBox="0 0 360 240" preserveAspectRatio="xMidYMax slice" className="absolute inset-0 h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id={`ceu-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={topo} />
          <stop offset="100%" stopColor={base} />
        </linearGradient>
      </defs>
      <rect width="360" height="240" fill={`url(#ceu-${id})`} />

      {/* Céu */}
      {periodo === 'noite' && (
        <g fill="#fff6dc">
          <circle cx="300" cy="40" r="14" opacity=".9" />
          <circle cx="306" cy="36" r="12" fill={topo} />
          {[
            [40, 30],
            [90, 60],
            [150, 24],
            [220, 50],
            [260, 20],
            [330, 80],
          ].map(([x, y]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" opacity=".7" />
          ))}
        </g>
      )}
      {periodo === 'manha' && <circle cx="60" cy="70" r="18" fill="#f0d58a" opacity=".35" />}
      {periodo === 'tarde' && <circle cx="300" cy="90" r="22" fill="#f0a35e" opacity=".35" />}

      {especie === 'broto' && <Clareira nivel={nivel} />}
      {especie === 'faisca' && <Acampamento nivel={nivel} periodo={periodo} />}
      {especie === 'gota' && <Lago nivel={nivel} />}

      {/* Decorações das conquistas, sempre nos mesmos lugares (cantos do chão) */}
      {decoracoes.includes('vaso') && (
        <g transform="translate(36 204)">
          <path d="M-8 0h16l-3 14h-10z" fill="#b5653f" />
          <path d="M0 0c-2-8-8-10-10-8 2 4 6 7 10 8zM0 0c2-8 8-10 10-8-2 4-6 7-10 8z" fill="#3fa877" />
          <circle cy="-8" r="4" fill="#ff8fa3" />
        </g>
      )}
      {decoracoes.includes('lanterna') && (
        <g transform="translate(318 190)">
          <path d="M0 0v28" stroke="#5a5f5c" strokeWidth="2" />
          <rect x="-7" y="-14" width="14" height="16" rx="3" fill="#2e3330" />
          <rect x="-4" y="-11" width="8" height="10" rx="2" fill="#f0d58a" opacity={periodo === 'noite' ? 1 : 0.6} />
          {periodo === 'noite' && <circle cy="-6" r="16" fill="#f0d58a" opacity=".12" />}
        </g>
      )}
      {decoracoes.includes('trofeu') && (
        <g transform="translate(70 214)">
          <path d="M-7 -14h14v6c0 5-3 8-7 8s-7-3-7-8z" fill="#d8b45a" />
          <path d="M-2 0h4v4h-4zM-6 4h12v3h-12z" fill="#b8933c" />
        </g>
      )}
      {decoracoes.includes('almofada') && <ellipse cx="290" cy="222" rx="18" ry="6" fill="#9b8cff" opacity=".8" />}
    </svg>
  )
}

function Clareira({ nivel }: { nivel: 1 | 2 | 3 }) {
  return (
    <g>
      {nivel >= 2 && (
        <g fill="#0f3b2b">
          <path d="M20 200l18-60 18 60z" />
          <path d="M304 200l20-70 20 70z" />
        </g>
      )}
      {nivel === 3 && (
        <g fill="#14523a">
          <circle cx="70" cy="150" r="30" />
          <circle cx="292" cy="146" r="34" />
        </g>
      )}
      <path d="M0 200q90-24 180-8t180 0v48H0z" fill="#174d36" />
      <path d="M0 214q120-14 240 0t120-4v30H0z" fill="#1d6143" />
      {nivel >= 2 &&
        [
          [110, 214],
          [250, 216],
          ...(nivel === 3 ? [[150, 222], [210, 224], [330, 218]] : []),
        ].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill={nivel === 3 ? '#f0d58a' : '#7ee8b8'} />)}
    </g>
  )
}

function Acampamento({ nivel, periodo }: { nivel: 1 | 2 | 3; periodo: Periodo }) {
  return (
    <g>
      {nivel >= 2 && <path d="M260 206l34-48 34 48z" fill="#5c3b2a" />}
      {nivel >= 2 && <path d="M294 158l-10 48h20z" fill="#3d271c" />}
      {nivel === 3 && (
        <g>
          <path d="M10 120q90 30 170 10t170 10" stroke="#5a5f5c" strokeWidth="1.5" fill="none" />
          {[40, 90, 140, 200, 250, 310].map((x, i) => (
            <circle key={x} cx={x} cy={124 + (i % 2) * 6} r="3.5" fill="#f0d58a" opacity={periodo === 'noite' ? 1 : 0.6} />
          ))}
        </g>
      )}
      <path d="M0 204q180-18 360 0v36H0z" fill="#3a2a20" />
      <path d="M0 216q180-10 360 0v24H0z" fill="#4a3528" />
      <g transform="translate(88 210)">
        <path d="M-16 0h32" stroke="#6b4a32" strokeWidth="5" strokeLinecap="round" />
        <path d="M-12 -4l24 6" stroke="#5c3b2a" strokeWidth="4" strokeLinecap="round" />
        <path d="M0 -6c-6-6-4-14 0-18 0 6 6 8 4 14z" fill="#f0a35e" opacity=".9" />
      </g>
    </g>
  )
}

function Lago({ nivel }: { nivel: 1 | 2 | 3 }) {
  return (
    <g>
      {nivel === 3 && (
        <g fill="none" strokeWidth="5" opacity=".35" strokeLinecap="round">
          <path d="M40 200a140 140 0 0 1 280 0" stroke="#e07a6a" />
          <path d="M52 200a128 128 0 0 1 256 0" stroke="#d8b45a" />
          <path d="M64 200a116 116 0 0 1 232 0" stroke="#7ee8b8" />
        </g>
      )}
      <path d="M0 196q180-14 360 0v44H0z" fill="#1e3a35" />
      <ellipse cx="180" cy="222" rx="150" ry="16" fill="#2c6f96" opacity=".75" />
      <path d="M90 222q12-4 24 0t24 0M220 226q12-4 24 0t24 0" stroke="#a9dcf3" strokeWidth="2" fill="none" opacity=".6" />
      {nivel >= 2 && (
        <g>
          <ellipse cx="34" cy="204" rx="16" ry="8" fill="#3b4441" />
          <ellipse cx="330" cy="206" rx="12" ry="6" fill="#3b4441" />
          <path d="M310 206v-22M316 206v-16M304 206v-14" stroke="#3fa877" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
    </g>
  )
}

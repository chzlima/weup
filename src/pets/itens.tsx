import type { Especie, Estagio } from '../lib/pets'
import { ALTURA_ROSTO } from './arte'

// Arte dos itens do visual (chapéu, acessório e efeito), no mesmo quadro de 120 × 120 do pet.
// Chapéu e acessório são desenhados dentro do corpo (crescem e se mexem junto com ele);
// os efeitos ficam em volta, no quadro inteiro.

type Ponto = { x: number; y: number }

// Onde o chapéu e o acessório encostam no corpo, por espécie e estágio (coordenadas antes da escala do estágio).
export function pontosDoCorpo(especie: Especie, estagio: Estagio): { cabeca: Ponto; lado: Ponto } {
  let topo: number
  if (especie === 'broto') topo = estagio >= 4 ? 6 : 36
  else if (especie === 'gota') topo = estagio >= 3 ? 8 : 46
  else topo = 42
  return { cabeca: { x: 60, y: topo }, lado: { x: 84, y: ALTURA_ROSTO[especie] + 14 } }
}

export function Chapeu({ id, x, y }: { id: string; x: number; y: number }) {
  return (
    <g transform={`translate(${x - 60} ${y})`}>
      {id === 'boina' && (
        <>
          <path d="M42 0c0-8 8-13 18-13s20 4 20 10c0 4-8 6-20 6S42 4 42 0z" fill="#c0504d" />
          <path d="M44 1h32" stroke="#8f3a37" strokeWidth="3" strokeLinecap="round" />
          <circle cx="61" cy="-14" r="2.5" fill="#8f3a37" />
        </>
      )}
      {id === 'coroa_folhas' &&
        [-24, -12, 0, 12, 24].map((dx, i) => (
          <path
            key={dx}
            d={`M${60 + dx} 2c-4-6-3-12 1-15 3 5 3 10-1 15z`}
            fill={i % 2 ? '#7ee8b8' : '#14b87a'}
            transform={`rotate(${dx * 1.4} ${60 + dx} 2)`}
          />
        ))}
      {id === 'capelo' && (
        <>
          <path d="M48 -2h24v5c0 3-5 5-12 5s-12-2-12-5z" fill="#2b2f2d" />
          <path d="M60 -16l26 9-26 9-26-9z" fill="#3a3f3c" />
          <path d="M76 -10v12" stroke="#d8b45a" strokeWidth="2" />
          <circle cx="76" cy="4" r="2.5" fill="#d8b45a" />
        </>
      )}
      {id === 'coroa' && (
        <>
          <path d="M44 2l-2-16 9 8 9-12 9 12 9-8-2 16z" fill="#d8b45a" stroke="#b8933c" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="51" cy="-2" r="2" fill="#ff8fa3" />
          <circle cx="60" cy="-4" r="2.4" fill="#7fd6e8" />
          <circle cx="69" cy="-2" r="2" fill="#9b8cff" />
        </>
      )}
    </g>
  )
}

export function Acessorio({ id, x, y }: { id: string; x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      {id === 'estetoscopio' && (
        <>
          <path d="M-30 -8c0 14 10 20 20 20s16-6 16-14" stroke="#cfd8dc" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <circle cx="6" cy="-4" r="5" fill="#cfd8dc" stroke="#90a4ae" strokeWidth="1.5" />
          <circle cx="6" cy="-4" r="2" fill="#90a4ae" />
        </>
      )}
      {id === 'flor' && (
        <>
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={5 * Math.cos((a * Math.PI) / 180)} cy={5 * Math.sin((a * Math.PI) / 180)} r="4" fill="#ff8fa3" />
          ))}
          <circle r="3" fill="#f0d58a" />
        </>
      )}
      {id === 'laco_fita' && (
        <>
          <path d="M0 0l-10-7v14z" fill="#e05a5a" />
          <path d="M0 0l10-7v14z" fill="#e05a5a" />
          <circle r="3" fill="#b84444" />
        </>
      )}
      {id === 'medalha' && (
        <>
          <path d="M-5 -12l5 8 5-8" stroke="#4aa3cf" strokeWidth="3" fill="none" />
          <circle cy="2" r="6" fill="#d8b45a" stroke="#b8933c" strokeWidth="1.5" />
          <path d="M0 -1.5l1 2.2 2.4.3-1.8 1.6.5 2.4L0 3.8l-2.1 1.2.5-2.4-1.8-1.6 2.4-.3z" fill="#fff6dc" />
        </>
      )}
    </g>
  )
}

const POSICOES = [
  [18, 40],
  [102, 34],
  [12, 78],
  [108, 74],
  [30, 16],
  [92, 12],
]

export function Efeito({ id }: { id: string }) {
  return (
    <g>
      {POSICOES.map(([x, y], i) => (
        <g key={i} className="pet-particula" style={{ animationDelay: `${i * 0.45}s` }}>
          {id === 'brilhos' && (
            <path d={`M${x} ${y - 5}l1.5 3.5 3.5 1.5-3.5 1.5-1.5 3.5-1.5-3.5-3.5-1.5 3.5-1.5z`} fill="#f0d58a" />
          )}
          {id === 'vagalumes' && (
            <>
              <circle cx={x} cy={y} r="4.5" fill="#e6f59a" opacity=".3" />
              <circle cx={x} cy={y} r="2" fill="#f4ffb0" />
            </>
          )}
          {id === 'estrelas' && (
            <path
              d={`M${x} ${y - 4.5}l1.3 2.9 3.2.4-2.4 2.2.7 3.2-2.8-1.6-2.8 1.6.7-3.2-2.4-2.2 3.2-.4z`}
              fill="#fff6dc"
            />
          )}
          {id === 'coracoes' && (
            <path d={`M${x} ${y + 3}c-4-3-6-5-6-7 0-3 4-4 6-1 2-3 6-2 6 1 0 2-2 4-6 7z`} fill="#ff8fa3" />
          )}
        </g>
      ))}
    </g>
  )
}

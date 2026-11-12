import type { Especie, Estagio } from '../lib/pets'

// Arte dos pets em SVG feito por código, em CAMADAS:
//   corpo (espécie × estágio)  →  rosto (expressão)  →  encaixes (onde acessórios vão entrar, ciclo 7)
// Tudo num quadro de 120 × 120, com o chão na altura 108. Para trocar pela arte de um ilustrador,
// basta substituir os corpos e rostos mantendo os mesmos encaixes.

export type Expressao = 'feliz' | 'animado' | 'curioso' | 'tranquilo' | 'orgulhoso' | 'pensativo'
export type Rosto = Expressao | 'neutro'

export const EXPRESSOES: { id: Expressao; nome: string }[] = [
  { id: 'feliz', nome: 'Feliz' },
  { id: 'animado', nome: 'Animado' },
  { id: 'curioso', nome: 'Curioso' },
  { id: 'tranquilo', nome: 'Tranquilo' },
  { id: 'orgulhoso', nome: 'Orgulhoso' },
  { id: 'pensativo', nome: 'Pensativo' },
]

export const CHAO = 108
export const ESCALA: Record<Estagio, number> = { 1: 0.72, 2: 0.86, 3: 1, 4: 1, 5: 1 }

// Altura dos olhos de cada espécie (no corpo antes da escala).
export const ALTURA_ROSTO: Record<Especie, number> = { broto: 72, faisca: 78, gota: 78 }

type Ponto = { x: number; y: number }

// Encaixes para os cosméticos (coordenadas do quadro, já com a escala do estágio aplicada).
// cabeca: onde fica a base de um chapéu · lado: onde fica um acessório (flor, laço, broche).
export function encaixes(especie: Especie, estagio: Estagio): { cabeca: Ponto; lado: Ponto } {
  const topo = { broto: 34, faisca: 36, gota: 30 }[especie]
  const s = ESCALA[estagio]
  const escalar = (p: Ponto) => ({ x: 60 + (p.x - 60) * s, y: CHAO + (p.y - CHAO) * s })
  return { cabeca: escalar({ x: 60, y: topo }), lado: escalar({ x: 84, y: ALTURA_ROSTO[especie] + 14 }) }
}

// ---------- Rostos ----------

const TINTA = '#121413'

function Olho({ x, y, r = 5, brilho = { dx: 1.5, dy: -1.5 } }: { x: number; y: number; r?: number; brilho?: { dx: number; dy: number } }) {
  return (
    <>
      <circle cx={x} cy={y} r={r} fill={TINTA} />
      <circle cx={x + brilho.dx} cy={y + brilho.dy} r={r * 0.32} fill="#fff" />
    </>
  )
}

const traco = { stroke: TINTA, strokeWidth: 3, strokeLinecap: 'round' as const, fill: 'none' }

export function RostoPet({ y, rosto }: { y: number; rosto: Rosto }) {
  const bochecha = (op: number) => (
    <>
      <circle cx="40" cy={y + 9} r="4" fill="#d8b45a" opacity={op} />
      <circle cx="80" cy={y + 9} r="4" fill="#d8b45a" opacity={op} />
    </>
  )

  switch (rosto) {
    case 'feliz':
      return (
        <>
          <g className="pet-piscar">
            <Olho x={48} y={y} />
            <Olho x={72} y={y} />
          </g>
          <path d={`M51 ${y + 10}q9 9 18 0`} {...traco} />
          {bochecha(0.35)}
        </>
      )
    case 'animado':
      return (
        <>
          <g className="pet-piscar">
            <Olho x={48} y={y} r={5.6} brilho={{ dx: 1.8, dy: -1.8 }} />
            <Olho x={72} y={y} r={5.6} brilho={{ dx: 1.8, dy: -1.8 }} />
          </g>
          <path d={`M50 ${y + 9}q10 0 20 0q-1 11-10 11t-10-11z`} fill={TINTA} />
          <path d={`M55 ${y + 16}q5 -3 10 0q-2 3-5 3t-5-3z`} fill="#e07a6a" />
          {bochecha(0.5)}
        </>
      )
    case 'curioso':
      return (
        <>
          <g className="pet-piscar">
            <Olho x={48} y={y} r={5.8} brilho={{ dx: 1.2, dy: -2.4 }} />
            <Olho x={72} y={y} r={5.8} brilho={{ dx: 1.2, dy: -2.4 }} />
          </g>
          <path d={`M66 ${y - 11}q6 -4 12 -1`} {...traco} strokeWidth={2.4} />
          <circle cx="60" cy={y + 12} r="2.8" {...traco} strokeWidth={2.6} />
          {bochecha(0.25)}
        </>
      )
    case 'tranquilo':
      return (
        <>
          <path d={`M43 ${y}q5 4 10 0`} {...traco} />
          <path d={`M67 ${y}q5 4 10 0`} {...traco} />
          <path d={`M54 ${y + 11}q6 4 12 0`} {...traco} />
          {bochecha(0.3)}
        </>
      )
    case 'orgulhoso':
      return (
        <>
          <path d={`M43 ${y + 2}q5 -6 10 0`} {...traco} />
          <path d={`M67 ${y + 2}q5 -6 10 0`} {...traco} />
          <path d={`M50 ${y + 9}q10 10 20 0`} {...traco} />
          {bochecha(0.55)}
          <path d={`M88 ${y - 14}l1.6 3.4 3.4 1.6-3.4 1.6-1.6 3.4-1.6-3.4-3.4-1.6 3.4-1.6z`} fill="#d8b45a" />
        </>
      )
    case 'pensativo':
      return (
        <>
          <g className="pet-piscar">
            <Olho x={46} y={y} brilho={{ dx: -1.8, dy: -1.6 }} />
            <Olho x={70} y={y} brilho={{ dx: -1.8, dy: -1.6 }} />
          </g>
          <path d={`M40 ${y - 10}q6 -3 12 0`} {...traco} strokeWidth={2.4} />
          <path d={`M55 ${y + 12}h9`} {...traco} />
          <g fill="#9aa49f">
            <circle cx="90" cy={y - 12} r="2" />
            <circle cx="96" cy={y - 19} r="2.8" />
            <circle cx="104" cy={y - 28} r="3.6" />
          </g>
        </>
      )
    default:
      return (
        <>
          <g className="pet-piscar">
            <Olho x={48} y={y} />
            <Olho x={72} y={y} />
          </g>
          <path d={`M54 ${y + 11}q6 5 12 0`} {...traco} />
          {bochecha(0.35)}
        </>
      )
  }
}

// ---------- Detalhe do caminho (estágios 4 e 5) ----------
// Uma insígnia na cor do caminho, por cima do corpo: estrelas (conhecimento),
// coração e folhas (saúde) ou cristais (organização). A forma lendária ganha mais brilho.
export function DetalheCaminho({ caminho, estagio }: { caminho: 'conhecimento' | 'saude' | 'organizacao'; estagio: Estagio }) {
  const lendaria = estagio === 5
  if (caminho === 'conhecimento')
    return (
      <g>
        <path d="M95.0 45.0L97.0 50.2L102.6 50.5L98.2 54.1L99.7 59.5L95.0 56.4L90.3 59.5L91.8 54.1L87.4 50.5L93.0 50.2z" fill="#9b8cff" stroke="#b8adff" strokeWidth="1.2" strokeLinejoin="round" />
        {[
          [24, 44],
          [98, 30],
          ...(lendaria ? [[14, 60], [108, 64], [60, 4]] : []),
        ].map(([x, y]) => (
          <path key={`${x}-${y}`} d={`M${x} ${y - 4}l1.3 2.7 2.7 1.3-2.7 1.3-1.3 2.7-1.3-2.7-2.7-1.3 2.7-1.3z`} fill="#d6cfff" />
        ))}
      </g>
    )
  if (caminho === 'saude')
    return (
      <g>
        <path d="M95 52c-3-5-11-3-9 3 1 3 5 6 9 9 4-3 8-6 9-9 2-6-6-8-9-3z" fill="#ff8fa3" />
        <path d="M18 56c4-6 10-6 12-2-4 4-8 4-12 2z" fill="#7ee8b8" />
        {lendaria && <path d="M24 40c-3-5-11-3-9 3 1 3 5 6 9 9 4-3 8-6 9-9 2-6-6-8-9-3z" fill="#ffb3c1" />}
      </g>
    )
  return (
    <g>
      <path d="M96 44l6 8-6 10-6-10z" fill="#7fd6e8" />
      <path d="M96 44l6 8h-12z" fill="#b6ecf6" />
      {lendaria && (
        <>
          <path d="M20 48l4 6-4 7-4-7z" fill="#7fd6e8" />
          <path d="M60 2l4 6-4 7-4-7z" fill="#b6ecf6" />
        </>
      )}
    </g>
  )
}

// ---------- Corpos ----------

export function CorpoBroto({ estagio }: { estagio: Estagio }) {
  const cor = estagio === 1 ? '#3fa877' : estagio >= 4 ? '#0f9e68' : '#14b87a'
  return (
    <>
      {estagio >= 4 && (
        // Copa: o Bosque ganha uma coroa de folhas; a forma lendária, folhas douradas e flores
        <g>
          <circle cx="40" cy="30" r="15" fill={estagio === 5 ? '#d8b45a' : '#14b87a'} />
          <circle cx="80" cy="30" r="15" fill={estagio === 5 ? '#e8c77a' : '#0f9e68'} />
          <circle cx="60" cy="20" r="18" fill={estagio === 5 ? '#f0d58a' : '#3fa877'} />
          <circle cx="60" cy="20" r="8" fill={estagio === 5 ? '#fff6dc' : '#7ee8b8'} opacity=".7" />
          {estagio === 5 &&
            [
              [34, 22],
              [86, 24],
              [60, 6],
              [48, 32],
              [74, 33],
            ].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="3" fill="#fff" opacity=".9" />)}
        </g>
      )}
      {estagio === 3 && (
        <>
          <path d="M60 30c-6-12-2-24 12-28 0 12-4 22-12 28z" fill="#7ee8b8" />
          <path d="M60 30c-4-10-12-16-22-16 2 10 10 16 22 16z" fill="#14b87a" />
          <path d="M60 30c6-6 16-8 24-4-6 6-14 8-24 4z" fill="#0f9e68" />
          {[0, 72, 144, 216, 288].map((a) => (
            <circle key={a} cx={72 + 5 * Math.cos((a * Math.PI) / 180)} cy={6 + 5 * Math.sin((a * Math.PI) / 180)} r="3.5" fill="#d8b45a" />
          ))}
          <circle cx="72" cy="6" r="2.5" fill="#fff6dc" />
        </>
      )}
      {estagio === 2 && (
        <>
          <path d="M60 28c-2-10 4-18 14-20-1 9-6 15-14 20z" fill="#7ee8b8" />
          <path d="M60 30c-1-7-6-12-13-13 1 7 6 11 13 13z" fill="#14b87a" />
        </>
      )}
      {estagio === 1 && <path d="M60 32c0-8 4-13 10-15 0 7-4 12-10 15z" fill="#7ee8b8" />}
      <path d="M22 72c0-22 17-40 38-40s38 18 38 40-17 32-38 32-38-10-38-32z" fill={cor} />
      <path d="M34 66c0-14 11-24 26-24" stroke="#7ee8b8" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".5" />
      {estagio >= 3 && <path d="M98 74c8-2 14 2 16 8-8 2-13-1-16-8z" fill="#7ee8b8" />}
      {estagio >= 4 && (
        // Uma mudinha nasceu ao lado: o Bosque cuida de quem está começando
        <g>
          <path d="M14 104c0-5 2-8 5-9 0 4-2 7-5 9z" fill="#7ee8b8" />
          <ellipse cx="15" cy="105" rx="6" ry="2" fill="#000" opacity=".2" />
        </g>
      )}
    </>
  )
}

export function CorpoFaisca({ estagio }: { estagio: Estagio }) {
  const asa = estagio === 5 ? ['#f0d58a', '#fff1d6'] : ['#d8b45a', '#e8c77a']
  return (
    <>
      {estagio >= 3 && (
        <g transform={estagio >= 4 ? 'translate(60 80) scale(1.15) translate(-60 -80)' : undefined}>
          <path d="M30 88C12 88 2 76 2 62c10 6 18 8 30 8z" fill={asa[0]} />
          <path d="M28 78C14 74 8 64 10 54c8 6 14 8 22 8z" fill={asa[1]} />
          <path d="M90 88c18 0 28-12 28-26-10 6-18 8-30 8z" fill={asa[0]} />
          <path d="M92 78c14-4 20-14 18-24-8 6-14 8-22 8z" fill={asa[1]} />
        </g>
      )}
      <path
        d="M60 20C72 38 96 54 96 78c0 16-16 26-36 26S24 94 24 78c0-16 14-24 20-40 4 8 10 10 16-18z"
        fill={estagio === 1 ? '#e08a4a' : estagio >= 4 ? '#f5a85a' : '#f0a35e'}
      />
      <ellipse cx="60" cy="86" rx="22" ry="14" fill={estagio === 5 ? '#fff1d6' : '#f7c98b'} opacity=".55" />
      {estagio >= 2 && <path d="M82 44c6 6 8 14 4 20-2-6-4-12-4-20z" fill="#f7c98b" />}
      {estagio === 3 && <path d="M60 20c-4 8-4 14 0 18 4-4 4-10 0-18z" fill="#fff1d6" />}
      {estagio === 5 && <ellipse cx="60" cy="80" rx="12" ry="16" fill="#fff6dc" opacity=".35" />}
      {estagio >= 4 && (
        // Coroa de três chamas
        <g fill={estagio === 5 ? '#fff1d6' : '#f7c98b'}>
          <path d="M60 8c-5 8-5 14 0 18 5-4 5-10 0-18z" />
          <path d="M48 16c-4 6-3 11 1 13 3-3 3-8-1-13z" />
          <path d="M72 16c4 6 3 11-1 13-3-3-3-8 1-13z" />
        </g>
      )}
    </>
  )
}

export function CorpoGota({ estagio }: { estagio: Estagio }) {
  return (
    <>
      {estagio === 5 && (
        // Arco-íris atrás e estrelas
        <g fill="none" strokeLinecap="round" opacity=".85">
          <path d="M8 70a52 52 0 0 1 104 0" stroke="#e07a6a" strokeWidth="4" />
          <path d="M14 70a46 46 0 0 1 92 0" stroke="#d8b45a" strokeWidth="4" />
          <path d="M20 70a40 40 0 0 1 80 0" stroke="#7ee8b8" strokeWidth="4" />
          <path d="M26 70a34 34 0 0 1 68 0" stroke="#a9dcf3" strokeWidth="4" />
        </g>
      )}
      {estagio >= 3 && (
        <g fill={estagio === 4 ? '#c9d6e3' : '#e6f3fa'} opacity=".95">
          <circle cx="42" cy="26" r="11" />
          <circle cx="60" cy="18" r="14" />
          <circle cx="78" cy="26" r="11" />
          <rect x="40" y="24" width="40" height="12" rx="6" />
        </g>
      )}
      <path
        d="M60 20S94 54 94 78a34 34 0 0 1-68 0c0-24 34-58 34-58z"
        fill={estagio === 1 ? '#4aa3cf' : estagio >= 4 ? '#3d93c8' : '#5cb8e4'}
      />
      <path d="M40 70c0-10 6-20 14-28" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".35" />
      {estagio === 4 && <path d="M96 30l-6 10h5l-4 9 10-12h-5l4-7z" fill="#d8b45a" />}
      {estagio >= 2 && (
        <path d="M34 96q6-5 13 0t13 0t13 0t13 0" stroke="#a9dcf3" strokeWidth="3" strokeLinecap="round" fill="none" />
      )}
      {estagio === 5 &&
        [
          [16, 30],
          [104, 36],
          [96, 12],
        ].map(([x, y]) => (
          <path
            key={`${x}-${y}`}
            d={`M${x} ${y - 4}l1.2 2.8 2.8 1.2-2.8 1.2-1.2 2.8-1.2-2.8-2.8-1.2 2.8-1.2z`}
            fill="#fff6dc"
          />
        ))}
    </>
  )
}

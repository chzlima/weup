import type { Especie, Estagio } from '../lib/pets'

// Arte PROVISÓRIA dos pets (formas simples em SVG) até a arte oficial ficar pronta.
// Cada espécie tem 5 estágios. Por enquanto os estágios 4 e 5 usam o desenho do 3 com uma aura
// (a arte nova em camadas chega no ciclo 2 do Pet Rework).

const ESCALA: Record<Estagio, number> = { 1: 0.72, 2: 0.86, 3: 1, 4: 1, 5: 1 }
const CHAO = 108

export function Pet(props: {
  especie?: Especie
  estagio?: Estagio
  feliz?: boolean
  silhueta?: boolean // estágio ainda bloqueado: só a sombra
  size?: number
  nome?: string
}) {
  const { especie = 'broto', estagio: estagioReal = 2, feliz = false, silhueta = false, size = 96 } = props
  const s = ESCALA[estagioReal]
  const estagio = Math.min(estagioReal, 3) as Estagio // desenho disponível

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={props.nome ? `Seu companheiro, ${props.nome}` : 'Companheiro'}
      style={silhueta ? { filter: 'brightness(0)', opacity: 0.25 } : undefined}
    >
      {estagioReal >= 4 && (
        <circle cx="60" cy="64" r={estagioReal === 5 ? 56 : 50} fill="none" stroke="#d8b45a" strokeWidth="2" opacity=".55" strokeDasharray={estagioReal === 5 ? undefined : '4 6'} />
      )}
      <ellipse cx="60" cy={CHAO} rx={30 * s} ry="5" fill="#000" opacity=".25" />
      <g transform={`translate(60 ${CHAO}) scale(${s}) translate(-60 ${-CHAO})`}>
        {especie === 'broto' && <Broto estagio={estagio} />}
        {especie === 'faisca' && <Faisca estagio={estagio} />}
        {especie === 'gota' && <Gota estagio={estagio} />}
        <Rosto y={especie === 'broto' ? 72 : 78} feliz={feliz} />
      </g>
    </svg>
  )
}

function Rosto({ y, feliz }: { y: number; feliz: boolean }) {
  return (
    <>
      <circle cx="48" cy={y} r="5" fill="#121413" />
      <circle cx="72" cy={y} r="5" fill="#121413" />
      <circle cx="49.5" cy={y - 1.5} r="1.6" fill="#fff" />
      <circle cx="73.5" cy={y - 1.5} r="1.6" fill="#fff" />
      <path
        d={feliz ? `M51 ${y + 10}q9 9 18 0` : `M54 ${y + 11}q6 5 12 0`}
        stroke="#121413"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="40" cy={y + 9} r="4" fill="#d8b45a" opacity=".35" />
      <circle cx="80" cy={y + 9} r="4" fill="#d8b45a" opacity=".35" />
    </>
  )
}

function Broto({ estagio }: { estagio: Estagio }) {
  return (
    <>
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
      <path d="M22 72c0-22 17-40 38-40s38 18 38 40-17 32-38 32-38-10-38-32z" fill={estagio === 1 ? '#3fa877' : '#14b87a'} />
      <path d="M34 66c0-14 11-24 26-24" stroke="#7ee8b8" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".5" />
      {estagio === 3 && <path d="M98 74c8-2 14 2 16 8-8 2-13-1-16-8z" fill="#7ee8b8" />}
    </>
  )
}

function Faisca({ estagio }: { estagio: Estagio }) {
  return (
    <>
      {estagio === 3 && (
        <>
          <path d="M30 88C12 88 2 76 2 62c10 6 18 8 30 8z" fill="#d8b45a" />
          <path d="M28 78C14 74 8 64 10 54c8 6 14 8 22 8z" fill="#e8c77a" />
          <path d="M90 88c18 0 28-12 28-26-10 6-18 8-30 8z" fill="#d8b45a" />
          <path d="M92 78c14-4 20-14 18-24-8 6-14 8-22 8z" fill="#e8c77a" />
        </>
      )}
      <path
        d="M60 20C72 38 96 54 96 78c0 16-16 26-36 26S24 94 24 78c0-16 14-24 20-40 4 8 10 10 16-18z"
        fill={estagio === 1 ? '#e08a4a' : '#f0a35e'}
      />
      <ellipse cx="60" cy="86" rx="22" ry="14" fill="#f7c98b" opacity=".55" />
      {estagio >= 2 && <path d="M82 44c6 6 8 14 4 20-2-6-4-12-4-20z" fill="#f7c98b" />}
      {estagio === 3 && <path d="M60 20c-4 8-4 14 0 18 4-4 4-10 0-18z" fill="#fff1d6" />}
    </>
  )
}

function Gota({ estagio }: { estagio: Estagio }) {
  return (
    <>
      {estagio === 3 && (
        <g fill="#e6f3fa" opacity=".95">
          <circle cx="42" cy="26" r="11" />
          <circle cx="60" cy="18" r="14" />
          <circle cx="78" cy="26" r="11" />
          <rect x="40" y="24" width="40" height="12" rx="6" />
        </g>
      )}
      <path d="M60 20S94 54 94 78a34 34 0 0 1-68 0c0-24 34-58 34-58z" fill={estagio === 1 ? '#4aa3cf' : '#5cb8e4'} />
      <path d="M40 70c0-10 6-20 14-28" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none" opacity=".35" />
      {estagio >= 2 && (
        <path
          d="M34 96q6-5 13 0t13 0t13 0t13 0"
          stroke="#a9dcf3"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
      )}
    </>
  )
}

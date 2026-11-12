import { useId } from 'react'
import type { Especie, Estagio } from '../lib/pets'
import {
  ALTURA_ROSTO, CHAO, CorpoBroto, CorpoFaisca, CorpoGota, ESCALA, RostoPet, type Expressao, type Rosto,
} from '../pets/arte'

// O pet desenhado em camadas (ver src/pets/arte.tsx): aura, sombra, corpo da espécie e rosto da expressão.
// Parado, cada espécie tem o seu movimento: o Broto balança, a Faísca tremula e a Gota flutua.
// Quem pede "reduzir movimento" no aparelho vê o pet parado (regra global em index.css).
export function Pet(props: {
  especie?: Especie
  estagio?: Estagio
  expressao?: Expressao
  feliz?: boolean // atalho antigo: feliz = expressão "feliz"; sem nada, o rosto neutro
  silhueta?: boolean // estágio ainda bloqueado: só a sombra
  parado?: boolean // sem animação (miniaturas e silhuetas)
  size?: number
  nome?: string
}) {
  const { especie = 'broto', estagio = 2, feliz = false, silhueta = false, size = 96 } = props
  const rosto: Rosto = props.expressao ?? (feliz ? 'feliz' : 'neutro')
  const s = ESCALA[estagio]
  const animado = !props.parado && !silhueta
  const id = useId().replace(/:/g, '')

  return (
    <svg
      viewBox="0 0 120 120"
      width={size}
      height={size}
      role="img"
      aria-label={props.nome ? `Seu companheiro, ${props.nome}` : 'Companheiro'}
      style={silhueta ? { filter: 'brightness(0)', opacity: 0.25 } : undefined}
      overflow="visible"
    >
      {estagio >= 4 && !silhueta && (
        <>
          <defs>
            <radialGradient id={`aura-${id}`}>
              <stop offset="0%" stopColor="#d8b45a" stopOpacity={estagio === 5 ? 0.45 : 0.25} />
              <stop offset="100%" stopColor="#d8b45a" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="60" cy="62" r="60" fill={`url(#aura-${id})`} className={animado ? 'pet-aura' : undefined} />
        </>
      )}
      <ellipse cx="60" cy={CHAO} rx={30 * s} ry="5" fill="#000" opacity=".25" />
      <g transform={`translate(60 ${CHAO}) scale(${s}) translate(-60 ${-CHAO})`}>
        <g className={animado ? `pet-parado-${especie}` : undefined}>
          {especie === 'broto' && <CorpoBroto estagio={estagio} />}
          {especie === 'faisca' && <CorpoFaisca estagio={estagio} />}
          {especie === 'gota' && <CorpoGota estagio={estagio} />}
          <RostoPet y={ALTURA_ROSTO[especie]} rosto={rosto} />
        </g>
      </g>
    </svg>
  )
}

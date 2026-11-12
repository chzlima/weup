import { useEffect, useState } from 'react'
import { Pet } from '../components/Pet'
import type { MeuPet } from '../lib/pets'
import { nomeDaForma } from './caminhos'

type Fase = 'antes' | 'brilho' | 'depois'

// Cena de evolução: a forma antiga brilha, um clarão, e a forma nova aparece com o nome.
// Com "reduzir movimento" ligado, as animações somem e a cena só troca de forma.
export function Transformacao({ antes, depois, onFechar }: { antes: MeuPet; depois: MeuPet; onFechar: () => void }) {
  const [fase, setFase] = useState<Fase>('antes')

  useEffect(() => {
    const t1 = setTimeout(() => setFase('brilho'), 1400)
    const t2 = setTimeout(() => setFase('depois'), 1900)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  const nomeNovo = nomeDaForma(depois.especie, depois.estagio, depois.caminho)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Seu companheiro evoluiu"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg/95 px-6 text-center"
      onClick={fase === 'depois' ? onFechar : undefined}
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-gold">
        {fase === 'depois' ? 'Evolução!' : `${antes.nome} está mudando…`}
      </p>

      <div className="relative flex h-64 w-64 items-center justify-center">
        {fase !== 'depois' && (
          <div className="animate-[tremor_0.35s_ease-in-out_infinite]">
            <div style={{ filter: 'brightness(0) invert(1)', opacity: fase === 'brilho' ? 1 : 0.85 }}>
              <Pet especie={antes.especie} estagio={antes.estagio} caminho={antes.caminho} parado size={190} />
            </div>
          </div>
        )}
        {fase === 'brilho' && <div className="absolute inset-0 animate-[clarao_0.5s_ease-out_forwards] rounded-full bg-white" />}
        {fase === 'depois' && (
          <div className="animate-[surgir_0.7s_ease-out]">
            <Pet especie={depois.especie} estagio={depois.estagio} caminho={depois.caminho} expressao="orgulhoso" size={220} />
          </div>
        )}
      </div>

      {fase === 'depois' && (
        <div className="animate-[aparecer_0.5s_ease-out] space-y-2">
          <p className="text-2xl font-extrabold">
            {depois.nome} virou {nomeNovo}!
          </p>
          <p className="text-sm text-muted">Vocês cresceram juntos. Isso é evolução de verdade.</p>
          <button onClick={onFechar} className="mt-3 rounded-2xl bg-brand px-8 py-3 font-bold text-bg">
            Que demais!
          </button>
        </div>
      )}
    </div>
  )
}

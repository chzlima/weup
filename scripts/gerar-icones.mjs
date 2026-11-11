// Gera os ícones do app (PNG) a partir do mascote Broto.
// Como usar (só quando o ícone mudar):  node scripts/gerar-icones.mjs
import sharp from 'sharp'
import { writeFileSync } from 'node:fs'

const FUNDO = '#121413'
const CARTAO = '#1b1e1d'

// Broto (estágio 2, feliz), desenhado numa caixa de 120×120 — o mesmo de src/components/Pet.tsx.
const broto = `
  <path d="M60 28c-2-10 4-18 14-20-1 9-6 15-14 20z" fill="#7ee8b8"/>
  <path d="M60 30c-1-7-6-12-13-13 1 7 6 11 13 13z" fill="#14b87a"/>
  <path d="M22 72c0-22 17-40 38-40s38 18 38 40-17 32-38 32-38-10-38-32z" fill="#14b87a"/>
  <path d="M34 66c0-14 11-24 26-24" stroke="#7ee8b8" stroke-width="4" stroke-linecap="round" fill="none" opacity=".5"/>
  <circle cx="48" cy="72" r="5" fill="#121413"/>
  <circle cx="72" cy="72" r="5" fill="#121413"/>
  <circle cx="49.5" cy="70.5" r="1.6" fill="#fff"/>
  <circle cx="73.5" cy="70.5" r="1.6" fill="#fff"/>
  <path d="M51 82q9 9 18 0" stroke="#121413" stroke-width="3" stroke-linecap="round" fill="none"/>
  <circle cx="40" cy="81" r="4" fill="#d8b45a" opacity=".35"/>
  <circle cx="80" cy="81" r="4" fill="#d8b45a" opacity=".35"/>`

// O Broto ocupa x 22–98 e y 8–104 na caixa; centro ≈ (60, 56).
function brotoCentralizado(escala) {
  const tx = 256 - 60 * escala
  const ty = 256 - 56 * escala
  return `<g transform="translate(${tx} ${ty}) scale(${escala})">${broto}</g>`
}

// "any": cartão arredondado (cantos transparentes), para navegadores e Android antigos.
const svgAny = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" fill="${FUNDO}"/>
  <rect x="32" y="32" width="448" height="448" rx="96" fill="${CARTAO}"/>
  ${brotoCentralizado(3.4)}
</svg>`

// "maskable" e Apple: fundo até a borda (o sistema recorta o formato); mascote dentro da zona segura.
const svgCheio = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${CARTAO}"/>
  ${brotoCentralizado(2.9)}
</svg>`

const saidas = [
  { svg: svgAny, tamanho: 192, arquivo: 'public/pwa-192.png' },
  { svg: svgAny, tamanho: 512, arquivo: 'public/pwa-512.png' },
  { svg: svgCheio, tamanho: 512, arquivo: 'public/pwa-maskable-512.png' },
  { svg: svgCheio, tamanho: 180, arquivo: 'public/apple-touch-icon.png' },
]

for (const s of saidas) {
  await sharp(Buffer.from(s.svg)).resize(s.tamanho, s.tamanho).png({ compressionLevel: 9 }).toFile(s.arquivo)
  console.log('ok', s.arquivo)
}

// Favicon em SVG (aba do navegador).
writeFileSync('public/icon.svg', svgAny + '\n')
console.log('ok public/icon.svg')

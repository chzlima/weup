import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json'

export default defineConfig({
  // Versão do app (package.json), mostrada no Perfil.
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  // Expõe ao app o commit que a Vercel está publicando (não é segredo), para saber qual versão está rodando.
  envPrefix: ['VITE_', 'VERCEL_GIT_COMMIT_SHA'],
  plugins: [
    react(),
    tailwindcss(),
    // PWA: deixa o app instalável no celular e guarda os arquivos para abrir rápido (e sem internet).
    VitePWA({
      // 'prompt': quando sai versão nova, o app AVISA ("Atualização disponível") e a pessoa escolhe a hora
      // de atualizar (src/components/AvisoAtualizacao.tsx). Se ignorar, ela entra quando o app for fechado.
      registerType: 'prompt',
      injectRegister: false, // o registro é feito pelo próprio app (useRegisterSW)
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'WeUp! — Evolua no seu ritmo',
        short_name: 'WeUp!',
        description: 'Tarefas, hábitos e um companheiro que evolui junto com você.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#121413',
        theme_color: '#121413',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        // Segurar o ícone do app no celular mostra estes atalhos (ver src/lib/atalhos.ts).
        shortcuts: [
          { name: 'Nova tarefa', short_name: 'Nova tarefa', url: '/?acao=nova-tarefa', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
          { name: 'Iniciar foco', short_name: 'Foco', url: '/?acao=foco', icons: [{ src: '/pwa-192.png', sizes: '192x192' }] },
        ],
        // "Compartilhar → WeUp!" em outros apps (Android, com o app instalado): vira uma tarefa nova.
        share_target: { action: '/', method: 'GET', params: { title: 'title', text: 'text', url: 'url' } },
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        // Recebe as notificações push dos lembretes (public/push-sw.js).
        importScripts: ['push-sw.js'],
        // A fonte (Nunito) vem do Google Fonts: guarda uma cópia para funcionar offline.
        // Os dados do Supabase NÃO são guardados: sempre vêm frescos do servidor.
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'fontes',
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})

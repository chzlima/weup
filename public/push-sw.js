// WeUp! · Notificações push (carregado pelo service worker gerado pelo vite-plugin-pwa: ver vite.config.ts).
// O servidor (supabase/functions/enviar-lembretes) manda { titulo, detalhe, tag }. A "tag" é a mesma chave
// do aviso na tela Hoje: se o mesmo lembrete chegar pelos dois caminhos, o aparelho mostra um só.

self.addEventListener('push', (evento) => {
  let dados = {}
  try {
    dados = evento.data ? evento.data.json() : {}
  } catch {
    dados = { titulo: 'WeUp!', detalhe: evento.data ? evento.data.text() : '' }
  }
  evento.waitUntil(
    self.registration.showNotification(dados.titulo || 'WeUp!', {
      body: dados.detalhe || '',
      tag: dados.tag,
      icon: '/pwa-192.png',
      badge: '/pwa-192.png',
    }),
  )
})

// Tocar no aviso abre o app (ou traz para a frente se já estiver aberto).
self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  evento.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((janelas) => {
      for (const j of janelas) if ('focus' in j) return j.focus()
      return self.clients.openWindow('/')
    }),
  )
})

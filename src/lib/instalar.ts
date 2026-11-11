import { useEffect, useState } from 'react'

// Instalação do app (PWA).
// Android/Chrome: o navegador avisa que dá para instalar (evento "beforeinstallprompt") e o app mostra um botão.
// iPhone: a Apple não deixa o app pedir; a pessoa usa Compartilhar → "Adicionar à Tela de Início".

type PedidoInstalacao = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let pedido: PedidoInstalacao | null = null
const ouvintes = new Set<() => void>()
const avisar = () => ouvintes.forEach((f) => f())

// Escuta desde o carregamento do app (o evento pode chegar antes da tela Perfil abrir).
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  pedido = e as PedidoInstalacao
  avisar()
})
window.addEventListener('appinstalled', () => {
  pedido = null
  avisar()
})

export const rodandoComoApp = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true

export const ehIphone = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

export function useInstalacao() {
  const [, forcar] = useState(0)
  useEffect(() => {
    const f = () => forcar((n) => n + 1)
    ouvintes.add(f)
    return () => {
      ouvintes.delete(f)
    }
  }, [])

  return {
    instalado: rodandoComoApp(),
    podeInstalar: !!pedido,
    iphone: ehIphone(),
    instalar: async () => {
      if (!pedido) return
      await pedido.prompt()
      await pedido.userChoice
      pedido = null
      avisar()
    },
  }
}

// Está com internet?
export function useOnline() {
  const [online, setOnline] = useState(navigator.onLine)
  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])
  return online
}

import { supabase } from './supabase'
import { checar } from './tarefas'

// Lembretes com o app fechado (web push). O aparelho se inscreve aqui; quem envia é o servidor
// (supabase/functions/enviar-lembretes, chamado a cada minuto). Ver supabase/ciclo27-push.sql.

// Chave PÚBLICA das notificações (VAPID), gerada pelo servidor. A privada nunca sai do servidor.
async function chavePublica() {
  const r = await supabase.rpc('chave_publica_push')
  const chave = checar<string | null>(r)
  if (!chave) throw new Error('As notificações ainda estão sendo preparadas no servidor. Tente de novo em 1 minuto.')
  return chave
}

export const pushSuportado = () =>
  typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

function chaveEmBytes(base64url: string) {
  const base64 = (base64url + '='.repeat((4 - (base64url.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/')
  return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0))
}

async function registro() {
  return (await navigator.serviceWorker.getRegistration()) ?? null
}

// Este aparelho já está inscrito?
export async function inscritoNesteAparelho() {
  if (!pushSuportado()) return false
  const reg = await registro()
  return !!(await reg?.pushManager.getSubscription())
}

// Inscreve este aparelho e guarda a inscrição na conta. Pede a permissão se ainda não tiver.
export async function ligarPush() {
  if (!pushSuportado()) throw new Error('Este navegador não recebe avisos com o app fechado.')
  if ((await Notification.requestPermission()) !== 'granted') throw new Error('Os avisos não foram permitidos.')
  const reg = await registro()
  if (!reg) throw new Error('Abra o app instalado (ou recarregue a página) e tente de novo.')
  const inscricao =
    (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chaveEmBytes(await chavePublica()) }))
  const json = inscricao.toJSON()
  checar(
    await supabase
      .from('push_subscriptions')
      .upsert({ endpoint: json.endpoint, p256dh: json.keys?.p256dh, auth: json.keys?.auth }, { onConflict: 'endpoint' }),
  )
}

// Cancela a inscrição deste aparelho (os outros aparelhos continuam recebendo).
export async function desligarPush() {
  const reg = pushSuportado() ? await registro() : null
  const inscricao = await reg?.pushManager.getSubscription()
  if (!inscricao) return
  checar(await supabase.from('push_subscriptions').delete().eq('endpoint', inscricao.endpoint))
  await inscricao.unsubscribe()
}

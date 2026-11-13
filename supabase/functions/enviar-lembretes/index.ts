// WeUp! · Função "enviar-lembretes" (Supabase Edge Function)
// Chamada a cada minuto pelo agendamento (supabase/ciclo27-push.sql). Pega os lembretes que acabaram de chegar,
// anota cada um em push_enviados (para nunca mandar duas vezes) e envia para os aparelhos inscritos da pessoa.
//
// Segredos (Supabase → Edge Functions → Secrets), colados à mão no painel, nunca no código:
//   VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY
// SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY já vêm prontos no ambiente da função.

import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2.45.4'

type Devido = { user_id: string; chave: string; titulo: string; detalhe: string }
type Inscricao = { id: string; endpoint: string; p256dh: string; auth: string }

Deno.serve(async () => {
  const publica = Deno.env.get('VAPID_PUBLIC_KEY')
  const privada = Deno.env.get('VAPID_PRIVATE_KEY')
  if (!publica || !privada) return Response.json({ erro: 'Faltam as chaves VAPID nos segredos da função.' }, { status: 500 })
  webpush.setVapidDetails('https://weup-rose.vercel.app', publica, privada)

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  })

  const { data: devidos, error } = await db.rpc('lembretes_devidos')
  if (error) return Response.json({ erro: error.message }, { status: 500 })

  let enviados = 0
  for (const l of (devidos ?? []) as Devido[]) {
    // Anota antes de enviar: se outra chamada chegar junto, só uma consegue anotar e só ela envia.
    const anotou = await db.from('push_enviados').insert({ chave: l.chave, user_id: l.user_id }).select('chave')
    if (anotou.error || !anotou.data?.length) continue

    const { data: inscricoes } = await db.from('push_subscriptions').select('id, endpoint, p256dh, auth').eq('user_id', l.user_id)
    const corpo = JSON.stringify({ titulo: l.titulo, detalhe: l.detalhe, tag: l.chave })
    for (const i of (inscricoes ?? []) as Inscricao[]) {
      try {
        await webpush.sendNotification({ endpoint: i.endpoint, keys: { p256dh: i.p256dh, auth: i.auth } }, corpo, { TTL: 900 })
        enviados++
      } catch (e) {
        // 404/410: o aparelho cancelou a inscrição (desinstalou, limpou dados). Remove para não tentar de novo.
        const status = (e as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) await db.from('push_subscriptions').delete().eq('id', i.id)
      }
    }
  }

  // Limpeza: o registro de envios só precisa dos últimos 2 dias.
  await db.from('push_enviados').delete().lt('enviado_em', new Date(Date.now() - 2 * 86_400_000).toISOString())

  return Response.json({ devidos: devidos?.length ?? 0, enviados })
})

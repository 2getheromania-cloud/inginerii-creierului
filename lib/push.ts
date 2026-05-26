import webPush from 'web-push'
import { createClient } from '@supabase/supabase-js'

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY ?? 'BLl6oLlrGS4a_uKuda93fWYdLgKB6PvKjNLZd1pTfjLBM2eksPM6631gxAPvVD3vOU_5rIr2uY6oJ7VaJlLjaVQ'
const VAPID_SUBJECT = 'mailto:2getheromania@gmail.com'

function initVapid() {
  const privateKey = process.env.VAPID_PRIVATE_KEY
  if (!privateKey) throw new Error('VAPID_PRIVATE_KEY env var is not set')
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, privateKey)
}

export async function sendPushToUser(
  recipientId: string,
  payload: { title: string; body: string; url?: string },
) {
  const { data: subs } = await service()
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', recipientId)

  if (!subs?.length) return

  // Count total unread messages for badge number
  const { count: unread } = await service()
    .from('private_messages')
    .select('id', { count: 'exact', head: true })
    .eq('read', false)
    .neq('sender_id', recipientId)

  const badge = (unread ?? 0) > 0 ? unread! : 1

  initVapid()
  const json = JSON.stringify({ ...payload, badge })

  const results = await Promise.allSettled(
    subs.map(sub =>
      webPush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        json,
      )
    ),
  )

  for (let i = 0; i < results.length; i++) {
    const r = results[i]
    if (r.status === 'rejected') {
      const err = r.reason as { statusCode?: number; message?: string }
      if (err.statusCode === 410 || err.statusCode === 403) {
        // 410 = expired, 403 = wrong VAPID key — both mean subscription is invalid
        await service().from('push_subscriptions').delete().eq('endpoint', subs[i].endpoint)
      } else {
        throw new Error(`Push failed: ${err.statusCode} ${err.message}`)
      }
    }
  }
}

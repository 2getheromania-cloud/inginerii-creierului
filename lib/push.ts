import webPush from 'web-push'
import { createClient } from '@supabase/supabase-js'

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// Public key and subject are not secrets — safe to hardcode
const VAPID_PUBLIC_KEY = 'BKy69Ol32MtmlhW3KyuedEAunYX28zlyqpHiWgRKuNjsih1yb9pOwUpYrIpCX4YkIYWdzSqxdECe2d4kMEwKl8A'
const VAPID_SUBJECT = 'mailto:2getheromania@gmail.com'

function initVapid() {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY!)
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
      if (err.statusCode === 410) {
        await service().from('push_subscriptions').delete().eq('endpoint', subs[i].endpoint)
      } else {
        throw new Error(`Push failed: ${err.statusCode} ${err.message}`)
      }
    }
  }
}

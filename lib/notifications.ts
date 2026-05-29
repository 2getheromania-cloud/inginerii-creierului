import { createClient } from '@supabase/supabase-js'
import { sendPrivateChatNotification } from '@/lib/email/resend'

function service() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

const INACTIVE_MS = 5 * 60 * 1000   // 5 minutes — below this, user is considered active
const DEBOUNCE_MIN = 30              // minutes between emails per conversation/recipient

export async function maybeNotifyPrivateMessage(
  conversationId: string,
  recipientId: string,
  senderName: string,
  preview: string,
) {
  const db = service()

  // Fetch recipient presence + contact info in one query
  const { data: recipient } = await db
    .from('profiles')
    .select('email, name, last_seen_at')
    .eq('id', recipientId)
    .single()
  if (!recipient) return

  // Skip if recipient was active in the last 5 minutes
  const lastSeen = recipient.last_seen_at ? new Date(recipient.last_seen_at).getTime() : 0
  if (Date.now() - lastSeen < INACTIVE_MS) return

  // Skip if recipient has an active push subscription (push handles it)
  const { count: pushCount } = await db
    .from('push_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', recipientId)
  if (pushCount && pushCount > 0) return

  // Skip if no unread messages from others exist in the conversation
  const { count } = await db
    .from('private_messages')
    .select('id', { count: 'exact', head: true })
    .eq('conversation_id', conversationId)
    .eq('read', false)
    .neq('sender_id', recipientId)
  if (!count) return

  // Debounce: skip if an email was already sent for this conversation in the last 30 min
  const debounceThreshold = new Date(Date.now() - DEBOUNCE_MIN * 60 * 1000).toISOString()
  const { data: recent } = await db
    .from('private_notification_log')
    .select('id')
    .eq('conversation_id', conversationId)
    .eq('recipient_id', recipientId)
    .gte('sent_at', debounceThreshold)
    .maybeSingle()
  if (recent) return

  // All checks passed — send email and log it
  await sendPrivateChatNotification(recipient.email, recipient.name, senderName, preview)
  await db.from('private_notification_log').insert({
    conversation_id: conversationId,
    recipient_id: recipientId,
    sent_at: new Date().toISOString(),
  })
}

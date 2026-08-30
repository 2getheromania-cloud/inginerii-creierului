import { createClient } from '@supabase/supabase-js'

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

/**
 * Tabelele care referă utilizatorul, în ordinea dependențelor.
 * Le curățăm explicit cu service role înainte de auth.admin.deleteUser(),
 * ca ștergerea să meargă chiar dacă o cheie străină nu are ON DELETE CASCADE
 * (cauza erorii „Database error deleting user”).
 */
const USER_TABLES: { table: string; column: string }[] = [
  { table: 'private_message_reactions', column: 'user_id' },
  { table: 'group_chat_reactions',      column: 'user_id' },
  { table: 'private_notification_log',  column: 'user_id' },
  { table: 'private_messages',          column: 'sender_id' },
  { table: 'conversations',             column: 'user_id' },
  { table: 'group_chat_messages',       column: 'sender_id' },
  { table: 'push_subscriptions',        column: 'user_id' },
  { table: 'notifications',             column: 'user_id' },
  { table: 'documents',                 column: 'uploaded_by' },
  { table: 'documents',                 column: 'user_id' },
  { table: 'daily_reports',             column: 'user_id' },
]

/**
 * Șterge definitiv un utilizator: fișiere, rânduri dependente, profil și
 * contul de autentificare. Toate operațiile folosesc SUPABASE_SERVICE_ROLE_KEY —
 * doar service_role poate șterge din auth.users.
 *
 * Returnează un mesaj de eroare dacă ștergerea contului auth a eșuat.
 */
export async function purgeUser(userId: string): Promise<{ error?: string }> {
  const db = admin()

  // Fișierele din bucket-ul privat `documents` (cale: `${userId}/...`)
  try {
    const { data: files } = await db.storage.from('documents').list(userId)
    if (files?.length) {
      await db.storage.from('documents').remove(files.map(f => `${userId}/${f.name}`))
    }
  } catch (err) {
    console.error('[purgeUser] storage cleanup:', err)
  }

  // Rândurile dependente — tabelele inexistente sunt ignorate
  for (const { table, column } of USER_TABLES) {
    const { error } = await db.from(table).delete().eq(column, userId)
    if (error && error.code !== '42P01' && error.code !== '42703') {
      console.error(`[purgeUser] ${table}.${column}:`, error.message)
    }
  }

  const { error: profileErr } = await db.from('profiles').delete().eq('id', userId)
  if (profileErr) console.error('[purgeUser] profiles:', profileErr.message)

  const { error: authErr } = await db.auth.admin.deleteUser(userId)
  if (authErr) {
    console.error('[purgeUser] auth delete:', authErr.message)
    return {
      error:
        `Auth delete: ${authErr.message}. ` +
        'Rulează migrația supabase/migrations/20260830_active_and_delete_fix.sql ' +
        '(setează ON DELETE CASCADE pe cheile străine spre auth.users).',
    }
  }

  return {}
}

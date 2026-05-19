import { Resend } from 'resend'

const FROM = 'Inginerii Creierului <noreply@ingineriicreierului.ro>'

function client() {
  return new Resend(process.env.RESEND_API_KEY)
}

function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL ?? 'https://app.ingineriicreierului.ro'
}

export async function sendMagicLinkEmail(email: string, link: string) {
  return client().emails.send({
    from: FROM,
    to: email,
    subject: 'Intră în contul tău — Inginerii Creierului',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#166534">Bun venit înapoi!</h2>
        <p>Click pe butonul de mai jos pentru a te autentifica:</p>
        <a href="${link}" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Autentifică-te
        </a>
        <p style="color:#6b7280;font-size:13px">Link-ul expiră în 1 oră. Dacă nu ai solicitat acest link, ignoră acest email.</p>
      </div>`,
  })
}

export async function sendDailyReminder(email: string, name: string) {
  return client().emails.send({
    from: FROM,
    to: email,
    subject: '⏰ Reminder: completează raportul de azi',
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#166534">Salut, ${name || 'cursant'}!</h2>
        <p>Nu ai completat încă raportul zilnic de astăzi. Acordă 2 minute pentru a-ți monitoriza progresul.</p>
        <a href="${appUrl()}/dashboard" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Completează raportul
        </a>
      </div>`,
  })
}

export async function sendWeeklySummary(
  email: string,
  name: string,
  week: number,
  avgSliders: Record<string, number>,
  completedDays: number
) {
  const sliderRows = Object.entries(avgSliders)
    .map(([k, v]) => `<tr><td style="padding:4px 8px">${k}</td><td style="padding:4px 8px;font-weight:600">${v.toFixed(1)}/10</td></tr>`)
    .join('')

  return client().emails.send({
    from: FROM,
    to: email,
    subject: `📊 Rezumat săptămâna ${week} — Inginerii Creierului`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#166534">Rezumat săptămâna ${week}</h2>
        <p>Salut, ${name || 'cursant'}! Iată cum a decurs săptămâna ta:</p>
        <p><strong>Zile raportate:</strong> ${completedDays}/7</p>
        <h3>Medii indicatori</h3>
        <table style="border-collapse:collapse;width:100%">${sliderRows}</table>
        <a href="${appUrl()}/istoric" style="display:inline-block;background:#16a34a;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Vezi istoricul complet
        </a>
      </div>`,
  })
}

export async function sendInactivityAlert(
  adminEmail: string,
  cursantName: string,
  cursantEmail: string,
  daysMissed: number
) {
  return client().emails.send({
    from: FROM,
    to: adminEmail,
    subject: `⚠️ Inactivitate: ${cursantName || cursantEmail} (${daysMissed} zile)`,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <h2 style="color:#dc2626">Alertă inactivitate</h2>
        <p><strong>${cursantName || cursantEmail}</strong> nu a raportat în ultimele <strong>${daysMissed} zile</strong>.</p>
        <p>Email: ${cursantEmail}</p>
        <a href="${appUrl()}/admin" style="display:inline-block;background:#dc2626;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">
          Vezi în admin
        </a>
      </div>`,
  })
}

export async function sendManualNotification(email: string, subject: string, message: string) {
  return client().emails.send({
    from: FROM,
    to: email,
    subject,
    html: `
      <div style="font-family:Inter,sans-serif;max-width:480px;margin:0 auto;padding:32px">
        <div style="white-space:pre-wrap">${message.replace(/\n/g, '<br>')}</div>
        <hr style="margin:24px 0;border-color:#e5e7eb">
        <p style="color:#6b7280;font-size:13px">— Echipa Inginerii Creierului</p>
      </div>`,
  })
}

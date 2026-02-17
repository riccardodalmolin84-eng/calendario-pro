import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

interface Booking {
  id: string
  user_name: string
  user_surname: string
  user_email: string
  user_phone: string
  start_time: string
  end_time: string
  events: {
    title: string
    location: string
    duration_minutes: number
  }
}

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!)

    // Get today's date in Italy timezone (UTC+1)
    // We calculate the current time in Italy by adding 1 hour to UTC (Winter time)
    const now = new Date()
    const italyOffset = 1 * 60 * 60 * 1000 // 1 hour in ms
    const todayItaly = new Date(now.getTime() + italyOffset)

    todayItaly.setUTCHours(0, 0, 0, 0)
    const startOfToday = new Date(todayItaly.getTime() - italyOffset) // Convert back to UTC for query

    const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)

    console.log('Querying for Italy Today:', startOfToday.toISOString(), 'to', endOfToday.toISOString())

    // Fetch today's bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('*, events(title, location, duration_minutes)')
      .gte('start_time', startOfToday.toISOString())
      .lt('start_time', endOfToday.toISOString())
      .order('start_time', { ascending: true })

    if (bookingsError) throw bookingsError

    // If no bookings, exit early
    if (!bookings || bookings.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No bookings for today' }),
        { headers: { 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Fetch admin email
    const { data: adminProfile } = await supabase
      .from('admin_profiles')
      .select('email')
      .single()

    if (!adminProfile?.email) {
      throw new Error('Admin email not configured')
    }

    // Send admin summary email
    await sendAdminSummary(adminProfile.email, bookings as Booking[], todayItaly)

    // Send customer reminder emails
    for (const booking of bookings as Booking[]) {
      if (booking.user_email) {
        await sendCustomerReminder(booking)
      }
    }

    return new Response(
      JSON.stringify({
        message: 'Emails sent successfully',
        bookingsCount: bookings.length
      }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})

async function sendAdminSummary(adminEmail: string, bookings: Booking[], todayItaly: Date) {
  const bookingsList = bookings.map(b => {
    const startTime = new Date(b.start_time)
    const timeStr = startTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    return `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 8px; font-weight: 600;">${timeStr}</td>
        <td style="padding: 12px 8px;">${b.user_name} ${b.user_surname}</td>
        <td style="padding: 12px 8px;">${b.events.title}</td>
        <td style="padding: 12px 8px;">${b.user_phone}</td>
        <td style="padding: 12px 8px;">${b.user_email || '-'}</td>
      </tr>
    `
  }).join('')

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Appuntamenti di Oggi</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 800px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">📅 Appuntamenti di Oggi</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 16px;">${todayItaly.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Europe/Rome' })}</p>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 24px;">Hai <strong>${bookings.length}</strong> appuntament${bookings.length === 1 ? 'o' : 'i'} programmati per oggi:</p>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <thead>
              <tr style="background: #f8f9fa; border-bottom: 2px solid #6366f1;">
                <th style="padding: 12px 8px; text-align: left; font-weight: 700; color: #6366f1;">Ora</th>
                <th style="padding: 12px 8px; text-align: left; font-weight: 700; color: #6366f1;">Cliente</th>
                <th style="padding: 12px 8px; text-align: left; font-weight: 700; color: #6366f1;">Evento</th>
                <th style="padding: 12px 8px; text-align: left; font-weight: 700; color: #6366f1;">Telefono</th>
                <th style="padding: 12px 8px; text-align: left; font-weight: 700; color: #6366f1;">Email</th>
              </tr>
            </thead>
            <tbody>
              ${bookingsList}
            </tbody>
          </table>
        </div>
        <div style="background: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; margin: 0;">CalendarioAloe - Sistema di Gestione Appuntamenti</p>
        </div>
      </div>
    </body>
    </html>
  `

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'CalendarioAloe <onboarding@resend.dev>',
      to: [adminEmail],
      subject: `📅 ${bookings.length} Appuntament${bookings.length === 1 ? 'o' : 'i'} Oggi - ${todayItaly.toLocaleDateString('it-IT', { timeZone: 'Europe/Rome' })}`,
      html
    })
  })
}

async function sendCustomerReminder(booking: Booking) {
  const startTime = new Date(booking.start_time)
  const timeStr = startTime.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
  const dateStr = startTime.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })

  // Generate .ics calendar file
  const icsContent = generateICS(booking)

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Promemoria Appuntamento</title>
    </head>
    <body style="font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 32px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: 800;">🌿 Promemoria Appuntamento</h1>
        </div>
        <div style="padding: 32px;">
          <p style="font-size: 16px; color: #333; margin-bottom: 24px;">Ciao <strong>${booking.user_name}</strong>,</p>
          <p style="font-size: 16px; color: #333; margin-bottom: 24px;">Questo è un promemoria per il tuo appuntamento di oggi:</p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 8px;">
            <p style="margin: 0 0 12px 0; font-size: 14px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">Dettagli Appuntamento</p>
            <p style="margin: 8px 0; font-size: 16px; color: #333;"><strong>📅 Data:</strong> ${dateStr}</p>
            <p style="margin: 8px 0; font-size: 16px; color: #333;"><strong>🕐 Ora:</strong> ${timeStr}</p>
            <p style="margin: 8px 0; font-size: 16px; color: #333;"><strong>📍 Evento:</strong> ${booking.events.title}</p>
            ${booking.events.location ? `<p style="margin: 8px 0; font-size: 16px; color: #333;"><strong>📌 Luogo:</strong> ${booking.events.location}</p>` : ''}
            <p style="margin: 8px 0; font-size: 16px; color: #333;"><strong>⏱️ Durata:</strong> ${booking.events.duration_minutes} minuti</p>
          </div>

          <p style="font-size: 14px; color: #666; margin-top: 24px;">Ci vediamo presto!</p>
        </div>
        <div style="background: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px; margin: 0;">Aloe di Elisabetta - CalendarioAloe</p>
        </div>
      </div>
    </body>
    </html>
  `

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${RESEND_API_KEY}`
    },
    body: JSON.stringify({
      from: 'Aloe di Elisabetta <onboarding@resend.dev>',
      to: [booking.user_email],
      subject: `🌿 Promemoria: Appuntamento Oggi alle ${timeStr}`,
      html,
      attachments: [{
        filename: 'appuntamento.ics',
        content: Buffer.from(icsContent).toString('base64')
      }]
    })
  })
}

function generateICS(booking: Booking): string {
  const startTime = new Date(booking.start_time)
  const endTime = new Date(booking.end_time)

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//CalendarioAloe//IT
BEGIN:VEVENT
UID:${booking.id}@calendarioaloe.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(startTime)}
DTEND:${formatDate(endTime)}
SUMMARY:${booking.events.title}
DESCRIPTION:Appuntamento con ${booking.user_name} ${booking.user_surname}
LOCATION:${booking.events.location || ''}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`
}

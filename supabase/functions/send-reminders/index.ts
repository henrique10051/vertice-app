import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'
import { corsHeaders } from '../_shared/cors.ts'

const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') || 'mailto:suporte@vertice.app'

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY)

type PushSubscription = { id: string; endpoint: string; p256dh: string; auth: string }

async function sendToUser(
  serviceClient: ReturnType<typeof createClient>,
  userId: string,
  title: string,
  body: string,
  url: string,
) {
  const { data: subs } = await serviceClient
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  for (const sub of (subs || []) as PushSubscription[]) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({ title, body, url }),
      )
    } catch (err) {
      const status = (err as { statusCode?: number }).statusCode
      if (status === 404 || status === 410) {
        await serviceClient.from('push_subscriptions').delete().eq('id', sub.id)
      }
    }
  }
}

async function claimReminder(
  serviceClient: ReturnType<typeof createClient>,
  sourceType: 'habit' | 'agenda_task',
  sourceId: string,
) {
  const { data, error } = await serviceClient
    .from('reminder_logs')
    .insert({ source_type: sourceType, source_id: sourceId })
    .select()
  return !error && !!data?.length
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    const now = new Date()
    let sent = 0

    // Agenda tasks: due_date is a full timestamptz, compare directly against now().
    const windowStart = new Date(now.getTime() - 2.5 * 60 * 1000).toISOString()
    const windowEnd = new Date(now.getTime() + 2.5 * 60 * 1000).toISOString()
    const { data: tasks } = await serviceClient
      .from('agenda_tasks')
      .select('id, user_id, title, due_date')
      .eq('status', 'pending')
      .gte('due_date', windowStart)
      .lte('due_date', windowEnd)

    for (const task of tasks || []) {
      const claimed = await claimReminder(serviceClient, 'agenda_task', task.id)
      if (!claimed) continue
      await sendToUser(
        serviceClient,
        task.user_id,
        'Tarefa agendada',
        `"${task.title}" está marcada para agora.`,
        '/agenda',
      )
      sent++
    }

    // Habits: scheduled_time is a plain TIME (no timezone), so compare it against each
    // user's local wall-clock time using their profiles.timezone.
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id, timezone')
      .not('timezone', 'is', null)

    const timezoneGroups = new Map<string, string[]>()
    for (const profile of profiles || []) {
      const tz = profile.timezone || 'America/Sao_Paulo'
      if (!timezoneGroups.has(tz)) timezoneGroups.set(tz, [])
      timezoneGroups.get(tz)!.push(profile.id)
    }

    for (const [timezone, userIds] of timezoneGroups) {
      const localTime = new Intl.DateTimeFormat('en-GB', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(now)

      const { data: habits } = await serviceClient
        .from('custom_trackers')
        .select('id, user_id, name, scheduled_time')
        .in('user_id', userIds)
        .eq('is_habit', true)
        .not('scheduled_time', 'is', null)

      for (const habit of habits || []) {
        const habitTime = (habit.scheduled_time as string).slice(0, 5)
        if (habitTime !== localTime) continue

        const { data: doneToday } = await serviceClient
          .from('custom_tracker_entries')
          .select('id')
          .eq('tracker_id', habit.id)
          .eq('date', new Date().toISOString().slice(0, 10))
          .maybeSingle()
        if (doneToday) continue

        const claimed = await claimReminder(serviceClient, 'habit', habit.id)
        if (!claimed) continue

        await sendToUser(
          serviceClient,
          habit.user_id,
          'Hora do hábito',
          `Não esqueça: "${habit.name}".`,
          '/habitos',
        )
        sent++
      }
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})

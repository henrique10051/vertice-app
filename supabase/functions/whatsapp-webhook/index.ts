import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

interface WebhookPayload {
  From?: string
  FromWhatsapp?: string
  phone?: string
  Body?: string
  message?: string
}

function normalizePhone(raw: string): string {
  return raw.replace(/[^\d]/g, '')
}

function formatWhatsAppResponse(message: string): string {
  return message
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    let payload: WebhookPayload

    const contentType = req.headers.get('Content-Type') || ''

    if (contentType.includes('application/json')) {
      payload = (await req.json()) as WebhookPayload
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const formData = await req.formData()
      payload = {
        From: (formData.get('From') as string) || undefined,
        FromWhatsapp: (formData.get('FromWhatsapp') as string) || undefined,
        phone: (formData.get('phone') as string) || undefined,
        Body: (formData.get('Body') as string) || undefined,
        message: (formData.get('message') as string) || undefined,
      }
    } else {
      payload = (await req.json()) as WebhookPayload
    }

    const rawPhone = payload.From || payload.FromWhatsapp || payload.phone || ''
    const phone = normalizePhone(rawPhone)
    const messageBody = (payload.Body || payload.message || '').trim()

    if (!phone) {
      return new Response(
        JSON.stringify({ success: false, message: 'Telefone do remetente não fornecido.' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const { data: profile, error: profileError } = await serviceClient
      .from('profiles')
      .select('id, phone_number, is_premium')
      .ilike('phone_number', `%${phone}%`)
      .maybeSingle()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({
          success: false,
          message: formatWhatsAppResponse(
            'Seu número não está vinculado a uma conta. Acesse seu perfil no app para vincular seu WhatsApp.',
          ),
        }),
        { status: 404, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    if (!profile.is_premium) {
      return new Response(
        JSON.stringify({
          success: false,
          message: formatWhatsAppResponse(
            'Você precisa do plano Premium para usar a integração via WhatsApp. Faça upgrade no app!',
          ),
        }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const userId = profile.id
    const today = new Date().toISOString().split('T')[0]
    const lowerMsg = messageBody.toLowerCase().trim()

    if (
      lowerMsg.startsWith('done ') ||
      lowerMsg.startsWith('feito ') ||
      lowerMsg.startsWith('concluir ')
    ) {
      const habitName = messageBody.replace(/^(done|feito|concluir)\s+/i, '').trim()

      if (!habitName) {
        return new Response(
          JSON.stringify({
            success: false,
            message: formatWhatsAppResponse(
              'Qual hábito você quer concluir? Ex: "Done Beber Água"',
            ),
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        )
      }

      const { data: habits } = await serviceClient
        .from('habits')
        .select('id, title')
        .eq('user_id', userId)
        .ilike('title', `%${habitName}%`)

      if (!habits || habits.length === 0) {
        return new Response(
          JSON.stringify({
            success: false,
            message: formatWhatsAppResponse(
              `Hábito "${habitName}" não encontrado. Verifique o nome e tente novamente.`,
            ),
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        )
      }

      const habit = habits[0]

      const { data: existingLog } = await serviceClient
        .from('habit_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('habit_id', habit.id)
        .eq('date', today)
        .maybeSingle()

      if (existingLog) {
        return new Response(
          JSON.stringify({
            success: true,
            message: formatWhatsAppResponse(`O hábito "${habit.title}" já foi concluído hoje! 💪`),
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        )
      }

      const { error: logError } = await serviceClient.from('habit_logs').insert({
        user_id: userId,
        habit_id: habit.id,
        date: today,
        completed_at: new Date().toISOString(),
      })

      if (logError) {
        return new Response(
          JSON.stringify({
            success: false,
            message: formatWhatsAppResponse('Erro ao registrar o hábito. Tente novamente.'),
          }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        )
      }

      await serviceClient.from('habits').update({ is_completed: true }).eq('id', habit.id)

      return new Response(
        JSON.stringify({
          success: true,
          message: formatWhatsAppResponse(
            `Hábito "${habit.title}" concluído com sucesso! 🎉 Continue assim!`,
          ),
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    if (
      lowerMsg.startsWith('new habit ') ||
      lowerMsg.startsWith('novo hábito ') ||
      lowerMsg.startsWith('novo habito ')
    ) {
      const habitName = messageBody.replace(/^(new habit|novo hábito|novo habito)\s+/i, '').trim()

      if (!habitName) {
        return new Response(
          JSON.stringify({
            success: false,
            message: formatWhatsAppResponse(
              'Qual é o nome do novo hábito? Ex: "New Habit Ler 10 páginas"',
            ),
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        )
      }

      const { error: insertError } = await serviceClient.from('habits').insert({
        user_id: userId,
        title: habitName,
        description: 'Criado via WhatsApp',
        frequency: 'daily',
        is_completed: false,
      })

      if (insertError) {
        return new Response(
          JSON.stringify({
            success: false,
            message: formatWhatsAppResponse('Erro ao criar o hábito. Tente novamente.'),
          }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: formatWhatsAppResponse(
            `Hábito "${habitName}" criado com sucesso! 🌱 Você já pode começar a rastreá-lo.`,
          ),
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    if (lowerMsg === 'help' || lowerMsg === 'ajuda') {
      return new Response(
        JSON.stringify({
          success: true,
          message: formatWhatsAppResponse(
            '🤖 Comandos disponíveis:\n\n' +
              '✅ "Done [nome do hábito]" — Marca um hábito como concluído hoje\n' +
              '➕ "New Habit [nome]" — Cria um novo hábito\n' +
              '❓ "Help" — Mostra esta mensagem',
          ),
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        message: formatWhatsAppResponse(
          'Comando não reconhecido. Envie "Help" para ver os comandos disponíveis.',
        ),
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'Erro interno do servidor.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})

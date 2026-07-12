import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const INTENT_SYSTEM_PROMPT = `You are an intent extraction assistant. Analyze the user's voice command in Portuguese and extract the intent. Return ONLY a valid JSON object (no markdown) with this exact schema:
{
  "action": "complete_habit" | "add_expense" | "unknown",
  "habit_title": string,
  "amount": number,
  "category": string
}

Rules:
- For "Concluir hábito [nome]" or "Marcar [nome] como feito" -> action="complete_habit", habit_title=[nome]
- For "Gastei [valor] com [categoria]" or "Despesa de [valor] em [categoria]" -> action="add_expense", amount=[valor], category=[categoria]
- Map categories to: Moradia, Alimentação, Transporte, Educação/Crescimento, Renda, Outros
- Anything else -> action="unknown", all fields empty/zero
- Extract the habit title as a fuzzy match (partial name is OK)
- Return ONLY JSON, no other text`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ success: false, message: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ success: false, message: 'Usuário não encontrado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const formData = await req.formData()
    const audioFile = formData.get('audio') as File
    if (!audioFile) {
      return new Response(JSON.stringify({ success: false, message: 'Áudio não fornecido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ success: false, message: 'OPENAI_API_KEY não configurada no servidor' }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const whisperFormData = new FormData()
    whisperFormData.append('file', audioFile, 'voice.webm')
    whisperFormData.append('model', 'whisper-1')
    whisperFormData.append('language', 'pt')

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${openaiApiKey}` },
      body: whisperFormData,
    })

    if (!whisperResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, message: 'Erro na transcrição de áudio' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const { text: transcription } = await whisperResponse.json()

    const intentResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: INTENT_SYSTEM_PROMPT },
          { role: 'user', content: transcription },
        ],
        temperature: 0,
      }),
    })

    if (!intentResponse.ok) {
      return new Response(
        JSON.stringify({ success: false, message: 'Erro ao extrair intenção', transcription }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    const intentData = await intentResponse.json()
    const intentText = intentData.choices?.[0]?.message?.content ?? '{}'
    let intent: { action: string; habit_title: string; amount: number; category: string }

    try {
      intent = JSON.parse(intentText)
    } catch {
      intent = { action: 'unknown', habit_title: '', amount: 0, category: '' }
    }

    const serviceClient = createClient(supabaseUrl, serviceRoleKey)

    if (intent.action === 'complete_habit' && intent.habit_title) {
      const { data: habits } = await serviceClient
        .from('habits')
        .select('id, title')
        .eq('user_id', user.id)
        .ilike('title', `%${intent.habit_title}%`)

      if (habits && habits.length > 0) {
        await serviceClient.from('habits').update({ is_completed: true }).eq('id', habits[0].id)

        return new Response(
          JSON.stringify({
            success: true,
            action: 'complete_habit',
            message: `Hábito "${habits[0].title}" concluído com sucesso!`,
            transcription,
          }),
          { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        )
      }

      return new Response(
        JSON.stringify({
          success: false,
          message: `Hábito "${intent.habit_title}" não encontrado.`,
          transcription,
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    if (intent.action === 'add_expense' && intent.amount > 0) {
      const { error: insertError } = await serviceClient.from('transactions').insert({
        user_id: user.id,
        type: 'expense',
        amount: intent.amount,
        category: intent.category || 'Outros',
        description: transcription,
        date: new Date().toISOString().split('T')[0],
      })

      if (insertError) {
        return new Response(
          JSON.stringify({ success: false, message: 'Erro ao registrar despesa.', transcription }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } },
        )
      }

      return new Response(
        JSON.stringify({
          success: true,
          action: 'add_expense',
          message: `Despesa de R$ ${intent.amount.toFixed(2)} em ${intent.category || 'Outros'} registrada!`,
          transcription,
        }),
        { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
      )
    }

    return new Response(
      JSON.stringify({
        success: false,
        message:
          'Comando não reconhecido. Diga: "Concluir hábito [nome]" ou "Gastei [valor] com [categoria]".',
        transcription,
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } },
    )
  } catch {
    return new Response(JSON.stringify({ success: false, message: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})

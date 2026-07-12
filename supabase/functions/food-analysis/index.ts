import 'jsr:@supabase/functions-js/edge-runtime.d.ts'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

const SYSTEM_PROMPT_PHOTO = `You are a nutrition AI assistant. Analyze the food in the image and estimate the calorie content. Return ONLY a valid JSON object (no markdown, no extra text) with this exact schema:
{
  "estimated_calories": number,
  "food_description": string
}
Respond in Portuguese. Be specific with the food description (e.g., "1 fatia de pizza de calabresa").`

const SYSTEM_PROMPT_TEXT = `You are a nutrition AI assistant. Estimate the calorie content for the described food. Return ONLY a valid JSON object (no markdown, no extra text) with this exact schema:
{
  "estimated_calories": number,
  "food_description": string
}
Respond in Portuguese. Be specific with the food description. Estimate based on standard portion sizes.`

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
    } = await userClient.auth.getUser()
    if (!user) {
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    if (!openaiApiKey) {
      return new Response(JSON.stringify({ error: 'OPENAI_API_KEY não configurada' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const { imageUrl, text } = await req.json()

    let messages: any[]

    if (imageUrl) {
      messages = [
        { role: 'system', content: SYSTEM_PROMPT_PHOTO },
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Analise esta refeição e estime as calorias.' },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ]
    } else if (text) {
      messages = [
        { role: 'system', content: SYSTEM_PROMPT_TEXT },
        { role: 'user', content: text },
      ]
    } else {
      return new Response(JSON.stringify({ error: 'Forneça imageUrl ou text' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3,
        max_tokens: 300,
      }),
    })

    if (!aiResponse.ok) {
      return new Response(JSON.stringify({ error: 'Falha na análise de IA' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      })
    }

    const aiData = await aiResponse.json()
    const content = aiData.choices?.[0]?.message?.content ?? '{}'

    let result: { estimated_calories: number; food_description: string }
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      result = jsonMatch
        ? JSON.parse(jsonMatch[0])
        : { estimated_calories: 0, food_description: 'Não identificado' }
    } catch {
      result = { estimated_calories: 0, food_description: 'Não identificado' }
    }

    return new Response(JSON.stringify(result), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  } catch {
    return new Response(JSON.stringify({ error: 'Erro interno do servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    })
  }
})

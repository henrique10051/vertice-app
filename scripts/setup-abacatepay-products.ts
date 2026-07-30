// One-time setup: creates the AbacatePay products backing each paid plan.
// Run once per environment (sandbox and production use different API keys):
//   ABACATEPAY_API_KEY=xxx deno run --allow-net --allow-env scripts/setup-abacatepay-products.ts
// Copy the printed product ids into the ABACATEPAY_PRODUCT_PRO / ABACATEPAY_PRODUCT_PREMIUM
// secrets used by the abacatepay-checkout edge function.

const apiKey = Deno.env.get('ABACATEPAY_API_KEY')
if (!apiKey) {
  console.error('Missing ABACATEPAY_API_KEY')
  Deno.exit(1)
}

const plans = [
  { externalId: 'vertice-pro-mensal', name: 'Vértice Pro', price: 1990 },
  { externalId: 'vertice-premium-mensal', name: 'Vértice Premium', price: 3990 },
]

for (const plan of plans) {
  const res = await fetch('https://api.abacatepay.com/v2/products/create', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      externalId: plan.externalId,
      name: plan.name,
      price: plan.price,
      currency: 'BRL',
      cycle: 'MONTHLY',
    }),
  })
  const result = await res.json()
  if (!res.ok || !result.success) {
    console.error(`Failed to create ${plan.externalId}:`, result.error ?? (await res.text()))
    continue
  }
  console.log(`${plan.externalId} -> ${result.data.id}`)
}

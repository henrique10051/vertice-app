export function formatBRL(n: number, opts?: Intl.NumberFormatOptions) {
  return n.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
    ...opts,
  })
}

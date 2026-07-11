export function getTodayStr(): string {
  return new Date().toISOString().split('T')[0]
}

export function formatDatePT(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  return `${day}/${month}/${year}`
}

export function getLastNDays(n: number): string[] {
  return Array.from({ length: n })
    .map((_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - i)
      return d.toISOString().split('T')[0]
    })
    .reverse()
}

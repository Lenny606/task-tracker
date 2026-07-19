/**
 * Czech pluralization: czechPlural(1, 'úkol', 'úkoly', 'úkolů') → 'úkol'
 * one: 1, few: 2–4, many: 0 and 5+
 */
export function czechPlural(count: number, one: string, few: string, many: string): string {
  const n = Math.abs(count)
  if (n === 1) return one
  if (n >= 2 && n <= 4) return few
  return many
}

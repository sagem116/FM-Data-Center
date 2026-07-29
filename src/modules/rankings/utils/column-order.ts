export function mergeColumnOrder(saved: string[] | undefined, available: string[]): string[] {
  const availableSet = new Set(available)
  const retained = (saved ?? []).filter((key, index, list) => availableSet.has(key) && list.indexOf(key) === index)
  const missing = available.filter((key) => !retained.includes(key))
  return [...retained, ...missing]
}

export function moveColumn(order: string[], source: string, target: string): string[] {
  if (source === target || !order.includes(source) || !order.includes(target)) return order
  const next = order.filter((key) => key !== source)
  const targetIndex = next.indexOf(target)
  next.splice(targetIndex, 0, source)
  return next
}

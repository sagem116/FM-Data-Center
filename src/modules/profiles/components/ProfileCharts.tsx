import type { EvolutionSeries } from '../types'

function format(value: number, unit: EvolutionSeries['unit']): string {
  if (unit === 'money') return new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR', notation: 'compact', maximumFractionDigits: 1 }).format(value)
  if (unit === 'percent') return `${value.toLocaleString('pt-PT', { maximumFractionDigits: 1 })}%`
  return value.toLocaleString('pt-PT', { maximumFractionDigits: unit === 'rating' ? 1 : 2 })
}

export function ProfileLineChart({ series }: { series: EvolutionSeries }) {
  const points = series.points.filter((point): point is typeof point & { value: number } => typeof point.value === 'number' && Number.isFinite(point.value))
  if (!points.length) return <div className="profile-chart-empty">Sem valores reconhecidos</div>
  const width = 520, height = 190, padX = 32, padY = 24
  const values = points.map((point) => point.value)
  const min = Math.min(...values), max = Math.max(...values)
  const span = max - min || Math.max(Math.abs(max) * .1, 1)
  const coords = points.map((point, index) => {
    const x = points.length === 1 ? width / 2 : padX + index * (width - padX * 2) / (points.length - 1)
    const y = height - padY - ((point.value - min) / span) * (height - padY * 2)
    return { ...point, x, y }
  })
  const line = coords.map((point) => `${point.x},${point.y}`).join(' ')
  const area = `${padX},${height - padY} ${line} ${coords.at(-1)?.x ?? width - padX},${height - padY}`
  return <div className="profile-chart-wrap">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`Evolução de ${series.label}`}>
      <line x1={padX} x2={width - padX} y1={height - padY} y2={height - padY} className="profile-chart-axis" />
      <polygon points={area} className="profile-chart-area" />
      <polyline points={line} className="profile-chart-line" />
      {coords.map((point) => <g key={point.seasonId}>
        <circle cx={point.x} cy={point.y} r="4.5" className="profile-chart-point"><title>{`${point.season}: ${format(point.value, series.unit)}`}</title></circle>
        <text x={point.x} y={height - 7} textAnchor="middle" className="profile-chart-label">{point.season.replace(/^20/, '').replace('/', '–')}</text>
      </g>)}
    </svg>
    <div className="profile-chart-range"><span>{format(min, series.unit)}</span><strong>{format(points.at(-1)?.value ?? 0, series.unit)}</strong><span>{format(max, series.unit)}</span></div>
  </div>
}

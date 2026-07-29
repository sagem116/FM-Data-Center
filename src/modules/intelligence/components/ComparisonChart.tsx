const palette=['#55d6ae','#43a5ff','#edb65f','#d887ff','#ff7f91']
export function ComparisonLineChart({series}:{series:Array<{entityId:string;name:string;points:Array<{season:string;value?:number}>}>}){
  const seasons=[...new Set(series.flatMap(s=>s.points.map(p=>p.season)))]
  const values=series.flatMap(s=>s.points.map(p=>p.value).filter((v):v is number=>typeof v==='number'))
  if(!values.length)return <div className="profile-chart-empty">Sem valores comparáveis</div>
  const width=700,height=260,pad=38,min=Math.min(...values),max=Math.max(...values),span=max-min||1
  const x=(season:string)=>seasons.length<2?width/2:pad+seasons.indexOf(season)*(width-pad*2)/(seasons.length-1)
  const y=(value:number)=>height-pad-(value-min)/span*(height-pad*2)
  return <div className="comparison-chart"><svg viewBox={`0 0 ${width} ${height}`}>
    <line x1={pad} x2={width-pad} y1={height-pad} y2={height-pad} className="profile-chart-axis" />
    {series.map((item,index)=>{const points=item.points.filter((p):p is {season:string;value:number}=>typeof p.value==='number').map(p=>`${x(p.season)},${y(p.value)}`).join(' ');return <g key={item.entityId}><polyline points={points} fill="none" stroke={palette[index%palette.length]} strokeWidth="3" />{item.points.filter((p):p is {season:string;value:number}=>typeof p.value==='number').map(p=><circle key={p.season} cx={x(p.season)} cy={y(p.value)} r="4" fill={palette[index%palette.length]}><title>{item.name}: {p.season} · {p.value.toLocaleString('pt-PT',{maximumFractionDigits:1})}</title></circle>)}</g>})}
    {seasons.map(s=><text key={s} x={x(s)} y={height-10} textAnchor="middle" className="profile-chart-label">{s.replace(/^20/,'').replace('/','–')}</text>)}
  </svg><div className="comparison-legend">{series.map((s,i)=><span key={s.entityId}><i style={{background:palette[i%palette.length]}} />{s.name}</span>)}</div></div>
}

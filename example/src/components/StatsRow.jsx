function StatCard({ label, value, delta, up }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      <div className={`stat-delta ${up ? 'delta-up' : 'delta-down'}`}>{delta}</div>
    </div>
  )
}

export function StatsRow() {
  return (
    <div className="stats-grid">
      <StatCard label="Total Requests"     value="15,000" delta="↑ 8.2% vs last week" up />
      <StatCard label="Active Connections" value="342"    delta="↑ 3.1% vs last week" up />
      <StatCard label="Error Rate"         value="0.4%"   delta="↓ 0.1% vs last week" up={false} />
      <StatCard label="Avg Latency"        value="124ms"  delta="↑ 12ms vs last week"  up={false} />
    </div>
  )
}

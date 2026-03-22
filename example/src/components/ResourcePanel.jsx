const RESOURCES = [
  { label: 'CPU Usage',   value: 34, color: '#3b82f6' },
  { label: 'Memory',      value: 61, color: '#8b5cf6' },
  { label: 'Disk I/O',    value: 18, color: '#06b6d4' },
  { label: 'Network Out', value: 47, color: '#10b981' },
]

export function ResourcePanel() {
  return (
    <div className="panel">
      <div className="panel-title">Resource Usage</div>
      {RESOURCES.map(r => (
        <div key={r.label} className="progress-row">
          <div className="progress-label">
            <span>{r.label}</span>
            <span>{r.value}%</span>
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${r.value}%`, background: r.color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

import { useState } from 'react'

const INITIAL_PROCESSES = [
  { id: 'proc-001', name: 'api-gateway',     port: 8080, status: 'active', cpu: '12%', mem: '248 MB' },
  { id: 'proc-002', name: 'auth-service',    port: 3001, status: 'active', cpu: '4%',  mem: '96 MB'  },
  { id: 'proc-003', name: 'data-pipeline',   port: 5432, status: 'idle',   cpu: '0%',  mem: '512 MB' },
  { id: 'proc-004', name: 'cache-worker',    port: 6379, status: 'active', cpu: '7%',  mem: '64 MB'  },
  { id: 'proc-005', name: 'report-exporter', port: 9000, status: 'error',  cpu: '0%',  mem: '32 MB'  },
]

function StatusBadge({ status }) {
  const cls = { active: 'status-active', idle: 'status-idle', error: 'status-error' }[status] ?? 'status-idle'
  return <span className={`status-badge ${cls}`}>{status}</span>
}

function ProcessRow({ proc, onStop, onRestart }) {
  return (
    <tr>
      <td><code style={{ fontSize: 12, color: '#7dd3fc' }}>{proc.id}</code></td>
      <td>{proc.name}</td>
      <td><code style={{ fontSize: 12 }}>{proc.port}</code></td>
      <td><StatusBadge status={proc.status} /></td>
      <td>{proc.cpu}</td>
      <td>{proc.mem}</td>
      <td>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="btn btn-secondary" onClick={() => onStop(proc.id)}>Stop</button>
          <button className="btn btn-primary"   onClick={() => onRestart(proc.id)}>Restart</button>
        </div>
      </td>
    </tr>
  )
}

export function ProcessTable() {
  const [procs, setProcs] = useState(INITIAL_PROCESSES)

  const handleStop    = (id) => setProcs(p => p.map(r => r.id === id ? { ...r, status: 'idle'   } : r))
  const handleRestart = (id) => setProcs(p => p.map(r => r.id === id ? { ...r, status: 'active' } : r))

  return (
    <div className="table-card">
      <div className="table-header">
        <span className="table-title">Running Processes</span>
        <div className="table-actions">
          <button className="btn btn-primary">+ New Process</button>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            {['ID', 'Name', 'Port', 'Status', 'CPU', 'Memory', 'Actions'].map(h => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {procs.map(proc => (
            <ProcessRow key={proc.id} proc={proc} onStop={handleStop} onRestart={handleRestart} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

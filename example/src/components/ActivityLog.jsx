const LOGS = [
  { time: '14:32:01', msg: 'api-gateway: 200 GET /api/users',       dot: 'dot-green'  },
  { time: '14:31:58', msg: 'auth-service: JWT token refreshed',      dot: 'dot-blue'   },
  { time: '14:31:45', msg: 'report-exporter: connection timed out',  dot: 'dot-red'    },
  { time: '14:31:30', msg: 'cache-worker: evicted 1,240 stale keys', dot: 'dot-yellow' },
  { time: '14:31:12', msg: 'api-gateway: 404 GET /api/missing',      dot: 'dot-red'    },
  { time: '14:30:55', msg: 'data-pipeline: batch job completed',     dot: 'dot-green'  },
]

export function ActivityLog() {
  return (
    <div className="panel">
      <div className="panel-title">Activity Log</div>
      {LOGS.map((l, i) => (
        <div key={i} className="log-entry">
          <div className={`log-dot ${l.dot}`} />
          <span className="log-time">{l.time}</span>
          <span className="log-msg">{l.msg}</span>
        </div>
      ))}
    </div>
  )
}

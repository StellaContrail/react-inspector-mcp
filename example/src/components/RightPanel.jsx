import { useState } from 'react'

const NOTIFICATIONS = [
  { icon: '🔴', title: 'report-exporter crashed', body: 'Process exited with code 137 · 1 min ago' },
  { icon: '🟡', title: 'High memory usage',        body: 'data-pipeline at 89% · 4 min ago'         },
  { icon: '🟢', title: 'Deploy succeeded',          body: 'api-gateway v2.4.1 · 8 min ago'           },
]

const INITIAL_SERVERS = [
  { name: 'api-gateway',   port: ':8080', running: true  },
  { name: 'auth-service',  port: ':3001', running: true  },
  { name: 'data-pipeline', port: ':5432', running: false },
]

const INITIAL_SETTINGS = [
  { label: 'Auto-restart on crash',    on: true  },
  { label: 'Send crash reports',       on: false },
  { label: 'Enable metrics collector', on: true  },
  { label: 'Dark mode',                on: true  },
]

function NotificationList() {
  return (
    <div className="right-section">
      <div className="right-section-title">Notifications</div>
      {NOTIFICATIONS.map((n, i) => (
        <div key={i} className="notification-item">
          <span className="notif-icon">{n.icon}</span>
          <div>
            <div className="notif-title">{n.title}</div>
            <div className="notif-body">{n.body}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function ServerControls() {
  const [servers, setServers] = useState(INITIAL_SERVERS)
  const toggle = (name) =>
    setServers(s => s.map(sv => sv.name === name ? { ...sv, running: !sv.running } : sv))

  return (
    <div className="right-section">
      <div className="right-section-title">Server Controls</div>
      {servers.map(sv => (
        <div key={sv.name} className="server-control">
          <div className="server-dot" style={{ background: sv.running ? '#4ade80' : '#f87171' }} />
          <div>
            <div className="server-name">{sv.name}</div>
            <div className="server-port">{sv.port}</div>
          </div>
          <button
            className="server-btn"
            style={{
              background: sv.running ? '#fee2e2' : '#dcfce7',
              color:      sv.running ? '#dc2626' : '#16a34a',
            }}
            onClick={() => toggle(sv.name)}
          >
            {sv.running ? 'Stop' : 'Start'}
          </button>
        </div>
      ))}
    </div>
  )
}

function SettingsPanel() {
  const [settings, setSettings] = useState(INITIAL_SETTINGS)
  const toggle = (label) =>
    setSettings(s => s.map(item => item.label === label ? { ...item, on: !item.on } : item))

  return (
    <div className="right-section">
      <div className="right-section-title">Settings</div>
      {settings.map(item => (
        <div key={item.label} className="toggle-row">
          {item.label}
          <div className={`toggle ${item.on ? 'on' : ''}`} onClick={() => toggle(item.label)} />
        </div>
      ))}
    </div>
  )
}

export function RightPanel() {
  return (
    <aside className="right-panel">
      <NotificationList />
      <ServerControls />
      <SettingsPanel />
    </aside>
  )
}

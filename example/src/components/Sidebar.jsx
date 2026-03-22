import { useState } from 'react'

const NAV = [
  { icon: '📊', label: 'Dashboard',  count: null },
  { icon: '⚙️', label: 'Processes',  count: '5'  },
  { icon: '📁', label: 'Storage',    count: null },
  { icon: '🔔', label: 'Alerts',     count: '3'  },
  { icon: '🔐', label: 'Auth',       count: null },
  { icon: '📈', label: 'Metrics',    count: null },
]

function NavItem({ icon, label, count, active, onClick }) {
  return (
    <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
      <span className="icon">{icon}</span>
      {label}
      {count && <span className="count">{count}</span>}
    </div>
  )
}

export function Sidebar() {
  const [active, setActive] = useState('Dashboard')

  return (
    <nav className="sidebar">
      <div className="sidebar-section">
        <div className="sidebar-label">Navigation</div>
        {NAV.map(item => (
          <NavItem
            key={item.label}
            {...item}
            active={active === item.label}
            onClick={() => setActive(item.label)}
          />
        ))}
      </div>
    </nav>
  )
}

import { Header }        from './components/Header.jsx'
import { Sidebar }        from './components/Sidebar.jsx'
import { StatsRow }       from './components/StatsRow.jsx'
import { ProcessTable }   from './components/ProcessTable.jsx'
import { ResourcePanel }  from './components/ResourcePanel.jsx'
import { ActivityLog }    from './components/ActivityLog.jsx'
import { RightPanel }     from './components/RightPanel.jsx'

function MainContent() {
  return (
    <main className="main">
      <div className="hint-banner">
        <span className="icon">🔍</span>
        <span>
          Enable the <strong>React Inspector MCP</strong> extension, then click any component to capture its context for Claude Code.
        </span>
      </div>
      <div className="page-title">Dashboard</div>
      <div className="page-subtitle">Infrastructure overview · Real-time monitoring</div>
      <StatsRow />
      <ProcessTable />
      <div className="panel-grid">
        <ResourcePanel />
        <ActivityLog />
      </div>
    </main>
  )
}

export default function App() {
  return (
    <>
      <Header />
      <div className="layout">
        <Sidebar />
        <MainContent />
        <RightPanel />
      </div>
    </>
  )
}

import { useCallback, useEffect, useState } from 'react'
import { Tabs, Time, Footer, Icon } from 'animal-island-ui'
import { api, type ClusterStatus } from './api'
import { ClusterCard } from './components/ClusterCard'
import { DemoPanel } from './components/DemoPanel'
import { PracticalPanel } from './components/PracticalPanel'

export default function App() {
  const [status, setStatus] = useState<ClusterStatus | null>(null)

  const refresh = useCallback(async () => {
    try {
      setStatus(await api.clusterStatus())
    } catch {
      setStatus(null)
    }
  }, [])

  useEffect(() => {
    refresh()
    const t = setInterval(refresh, 3000)
    return () => clearInterval(t)
  }, [refresh])

  return (
    <>
      <div className="app-shell">
        <header className="app-header">
          <div className="row tight" style={{ alignItems: 'center' }}>
            <Icon name="icon-map" size={56} bounce />
            <div>
              <h1 className="app-title">
                🦊 psinsieme console 🐰
              </h1>
              <p className="app-subtitle">
                🐻 Multi-party PSI — KS05 / BEH21 / YYH26 over gRPC + mTLS 🦉
              </p>
            </div>
          </div>
          <div className="row tight">
            <Icon name="icon-critterpedia" size={36} bounce />
            <Time />
          </div>
        </header>

        <ClusterCard status={status} onChange={refresh} />

        <Tabs
          defaultActiveKey="demo"
          leafAnimation
          items={[
            { key: 'demo',      label: '🐝 Demo Hive',      children: <DemoPanel onAfterRun={refresh} /> },
            { key: 'practical', label: '🐢 Practical Pond', children: <PracticalPanel /> },
          ]}
        />

        <footer className="app-footer-meta">
          🦝 🦔 🦦 🐸 🦋 🐳 🐧 🦊 🐰 🐻 🐼 🐨 🦉 🐢 🦝
          <br />
          UI: <a href="https://github.com/guokaigdg/animal-island-ui" target="_blank" rel="noreferrer">
            animal-island-ui
          </a>
          {' · '}
          backend: webapp/server.py
        </footer>
      </div>
      <Footer type="sea" />
    </>
  )
}

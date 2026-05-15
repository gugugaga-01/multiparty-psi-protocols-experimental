import { useCallback, useEffect, useState } from 'react'
import { Tabs, Time, Footer } from 'animal-island-ui'
import { api, type ClusterStatus } from './api'
import { ClusterCard } from './components/ClusterCard'
import { DemoPanel } from './components/DemoPanel'
import { PracticalPanel } from './components/PracticalPanel'

function Shell() {
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
        <header className="aii-hero">
          <div className="aii-hero-row">
            <div>
              <h1 className="aii-hero-title">psinsieme console</h1>
              <p className="aii-hero-sub">
                Multi-party PSI — KS05 / BEH21 / YYH26 over gRPC + mTLS
              </p>
              <div className="aii-hero-time" style={{ display: 'inline-block', marginTop: 10 }}>
                <Time />
              </div>
            </div>
            <img
              className="aii-hero-mascot"
              src="/aii/animal_icon.png"
              alt="animal island mascot"
              decoding="async"
            />
          </div>
        </header>
        <div className="aii-guide-line" />

        <ClusterCard status={status} onChange={refresh} />

        <Tabs
          defaultActiveKey="demo"
          leafAnimation
          items={[
            { key: 'demo',      label: 'Demo',      children: <DemoPanel onAfterRun={refresh} /> },
            { key: 'practical', label: 'Practical', children: <PracticalPanel /> },
          ]}
        />

        <footer className="app-footer-meta">
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

export default function App() {
  return <Shell />
}

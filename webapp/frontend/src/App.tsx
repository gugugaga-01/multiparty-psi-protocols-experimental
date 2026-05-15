import { useCallback, useEffect, useState } from 'react'
import { Tabs, Time, Footer, Loading } from 'animal-island-ui'
import { api, type ClusterStatus } from './api'
import { ClusterCard } from './components/ClusterCard'
import { DemoPanel } from './components/DemoPanel'
import { PracticalPanel } from './components/PracticalPanel'
import { BusyProvider, useBusy } from './busy'

function BusyOverlay() {
  const { active, message } = useBusy()
  return (
    <div
      className="aii-busy-overlay"
      style={{ pointerEvents: active ? 'auto' : 'none', opacity: active ? 1 : 0 }}
      aria-hidden={!active}
    >
      <Loading active={active} style={{ width: '100%', height: '100%' }} />
      {active && message && <div className="aii-busy-msg">{message}</div>}
    </div>
  )
}

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
      <BusyOverlay />
    </>
  )
}

export default function App() {
  return (
    <BusyProvider>
      <Shell />
    </BusyProvider>
  )
}

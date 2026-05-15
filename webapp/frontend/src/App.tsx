import { useCallback, useEffect, useState } from 'react'
import { Tabs, Time, Footer, Select } from 'animal-island-ui'
import { api, type ClusterStatus } from './api'
import { ClusterCard } from './components/ClusterCard'
import { DemoPanel } from './components/DemoPanel'
import { PracticalPanel } from './components/PracticalPanel'
import { I18nProvider, useI18n, type Locale } from './i18n'

function LocaleSwitch() {
  const { locale, setLocale, t } = useI18n()
  return (
    <div className="aii-locale-switch">
      <span className="aii-locale-label">{t('locale.label')}</span>
      <Select
        value={locale}
        onChange={(v) => setLocale(v as Locale)}
        options={[
          { key: 'en', label: t('locale.en') },
          { key: 'zh', label: t('locale.zh') },
        ]}
      />
    </div>
  )
}

function Shell() {
  const { t } = useI18n()
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
    const id = setInterval(refresh, 3000)
    return () => clearInterval(id)
  }, [refresh])

  return (
    <>
      <div className="app-shell">
        <header className="aii-hero">
          <div className="aii-hero-row">
            <div>
              <h1 className="aii-hero-title">psinsieme console</h1>
              <p className="aii-hero-sub">{t('app.subtitle')}</p>
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
          <LocaleSwitch />
        </header>
        <div className="aii-guide-line" />

        <ClusterCard status={status} onChange={refresh} />

        <Tabs
          defaultActiveKey="demo"
          leafAnimation
          items={[
            { key: 'demo',      label: t('tabs.demo'),      children: <DemoPanel onAfterRun={refresh} /> },
            { key: 'practical', label: t('tabs.practical'), children: <PracticalPanel /> },
          ]}
        />

        <footer className="app-footer-meta">
          {t('app.footer.ui')}:{' '}
          <a href="https://github.com/guokaigdg/animal-island-ui" target="_blank" rel="noreferrer">
            animal-island-ui
          </a>
          {' · '}
          {t('app.footer.backend')}: webapp/server.py
        </footer>
      </div>
      <Footer type="sea" />
    </>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <Shell />
    </I18nProvider>
  )
}

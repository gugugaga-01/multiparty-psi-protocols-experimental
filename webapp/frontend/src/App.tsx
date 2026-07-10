import { useCallback, useEffect, useState } from 'react'
import { Cursor, Icon, Tabs, Time, Footer, Switch, type IconName } from 'animal-island-ui'
import { api, type ClusterStatus } from './api'
import { ClusterCard } from './components/ClusterCard'
import { DemoPanel } from './components/DemoPanel'
import { GuidePage, ProjectPage, ProtocolsPage, WhyPsiPage } from './components/InfoPages'
import { PracticalPanel } from './components/PracticalPanel'
import { I18nProvider } from './I18nProvider'
import { ProtocolSelectionProvider } from './ProtocolSelectionContext'
import { useI18n, type Locale } from './i18n'

const PAGES = ['console', 'why', 'guide', 'project', 'protocols'] as const
type Page = typeof PAGES[number]

function pageFromHash(): Page {
  if (typeof window === 'undefined') return 'console'
  const raw = window.location.hash.replace(/^#\/?/, '')
  return PAGES.includes(raw as Page) ? (raw as Page) : 'console'
}

function LocaleSwitch() {
  const { locale, setLocale, t } = useI18n()
  return (
    <div className="aii-locale-switch">
      <span className="aii-locale-label">{t('locale.label')}</span>
      <Switch
        checked={locale === 'zh'}
        onChange={(v) => setLocale((v ? 'zh' : 'en') as Locale)}
        checkedChildren="中"
        unCheckedChildren="EN"
      />
    </div>
  )
}

function StatusDot({ tone, label, value }: { tone: 'ok' | 'warn' | 'bad'; label: string; value: string }) {
  return (
    <div className={'console-stat ' + tone}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

function ConsolePage({
  status,
  refresh,
}: {
  status: ClusterStatus | null
  refresh: () => void
}) {
  const { t } = useI18n()
  const runningParties = status?.parties.filter((p) => p.running).length ?? 0
  const partyTotal = status?.num_parties ?? 0
  const protocolCount = status?.protocols_available?.length ?? 0
  const anyRunning = !!status && (status.dealer.running || status.parties.some((p) => p.running))

  return (
    <ProtocolSelectionProvider
      available={status?.protocols_available ?? null}
      activeProtocol={anyRunning ? status?.protocol ?? null : null}
      locked={anyRunning}
    >
    <main className="console-page">
      <section className="console-overview" aria-labelledby="console-overview-title">
        <div className="console-overview-copy">
          <span className="info-kicker">{t('console.kicker')}</span>
          <h2 id="console-overview-title">{t('console.title')}</h2>
          <p>{t('console.lead')}</p>
        </div>
        <div className="console-stat-grid" aria-label={t('console.statusSummary')}>
          <StatusDot
            tone={status?.built ? 'ok' : 'bad'}
            label={t('console.stat.build')}
            value={status?.built ? t('cluster.builtOk') : t('cluster.notBuilt')}
          />
          <StatusDot
            tone={anyRunning ? 'ok' : 'warn'}
            label={t('console.stat.cluster')}
            value={anyRunning ? t('cluster.running') : t('cluster.stopped')}
          />
          <StatusDot
            tone={runningParties === partyTotal && partyTotal > 0 ? 'ok' : runningParties > 0 ? 'warn' : 'bad'}
            label={t('console.stat.parties')}
            value={String(runningParties) + '/' + String(partyTotal)}
          />
          <StatusDot
            tone={protocolCount > 0 ? 'ok' : 'warn'}
            label={t('console.stat.protocols')}
            value={protocolCount > 0 ? String(protocolCount) : t('console.stat.pending')}
          />
        </div>
      </section>

      <ClusterCard status={status} onChange={refresh} />

      <section className="console-runner" aria-label={t('console.runner')}>
        <Tabs
          defaultActiveKey="demo"
          leafAnimation
          items={[
            { key: 'demo',      label: t('tabs.demo'),      children: <DemoPanel onAfterRun={refresh} /> },
            { key: 'practical', label: t('tabs.practical'), children: <PracticalPanel /> },
          ]}
        />
      </section>
    </main>
    </ProtocolSelectionProvider>
  )
}

function Shell() {
  const { t } = useI18n()
  const [status, setStatus] = useState<ClusterStatus | null>(null)
  const [page, setPageState] = useState<Page>(pageFromHash)

  const refresh = useCallback(async () => {
    try {
      setStatus(await api.clusterStatus())
    } catch {
      setStatus(null)
    }
  }, [])

  const setPage = useCallback((next: Page) => {
    setPageState(next)
    if (typeof window !== 'undefined') {
      window.location.hash = next === 'console' ? '' : next
    }
  }, [])

  useEffect(() => {
    if (page === 'protocols') {
      refresh()
      return
    }
    if (page !== 'console') return
    refresh()
    const id = setInterval(refresh, 3000)
    return () => clearInterval(id)
  }, [page, refresh])

  useEffect(() => {
    const onHashChange = () => setPageState(pageFromHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const pageLabel = (icon: IconName, label: string) => (
    <span className="page-tab-label">
      <Icon name={icon} size={22} bounce />
      <span>{label}</span>
    </span>
  )

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

        <Tabs
          activeKey={page}
          onChange={(key) => setPage(key as Page)}
          leafAnimation
          items={[
            {
              key: 'console',
              label: pageLabel('icon-miles', t('nav.console')),
              children: <ConsolePage status={status} refresh={refresh} />,
            },
            { key: 'why', label: pageLabel('icon-chat', t('nav.why')), children: <WhyPsiPage /> },
            { key: 'guide', label: pageLabel('icon-map', t('nav.guide')), children: <GuidePage /> },
            { key: 'project', label: pageLabel('icon-helicopter', t('nav.project')), children: <ProjectPage /> },
            { key: 'protocols', label: pageLabel('icon-critterpedia', t('nav.protocols')), children: <ProtocolsPage available={status?.protocols_available ?? null} /> },
          ]}
        />

        <footer className="app-footer-meta">
          {t('app.footer.ui')}:{' '}
          <a href="https://github.com/guokaigdg/animal-island-ui" target="_blank" rel="noreferrer">
            animal-island-ui
          </a>
          {' · '}
          {t('app.footer.backend')}: webapp/server.py
          <br />
          {t('app.disclaimer.short')}
        </footer>
      </div>
      <Footer type="sea" />
    </>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <Cursor>
        <Shell />
      </Cursor>
    </I18nProvider>
  )
}

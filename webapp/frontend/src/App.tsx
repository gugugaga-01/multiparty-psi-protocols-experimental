import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { Icon, Switch, type IconName } from 'animal-island-ui'
import { api, type ClusterStatus } from './api'
import { ClusterCard } from './components/ClusterCard'
import { DemoPanel } from './components/DemoPanel'
import { GuidePage, ProjectPage, ProtocolsPage, WhyPsiPage } from './components/InfoPages'
import { PracticalPanel } from './components/PracticalPanel'
import { I18nProvider } from './I18nProvider'
import { ProtocolSelectionProvider } from './ProtocolSelectionContext'
import { useI18n, type Locale } from './i18n'

const RUN_MODE_KEY = 'psinsieme.runMode'

type Page = 'run' | 'protocols' | 'learn'
type LearnSection = 'why' | 'guide' | 'project'
type RunMode = 'quick' | 'participant'

type Route = {
  page: Page
  learnSection: LearnSection
}

function routeFromHash(): Route {
  if (typeof window === 'undefined') return { page: 'run', learnSection: 'why' }
  const raw = window.location.hash.replace(/^#\/?/, '')
  if (raw === 'protocols') return { page: 'protocols', learnSection: 'why' }
  if (raw === 'learn' || raw === 'why' || raw === 'guide' || raw === 'project') {
    return {
      page: 'learn',
      learnSection: raw === 'guide' || raw === 'project' ? raw : 'why',
    }
  }
  return { page: 'run', learnSection: 'why' }
}

function LocaleSwitch() {
  const { locale, setLocale, t } = useI18n()
  return (
    <div className="locale-control">
      <span>{t('locale.label')}</span>
      <Switch
        checked={locale === 'zh'}
        onChange={(value) => setLocale((value ? 'zh' : 'en') as Locale)}
        checkedChildren="中"
        unCheckedChildren="EN"
      />
    </div>
  )
}

function ReadinessBanner({ status, loading }: { status: ClusterStatus | null; loading: boolean }) {
  const { t } = useI18n()
  const runningParties = status?.parties.filter((party) => party.running).length ?? 0
  const anyRunning = !!status && (status.dealer.running || runningParties > 0)
  const tone = loading ? 'checking' : !status || !status.built ? 'blocked' : anyRunning ? 'running' : 'ready'
  const title = loading
    ? t('run.readiness.checking')
    : !status
      ? t('run.readiness.unavailable')
      : !status.built
        ? t('run.readiness.setup')
        : anyRunning
          ? t('run.readiness.running')
          : t('run.readiness.ready')
  const detail = loading
    ? t('run.readiness.checkingDetail')
    : !status
      ? t('run.readiness.unavailableDetail')
      : !status.built
        ? t('run.readiness.setupDetail')
        : anyRunning
          ? t('run.readiness.runningDetail', { protocol: status.protocol || 'PSI', count: runningParties })
          : t('run.readiness.readyDetail', { count: status.protocols_available?.length ?? 0 })

  return (
    <div className={`readiness-banner ${tone}`} role="status" aria-live="polite">
      <span className="readiness-icon" aria-hidden="true">
        {tone === 'ready' ? '✓' : tone === 'running' ? '●' : tone === 'checking' ? '…' : '!'}
      </span>
      <div>
        <strong>{title}</strong>
        <span>{detail}</span>
      </div>
    </div>
  )
}

function ModeChoice({ mode, onChange }: { mode: RunMode; onChange: (mode: RunMode) => void }) {
  const { t } = useI18n()
  return (
    <div className="run-mode-picker" aria-label={t('run.mode.label')}>
      <button className={mode === 'quick' ? 'active' : ''} onClick={() => onChange('quick')}>
        <Icon name="icon-miles" size={25} />
        <span>
          <strong>{t('run.mode.quick')}</strong>
          <small>{t('run.mode.quickDetail')}</small>
        </span>
        <em>{t('run.recommended')}</em>
      </button>
      <button className={mode === 'participant' ? 'active' : ''} onClick={() => onChange('participant')}>
        <Icon name="icon-helicopter" size={25} />
        <span>
          <strong>{t('run.mode.participant')}</strong>
          <small>{t('run.mode.participantDetail')}</small>
        </span>
      </button>
    </div>
  )
}

function RunPage({
  status,
  loading,
  refresh,
}: {
  status: ClusterStatus | null
  loading: boolean
  refresh: () => void
}) {
  const { t } = useI18n()
  const [mode, setModeState] = useState<RunMode>(() => {
    if (typeof window === 'undefined') return 'quick'
    return window.localStorage.getItem(RUN_MODE_KEY) === 'participant' ? 'participant' : 'quick'
  })
  const anyRunning = !!status && (status.dealer.running || status.parties.some((party) => party.running))

  const setMode = (next: RunMode) => {
    setModeState(next)
    window.localStorage.setItem(RUN_MODE_KEY, next)
  }

  return (
    <ProtocolSelectionProvider
      available={status?.protocols_available ?? null}
      activeProtocol={anyRunning ? status?.protocol ?? null : null}
      locked={anyRunning}
    >
      <main id="main-content" className="run-page">
        <section className="page-heading">
          <div>
            <span className="eyebrow">{t('console.kicker')}</span>
            <h1>{t('run.title')}</h1>
            <p>{t('run.lead')}</p>
          </div>
          <ReadinessBanner status={status} loading={loading} />
        </section>

        <section aria-labelledby="run-mode-title">
          <div className="section-heading">
            <div>
              <h2 id="run-mode-title">{t('run.chooseTask')}</h2>
              <p>{t('run.chooseTaskDetail')}</p>
            </div>
          </div>
          <ModeChoice mode={mode} onChange={setMode} />
        </section>

        <section className="run-workspace" aria-label={mode === 'quick' ? t('run.mode.quick') : t('run.mode.participant')}>
          {mode === 'quick' ? <DemoPanel onAfterRun={refresh} /> : <PracticalPanel />}
        </section>

        <details className="system-details">
          <summary>
            <span>
              <strong>{t('run.clusterDetails')}</strong>
              <small>{t('run.clusterDetailsHint')}</small>
            </span>
            <span aria-hidden="true">⌄</span>
          </summary>
          <div className="system-details-body">
            <ClusterCard status={status} onChange={refresh} compact />
          </div>
        </details>
      </main>
    </ProtocolSelectionProvider>
  )
}

function LearnPage({ section, onChange }: { section: LearnSection; onChange: (section: LearnSection) => void }) {
  const { t } = useI18n()
  const content: Record<LearnSection, ReactNode> = {
    why: <WhyPsiPage />,
    guide: <GuidePage />,
    project: <ProjectPage />,
  }
  return (
    <div id="main-content" className="learn-shell">
      <nav className="learn-nav" aria-label={t('learn.sections')}>
        {(['why', 'guide', 'project'] as const).map((item) => (
          <button key={item} className={section === item ? 'active' : ''} onClick={() => onChange(item)}>
            {t(`nav.${item}`)}
          </button>
        ))}
      </nav>
      {content[section]}
    </div>
  )
}

function NavButton({ active, icon, children, onClick }: { active: boolean; icon: IconName; children: ReactNode; onClick: () => void }) {
  return (
    <button className={active ? 'active' : ''} aria-current={active ? 'page' : undefined} onClick={onClick}>
      <Icon name={icon} size={20} />
      <span>{children}</span>
    </button>
  )
}

function Shell() {
  const { t } = useI18n()
  const initialRoute = routeFromHash()
  const [status, setStatus] = useState<ClusterStatus | null>(null)
  const [statusLoading, setStatusLoading] = useState(true)
  const [page, setPageState] = useState<Page>(initialRoute.page)
  const [learnSection, setLearnSection] = useState<LearnSection>(initialRoute.learnSection)

  const refresh = useCallback(async () => {
    try {
      setStatus(await api.clusterStatus())
    } catch {
      setStatus(null)
    } finally {
      setStatusLoading(false)
    }
  }, [])

  const setPage = useCallback((next: Page) => {
    setPageState(next)
    window.location.hash = next === 'run' ? '' : next
  }, [])

  const changeLearnSection = useCallback((next: LearnSection) => {
    setLearnSection(next)
    window.location.hash = next
  }, [])

  useEffect(() => {
    if (page === 'protocols' || page === 'run') refresh()
    if (page !== 'run') return
    const id = setInterval(refresh, 3000)
    return () => clearInterval(id)
  }, [page, refresh])

  useEffect(() => {
    const onHashChange = () => {
      const route = routeFromHash()
      setPageState(route.page)
      setLearnSection(route.learnSection)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return (
    <>
      <a className="skip-link" href="#main-content">{t('a11y.skip')}</a>
      <header className="product-header">
        <div className="product-header-inner">
          <button className="brand" onClick={() => setPage('run')} aria-label={t('nav.run')}>
            <img src="/aii/animal_icon.png" alt="" />
            <span>
              <strong>psinsieme</strong>
              <small>{t('app.productLabel')}</small>
            </span>
          </button>
          <nav className="primary-nav" aria-label={t('nav.label')}>
            <NavButton active={page === 'run'} icon="icon-miles" onClick={() => setPage('run')}>{t('nav.run')}</NavButton>
            <NavButton active={page === 'protocols'} icon="icon-critterpedia" onClick={() => setPage('protocols')}>{t('nav.protocols')}</NavButton>
            <NavButton active={page === 'learn'} icon="icon-map" onClick={() => setPage('learn')}>{t('nav.learn')}</NavButton>
          </nav>
          <LocaleSwitch />
        </div>
      </header>

      <div className="app-shell modern-shell">
        {page === 'run' && <RunPage status={status} loading={statusLoading} refresh={refresh} />}
        {page === 'protocols' && <div id="main-content"><ProtocolsPage available={status?.protocols_available ?? null} /></div>}
        {page === 'learn' && <LearnPage section={learnSection} onChange={changeLearnSection} />}
      </div>

      <footer className="product-footer">
        <span>psinsieme</span>
        <span>{t('app.disclaimer.short')}</span>
      </footer>
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

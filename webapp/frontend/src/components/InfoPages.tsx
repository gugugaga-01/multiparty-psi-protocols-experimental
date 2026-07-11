import { Card, Collapse, Divider, Icon, type IconName } from 'animal-island-ui'
import { useI18n } from '../i18n'
import { PROTOCOL_CATEGORIES, PROTOCOLS } from '../protocolCatalog'
import { LearnPage } from './LearnPage'

const guideSteps = [
  { key: 'guide.step1', icon: 'icon-diy', color: 'app-green' },
  { key: 'guide.step2', icon: 'icon-map', color: 'app-yellow' },
  { key: 'guide.step3', icon: 'icon-variant', color: 'app-blue' },
  { key: 'guide.step4', icon: 'icon-chat', color: 'app-orange' },
] as const

const projectPoints = [
  { key: 'project.point1', icon: 'icon-critterpedia', color: 'app-teal' },
  { key: 'project.point2', icon: 'icon-helicopter', color: 'app-green' },
  { key: 'project.point3', icon: 'icon-design', color: 'app-yellow' },
] as const

function InfoHero({ kicker, title, lead, icon }: { kicker: string; title: string; lead: string; icon: IconName }) {
  return (
    <Card type="title" color="default" className="info-hero-card">
      <div className="info-hero-copy"><span className="info-kicker">{kicker}</span><h2>{title}</h2><p>{lead}</p></div>
      <div className="info-hero-icon" aria-hidden="true"><Icon name={icon} size={58} bounce /></div>
    </Card>
  )
}

export function WhyPsiPage() {
  return <LearnPage />
}

export function GuidePage() {
  const { locale, t } = useI18n()
  const quick = locale === 'zh' ? '快速本地运行' : 'Quick local run'
  const participant = locale === 'zh' ? '连接参与方' : 'Connect a participant'
  return (
    <main className="info-page">
      <InfoHero kicker={t('guide.kicker')} title={t('guide.title')} lead={t('guide.lead')} icon="icon-map" />
      <div className="info-app-grid">
        {guideSteps.map((step, i) => <Card key={step.key} type="title" color={step.color} className="info-step-card"><div className="info-step-icon"><Icon name={step.icon} size={34} bounce /></div><span className="info-index">{String(i + 1).padStart(2, '0')}</span><h3>{t(`${step.key}.title`)}</h3><p>{t(`${step.key}.body`)}</p></Card>)}
      </div>
      <div className="guide-mode-grid">
        <Card type="title" color="app-yellow" className="guide-mode-card"><Icon name="icon-miles" size={32} bounce /><div><h3>{quick}</h3><p>{t('guide.demo.body')}</p><span>{t('guide.demo.best')}</span></div></Card>
        <Card type="title" color="app-teal" className="guide-mode-card"><Icon name="icon-chat" size={32} bounce /><div><h3>{participant}</h3><p>{t('guide.practical.body')}</p><span>{t('guide.practical.best')}</span></div></Card>
      </div>
      <div className="info-command-row">
        <Collapse defaultExpanded question={quick} answer={<div className="info-collapse-body"><p>{t('guide.demo.body')}</p></div>} />
        <Collapse question={participant} answer={<div className="info-collapse-body"><p>{t('guide.practical.body')}</p></div>} />
      </div>
    </main>
  )
}

export function ProjectPage() {
  const { locale, t } = useI18n()
  const c = locale === 'zh' ? {
    known: '已知协议集成', discovery: '可用性由运行时发现', boundary: '研究级实现', boundaryBody: '当前协议集成以半诚实研究实验为目标；具体可用协议取决于构建选项。',
    browser: '浏览器', web: 'server.py Web API', client: 'Python party 客户端', grpc: 'psi_party gRPC', plugin: '协议插件', result: '主导方交集', path: '实际请求路径',
  } : {
    known: 'Known protocol integrations', discovery: 'Availability discovered at runtime', boundary: 'Research implementation', boundaryBody: 'Current integrations target semi-honest research experiments; the available protocols depend on build options.',
    browser: 'Browser', web: 'server.py Web API', client: 'Python party client', grpc: 'psi_party gRPC', plugin: 'Protocol plugin', result: 'Leader intersection', path: 'Actual request path',
  }
  return (
    <main className="info-page">
      <InfoHero kicker={t('project.kicker')} title={t('project.title')} lead={t('project.lead')} icon="icon-helicopter" />
      <div className="project-stat-grid">
        <Card type="title" color="app-blue" className="project-stat-card"><Icon name="icon-variant" size={30} bounce /><span>{c.known}</span><strong>{PROTOCOLS.length}</strong></Card>
        <Card type="title" color="app-green" className="project-stat-card"><Icon name="icon-helicopter" size={30} bounce /><span>{c.discovery}</span><strong>psi_party</strong></Card>
        <Card type="title" color="app-orange" className="project-stat-card"><Icon name="icon-map" size={30} bounce /><span>{c.boundary}</span><strong>semi-honest</strong></Card>
      </div>
      <div className="project-cards">
        {projectPoints.map((point) => <Card key={point.key} type="title" color={point.color} className="project-feature-card"><Icon name={point.icon} size={32} bounce /><div><h3>{t(`${point.key}.title`)}</h3><p>{t(`${point.key}.body`)}</p></div></Card>)}
      </div>
      <Card type="dashed" className="info-path-card"><h3>{c.path}</h3><Divider type="wave-yellow" /><div className="info-path project-request-path" aria-label={c.path}>{[c.browser, c.web, c.client, c.grpc, c.plugin, c.result].map((step) => <span key={step}>{step}</span>)}</div></Card>
      <aside className="learn-callout warning"><strong>{c.boundary}</strong><p>{c.boundaryBody}</p></aside>
    </main>
  )
}

export function ProtocolsPage({ available }: { available?: string[] | null }) {
  const { t } = useI18n()
  return (
    <main className="info-page">
      <InfoHero kicker={t('protocols.kicker')} title={t('protocols.title')} lead={t('protocols.lead')} icon="icon-critterpedia" />
      <div className="protocol-summary-strip"><div><span>{t('protocol.summary.total')}</span><strong>{PROTOCOLS.length}</strong></div><div><span>{t('protocol.summary.built')}</span><strong>{available?.length ?? t('console.stat.pending')}</strong></div><div><span>{t('protocol.summary.source')}</span><strong>{t('protocol.summary.discovery')}</strong></div></div>
      <div className="protocol-category-list">
        {PROTOCOL_CATEGORIES.map((category) => {
          const protocols = PROTOCOLS.filter((protocol) => protocol.category === category.id)
          const built = available == null ? null : protocols.filter((protocol) => available.includes(protocol.id)).length
          const headingId = `protocol-category-${category.id}`
          return <section className="protocol-category-section" aria-labelledby={headingId} key={category.id}><div className="protocol-category-heading"><div><span className="protocol-category-kicker">{t('protocol.category')}</span><h2 id={headingId}>{t(category.labelKey)}</h2></div><span className="protocol-category-count">{built == null ? t('protocol.category.knownCount', { total: protocols.length }) : t('protocol.category.builtCount', { built, total: protocols.length })}</span></div><div className="protocol-list">{protocols.map((protocol) => {
            const isAvailable = available?.includes(protocol.id) ?? null
            return <Card key={protocol.id} type="title" color={protocol.color} className="protocol-card"><div className="protocol-heading"><Icon name={protocol.icon} size={38} bounce /><div><div className="protocol-title-row"><h3>{protocol.name}</h3>{isAvailable !== null && <span className={'protocol-status ' + (isAvailable ? 'ok' : 'warn')}>{isAvailable ? t('protocol.available') : t('protocol.notAvailable')}</span>}</div><code>{protocol.id}</code></div></div><div className="protocol-chip-row">{protocol.chips.map((chip) => <span key={chip}>{t(chip)}</span>)}</div><Divider type="line-white" /><div className="protocol-details"><span>{t('protocol.model')}</span><p>{t(protocol.modelKey)}</p><span>{t('protocol.dealer')}</span><p>{t(protocol.dealerKey)}</p><span>{t('protocol.fit')}</span><p>{t(protocol.fitKey)}</p></div></Card>
          })}</div></section>
        })}
      </div>
    </main>
  )
}

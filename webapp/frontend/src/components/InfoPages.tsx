import { useState } from 'react'
import { Button, Card, Collapse, Divider, Icon, type IconName } from 'animal-island-ui'
import { useI18n } from '../i18n'
import { PROTOCOL_CATEGORIES, PROTOCOLS } from '../protocolCatalog'

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

const guideModeCards = [
  { key: 'guide.demo', icon: 'icon-miles', color: 'app-yellow' },
  { key: 'guide.practical', icon: 'icon-chat', color: 'app-teal' },
] as const

const projectStats = [
  { key: 'project.stat.protocols', icon: 'icon-variant', color: 'app-blue' },
  { key: 'project.stat.service', icon: 'icon-helicopter', color: 'app-green' },
  { key: 'project.stat.console', icon: 'icon-map', color: 'app-orange' },
] as const

const historyItems = [
  {
    key: 'why.history.matching',
    icon: 'icon-chat',
    color: 'app-teal',
    detailKeys: ['why.history.matching.detail1', 'why.history.matching.detail2', 'why.history.matching.detail3'],
  },
  {
    key: 'why.history.formal',
    icon: 'icon-critterpedia',
    color: 'app-blue',
    detailKeys: ['why.history.formal.detail1', 'why.history.formal.detail2', 'why.history.formal.detail3'],
  },
  {
    key: 'why.history.scale',
    icon: 'icon-variant',
    color: 'app-orange',
    detailKeys: ['why.history.scale.detail1', 'why.history.scale.detail2', 'why.history.scale.detail3'],
  },
  {
    key: 'why.history.deploy',
    icon: 'icon-helicopter',
    color: 'app-green',
    detailKeys: ['why.history.deploy.detail1', 'why.history.deploy.detail2', 'why.history.deploy.detail3'],
  },
  {
    key: 'why.history.ecosystem',
    icon: 'icon-diy',
    color: 'app-yellow',
    detailKeys: ['why.history.ecosystem.detail1', 'why.history.ecosystem.detail2', 'why.history.ecosystem.detail3'],
  },
] as const


const psiTopicGroups = [
  {
    key: 'why.topic.group.base',
    tone: 'teal',
    items: [
      { key: 'why.topic.twoParty', tone: 'teal' },
      { key: 'why.topic.mpsi', tone: 'green' },
    ],
  },
  {
    key: 'why.topic.group.threshold',
    tone: 'orange',
    items: [
      { key: 'why.topic.tpsi', tone: 'orange' },
      { key: 'why.topic.tMpsi', tone: 'pink' },
      { key: 'why.topic.mtpsi', tone: 'blue' },
      { key: 'why.topic.otMpsi', tone: 'green' },
      { key: 'why.topic.traceableThresholdMpsi', tone: 'teal' },
    ],
  },
  {
    key: 'why.topic.group.threat',
    tone: 'blue',
    items: [
      { key: 'why.topic.semiHonest', tone: 'blue' },
      { key: 'why.topic.malicious', tone: 'orange' },
    ],
  },
  {
    key: 'why.topic.group.output',
    tone: 'green',
    items: [
      { key: 'why.topic.cardinality', tone: 'blue' },
      { key: 'why.topic.labeled', tone: 'pink' },
      { key: 'why.topic.psiDt', tone: 'green' },
      { key: 'why.topic.psiSum', tone: 'green' },
      { key: 'why.topic.circuit', tone: 'orange' },
      { key: 'why.topic.dpPsi', tone: 'teal' },
    ],
  },
  {
    key: 'why.topic.group.data',
    tone: 'orange',
    items: [
      { key: 'why.topic.unbalanced', tone: 'orange' },
      { key: 'why.topic.fuzzy', tone: 'pink' },
      { key: 'why.topic.streaming', tone: 'teal' },
    ],
  },
  {
    key: 'why.topic.group.infrastructure',
    tone: 'teal',
    items: [
      { key: 'why.topic.assisted', tone: 'green' },
      { key: 'why.topic.authorized', tone: 'pink' },
      { key: 'why.topic.verifiable', tone: 'teal' },
      { key: 'why.topic.psuPmt', tone: 'blue' },
    ],
  },
] as const


const psiPrimitiveGroups = [
  {
    key: 'why.primitive.group.crypto',
    tone: 'blue',
    items: [
      { key: 'why.primitive.he', tone: 'blue' },
      { key: 'why.primitive.fhe', tone: 'teal' },
      { key: 'why.primitive.ot', tone: 'orange' },
      { key: 'why.primitive.ote', tone: 'green' },
      { key: 'why.primitive.oprf', tone: 'pink' },
      { key: 'why.primitive.opprf', tone: 'blue' },
      { key: 'why.primitive.voleBole', tone: 'orange' },
      { key: 'why.primitive.secretSharing', tone: 'green' },
    ],
  },
  {
    key: 'why.primitive.group.encoding',
    tone: 'green',
    items: [
      { key: 'why.primitive.okvs', tone: 'green' },
      { key: 'why.primitive.polynomial', tone: 'teal' },
      { key: 'why.primitive.hashing', tone: 'orange' },
      { key: 'why.primitive.cuckoo', tone: 'pink' },
      { key: 'why.primitive.bloom', tone: 'blue' },
      { key: 'why.primitive.gbf', tone: 'green' },
      { key: 'why.primitive.bitmap', tone: 'orange' },
    ],
  },
  {
    key: 'why.primitive.group.controls',
    tone: 'orange',
    items: [
      { key: 'why.primitive.commitment', tone: 'orange' },
      { key: 'why.primitive.zk', tone: 'blue' },
      { key: 'why.primitive.hashToCurve', tone: 'teal' },
      { key: 'why.primitive.dp', tone: 'pink' },
      { key: 'why.primitive.batching', tone: 'green' },
    ],
  },
] as const

type ApplicationVariant = 'genetics' | 'recommendation' | 'contacts' | 'ads' | 'tracing'

const applicationItems = [
  { key: 'why.app.genetics', icon: 'icon-miles', color: 'app-teal', variant: 'genetics' },
  { key: 'why.app.recommendation', icon: 'icon-map', color: 'app-orange', variant: 'recommendation' },
  { key: 'why.app.contacts', icon: 'icon-chat', color: 'warm-peach-pink', variant: 'contacts' },
  { key: 'why.app.ads', icon: 'icon-design', color: 'app-blue', variant: 'ads' },
  { key: 'why.app.tracing', icon: 'icon-helicopter', color: 'app-green', variant: 'tracing' },
] as const

type ScenarioToken = { label: string; match?: boolean }

type ApplicationScenario = {
  leftKey: string
  leftTagKey: string
  leftItems: ScenarioToken[]
  rightKey: string
  rightTagKey: string
  rightItems: ScenarioToken[]
  outputValueKey: string
  purposeKey: string
  visualTitleKey: string
  riskKey: string
  psiKeepKey: string
  resultItemKeys: string[]
}

const applicationScenarios: Record<ApplicationVariant, ApplicationScenario> = {
  genetics: {
    leftKey: 'why.app.genetics.left',
    leftTagKey: 'why.app.genetics.leftTag',
    leftItems: [
      { label: 'BRCA1:c.68_69del', match: true },
      { label: 'APOE:e4' },
      { label: 'LDLR:p.G528D', match: true },
      { label: 'MTHFR:C677T' },
    ],
    rightKey: 'why.app.genetics.right',
    rightTagKey: 'why.app.genetics.rightTag',
    rightItems: [
      { label: 'BRCA1:c.68_69del', match: true },
      { label: 'HBB:p.Glu6Val' },
      { label: 'LDLR:p.G528D', match: true },
      { label: 'CFTR:p.Phe508del' },
    ],
    outputValueKey: 'why.app.genetics.outputValue',
    purposeKey: 'why.app.genetics.purpose',
    visualTitleKey: 'why.app.genetics.visualTitle',
    riskKey: 'why.app.genetics.risk',
    psiKeepKey: 'why.app.genetics.psiKeep',
    resultItemKeys: ['why.app.genetics.resultItem1', 'why.app.genetics.resultItem2'],
  },
  recommendation: {
    leftKey: 'why.app.recommendation.left',
    leftTagKey: 'why.app.recommendation.leftTag',
    leftItems: [
      { label: 'movie:Arrival' },
      { label: 'song:Night Drive', match: true },
      { label: 'movie:Spirited Away', match: true },
      { label: 'song:Blue Hour' },
    ],
    rightKey: 'why.app.recommendation.right',
    rightTagKey: 'why.app.recommendation.rightTag',
    rightItems: [
      { label: 'song:Night Drive', match: true },
      { label: 'movie:Moonrise' },
      { label: 'movie:Spirited Away', match: true },
      { label: 'song:Paper Lantern' },
    ],
    outputValueKey: 'why.app.recommendation.outputValue',
    purposeKey: 'why.app.recommendation.purpose',
    visualTitleKey: 'why.app.recommendation.visualTitle',
    riskKey: 'why.app.recommendation.risk',
    psiKeepKey: 'why.app.recommendation.psiKeep',
    resultItemKeys: ['why.app.recommendation.resultItem1', 'why.app.recommendation.resultItem2'],
  },
  contacts: {
    leftKey: 'why.app.contacts.left',
    leftTagKey: 'why.app.contacts.leftTag',
    leftItems: [
      { label: '+1 555 0142' },
      { label: '+1 555 0188', match: true },
      { label: '+1 555 0221' },
      { label: '+1 555 0330', match: true },
    ],
    rightKey: 'why.app.contacts.right',
    rightTagKey: 'why.app.contacts.rightTag',
    rightItems: [
      { label: 'maya / +1 555 0188', match: true },
      { label: 'noah / +1 555 0191' },
      { label: 'li / +1 555 0330', match: true },
      { label: 'zoe / +1 555 0404' },
    ],
    outputValueKey: 'why.app.contacts.outputValue',
    purposeKey: 'why.app.contacts.purpose',
    visualTitleKey: 'why.app.contacts.visualTitle',
    riskKey: 'why.app.contacts.risk',
    psiKeepKey: 'why.app.contacts.psiKeep',
    resultItemKeys: ['why.app.contacts.resultItem1', 'why.app.contacts.resultItem2'],
  },
  ads: {
    leftKey: 'why.app.ads.left',
    leftTagKey: 'why.app.ads.leftTag',
    leftItems: [
      { label: 'ad-user-a17' },
      { label: 'ad-user-k08', match: true },
      { label: 'ad-user-m44', match: true },
      { label: 'ad-user-p30' },
    ],
    rightKey: 'why.app.ads.right',
    rightTagKey: 'why.app.ads.rightTag',
    rightItems: [
      { label: 'buyer-k08', match: true },
      { label: 'buyer-n12' },
      { label: 'buyer-m44', match: true },
      { label: 'buyer-z90' },
    ],
    outputValueKey: 'why.app.ads.outputValue',
    purposeKey: 'why.app.ads.purpose',
    visualTitleKey: 'why.app.ads.visualTitle',
    riskKey: 'why.app.ads.risk',
    psiKeepKey: 'why.app.ads.psiKeep',
    resultItemKeys: ['why.app.ads.resultItem'],
  },
  tracing: {
    leftKey: 'why.app.tracing.left',
    leftTagKey: 'why.app.tracing.leftTag',
    leftItems: [
      { label: 'encounter-7a' },
      { label: 'encounter-9d', match: true },
      { label: 'encounter-2f' },
      { label: 'encounter-4c' },
    ],
    rightKey: 'why.app.tracing.right',
    rightTagKey: 'why.app.tracing.rightTag',
    rightItems: [
      { label: 'case-token-5b' },
      { label: 'encounter-9d', match: true },
      { label: 'case-token-8e' },
      { label: 'case-token-1a' },
    ],
    outputValueKey: 'why.app.tracing.outputValue',
    purposeKey: 'why.app.tracing.purpose',
    visualTitleKey: 'why.app.tracing.visualTitle',
    riskKey: 'why.app.tracing.risk',
    psiKeepKey: 'why.app.tracing.psiKeep',
    resultItemKeys: ['why.app.tracing.resultItem'],
  },
}

const aliceItems = ['alice-7', 'shared-42', 'route-8']
const bobItems = ['shared-42', 'bob-9', 'route-8']
const baseByItem: Record<string, number> = {
  'alice-7': 7,
  'shared-42': 11,
  'route-8': 13,
  'bob-9': 17,
}
const toyPrime = 101
const aliceSecret = 6
const bobSecret = 15
const sharedSecretExponent = aliceSecret * bobSecret

function modPow(base: number, exponent: number, modulus: number): number {
  let result = 1
  let b = base % modulus
  let e = exponent
  while (e > 0) {
    if (e % 2 === 1) result = (result * b) % modulus
    b = (b * b) % modulus
    e = Math.floor(e / 2)
  }
  return result
}

function toyHash(item: string) {
  return baseByItem[item]
}

function tokenFor(item: string, exponent: number) {
  return modPow(toyHash(item), exponent, toyPrime)
}

function DhTokenList({ items, step, party }: { items: string[]; step: number; party: 'alice' | 'bob' }) {
  const partyExponent = party === 'alice' ? aliceSecret : bobSecret
  const partySecretName = party === 'alice' ? 'a' : 'b'
  return (
    <div className="dh-token-list">
      {items.map((item) => {
        const shared = aliceItems.includes(item) && bobItems.includes(item)
        const base = toyHash(item)
        const onceBlinded = tokenFor(item, partyExponent)
        const twiceBlinded = tokenFor(item, sharedSecretExponent)
        const body = step === 0
          ? item
          : step === 1
            ? `H(${item}) = ${base} in mod ${toyPrime}`
            : step === 2
              ? `H(${item})^${partySecretName} mod p = ${base}^${partyExponent} mod ${toyPrime} = ${onceBlinded}`
              : `H(${item})^(a*b) mod p = ${base}^(${aliceSecret}*${bobSecret}) mod ${toyPrime} = ${twiceBlinded}`
        return (
          <span key={item} className={'dh-token ' + (step >= 3 && shared ? 'match' : '')}>
            {body}
          </span>
        )
      })}
    </div>
  )
}

function ScenarioList({ title, tag, items, stage }: { title: string; tag: string; items: ScenarioToken[]; stage: number }) {
  return (
    <div className="scenario-list">
      <div className="scenario-list-head">
        <strong>{title}</strong>
        <span>{tag}</span>
      </div>
      <div className="scenario-chip-list">
        {items.map((item) => (
          <span
            key={item.label}
            className={'scenario-chip ' + (
              stage < 2
                ? 'is-neutral'
                : item.match
                  ? 'is-match'
                  : stage >= 2
                    ? 'is-protected'
                    : 'is-private'
            )}
          >
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

function VisualPills({ items }: { items: string[] }) {
  return (
    <div className="visual-pill-row">
      {items.map((item) => <code key={item}>{item}</code>)}
    </div>
  )
}

function ApplicationIllustration({ variant, scenario, stage }: { variant: ApplicationVariant; scenario: ApplicationScenario; stage: number }) {
  const { t } = useI18n()

  const visual = (() => {
    switch (variant) {
      case 'genetics':
        return (
          <div className="case-visual case-health">
            <div className="visual-panel compact">
              <span className="visual-panel-label">{t(scenario.leftKey)}</span>
              <span className="visual-chip match">BRCA1:c.68_69del</span>
              <span className="visual-chip muted">APOE:e4</span>
              <span className="visual-chip match">LDLR:p.G528D</span>
              <span className="visual-chip muted">MTHFR:C677T</span>
            </div>
            <div className="visual-flow-node">∩</div>
            <div className="visual-panel outcome">
              <span className="visual-panel-label">{t('why.app.genetics.visual.result')}</span>
              <VisualPills items={scenario.resultItemKeys.map((key) => t(key))} />
              <strong>{t(scenario.purposeKey)}</strong>
            </div>
          </div>
        )
      case 'recommendation':
        return (
          <div className="case-visual case-fraud">
            <div className="visual-panel compact">
              <span className="visual-panel-label">{t('why.app.recommendation.visual.shared')}</span>
              <span className="visual-chip match">song:Night Drive</span>
              <span className="visual-chip match">movie:Spirited Away</span>
              <span className="visual-chip muted">movie:Moonrise</span>
            </div>
            <div className="fraud-graph recommendation-graph" aria-hidden="true">
              <span className="graph-node graph-bank">{t(scenario.leftKey)}</span>
              <span className="graph-node graph-market">{t(scenario.rightKey)}</span>
              <span className="graph-line graph-line-a" />
              <span className="graph-line graph-line-b" />
              <span className="graph-node graph-device match">{t('why.app.recommendation.visual.signal')}</span>
              <span className="graph-node graph-card match">{t('why.app.recommendation.visual.nonOverlap')}</span>
              <span className="graph-node graph-alert">{t('why.app.recommendation.visual.recs')}</span>
            </div>
          </div>
        )
      case 'contacts':
        return (
          <div className="case-visual case-contacts">
            <div className="phone-frame">
              <span className="phone-speaker" />
              <span className="contact-row muted">Ava +1 555 0142</span>
              <span className="contact-row match">Maya +1 555 0188</span>
              <span className="contact-row muted">Owen +1 555 0221</span>
              <span className="contact-row match">Li +1 555 0330</span>
            </div>
            <div className="visual-flow-node">→</div>
            <div className="visual-panel outcome suggestions">
              <span className="visual-panel-label">{t('why.app.contacts.visual.suggestions')}</span>
              <VisualPills items={scenario.resultItemKeys.map((key) => t(key))} />
              <strong>{t(scenario.purposeKey)}</strong>
            </div>
          </div>
        )
      case 'ads':
        return (
          <div className="case-visual case-ads">
            <div className="ad-funnel">
              <div className="funnel-step wide">
                <span>{t(scenario.leftKey)}</span>
                <strong>{t('why.app.ads.visual.exposed')}</strong>
              </div>
              <div className="funnel-step mid">
                <span>{t(scenario.rightKey)}</span>
                <strong>{t('why.app.ads.visual.buyers')}</strong>
              </div>
              <div className="funnel-step narrow match">
                <span>{t('why.app.scene.overlap')}</span>
                <strong>{t(scenario.outputValueKey)}</strong>
              </div>
            </div>
            <div className="conversion-pairs">
              <span>ad-user-k08 = buyer-k08</span>
              <span>ad-user-m44 = buyer-m44</span>
            </div>
          </div>
        )
      case 'tracing':
        return (
          <div className="case-visual case-tracing">
            <div className="exposure-timeline" aria-hidden="true">
              <span className="timeline-dot">7a</span>
              <span className="timeline-dot match">9d</span>
              <span className="timeline-dot">2f</span>
              <span className="timeline-dot">4c</span>
            </div>
            <div className="positive-token-card">
              <span>{t(scenario.rightKey)}</span>
              <strong>encounter-9d</strong>
            </div>
            <div className="exposure-alert">
              <strong>{t(scenario.outputValueKey)}</strong>
              <p>{t(scenario.purposeKey)}</p>
            </div>
          </div>
        )
      default:
        return null
    }
  })()

  return (
    <div className={'application-illustration illustration-' + variant + ' walkthrough-stage-' + stage}>
      <span className="scene-stage-label">
        {t(`why.app.walkthrough.stage${stage}.title`)}
      </span>
      {stage >= 2 && (
        <div className="visual-heading">
          <span>{t(scenario.visualTitleKey)}</span>
          <strong>{t(scenario.outputValueKey)}</strong>
        </div>
      )}
      {stage === 0 ? (
        <div className="walkthrough-ready">
          <span aria-hidden="true">🔒</span>
          <strong>{t(scenario.leftKey)} + {t(scenario.rightKey)}</strong>
          <p>{t('why.app.walkthrough.stage0.body')}</p>
        </div>
      ) : stage === 1 ? (
        <div className="walkthrough-purpose">
          <span aria-hidden="true">🎯</span>
          <strong>{t('why.app.walkthrough.stage1.prompt')}</strong>
          <p>{t(scenario.purposeKey)}</p>
        </div>
      ) : visual}
      {stage === 3 && (
        <div className="privacy-comparison walkthrough-leakage">
          <div className="privacy-card output is-visible">
            <span>{t('why.app.walkthrough.intendedLeak')}</span>
            <p>{t('why.app.walkthrough.outputLeak', { output: t(scenario.outputValueKey) })}</p>
          </div>
          <div className="privacy-card risk is-visible">
            <span>{t('why.app.walkthrough.rawLeak')}</span>
            <p>{t(scenario.riskKey)}</p>
          </div>
          <div className="privacy-card psi is-visible">
            <span>{t('why.app.walkthrough.keptPrivate')}</span>
            <p>{t(scenario.psiKeepKey)}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function ApplicationExplorer() {
  const { t } = useI18n()
  const [variant, setVariant] = useState<ApplicationVariant>('genetics')
  const [stage, setStage] = useState(0)
  const activeItem = applicationItems.find((item) => item.variant === variant) ?? applicationItems[0]
  const scenario = applicationScenarios[activeItem.variant]
  const stageKeys = ['stage0', 'stage1', 'stage2', 'stage3'] as const

  const chooseVariant = (nextVariant: ApplicationVariant) => {
    setVariant(nextVariant)
    setStage(0)
  }

  return (
    <Card type="title" color={activeItem.color} className={'application-lab-card scenario-' + activeItem.variant}>
      <div className="application-lab-copy">
        <span className="info-kicker">{t('why.apps.kicker')}</span>
        <h4>{t(`${activeItem.key}.title`)}</h4>
        <p>{t('why.app.walkthrough.intro')}</p>
      </div>

      <div className="application-lab-layout">
        <div className="application-picker" role="tablist" aria-label={t('why.apps.title')}>
          {applicationItems.map((item) => (
            <button
              key={item.variant}
              type="button"
              role="tab"
              aria-selected={item.variant === activeItem.variant}
              className={item.variant === activeItem.variant ? 'active' : ''}
              onClick={() => chooseVariant(item.variant)}
            >
              <Icon name={item.icon} size={24} bounce={item.variant === activeItem.variant} />
              <span>{t(`${item.key}.title`)}</span>
            </button>
          ))}
        </div>

        <div className="application-walkthrough">
          <div className="walkthrough-progress-head">
            <div>
              <span>{t('why.app.walkthrough.label')}</span>
              <strong>{t('why.app.walkthrough.progress', { current: stage + 1, total: stageKeys.length })}</strong>
            </div>
            <p>{t(`why.app.walkthrough.${stageKeys[stage]}.body`)}</p>
          </div>
          <div className="walkthrough-stepper" role="tablist" aria-label={t('why.app.walkthrough.label')}>
            {stageKeys.map((stageKey, index) => (
              <button
                key={stageKey}
                type="button"
                role="tab"
                aria-selected={stage === index}
                className={stage === index ? 'active' : stage > index ? 'complete' : ''}
                onClick={() => setStage(index)}
              >
                <span>{stage > index ? '✓' : index + 1}</span>
                <strong>{t(`why.app.walkthrough.${stageKey}.title`)}</strong>
              </button>
            ))}
          </div>

          <div className={'application-scene walkthrough-scene stage-' + stage} aria-label={t(`${activeItem.key}.animation`)}>
          <div className="scene-party scene-party-left">
            <ScenarioList
              title={t(scenario.leftKey)}
              tag={t(scenario.leftTagKey)}
              items={scenario.leftItems}
              stage={stage}
            />
          </div>

          <ApplicationIllustration variant={activeItem.variant} scenario={scenario} stage={stage} />

          <div className="scene-party scene-party-right">
            <ScenarioList
              title={t(scenario.rightKey)}
              tag={t(scenario.rightTagKey)}
              items={scenario.rightItems}
              stage={stage}
            />
          </div>

          {stage >= 2 && <div className="scene-outcome-strip is-visible">
            <div>
              <span>{t('why.app.stage.output')}</span>
              <strong>{t(scenario.outputValueKey)}</strong>
            </div>
            <div>
              <span>{t('why.app.stage.use')}</span>
              <p>{t(scenario.purposeKey)}</p>
            </div>
          </div>}
          </div>

          <div className="walkthrough-controls">
            <Button type="default" disabled={stage === 0} onClick={() => setStage((current) => Math.max(0, current - 1))}>
              {t('why.app.walkthrough.prev')}
            </Button>
            <Button type="primary" onClick={() => setStage((current) => current === stageKeys.length - 1 ? 0 : current + 1)}>
              {stage === stageKeys.length - 1 ? t('why.app.walkthrough.replay') : t('why.app.walkthrough.next')}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
}

function PsiBridge() {
  const { t } = useI18n()

  return (
    <Card type="dashed" className="psi-bridge-card">
      <div className="psi-bridge-copy">
        <span className="info-kicker">{t('why.psi.kicker')}</span>
        <h3>{t('why.psi.title')}</h3>
        <p>{t('why.psi.body')}</p>
      </div>
      <div className="psi-bridge-flow" aria-label={t('why.psi.title')}>
        <div className="bridge-step bridge-risk">
          <Icon name="icon-map" size={26} />
          <span>{t('why.psi.flow.plain')}</span>
        </div>
        <div className="bridge-step bridge-psi">
          <Icon name="icon-variant" size={26} bounce />
          <span>{t('why.psi.flow.replace')}</span>
        </div>
        <div className="bridge-step bridge-output">
          <Icon name="icon-critterpedia" size={26} />
          <span>{t('why.psi.flow.output')}</span>
        </div>
      </div>
    </Card>
  )
}

function InfoHero({ kicker, title, lead, icon }: {
  kicker: string
  title: string
  lead: string
  icon: IconName
}) {
  return (
    <Card type="title" color="default" className="info-hero-card">
      <div className="info-hero-copy">
        <span className="info-kicker">{kicker}</span>
        <h2>{title}</h2>
        <p>{lead}</p>
      </div>
      <div className="info-hero-icon" aria-hidden="true">
        <Icon name={icon} size={58} bounce />
      </div>
    </Card>
  )
}


function WhyStoryHero() {
  const { t } = useI18n()

  return (
    <Card type="title" color="default" className="why-story-hero">
      <div className="why-story-copy">
        <span className="info-kicker">{t('why.kicker')}</span>
        <h2>{t('why.title')}</h2>
        <p>{t('why.lead')}</p>
      </div>
      <div className="why-story-map">
        <div className="why-story-steps" aria-label={t('why.hero.flowLabel')}>
          <span>{t('why.hero.step1')}</span>
          <span>{t('why.hero.step2')}</span>
          <span>{t('why.hero.step3')}</span>
        </div>
        <div className="why-story-signal">
          <span>{t('why.hero.signal')}</span>
          <strong>{t('why.hero.equation')}</strong>
          <p>{t('why.hero.outputOnly')}</p>
        </div>
      </div>
    </Card>
  )
}

function HistorySection() {
  const { t } = useI18n()

  return (
    <section className="why-section history-section">
      <div className="why-section-heading history-heading">
        <span className="history-kicker">{t('why.history.kicker')}</span>
        <h3 className="why-section-title">{t('why.history.title')}</h3>
        <p>{t('why.history.lead')}</p>
      </div>
      <div className="history-timeline" aria-label={t('why.history.title')}>
        {historyItems.map((item, i) => (
          <article key={item.key} className={'history-card history-tone-' + i}>
            <div className="history-rail" aria-hidden="true">
              <span className="history-index">{String(i + 1).padStart(2, '0')}</span>
              <Icon name={item.icon} size={34} bounce />
              <span className="history-connector" />
            </div>
            <div className="history-year-block">
              <span>{t(item.key + '.date')}</span>
              <strong>{t(item.key + '.era')}</strong>
            </div>
            <div className="history-card-main">
              <h4>{t(item.key + '.title')}</h4>
              <p className="history-body">{t(item.key + '.body')}</p>
              <div className="history-content-grid">
                <div className="history-impact">
                  <span>{t('why.history.impactLabel')}</span>
                  <strong>{t(item.key + '.impact')}</strong>
                </div>
                <ul className="history-detail-list">
                  {item.detailKeys.map((detailKey) => (
                    <li key={detailKey}>{t(detailKey)}</li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function PsiTopicAtlas() {
  const { t } = useI18n()

  return (
    <section className="why-section psi-topic-section">
      <div className="why-section-heading">
        <span className="history-kicker">{t('why.topic.kicker')}</span>
        <h3 className="why-section-title">{t('why.topic.title')}</h3>
        <p>{t('why.topic.lead')}</p>
      </div>
      <div className="psi-topic-groups">
        {psiTopicGroups.map((group) => (
          <section key={group.key} className={'psi-topic-group-block topic-group-' + group.tone} aria-label={t(group.key)}>
            <div className="psi-topic-group-head">
              <span>{t(group.key)}</span>
              <p>{t(group.key + '.body')}</p>
            </div>
            <div className="psi-topic-grid">
              {group.items.map((item) => (
                <article key={item.key} className={'psi-topic-card topic-' + item.tone}>
                  <h4>{t(item.key + '.title')}</h4>
                  <p>{t(item.key + '.body')}</p>
                  <div className="psi-topic-detail">
                    <span>{t('why.topic.functionality')}</span>
                    <strong>{t(item.key + '.function')}</strong>
                  </div>
                  <div className="psi-topic-detail">
                    <span>{t('why.topic.usage')}</span>
                    <strong>{t(item.key + '.use')}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}


function PsiPrimitiveAtlas() {
  const { t } = useI18n()

  return (
    <section className="why-section psi-primitive-section">
      <div className="why-section-heading">
        <span className="history-kicker">{t('why.primitive.kicker')}</span>
        <h3 className="why-section-title">{t('why.primitive.title')}</h3>
        <p>{t('why.primitive.lead')}</p>
      </div>
      <div className="psi-topic-groups primitive-groups">
        {psiPrimitiveGroups.map((group) => (
          <section key={group.key} className={'psi-topic-group-block topic-group-' + group.tone} aria-label={t(group.key)}>
            <div className="psi-topic-group-head">
              <span>{t(group.key)}</span>
              <p>{t(group.key + '.body')}</p>
            </div>
            <div className="psi-topic-grid primitive-grid">
              {group.items.map((item) => (
                <article key={item.key} className={'psi-topic-card primitive-card topic-' + item.tone}>
                  <h4>{t(item.key + '.title')}</h4>
                  <p>{t(item.key + '.body')}</p>
                  <div className="psi-topic-detail">
                    <span>{t('why.primitive.role')}</span>
                    <strong>{t(item.key + '.role')}</strong>
                  </div>
                  <div className="psi-topic-detail">
                    <span>{t('why.primitive.common')}</span>
                    <strong>{t(item.key + '.common')}</strong>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

export function WhyPsiPage() {
  const { t } = useI18n()
  const [step, setStep] = useState(0)
  const stepCount = 4
  const intersection = aliceItems.filter((item) => bobItems.includes(item))

  return (
    <main className="info-page why-page">
      <WhyStoryHero />

      <section className="why-section applications-section">
        <div className="why-section-heading">
          <h3 className="why-section-title">{t('why.apps.title')}</h3>
          <p>{t('why.apps.lead')}</p>
        </div>
        <ApplicationExplorer />
      </section>

      <PsiBridge />

      <Card type="default" className="dh-demo-card">
        <div className="dh-demo-header">
          <div>
            <span className="info-kicker">{t('why.dh.kicker')}</span>
            <h3>{t('why.dh.title')}</h3>
            <p>{t('why.dh.lead')}</p>
          </div>
          <div className="dh-param-card">
            <code>p={toyPrime}, a={aliceSecret}, b={bobSecret}, a*b={sharedSecretExponent}</code>
            <span>{t('why.dh.params', { p: toyPrime, a: aliceSecret, b: bobSecret, ab: sharedSecretExponent })}</span>
          </div>
        </div>
        <Divider type="wave-yellow" />

        <div className="dh-stepper" role="tablist" aria-label={t('why.dh.title')}>
          {[0, 1, 2, 3].map((i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === step}
              aria-label={t('why.dh.progress', { step: i + 1, total: stepCount })}
              className={i === step ? 'active' : ''}
              onClick={() => setStep(i)}
            >
              {i + 1}
            </button>
          ))}
        </div>

        <div className="dh-step-copy">
          <div className="dh-step-meta">
            <span>{t('why.dh.progress', { step: step + 1, total: stepCount })}</span>
            <strong>{step >= 3 ? intersection.join(', ') : t('why.dh.hidden')}</strong>
          </div>
          <h4>{t('why.dh.step' + step + '.title')}</h4>
          <p>{t('why.dh.step' + step + '.body')}</p>
        </div>

        <div className="dh-party-grid">
          <Card type="dashed" className="dh-party-card">
            <h4>{t('why.dh.alice')}</h4>
            <DhTokenList items={aliceItems} step={step} party="alice" />
          </Card>
          <Card type="dashed" className="dh-party-card">
            <h4>{t('why.dh.bob')}</h4>
            <DhTokenList items={bobItems} step={step} party="bob" />
          </Card>
        </div>

        <div className="dh-result-row">
          <span>{t('why.dh.intersection')}</span>
          <code>{step >= 3 ? intersection.join(', ') : t('why.dh.hidden')}</code>
        </div>

        <div className="dh-controls">
          <Button type="default" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
            {t('why.dh.prev')}
          </Button>
          <Button type="primary" disabled={step === stepCount - 1} onClick={() => setStep((s) => Math.min(stepCount - 1, s + 1))}>
            {t('why.dh.next')}
          </Button>
        </div>
      </Card>

      <HistorySection />

      <PsiTopicAtlas />

      <PsiPrimitiveAtlas />
    </main>
  )
}

export function GuidePage() {
  const { t } = useI18n()

  return (
    <main className="info-page">
      <InfoHero
        kicker={t('guide.kicker')}
        title={t('guide.title')}
        lead={t('guide.lead')}
        icon="icon-map"
      />

      <div className="info-app-grid">
        {guideSteps.map((step, i) => (
          <Card key={step.key} type="title" color={step.color} className="info-step-card">
            <div className="info-step-icon"><Icon name={step.icon} size={34} bounce /></div>
            <span className="info-index">{String(i + 1).padStart(2, '0')}</span>
            <h3>{t(`${step.key}.title`)}</h3>
            <p>{t(`${step.key}.body`)}</p>
          </Card>
        ))}
      </div>

      <div className="guide-mode-grid">
        {guideModeCards.map((mode) => (
          <Card key={mode.key} type="title" color={mode.color} className="guide-mode-card">
            <Icon name={mode.icon} size={32} bounce />
            <div>
              <h3>{t(mode.key + '.title')}</h3>
              <p>{t(mode.key + '.body')}</p>
              <span>{t(mode.key + '.best')}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="info-command-row">
        <Collapse
          defaultExpanded
          question={t('guide.demo.title')}
          answer={
            <div className="info-collapse-body">
              <p>{t('guide.demo.body')}</p>
            </div>
          }
        />
        <Collapse
          question={t('guide.practical.title')}
          answer={
            <div className="info-collapse-body">
              <p>{t('guide.practical.body')}</p>
            </div>
          }
        />
      </div>
    </main>
  )
}

export function ProjectPage() {
  const { t } = useI18n()

  return (
    <main className="info-page">
      <InfoHero
        kicker={t('project.kicker')}
        title={t('project.title')}
        lead={t('project.lead')}
        icon="icon-helicopter"
      />

      <div className="project-stat-grid">
        {projectStats.map((stat) => (
          <Card key={stat.key} type="title" color={stat.color} className="project-stat-card">
            <Icon name={stat.icon} size={30} bounce />
            <span>{t(stat.key + '.label')}</span>
            <strong>{t(stat.key + '.value')}</strong>
          </Card>
        ))}
      </div>

      <div className="project-cards">
        {projectPoints.map((point) => (
          <Card key={point.key} type="title" color={point.color} className="project-feature-card">
            <Icon name={point.icon} size={32} bounce />
            <div>
              <h3>{t(`${point.key}.title`)}</h3>
              <p>{t(`${point.key}.body`)}</p>
            </div>
          </Card>
        ))}
      </div>

      <Card type="dashed" className="info-path-card">
        <h3>{t('project.arch.title')}</h3>
        <Divider type="wave-yellow" />
        <div className="info-path" aria-label={t('project.arch.title')}>
          <span>{t('project.arch.client')}</span>
          <span>{t('project.arch.party')}</span>
          <span>{t('project.arch.protocol')}</span>
          <span>{t('project.arch.result')}</span>
        </div>
      </Card>
    </main>
  )
}

export function ProtocolsPage({ available }: { available?: string[] | null }) {
  const { t } = useI18n()

  return (
    <main className="info-page">
      <InfoHero
        kicker={t('protocols.kicker')}
        title={t('protocols.title')}
        lead={t('protocols.lead')}
        icon="icon-critterpedia"
      />

      <div className="protocol-summary-strip">
        <div>
          <span>{t('protocol.summary.total')}</span>
          <strong>{PROTOCOLS.length}</strong>
        </div>
        <div>
          <span>{t('protocol.summary.built')}</span>
          <strong>{available?.length ?? t('console.stat.pending')}</strong>
        </div>
        <div>
          <span>{t('protocol.summary.source')}</span>
          <strong>{t('protocol.summary.discovery')}</strong>
        </div>
      </div>

      <div className="protocol-category-list">
        {PROTOCOL_CATEGORIES.map((category) => {
          const categoryProtocols = PROTOCOLS.filter((protocol) => protocol.category === category.id)
          const builtCount = available == null
            ? null
            : categoryProtocols.filter((protocol) => available.includes(protocol.id)).length
          const headingId = `protocol-category-${category.id}`

          return (
            <section className="protocol-category-section" aria-labelledby={headingId} key={category.id}>
              <div className="protocol-category-heading">
                <div>
                  <span className="protocol-category-kicker">{t('protocol.category')}</span>
                  <h2 id={headingId}>{t(category.labelKey)}</h2>
                </div>
                <span className="protocol-category-count">
                  {builtCount == null
                    ? t('protocol.category.knownCount', { total: categoryProtocols.length })
                    : t('protocol.category.builtCount', { built: builtCount, total: categoryProtocols.length })}
                </span>
              </div>

              <div className="protocol-list">
                {categoryProtocols.map((p) => {
                  const isAvailable = available?.includes(p.id) ?? null
                  return (
                    <Card key={p.id} type="title" color={p.color} className="protocol-card">
                      <div className="protocol-heading">
                        <Icon name={p.icon} size={38} bounce />
                        <div>
                          <div className="protocol-title-row">
                            <h3>{p.name}</h3>
                            {isAvailable !== null && (
                              <span className={'protocol-status ' + (isAvailable ? 'ok' : 'warn')}>
                                {isAvailable ? t('protocol.available') : t('protocol.notAvailable')}
                              </span>
                            )}
                          </div>
                          <code>{p.id}</code>
                        </div>
                      </div>
                      <div className="protocol-chip-row">
                        {p.chips.map((chip) => <span key={chip}>{t(chip)}</span>)}
                      </div>
                      <Divider type="line-white" />
                      <div className="protocol-details">
                        <span>{t('protocol.model')}</span>
                        <p>{t(p.modelKey)}</p>
                        <span>{t('protocol.dealer')}</span>
                        <p>{t(p.dealerKey)}</p>
                        <span>{t('protocol.fit')}</span>
                        <p>{t(p.fitKey)}</p>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
    </main>
  )
}

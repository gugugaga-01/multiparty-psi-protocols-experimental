import { useMemo, useState } from 'react'
import { Button, Card, Divider } from 'animal-island-ui'
import { useI18n } from '../i18n'
import {
  APPLICATION_CASES,
  GLOSSARY,
  HISTORY,
  LEARN_SOURCES,
  TOY_GROUP,
  TOY_ITEMS,
  toyToken,
  type LearnSource,
  type LocalizedText,
} from '../learnContent'

const categoryOrder = ['all', 'functionality', 'output', 'security', 'data', 'primitive'] as const
type Category = typeof categoryOrder[number]

function SourceLinks({ ids, compact = false }: { ids: readonly string[]; compact?: boolean }) {
  const { locale } = useI18n()
  return (
    <span className={'learn-source-links ' + (compact ? 'compact' : '')}>
      {ids.map((id) => {
        const source = LEARN_SOURCES.find((item) => item.id === id)
        if (!source) return null
        return (
          <a key={id} href={source.url} target="_blank" rel="noreferrer">
            {compact ? `[${source.year ?? source.id}]` : `${source.title}${source.year ? ` (${source.year})` : ''}`}
            <span className="sr-only">{locale === 'zh' ? '（在新标签页打开）' : ' (opens in a new tab)'}</span>
          </a>
        )
      })}
    </span>
  )
}

function SectionHeading({ number, title, body }: { number: string; title: string; body: string }) {
  return (
    <div className="learn-section-heading">
      <span>{number}</span>
      <div><h2>{title}</h2><p>{body}</p></div>
    </div>
  )
}

function DhTokens({ party, step }: { party: 'alice' | 'bob'; step: number }) {
  const items = TOY_ITEMS[party]
  const ownSecret = party === 'alice' ? TOY_GROUP.aliceSecret : TOY_GROUP.bobSecret
  const otherSecret = party === 'alice' ? TOY_GROUP.bobSecret : TOY_GROUP.aliceSecret
  const otherName = party === 'alice' ? 'b' : 'a'
  return (
    <div className="learn-token-list">
      {items.map((item) => {
        const base = TOY_ITEMS.bases[item]
        const once = toyToken(item, ownSecret)
        const twice = toyToken(item, ownSecret * otherSecret)
        const shared = TOY_ITEMS.alice.includes(item) && TOY_ITEMS.bob.includes(item)
        const text = step === 0 ? item
          : step === 1 ? `H(${item}) = ${base}`
            : step === 2 ? `${base}^${ownSecret} mod 23 = ${once}`
              : `${once}^${otherName} mod 23 = ${twice}`
        return <code key={item} className={step === 3 && shared ? 'match' : ''}>{text}</code>
      })}
    </div>
  )
}

export function LearnPage() {
  const { locale } = useI18n()
  const local = (text: LocalizedText) => text[locale]
  const [caseId, setCaseId] = useState(APPLICATION_CASES[0].id)
  const [dhStep, setDhStep] = useState(0)
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<Category>('all')
  const [showAll, setShowAll] = useState(false)
  const activeCase = APPLICATION_CASES.find((item) => item.id === caseId) ?? APPLICATION_CASES[0]
  const filteredGlossary = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase(locale === 'zh' ? 'zh-CN' : 'en')
    return GLOSSARY.filter((entry) => {
      const categoryMatch = category === 'all' || entry.category === category
      const textMatch = !needle || `${entry.term[locale]} ${entry.summary[locale]} ${entry.detail[locale]}`.toLocaleLowerCase().includes(needle)
      const depthMatch = showAll || Boolean(entry.essential) || Boolean(needle) || category !== 'all'
      return categoryMatch && textMatch && depthMatch
    })
  }, [category, locale, query, showAll])

  const copy = locale === 'zh' ? zh : en

  return (
    <main className="info-page why-page learn-page">
      <Card type="title" color="default" className="learn-hero">
        <div>
          <span className="info-kicker">{copy.kicker}</span>
          <h1>{copy.title}</h1>
          <p>{copy.lead}</p>
          <div className="learn-hero-pills"><span>{copy.exact}</span><span>{copy.conditional}</span><span>{copy.output}</span></div>
        </div>
        <div className="learn-equation" aria-label={copy.equationLabel}>
          <span>A</span><strong>∩</strong><span>B</span><b>= shared items</b>
        </div>
      </Card>

      <nav className="learn-path" aria-label={copy.pathLabel}>
        {copy.path.map((label, index) => <a key={label} href={`#learn-${index + 1}`}><span>{index + 1}</span>{label}</a>)}
      </nav>

      <section id="learn-1" className="learn-section">
        <SectionHeading number="01" title={copy.oneTitle} body={copy.oneBody} />
        <div className="learn-concept-grid">
          {copy.concepts.map((item) => <Card key={item.title} type="dashed" className="learn-concept-card"><h3>{item.title}</h3><p>{item.body}</p></Card>)}
        </div>
        <aside className="learn-callout exact"><strong>{copy.exactTitle}</strong><p>{copy.exactBody}</p></aside>
      </section>

      <section id="learn-2" className="learn-section">
        <SectionHeading number="02" title={copy.twoTitle} body={copy.twoBody} />
        <div className="learn-boundary-grid">
          <article className="learn-boundary protects"><h3>{copy.protectsTitle}</h3><ul>{copy.protects.map((x) => <li key={x}>{x}</li>)}</ul></article>
          <article className="learn-boundary leaks"><h3>{copy.leaksTitle}</h3><ul>{copy.leaks.map((x) => <li key={x}>{x}</li>)}</ul></article>
        </div>
        <aside className="learn-callout warning"><strong>{copy.modelTitle}</strong><p>{copy.modelBody}</p></aside>
      </section>

      <section id="learn-3" className="learn-section">
        <SectionHeading number="03" title={copy.threeTitle} body={copy.threeBody} />
        <div className="learn-output-grid">
          {copy.outputs.map((item) => <article key={item.title}><span>{item.symbol}</span><h3>{item.title}</h3><p>{item.body}</p></article>)}
        </div>
      </section>

      <section id="learn-4" className="learn-section">
        <SectionHeading number="04" title={copy.fourTitle} body={copy.fourBody} />
        <div className="learn-case-tabs" role="tablist" aria-label={copy.fourTitle}>
          {APPLICATION_CASES.map((item) => <button key={item.id} role="tab" aria-selected={item.id === activeCase.id} className={item.id === activeCase.id ? 'active' : ''} onClick={() => setCaseId(item.id)}>{local(item.title)}</button>)}
        </div>
        <Card type="default" className="learn-case-card">
          <div className="learn-case-title"><h3>{local(activeCase.title)}</h3><span>{local(activeCase.fit)}</span></div>
          <dl>
            <div><dt>{copy.parties}</dt><dd>{local(activeCase.parties)}</dd></div>
            <div><dt>{copy.inputs}</dt><dd>{local(activeCase.inputs)}</dd></div>
            <div><dt>{copy.result}</dt><dd>{local(activeCase.output)}</dd></div>
            <div className="leakage"><dt>{copy.leakage}</dt><dd>{local(activeCase.leakage)}</dd></div>
          </dl>
          <SourceLinks ids={activeCase.sourceIds} compact />
        </Card>
      </section>

      <section id="learn-5" className="learn-section">
        <SectionHeading number="05" title={copy.fiveTitle} body={copy.fiveBody} />
        <Card type="default" className="learn-dh-card">
          <div className="learn-dh-head"><div><h3>{copy.toyTitle}</h3><p>{copy.toyBody}</p></div><code>p=23 · q=11 · a=3 · b=7</code></div>
          <Divider type="wave-yellow" />
          <div className="learn-stepper" role="tablist" aria-label={copy.toyTitle}>
            {copy.dhSteps.map((item, index) => <button key={item.title} role="tab" aria-selected={dhStep === index} className={dhStep === index ? 'active' : ''} onClick={() => setDhStep(index)}><span>{index + 1}</span>{item.title}</button>)}
          </div>
          <p className="learn-step-explain">{copy.dhSteps[dhStep].body}</p>
          <div className="learn-party-grid"><article><h4>Alice</h4><DhTokens party="alice" step={dhStep} /></article><article><h4>Bob</h4><DhTokens party="bob" step={dhStep} /></article></div>
          <div className="learn-dh-result"><strong>{copy.intersection}</strong><code>{dhStep === 3 ? 'shared-42, route-8' : copy.hidden}</code></div>
          <div className="learn-dh-controls"><Button type="default" disabled={dhStep === 0} onClick={() => setDhStep((x) => x - 1)}>{copy.previous}</Button><Button type="primary" disabled={dhStep === 3} onClick={() => setDhStep((x) => x + 1)}>{copy.next}</Button></div>
        </Card>
        <aside className="learn-callout bridge"><strong>{copy.bridgeTitle}</strong><p>{copy.bridgeBody}</p><SourceLinks ids={['ristretto']} compact /></aside>
      </section>

      <section id="learn-6" className="learn-section">
        <SectionHeading number="06" title={copy.sixTitle} body={copy.sixBody} />
        <div className="learn-history">
          {HISTORY.map((item) => <article key={item.year}><time>{item.year}</time><div><h3>{local(item.title)}</h3><p>{local(item.body)}</p><SourceLinks ids={item.sourceIds} compact /></div></article>)}
        </div>
      </section>

      <section className="learn-section learn-reference">
        <SectionHeading number="↳" title={copy.referenceTitle} body={copy.referenceBody} />
        <div className="learn-search-row">
          <label><span>{copy.search}</span><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder={copy.searchPlaceholder} /></label>
          <button type="button" className="learn-depth-button" onClick={() => setShowAll((x) => !x)} aria-expanded={showAll}>{showAll ? copy.essentials : copy.showAll}</button>
        </div>
        <div className="learn-filter-row" aria-label={copy.filterLabel}>
          {categoryOrder.map((item) => <button type="button" key={item} className={category === item ? 'active' : ''} aria-pressed={category === item} onClick={() => setCategory(item)}>{copy.categories[item]}</button>)}
        </div>
        <p className="learn-result-count" aria-live="polite">{copy.results.replace('{count}', String(filteredGlossary.length))}</p>
        <div className="learn-glossary-grid">
          {filteredGlossary.map((entry) => <article key={entry.id}><div><span>{copy.categories[entry.category]}</span>{entry.essential && <b>{copy.essential}</b>}</div><h3>{local(entry.term)}</h3><p>{local(entry.summary)}</p><details><summary>{copy.more}</summary><p>{local(entry.detail)}</p>{entry.sourceIds && <SourceLinks ids={entry.sourceIds} compact />}</details></article>)}
        </div>
        {filteredGlossary.length === 0 && <p className="learn-empty">{copy.empty}</p>}
      </section>

      <section className="learn-section learn-bibliography">
        <SectionHeading number="§" title={copy.sourcesTitle} body={copy.sourcesBody} />
        {(['foundations', 'performance', 'multiparty', 'implementation'] as LearnSource['group'][]).map((group) => <div key={group}><h3>{copy.sourceGroups[group]}</h3><ol>{LEARN_SOURCES.filter((source) => source.group === group).map((source) => <li key={source.id}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a>{source.year && <span> · {source.year}</span>}</li>)}</ol></div>)}
      </section>
    </main>
  )
}

const en = {
  kicker: 'Learn PSI', title: 'Private intersection, without the magic words', lead: 'Start with the useful question, then add the privacy boundaries. This path explains what PSI computes, what it can still reveal, and how to choose the right result.',
  exact: 'Exact matching', conditional: 'Conditional privacy', output: 'Choose the output', equationLabel: 'Intersection of set A and set B', pathLabel: 'Six-part PSI learning path', path: ['The idea', 'Privacy boundary', 'Choose an output', 'Real uses', 'DH walkthrough', 'History'],
  oneTitle: 'PSI in five minutes', oneBody: 'Two or more owners compare sets and learn an agreed result about the overlap. They do not need to send every raw record to one another.',
  concepts: [{ title: 'Input', body: 'Each party starts with a set of consistently encoded values.' }, { title: 'Computation', body: 'A protocol makes equal values comparable while limiting exposure of nonmatches.' }, { title: 'Output', body: 'The parties learn the intersection, its size, an aggregate, or another explicitly defined result.' }],
  exactTitle: 'Equality is byte-level, not human-level', exactBody: '“Alice@example.com” and “alice@example.com” match only if the owners agree on normalization and encoding. Duplicates, fuzzy identities, and missing records need separate rules.',
  twoTitle: 'Privacy is a boundary, not a blanket', twoBody: 'A PSI claim is meaningful only with a specified output, threat model, party roles, and implementation. The protocol reduces disclosure; it does not make the workflow leak-free.',
  protectsTitle: 'A suitable PSI protocol can protect', protects: ['Nonmatching values from direct disclosure', 'The comparison computation from a semi-honest peer', 'Raw sets while producing the agreed result'],
  leaksTitle: 'A deployment may still reveal', leaks: ['The result and often input sizes', 'Roles, timing, traffic volume, errors, and availability', 'Facts inferred from repeated or maliciously chosen queries', 'Low-entropy identifiers guessed with auxiliary knowledge'],
  modelTitle: 'Know this project’s boundary', modelBody: 'psinsieme’s current service integrations target research and semi-honest experiments. Authentication or mTLS protects the channel; it does not upgrade a protocol to malicious security.',
  threeTitle: 'Choose the smallest useful output', threeBody: 'Less output can mean less exposure, but even counts and aggregates can be identifying. Decide the business question before choosing the protocol.',
  outputs: [{ symbol: 'A ∩ B', title: 'Elements', body: 'Reveal the matching identifiers.' }, { symbol: '|A ∩ B|', title: 'Cardinality', body: 'Reveal only the number of matches.' }, { symbol: 'Σ values', title: 'Aggregate', body: 'Compute a sum or statistic over matching rows.' }, { symbol: '≥ t of N', title: 'Threshold', body: 'Reveal items held by at least t parties.' }],
  fourTitle: 'Canonical application patterns', fourBody: 'A good use case states the parties, inputs, exact output, remaining leakage, and protocol family—without pretending PSI solves policy or data quality.', parties: 'Parties', inputs: 'Inputs', result: 'Output', leakage: 'Remaining leakage',
  fiveTitle: 'A sound DH-style toy', fiveBody: 'This tiny prime-order subgroup makes the equality trick inspectable. Its numbers are educational only; they are far too small for security.', toyTitle: 'Blind, exchange, blind again, compare', toyBody: 'We use the order-11 subgroup of integers modulo 23. Alice chooses a=3 and Bob b=7; both paths reach exponent ab.',
  dhSteps: [{ title: 'Private sets', body: 'The parties begin with raw items. No comparison is possible yet.' }, { title: 'Hash to group', body: 'For the toy, each item maps to a valid element of the order-11 subgroup.' }, { title: 'Blind once', body: 'Each party raises its group elements to a private nonzero exponent.' }, { title: 'Blind twice', body: 'After re-blinding received values, equal inputs produce equal tokens because (H(x)^a)^b = (H(x)^b)^a.' }],
  intersection: 'Intersection', hidden: 'hidden until comparison', previous: 'Previous', next: 'Next', bridgeTitle: 'From toy arithmetic to this implementation', bridgeBody: 'Real DH PSI must validate points and use a large prime-order group. This project domain-separates its hash, maps inputs with libsodium’s Ristretto255 hash-to-group operation, samples random nonzero scalars, validates received points, and compares hashed tokens.',
  sixTitle: 'How the field got here', sixBody: 'These milestones distinguish early private matchmaking, formal PSI, performance improvements, and multi-party threshold functionality.',
  referenceTitle: 'Searchable PSI reference', referenceBody: 'Start with the essentials. Open the full library or filter when you need protocol and primitive vocabulary.', search: 'Search terms', searchPlaceholder: 'Try “leakage”, “threshold”, or “OPRF”', showAll: 'Show all terms', essentials: 'Show essentials', filterLabel: 'Glossary categories', results: '{count} terms shown', essential: 'Essential', more: 'Why it matters', empty: 'No terms match this search.',
  categories: { all: 'All', functionality: 'Functionality', output: 'Output', security: 'Security', data: 'Data', primitive: 'Primitive' },
  sourcesTitle: 'Primary sources and implementation references', sourcesBody: 'Inline links point to the paper or project supporting each historical, security, or implementation claim.', sourceGroups: { foundations: 'Foundations', performance: 'Performance', multiparty: 'Multi-party and threshold PSI', implementation: 'Implementation references' },
}

const zh: typeof en = {
  kicker: '学习 PSI', title: '不靠术语，也能理解隐私集合求交', lead: '先从有用的问题出发，再理解隐私边界。这条路径说明 PSI 计算什么、仍可能泄露什么，以及如何选择合适的结果。',
  exact: '精确匹配', conditional: '有条件的隐私', output: '选择输出', equationLabel: '集合 A 与集合 B 的交集', pathLabel: '六部分 PSI 学习路径', path: ['核心概念', '隐私边界', '选择输出', '真实用途', 'DH 演示', '发展历史'],
  oneTitle: '五分钟理解 PSI', oneBody: '两个或更多数据持有方比较集合，并获得约定的交集相关结果，而不必把全部原始记录交给对方。',
  concepts: [{ title: '输入', body: '每一方从一组编码方式一致的值开始。' }, { title: '计算', body: '协议让相等值可比较，同时限制非匹配项的暴露。' }, { title: '输出', body: '各方获得交集、交集大小、聚合值或其他明确定义的结果。' }],
  exactTitle: '相等是字节级的，不是人类语义上的', exactBody: '只有各方约定相同的规范化与编码，“Alice@example.com”和“alice@example.com”才会匹配。重复项、模糊身份与缺失记录需要另行制定规则。',
  twoTitle: '隐私是一条边界，而不是万能保证', twoBody: '只有明确输出、威胁模型、参与方角色与实现方式，PSI 的隐私声明才有意义。协议减少披露，但不会让整个流程完全无泄露。',
  protectsTitle: '合适的 PSI 协议可以保护', protects: ['避免直接披露非匹配值', '在半诚实对手面前保护比较过程', '在生成约定结果时不公开原始集合'],
  leaksTitle: '部署仍可能暴露', leaks: ['结果以及通常可见的输入规模', '角色、时序、流量、错误与可用性', '重复查询或恶意选择查询所推断的信息', '借助辅助知识猜测出的低熵标识符'],
  modelTitle: '了解本项目的边界', modelBody: 'psinsieme 当前的服务集成面向研究与半诚实实验。身份认证或 mTLS 保护信道，但不会把协议升级为恶意安全。',
  threeTitle: '选择满足需求的最小输出', threeBody: '更少的输出通常意味着更少暴露，但计数与聚合也可能识别个人。应先明确业务问题，再选择协议。',
  outputs: [{ symbol: 'A ∩ B', title: '交集元素', body: '揭示匹配的标识符。' }, { symbol: '|A ∩ B|', title: '交集基数', body: '仅揭示匹配数量。' }, { symbol: 'Σ 数值', title: '聚合结果', body: '在匹配行上计算总和或统计量。' }, { symbol: 'N 方中 ≥ t 方', title: '阈值结果', body: '揭示至少由 t 方持有的元素。' }],
  fourTitle: '典型应用模式', fourBody: '好的用例会明确参与方、输入、精确输出、剩余泄露与协议族，而不会假装 PSI 能解决政策或数据质量问题。', parties: '参与方', inputs: '输入', result: '输出', leakage: '剩余泄露',
  fiveTitle: '数学上合理的 DH 风格玩具', fiveBody: '这个微小的素数阶子群便于检查相等性技巧。数字只用于教学，远不足以提供安全性。', toyTitle: '盲化、交换、再次盲化、比较', toyBody: '我们使用模 23 整数中的 11 阶子群。Alice 选择 a=3，Bob 选择 b=7；两条路径最终都得到指数 ab。',
  dhSteps: [{ title: '私有集合', body: '双方从原始元素开始，此时还不能进行比较。' }, { title: '哈希到群', body: '在玩具示例中，每个元素映射到 11 阶子群的有效元素。' }, { title: '首次盲化', body: '每一方使用自己的非零秘密指数对群元素做幂运算。' }, { title: '再次盲化', body: '对收到的值再次盲化后，相同输入产生相同令牌，因为 (H(x)^a)^b = (H(x)^b)^a。' }],
  intersection: '交集', hidden: '比较前保持隐藏', previous: '上一步', next: '下一步', bridgeTitle: '从玩具算术到本项目实现', bridgeBody: '真实 DH PSI 必须验证点并使用大素数阶群。本项目对哈希做域分离，使用 libsodium 的 Ristretto255 哈希到群操作映射输入，采样随机非零标量，验证收到的点，并比较哈希后的令牌。',
  sixTitle: '这一领域如何发展至今', sixBody: '这些里程碑区分了早期私密配对、形式化 PSI、性能改进以及多方阈值功能。',
  referenceTitle: '可搜索的 PSI 参考库', referenceBody: '先学习核心术语；需要协议与密码构件词汇时，再打开完整列表或使用筛选。', search: '搜索术语', searchPlaceholder: '试试“泄露”、“阈值”或“OPRF”', showAll: '显示全部术语', essentials: '仅显示核心术语', filterLabel: '术语分类', results: '显示 {count} 个术语', essential: '核心', more: '为什么重要', empty: '没有符合条件的术语。',
  categories: { all: '全部', functionality: '功能', output: '输出', security: '安全', data: '数据', primitive: '密码构件' },
  sourcesTitle: '主要来源与实现参考', sourcesBody: '行内链接直接指向支持相应历史、安全或实现说明的论文与项目。', sourceGroups: { foundations: '基础工作', performance: '性能进展', multiparty: '多方与阈值 PSI', implementation: '实现参考' },
}

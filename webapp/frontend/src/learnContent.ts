import type { Locale } from './i18n'

export type LocalizedText = Record<Locale, string>

export type LearnSource = {
  id: string
  title: string
  year?: string
  url: string
  group: 'foundations' | 'performance' | 'multiparty' | 'implementation'
}

export type GlossaryEntry = {
  id: string
  term: LocalizedText
  summary: LocalizedText
  detail: LocalizedText
  category: 'functionality' | 'output' | 'security' | 'data' | 'primitive'
  essential?: boolean
  sourceIds?: string[]
}

export type ApplicationCase = {
  id: string
  title: LocalizedText
  parties: LocalizedText
  inputs: LocalizedText
  output: LocalizedText
  leakage: LocalizedText
  fit: LocalizedText
  sourceIds: string[]
}

export const LEARN_SOURCES: LearnSource[] = [
  { id: 'meadows86', title: 'A More Efficient Cryptographic Matchmaking Protocol for Use in the Absence of a Continuously Available Third Party', year: '1986', url: 'https://conferences.computer.org/sp/pdfs/sp/1986/00044469.pdf', group: 'foundations' },
  { id: 'fnp04', title: 'Efficient Private Matching and Set Intersection', year: '2004', url: 'https://www.iacr.org/archive/eurocrypt2004/30270001/pm-eurocrypt04-lncs.pdf', group: 'foundations' },
  { id: 'psz14', title: 'Faster Private Set Intersection Based on OT Extension', year: '2014', url: 'https://www.usenix.org/system/files/conference/usenixsecurity14/sec14-paper-pinkas.pdf', group: 'performance' },
  { id: 'kkrt16', title: 'Efficient Batched Oblivious PRF with Applications to Private Set Intersection', year: '2016', url: 'https://eprint.iacr.org/2016/799.pdf', group: 'performance' },
  { id: 'mpsi17', title: 'Practical Multi-party Private Set Intersection from Symmetric-Key Techniques', year: '2017', url: 'https://eprint.iacr.org/2017/799.pdf', group: 'multiparty' },
  { id: 'otmpsi20', title: 'Practical Over-Threshold Multi-Party Private Set Intersection', year: '2020', url: 'https://dl.acm.org/doi/10.1145/3427228.3427267', group: 'multiparty' },
  { id: 'bay21', title: 'Practical Multi-Party Private Set Intersection Protocols', year: '2021', url: 'https://research.tudelft.nl/files/104543925/Practical_Multi_Party_Private_Set_Intersection_Protocols.pdf', group: 'multiparty' },
  { id: 'trace26', title: 'Practical Traceable Over-Threshold Multi-Party Private Set Intersection', year: '2026', url: 'https://www.ndss-symposium.org/wp-content/uploads/2026-s38-paper.pdf', group: 'multiparty' },
  { id: 'ristretto', title: 'libsodium: Ristretto', url: 'https://doc.libsodium.org/advanced/point-arithmetic/ristretto', group: 'implementation' },
  { id: 'pjc', title: 'Google Private Join and Compute', url: 'https://github.com/google/private-join-and-compute', group: 'implementation' },
]

export const APPLICATION_CASES: ApplicationCase[] = [
  {
    id: 'contacts',
    title: { en: 'Contact discovery', zh: '联系人发现' },
    parties: { en: 'A user and a directory service', zh: '用户与目录服务' },
    inputs: { en: 'Normalized phone numbers or account identifiers', zh: '规范化后的电话号码或账户标识符' },
    output: { en: 'Which contacts are registered', zh: '哪些联系人已经注册' },
    leakage: { en: 'Matches, set sizes, and repeated-query inferences may remain visible.', zh: '匹配项、集合大小以及重复查询产生的推断仍可能可见。' },
    fit: { en: 'Two-party or unbalanced PSI', zh: '两方 PSI 或非平衡 PSI' },
    sourceIds: ['kkrt16'],
  },
  {
    id: 'measurement',
    title: { en: 'Private measurement', zh: '隐私保护测量' },
    parties: { en: 'An event publisher and a conversion owner', zh: '事件发布方与转化数据持有方' },
    inputs: { en: 'Pseudonymous event IDs, optionally with values', zh: '假名化事件 ID，可附带数值' },
    output: { en: 'Intersection size or an aggregate over matching rows', zh: '交集大小或匹配行上的聚合结果' },
    leakage: { en: 'Small or repeated aggregates can reveal individuals; minimum cohort sizes or differential privacy may be needed.', zh: '过小或重复的聚合可能暴露个人；可能需要最小群体规模或差分隐私。' },
    fit: { en: 'PSI cardinality, PSI-Sum, or a private join', zh: 'PSI 基数、PSI-Sum 或隐私连接' },
    sourceIds: ['pjc'],
  },
  {
    id: 'breach',
    title: { en: 'Private membership checks', zh: '隐私成员关系检查' },
    parties: { en: 'A client and a large risk or breach database', zh: '客户端与大型风险或泄露数据库' },
    inputs: { en: 'A small query set and a much larger server set', zh: '较小的查询集合与大得多的服务端集合' },
    output: { en: 'Whether queried identifiers occur in the database', zh: '查询标识符是否存在于数据库中' },
    leakage: { en: 'Low-entropy inputs can be guessed; rate limits and authorization still matter.', zh: '低熵输入可能被猜测；速率限制与授权仍然重要。' },
    fit: { en: 'Unbalanced PSI or private membership test', zh: '非平衡 PSI 或隐私成员测试' },
    sourceIds: ['fnp04'],
  },
  {
    id: 'fraud',
    title: { en: 'Cross-organization risk sharing', zh: '跨机构风险共享' },
    parties: { en: 'Several banks, platforms, or threat-intelligence teams', zh: '多家银行、平台或威胁情报团队' },
    inputs: { en: 'Normalized account, device, or indicator IDs', zh: '规范化的账户、设备或指标 ID' },
    output: { en: 'IDs reported by all parties or by at least t parties', zh: '被所有参与方或至少 t 方报告的 ID' },
    leakage: { en: 'Threshold outputs and holder information are separate capabilities; do not assume traceability.', zh: '阈值输出与持有方信息是不同能力；不能默认具有可追踪性。' },
    fit: { en: 'All-party MPSI or over-threshold MP-PSI', zh: '全参与方 MPSI 或超阈值 MP-PSI' },
    sourceIds: ['mpsi17', 'otmpsi20', 'trace26'],
  },
  {
    id: 'records',
    title: { en: 'Private record linkage', zh: '隐私记录关联' },
    parties: { en: 'Healthcare, research, or public-interest data custodians', zh: '医疗、研究或公共利益数据保管方' },
    inputs: { en: 'Consented, normalized linkage identifiers', zh: '经同意且规范化的关联标识符' },
    output: { en: 'The exact records shared across approved datasets', zh: '获批数据集中完全相同的记录' },
    leakage: { en: 'PSI does not solve consent, data quality, fuzzy identity resolution, or governance.', zh: 'PSI 本身不能解决同意、数据质量、模糊身份解析或治理问题。' },
    fit: { en: 'Two-party PSI or an approved multi-party join', zh: '两方 PSI 或经批准的多方连接' },
    sourceIds: ['fnp04', 'pjc'],
  },
]

export const GLOSSARY: GlossaryEntry[] = [
  { id: 'psi', essential: true, category: 'functionality', term: { en: 'Private set intersection (PSI)', zh: '隐私集合求交（PSI）' }, summary: { en: 'Compute shared elements without revealing every nonmatch.', zh: '在不公开全部非匹配项的情况下计算共同元素。' }, detail: { en: 'The precise privacy guarantee depends on the protocol, roles, output, and adversary model.', zh: '准确的隐私保证取决于协议、角色、输出与对手模型。' }, sourceIds: ['fnp04'] },
  { id: 'mpsi', essential: true, category: 'functionality', term: { en: 'Multi-party PSI (MPSI)', zh: '多方 PSI（MPSI）' }, summary: { en: 'Find elements common to several owners.', zh: '查找多个数据持有方共同拥有的元素。' }, detail: { en: 'All-party MPSI normally means membership in every participating set.', zh: '全参与方 MPSI 通常指元素存在于每一个参与集合中。' }, sourceIds: ['mpsi17'] },
  { id: 'threshold', essential: true, category: 'functionality', term: { en: 'Over-threshold MP-PSI', zh: '超阈值多方 PSI' }, summary: { en: 'Return elements held by at least t of N parties.', zh: '返回至少由 N 方中的 t 方持有的元素。' }, detail: { en: 'Paper acronyms vary, so state the threshold semantics instead of relying on T-MPSI alone.', zh: '论文中的缩写并不统一，应明确阈值语义，而不能只写 T-MPSI。' }, sourceIds: ['otmpsi20'] },
  { id: 'traceable', category: 'functionality', term: { en: 'Traceable over-threshold MP-PSI', zh: '可追踪超阈值多方 PSI' }, summary: { en: 'Adds identification of holders for qualifying elements.', zh: '在满足阈值的元素上增加持有方识别能力。' }, detail: { en: 'This is stronger functionality than threshold intersection alone.', zh: '这比单纯的阈值交集具有更强的功能。' }, sourceIds: ['trace26'] },
  { id: 'cardinality', essential: true, category: 'output', term: { en: 'PSI cardinality (PSI-CA)', zh: 'PSI 基数（PSI-CA）' }, summary: { en: 'Reveal only how many items match.', zh: '仅揭示匹配项的数量。' }, detail: { en: 'A count can still be identifying when cohorts are small or queries repeat.', zh: '当群体很小或重复查询时，计数仍可能识别个人。' }, sourceIds: ['fnp04', 'pjc'] },
  { id: 'sum', category: 'output', term: { en: 'PSI-Sum / private join', zh: 'PSI-Sum / 隐私连接' }, summary: { en: 'Aggregate values attached to matching rows.', zh: '聚合匹配行所附带的数值。' }, detail: { en: 'The aggregate and query pattern are outputs that need their own leakage analysis.', zh: '聚合结果与查询模式都是需要单独分析泄露风险的输出。' }, sourceIds: ['pjc'] },
  { id: 'semi-honest', essential: true, category: 'security', term: { en: 'Semi-honest model', zh: '半诚实模型' }, summary: { en: 'Parties follow the protocol but inspect everything they receive.', zh: '参与方遵守协议，但会分析收到的全部信息。' }, detail: { en: 'It does not protect against malformed messages or maliciously chosen protocol behavior.', zh: '它不能防御畸形消息或恶意选择的协议行为。' }, sourceIds: ['fnp04'] },
  { id: 'malicious', category: 'security', term: { en: 'Malicious security', zh: '恶意安全' }, summary: { en: 'Security when a party may deviate from the protocol.', zh: '参与方可能偏离协议时的安全性。' }, detail: { en: 'The exact corruption threshold and guarantees must still be stated.', zh: '仍需明确腐化阈值与具体保证。' }, sourceIds: ['fnp04'] },
  { id: 'leakage', essential: true, category: 'security', term: { en: 'Leakage', zh: '泄露面' }, summary: { en: 'Information intentionally or incidentally visible during a run.', zh: '一次运行中有意或附带可见的信息。' }, detail: { en: 'Outputs, sizes, roles, timing, traffic volume, errors, and adaptive queries may reveal information.', zh: '输出、规模、角色、时序、流量、错误与自适应查询都可能泄露信息。' } },
  { id: 'transport', essential: true, category: 'security', term: { en: 'Transport security', zh: '传输安全' }, summary: { en: 'Authentication and channel encryption such as mTLS.', zh: '身份认证与 mTLS 等信道加密。' }, detail: { en: 'It protects connections, but does not replace the PSI protocol threat model.', zh: '它保护连接，但不能替代 PSI 协议自身的威胁模型。' } },
  { id: 'normalization', essential: true, category: 'data', term: { en: 'Exact-match normalization', zh: '精确匹配规范化' }, summary: { en: 'Both sides must encode equivalent values identically.', zh: '双方必须以相同方式编码等价值。' }, detail: { en: 'Case, Unicode, phone formats, whitespace, salts, and byte encoding can change equality.', zh: '大小写、Unicode、电话号码格式、空白、盐值和字节编码都会改变相等性。' } },
  { id: 'duplicates', category: 'data', term: { en: 'Sets, multisets, and duplicates', zh: '集合、多重集与重复项' }, summary: { en: 'Many PSI protocols treat duplicate inputs as one element.', zh: '许多 PSI 协议把重复输入视为一个元素。' }, detail: { en: 'Confirm deduplication and multiplicity semantics before interpreting counts.', zh: '解释计数之前，应确认去重与重复次数语义。' } },
  { id: 'low-entropy', essential: true, category: 'data', term: { en: 'Low-entropy identifiers', zh: '低熵标识符' }, summary: { en: 'Values such as phone numbers can be guessed from a limited space.', zh: '电话号码等值可从有限空间中猜测。' }, detail: { en: 'PSI is not a substitute for authorization, rate limiting, input policy, or abuse monitoring.', zh: 'PSI 不能替代授权、速率限制、输入策略或滥用监控。' } },
  { id: 'unbalanced', category: 'data', term: { en: 'Unbalanced PSI', zh: '非平衡 PSI' }, summary: { en: 'Optimize for one set being much larger than the other.', zh: '针对一个集合远大于另一个集合的情况优化。' }, detail: { en: 'Common in membership and breach-checking workloads.', zh: '常见于成员查询与泄露检查负载。' } },
  { id: 'oprf', essential: true, category: 'primitive', term: { en: 'Oblivious PRF (OPRF)', zh: '不经意伪随机函数（OPRF）' }, summary: { en: 'A client evaluates a keyed function without learning the key.', zh: '客户端在不知道密钥的情况下计算带密钥函数。' }, detail: { en: 'Batched OPRFs are a common building block in fast PSI.', zh: '批量 OPRF 是高性能 PSI 的常用构件。' }, sourceIds: ['kkrt16'] },
  { id: 'opprf', category: 'primitive', term: { en: 'Programmable OPRF (OPPRF)', zh: '可编程 OPRF（OPPRF）' }, summary: { en: 'Programs selected input/output pairs while hiding queries.', zh: '在隐藏查询的同时编程选定的输入输出对。' }, detail: { en: 'It is a key symmetric-cryptography tool in practical MPSI.', zh: '它是实用对称密码多方 PSI 的关键工具。' }, sourceIds: ['mpsi17'] },
  { id: 'ot', category: 'primitive', term: { en: 'Oblivious transfer (OT)', zh: '不经意传输（OT）' }, summary: { en: 'Transfer selected messages while hiding the choice.', zh: '在隐藏选择的情况下传输选定消息。' }, detail: { en: 'OT extension expands a small number of expensive base OTs into many efficient OTs.', zh: 'OT 扩展把少量昂贵的基础 OT 扩展为大量高效 OT。' }, sourceIds: ['psz14'] },
  { id: 'hashing', essential: true, category: 'primitive', term: { en: 'Hash-to-group', zh: '哈希到群' }, summary: { en: 'Map arbitrary input bytes to a valid cryptographic group element.', zh: '把任意输入字节映射为有效的密码学群元素。' }, detail: { en: 'Real DH PSI needs a defined, domain-separated mapping—not toy integer assignment.', zh: '真实 DH PSI 需要明确定义且域分离的映射，而不是玩具整数赋值。' }, sourceIds: ['ristretto'] },
  { id: 'secret-sharing', category: 'primitive', term: { en: 'Secret sharing', zh: '秘密分享' }, summary: { en: 'Split a value so only an authorized number of shares reconstructs it.', zh: '拆分一个值，使其只有在达到授权份额数时才能重构。' }, detail: { en: 'Shamir sharing is often used to express threshold behavior.', zh: 'Shamir 分享常用于表达阈值行为。' }, sourceIds: ['trace26'] },
  { id: 'dealer', category: 'security', term: { en: 'Trusted dealer', zh: '可信 dealer' }, summary: { en: 'A setup party distributes correlated keys or randomness.', zh: '负责分发相关密钥或随机性的设置方。' }, detail: { en: 'Dealer trust and deletion assumptions are part of the security model.', zh: '对 dealer 的信任与删除假设属于安全模型的一部分。' } },
]

export const HISTORY = [
  { year: '1986', title: { en: 'Cryptographic matchmaking precursor', zh: '密码学配对先驱' }, body: { en: 'Meadows studied private credential matchmaking; it was a precursor, not a general modern PSI construction.', zh: 'Meadows 研究了私密凭证配对；它是先驱工作，而非现代通用 PSI 构造。' }, sourceIds: ['meadows86'] },
  { year: '2004', title: { en: 'Formal private matching and intersection', zh: '私密匹配与求交的形式化' }, body: { en: 'Freedman, Nissim, and Pinkas presented efficient constructions and explicit adversary settings.', zh: 'Freedman、Nissim 与 Pinkas 提出了高效构造与明确的对手模型。' }, sourceIds: ['fnp04'] },
  { year: '2014–2016', title: { en: 'OT extension and batched OPRFs', zh: 'OT 扩展与批量 OPRF' }, body: { en: 'Symmetric-key techniques pushed two-party PSI toward much larger datasets.', zh: '对称密码技术推动两方 PSI 处理更大规模的数据集。' }, sourceIds: ['psz14', 'kkrt16'] },
  { year: '2017', title: { en: 'Practical multi-party PSI', zh: '实用多方 PSI' }, body: { en: 'OPPRF-based techniques enabled efficient all-party intersection without an honest majority.', zh: '基于 OPPRF 的技术在无需诚实多数的情况下实现了高效全参与方交集。' }, sourceIds: ['mpsi17'] },
  { year: '2020', title: { en: 'Over-threshold multi-party PSI', zh: '超阈值多方 PSI' }, body: { en: 'Protocols targeted elements held by at least t parties, rather than every party.', zh: '协议开始面向至少由 t 方持有、而非必须由所有方持有的元素。' }, sourceIds: ['otmpsi20'] },
  { year: '2026', title: { en: 'Traceable over-threshold PSI', zh: '可追踪超阈值 PSI' }, body: { en: 'Recent work adds holder traceability to qualifying threshold results.', zh: '近期工作为满足阈值的结果增加了持有方追踪能力。' }, sourceIds: ['trace26'] },
] as const

export const TOY_GROUP = { p: 23, q: 11, aliceSecret: 3, bobSecret: 7 } as const
export const TOY_ITEMS = {
  alice: ['alice-7', 'shared-42', 'route-8'],
  bob: ['shared-42', 'bob-9', 'route-8'],
  bases: { 'alice-7': 2, 'shared-42': 3, 'route-8': 4, 'bob-9': 6 } as Record<string, number>,
}

export function modPow(base: number, exponent: number, modulus: number): number {
  let result = 1
  let current = base % modulus
  let remaining = exponent
  while (remaining > 0) {
    if (remaining % 2 === 1) result = (result * current) % modulus
    current = (current * current) % modulus
    remaining = Math.floor(remaining / 2)
  }
  return result
}

export function toyToken(item: string, exponent: number): number {
  return modPow(TOY_ITEMS.bases[item], exponent, TOY_GROUP.p)
}

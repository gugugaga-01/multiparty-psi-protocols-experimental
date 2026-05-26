import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Locale = 'en' | 'zh'

const STORAGE_KEY = 'psinsieme.locale'

type Dict = Record<string, string>

const en: Dict = {
  'app.subtitle': 'Multi-party PSI — KS05 / BEH21 / YYH26 over gRPC + mTLS',
  'app.footer.ui': 'UI',
  'app.footer.backend': 'backend',
  'app.disclaimer.short': 'For research & learning only — not for production; provided as-is, no warranty.',

  'tabs.demo': 'Demo',
  'tabs.practical': 'Practical',

  'locale.label': 'Language',
  'locale.en': 'English',
  'locale.zh': '中文',

  // ClusterCard
  'cluster.title': 'Cluster control',
  'cluster.protocol': 'Protocol',
  'cluster.parties': 'Parties',
  'cluster.mtls': 'mTLS',
  'cluster.start': 'Start cluster',
  'cluster.stop': 'Stop cluster',
  'cluster.builtOk': 'binaries OK',
  'cluster.notBuilt': 'NOT BUILT',
  'cluster.dealerUp': 'dealer up',
  'cluster.dealerDown': 'dealer down',
  'cluster.buildDir': 'build dir',
  'cluster.busy.start': 'Starting cluster ({protocol}, N={n})…',
  'cluster.busy.stop': 'Stopping cluster…',

  // Demo
  'demo.title': 'Demo — one-click run',
  'demo.protocol': 'Protocol',
  'demo.n': 'Parties (N)',
  'demo.t': 'Threshold (t)',
  'demo.t.lockedMpsi': 'Locked to N — plain MPSI intersects all parties',
  'demo.autoCluster': 'Auto-manage cluster',
  'demo.autoCluster.hint': 'Start & stop psi_party processes automatically',
  'demo.customize': 'Customize inputs per party',
  'demo.customize.hint': 'Off uses curated demo input (known overlap)',
  'demo.perParty': 'Per-party input sets — edit the text directly, or use the size field to regenerate that party with a different element count.',
  'demo.party': 'Party',
  'demo.size': 'size:',
  'demo.reset': 'Reset to demo defaults',
  'demo.run': 'Run demo',
  'demo.success': 'success',
  'demo.failed': 'failed',
  'demo.busy': 'Running demo ({protocol}, N={n}, t={t})…',
  'demo.expected': 'Expected intersection',
  'demo.connRefused.hint': 'Is the cluster running? Enable "Auto-manage cluster" or start it from the panel above.',
  'demo.party.input': 'input',
  'demo.party.intersection': 'intersection',
  'demo.party.empty': '(empty)',
  'demo.leader': 'leader',
  'demo.member': 'member',

  // Practical
  'pr.title': 'Practical — one party',
  'pr.oneOwner': 'this browser = one data owner',
  'pr.target': 'Your party endpoint (client API)',
  'pr.leader': 'Leader inter-party address',
  'pr.role': 'Role',
  'pr.role.member': 'Member',
  'pr.role.leader': 'Leader',
  'pr.protocol': 'Protocol',
  'pr.elements': 'Your private elements (one per line, or comma-separated)',
  'pr.mtls.title': 'mTLS settings (optional)',
  'pr.mtls.use': 'Use mTLS',
  'pr.mtls.ca': 'CA certificate (PEM, optional)',
  'pr.mtls.cert': 'Client certificate (PEM, optional)',
  'pr.mtls.key': 'Client key (PEM, optional)',
  'pr.submit': 'Submit',
  'pr.busy': 'Submitting to {target} ({role}, {protocol})…',
  'pr.status': 'Status',
  'pr.intersection': 'Intersection',
}

const zh: Dict = {
  'app.subtitle': '多方隐私集合求交 — KS05 / BEH21 / YYH26，基于 gRPC + mTLS',
  'app.footer.ui': '界面',
  'app.footer.backend': '后端',
  'app.disclaimer.short': '仅供学习与研究使用，不适用于生产环境，按现状提供，不附带任何担保。',

  'tabs.demo': '演示',
  'tabs.practical': '实战',

  'locale.label': '语言',
  'locale.en': 'English',
  'locale.zh': '中文',

  'cluster.title': '集群控制',
  'cluster.protocol': '协议',
  'cluster.parties': '参与方',
  'cluster.mtls': 'mTLS',
  'cluster.start': '启动集群',
  'cluster.stop': '停止集群',
  'cluster.builtOk': '二进制就绪',
  'cluster.notBuilt': '尚未编译',
  'cluster.dealerUp': 'Dealer 在线',
  'cluster.dealerDown': 'Dealer 离线',
  'cluster.buildDir': '编译目录',
  'cluster.busy.start': '正在启动集群（{protocol}，N={n}）…',
  'cluster.busy.stop': '正在停止集群…',

  'demo.title': '演示 — 一键运行',
  'demo.protocol': '协议',
  'demo.n': '参与方数 (N)',
  'demo.t': '阈值 (t)',
  'demo.t.lockedMpsi': '锁定为 N —— 普通 MPSI 对所有参与方求交集',
  'demo.autoCluster': '自动管理集群',
  'demo.autoCluster.hint': '自动启动并停止 psi_party 进程',
  'demo.customize': '自定义每方输入',
  'demo.customize.hint': '关闭时使用预置演示输入（已知重叠）',
  'demo.perParty': '逐方输入集合 — 可直接编辑文本，或通过 size 字段为该方重新生成不同数量的元素。',
  'demo.party': '参与方',
  'demo.size': '大小：',
  'demo.reset': '恢复为演示默认值',
  'demo.run': '运行演示',
  'demo.success': '成功',
  'demo.failed': '失败',
  'demo.busy': '正在运行演示（{protocol}，N={n}，t={t}）…',
  'demo.expected': '预期交集',
  'demo.connRefused.hint': '集群是否在运行？请开启“自动管理集群”，或在上方面板手动启动。',
  'demo.party.input': '输入',
  'demo.party.intersection': '交集',
  'demo.party.empty': '（空）',
  'demo.leader': '主导方',
  'demo.member': '成员',

  'pr.title': '实战 — 单方接入',
  'pr.oneOwner': '本页代表一方数据持有者',
  'pr.target': '本方接入地址（客户端 API）',
  'pr.leader': '主导方互连地址',
  'pr.role': '角色',
  'pr.role.member': '成员',
  'pr.role.leader': '主导方',
  'pr.protocol': '协议',
  'pr.elements': '本方私有元素（每行一个，或用逗号分隔）',
  'pr.mtls.title': 'mTLS 设置（可选）',
  'pr.mtls.use': '启用 mTLS',
  'pr.mtls.ca': 'CA 证书（PEM，可选）',
  'pr.mtls.cert': '客户端证书（PEM，可选）',
  'pr.mtls.key': '客户端私钥（PEM，可选）',
  'pr.submit': '提交',
  'pr.busy': '正在向 {target} 提交（{role}，{protocol}）…',
  'pr.status': '状态',
  'pr.intersection': '交集',
}

const DICTS: Record<Locale, Dict> = { en, zh }

type I18nCtx = {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (key: string, vars?: Record<string, string | number>) => string
}

const Ctx = createContext<I18nCtx | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return 'en'
    const saved = window.localStorage.getItem(STORAGE_KEY)
    return saved === 'zh' || saved === 'en' ? saved : 'en'
  })

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, locale)
      document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en'
    }
  }, [locale])

  const setLocale = useCallback((l: Locale) => setLocaleState(l), [])

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const dict = DICTS[locale]
    const raw = dict[key] ?? DICTS.en[key] ?? key
    if (!vars) return raw
    return raw.replace(/\{(\w+)\}/g, (_, k) =>
      vars[k] === undefined ? `{${k}}` : String(vars[k]),
    )
  }, [locale])

  const value = useMemo<I18nCtx>(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useI18n(): I18nCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useI18n must be used inside <I18nProvider>')
  return v
}

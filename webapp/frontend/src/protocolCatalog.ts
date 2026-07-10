import type { CardColor, IconName } from 'animal-island-ui'

export const PROTOCOL_CATEGORY_IDS = ['two_party_psi', 'mpsi', 't_mpsi', 'tt_mpsi'] as const

export type ProtocolCategoryId = typeof PROTOCOL_CATEGORY_IDS[number]

export const PROTOCOL_IDS = [
  'dh_psi',
  'xzh26_ec_mpsi',
  'ks05_t_mpsi',
  'beh21_ot_mpsi',
  'yyh26_tt_mpsi',
] as const

export type ProtocolId = typeof PROTOCOL_IDS[number]
export type ThresholdMode = 'fixed_two' | 'all_parties' | 'configurable'

export type ProtocolCategory = {
  id: ProtocolCategoryId
  labelKey: string
  defaultProtocol: ProtocolId
}

export type ProtocolDefinition = {
  id: ProtocolId
  name: string
  category: ProtocolCategoryId
  thresholdMode: ThresholdMode
  equalSize: boolean
  dealerless: boolean
  icon: IconName
  color: CardColor
  modelKey: string
  dealerKey: string
  fitKey: string
  chips: readonly string[]
}

export const PROTOCOL_CATEGORIES: readonly ProtocolCategory[] = [
  { id: 'two_party_psi', labelKey: 'protocol.category.twoParty', defaultProtocol: 'dh_psi' },
  { id: 'mpsi', labelKey: 'protocol.category.mpsi', defaultProtocol: 'xzh26_ec_mpsi' },
  { id: 't_mpsi', labelKey: 'protocol.category.tMpsi', defaultProtocol: 'ks05_t_mpsi' },
  { id: 'tt_mpsi', labelKey: 'protocol.category.ttMpsi', defaultProtocol: 'yyh26_tt_mpsi' },
]

export const PROTOCOLS: readonly ProtocolDefinition[] = [
  {
    id: 'dh_psi',
    name: 'DH PSI',
    category: 'two_party_psi',
    thresholdMode: 'fixed_two',
    equalSize: false,
    dealerless: true,
    icon: 'icon-chat',
    color: 'app-teal',
    modelKey: 'protocol.dh.model',
    dealerKey: 'protocol.dealer.none',
    fitKey: 'protocol.dh.fit',
    chips: ['protocol.chip.twoParty', 'protocol.chip.dealerless', 'protocol.chip.semiHonest'],
  },
  {
    id: 'xzh26_ec_mpsi',
    name: 'XZH26 MPSI',
    category: 'mpsi',
    thresholdMode: 'all_parties',
    equalSize: true,
    dealerless: true,
    icon: 'icon-map',
    color: 'app-orange',
    modelKey: 'protocol.xzh26.model',
    dealerKey: 'protocol.dealer.none',
    fitKey: 'protocol.xzh26.fit',
    chips: ['protocol.chip.plain', 'protocol.chip.dealerless', 'protocol.chip.fullSet'],
  },
  {
    id: 'ks05_t_mpsi',
    name: 'KS05 T-MPSI',
    category: 't_mpsi',
    thresholdMode: 'configurable',
    equalSize: false,
    dealerless: false,
    icon: 'icon-miles',
    color: 'app-blue',
    modelKey: 'protocol.ks05.model',
    dealerKey: 'protocol.dealer.required',
    fitKey: 'protocol.ks05.fit',
    chips: ['protocol.chip.threshold', 'protocol.chip.dealer', 'protocol.chip.paillier'],
  },
  {
    id: 'beh21_ot_mpsi',
    name: 'BEH21 T-MPSI',
    category: 't_mpsi',
    thresholdMode: 'configurable',
    equalSize: true,
    dealerless: false,
    icon: 'icon-critterpedia',
    color: 'app-green',
    modelKey: 'protocol.beh21.model',
    dealerKey: 'protocol.dealer.required',
    fitKey: 'protocol.beh21.fit',
    chips: ['protocol.chip.threshold', 'protocol.chip.dealer', 'protocol.chip.equalSize'],
  },
  {
    id: 'yyh26_tt_mpsi',
    name: 'YYH26 TT-MPSI',
    category: 'tt_mpsi',
    thresholdMode: 'configurable',
    equalSize: false,
    dealerless: true,
    icon: 'icon-variant',
    color: 'purple',
    modelKey: 'protocol.yyh26.model',
    dealerKey: 'protocol.dealer.none',
    fitKey: 'protocol.yyh26.fit',
    chips: ['protocol.chip.threshold', 'protocol.chip.dealerless', 'protocol.chip.experimental'],
  },
]

export function isProtocolId(value: string | null | undefined): value is ProtocolId {
  return PROTOCOL_IDS.some((id) => id === value)
}

export function getProtocol(id: ProtocolId): ProtocolDefinition {
  const protocol = PROTOCOLS.find((item) => item.id === id)
  if (!protocol) throw new Error(`Unknown protocol: ${id}`)
  return protocol
}

export function getCategory(id: ProtocolCategoryId): ProtocolCategory {
  const category = PROTOCOL_CATEGORIES.find((item) => item.id === id)
  if (!category) throw new Error(`Unknown protocol category: ${id}`)
  return category
}

export function runnableProtocols(available: readonly string[] | null | undefined): ProtocolDefinition[] {
  if (available == null) return [...PROTOCOLS]
  return PROTOCOLS.filter((protocol) => available.includes(protocol.id))
}

export function runnableCategories(available: readonly string[] | null | undefined): ProtocolCategory[] {
  const runnable = runnableProtocols(available)
  return PROTOCOL_CATEGORIES.filter((category) =>
    runnable.some((protocol) => protocol.category === category.id),
  )
}

export function defaultProtocolForCategory(
  categoryId: ProtocolCategoryId,
  available: readonly string[] | null | undefined,
): ProtocolDefinition | null {
  const options = runnableProtocols(available).filter((protocol) => protocol.category === categoryId)
  const preferred = getCategory(categoryId).defaultProtocol
  return options.find((protocol) => protocol.id === preferred) ?? options[0] ?? null
}

export function initialProtocol(available: readonly string[] | null | undefined): ProtocolDefinition | null {
  for (const category of runnableCategories(available)) {
    const protocol = defaultProtocolForCategory(category.id, available)
    if (protocol) return protocol
  }
  return null
}

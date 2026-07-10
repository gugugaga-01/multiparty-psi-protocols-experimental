import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  PROTOCOLS,
  defaultProtocolForCategory,
  getProtocol,
  initialProtocol,
  isProtocolId,
  runnableCategories,
  runnableProtocols,
  type ProtocolCategory,
  type ProtocolCategoryId,
  type ProtocolDefinition,
  type ProtocolId,
} from './protocolCatalog'

type ProtocolSelectionValue = {
  category: ProtocolCategory | null
  protocol: ProtocolDefinition | null
  categories: ProtocolCategory[]
  protocols: ProtocolDefinition[]
  missingProtocols: ProtocolDefinition[]
  locked: boolean
  setCategory: (category: ProtocolCategoryId) => void
  setProtocol: (protocol: ProtocolId) => void
}

const ProtocolSelectionContext = createContext<ProtocolSelectionValue | null>(null)

export function ProtocolSelectionProvider({
  available,
  activeProtocol,
  locked,
  children,
}: {
  available: readonly string[] | null
  activeProtocol: string | null
  locked: boolean
  children: ReactNode
}) {
  const [protocolId, setProtocolId] = useState<ProtocolId | null>(
    () => initialProtocol(available)?.id ?? null,
  )

  const categories = useMemo(() => runnableCategories(available), [available])
  const runnable = useMemo(() => runnableProtocols(available), [available])
  const missingProtocols = useMemo(
    () => available == null ? [] : PROTOCOLS.filter((protocol) => !available.includes(protocol.id)),
    [available],
  )

  useEffect(() => {
    if (locked && isProtocolId(activeProtocol) && runnable.some((item) => item.id === activeProtocol)) {
      setProtocolId(activeProtocol)
      return
    }
    setProtocolId((current) => {
      if (current && runnable.some((item) => item.id === current)) return current
      return initialProtocol(available)?.id ?? null
    })
  }, [activeProtocol, available, locked, runnable])

  const protocol = protocolId && runnable.some((item) => item.id === protocolId)
    ? getProtocol(protocolId)
    : null
  const category = protocol
    ? categories.find((item) => item.id === protocol.category) ?? null
    : categories[0] ?? null
  const protocols = useMemo(
    () => category ? runnable.filter((item) => item.category === category.id) : [],
    [category, runnable],
  )

  const value = useMemo<ProtocolSelectionValue>(() => ({
    category,
    protocol,
    categories,
    protocols,
    missingProtocols,
    locked,
    setCategory: (categoryId) => {
      if (locked) return
      setProtocolId(defaultProtocolForCategory(categoryId, available)?.id ?? null)
    },
    setProtocol: (nextProtocol) => {
      if (locked || !runnable.some((item) => item.id === nextProtocol)) return
      setProtocolId(nextProtocol)
    },
  }), [available, categories, category, locked, missingProtocols, protocol, protocols, runnable])

  return (
    <ProtocolSelectionContext.Provider value={value}>
      {children}
    </ProtocolSelectionContext.Provider>
  )
}

// This module intentionally colocates the provider and its consumer hook.
// eslint-disable-next-line react-refresh/only-export-components
export function useProtocolSelection(): ProtocolSelectionValue {
  const value = useContext(ProtocolSelectionContext)
  if (!value) throw new Error('useProtocolSelection must be used inside ProtocolSelectionProvider')
  return value
}

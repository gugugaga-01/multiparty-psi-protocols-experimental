import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'

type BusyCtx = {
  active: boolean
  message: string | null
  begin: (message: string) => void
  end: () => void
}

const Ctx = createContext<BusyCtx | null>(null)

export function BusyProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0)
  const messageRef = useRef<string | null>(null)
  const [, force] = useState(0)

  const begin = useCallback((message: string) => {
    messageRef.current = message
    setCount((n) => n + 1)
    force((x) => x + 1)
  }, [])

  const end = useCallback(() => {
    setCount((n) => Math.max(0, n - 1))
  }, [])

  const value = useMemo<BusyCtx>(() => ({
    active: count > 0,
    message: count > 0 ? messageRef.current : null,
    begin,
    end,
  }), [count, begin, end])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useBusy(): BusyCtx {
  const v = useContext(Ctx)
  if (!v) throw new Error('useBusy must be used inside <BusyProvider>')
  return v
}

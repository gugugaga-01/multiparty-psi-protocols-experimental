export type ClusterStatus = {
  built: boolean
  build_dir: string | null
  num_parties: number
  protocol: string | null
  protocols_available?: string[]
  dealer: { pid: number | null; running: boolean; listening: boolean; port: number }
  parties: Array<{
    i: number
    pid: number | null
    running: boolean
    client_port: number
    inter_port: number
    client_listening: boolean
  }>
}

export type DemoDefaults = {
  num_parties: number
  threshold: number
  inputs: string[][]
  expected: string[]
}

export type DemoResult = {
  num_parties: number
  threshold: number
  protocol: string
  leader_address: string
  expected: string[]
  parties: Array<{
    name: string
    role: string
    address: string
    input: string[]
    intersection: string[]
    status: string
    error?: string | null
    error_code?: string | null
    error_params?: ApiErrorParams | null
  }>
  success: boolean
}

export type SubmitResult = {
  intersection: string[]
  status: string
  role?: 'leader' | 'member'
}

export type ApiErrorParams = Record<string, string | number>

export class ApiError extends Error {
  readonly code: string | null
  readonly params: ApiErrorParams
  readonly detail: string

  constructor(detail: string, code?: string | null, params?: ApiErrorParams) {
    super(detail)
    this.name = 'ApiError'
    this.detail = detail
    this.code = code ?? null
    this.params = params ?? {}
  }
}

type Translator = (key: string, vars?: ApiErrorParams) => string

export function formatApiError(error: unknown, t: Translator): string {
  if (error instanceof ApiError && error.code) {
    const key = `error.${error.code}`
    const localized = t(key, error.params)
    if (localized !== key) return localized
  }
  if (error instanceof TypeError) return t('error.network')
  const detail = error instanceof Error ? error.message : String(error)
  return t('error.unexpected', { detail })
}

export function formatApiProblem(
  detail: string,
  code: string | null | undefined,
  params: ApiErrorParams | null | undefined,
  t: Translator,
): string {
  return formatApiError(new ApiError(detail, code, params ?? undefined), t)
}

async function jfetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  const text = await res.text()
  let data: unknown
  try { data = text ? JSON.parse(text) : {} } catch { data = { detail: text } }
  if (!res.ok) {
    const payload = data && typeof data === 'object'
      ? data as { detail?: unknown; code?: unknown; params?: unknown }
      : {}
    const detail = payload.detail === undefined
      ? `${res.status} ${res.statusText}`
      : String(payload.detail)
    const code = typeof payload.code === 'string' ? payload.code : null
    const params = payload.params && typeof payload.params === 'object'
      ? Object.fromEntries(
          Object.entries(payload.params).filter((entry): entry is [string, string | number] =>
            typeof entry[1] === 'string' || typeof entry[1] === 'number',
          ),
        )
      : {}
    throw new ApiError(detail, code, params)
  }
  return data as T
}

export const api = {
  health: () => jfetch<{ status: string }>('/api/health'),
  clusterStatus: () => jfetch<ClusterStatus>('/api/cluster/status'),
  clusterStart: (body: {
    num_parties: number
    protocol: string
    tls?: boolean
    build_dir?: string | null
  }) => jfetch<ClusterStatus>('/api/cluster/start', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  clusterStop: () => jfetch<ClusterStatus>('/api/cluster/stop', { method: 'POST' }),
  demoDefaults: (n: number, sizes?: number[]) => {
    const q = new URLSearchParams({ n: String(n) })
    if (sizes && sizes.length > 0) q.set('sizes', sizes.join(','))
    return jfetch<DemoDefaults>(`/api/demo/defaults?${q.toString()}`)
  },
  demo: (body: {
    num_parties: number
    threshold?: number
    protocol: string
    auto_cluster?: boolean
    inputs?: string[][]
    sizes?: number[]
  }) => jfetch<DemoResult>('/api/demo', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
  submit: (body: {
    target: string
    leader_address: string
    role: 'leader' | 'member'
    elements: string[]
    protocol: string
    num_parties: number
    threshold: number
    tls?: boolean
    ca_cert?: string
    client_cert?: string
    client_key?: string
  }) => jfetch<SubmitResult>('/api/submit', {
    method: 'POST',
    body: JSON.stringify(body),
  }),
}

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
  }>
  success: boolean
}

export type SubmitResult = {
  intersection: string[]
  status: string
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
    const detail =
      (data && typeof data === 'object' && 'detail' in data
        ? String((data as { detail: unknown }).detail)
        : `${res.status} ${res.statusText}`)
    throw new Error(detail)
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

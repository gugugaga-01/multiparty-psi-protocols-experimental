import { useState } from 'react'
import { Button, Card, Input, Select, Switch, Divider, Typewriter } from 'animal-island-ui'
import { api, type DemoResult } from '../api'
import { useBusy } from '../busy'

const PROTOCOLS = [
  { key: 'ks05_t_mpsi',   label: 'KS05 T-MPSI' },
  { key: 'beh21_t_mpsi',  label: 'BEH21 T-MPSI' },
  { key: 'yyh26_tt_mpsi', label: 'YYH26 TT-MPSI' },
]

const PARTY_COLORS = [
  'app-pink', 'app-blue', 'app-yellow', 'app-orange',
  'app-teal', 'app-green', 'lime-green', 'warm-peach-pink',
  'purple', 'yellow-green', 'app-red', 'brown',
] as const


export function DemoPanel({ onAfterRun }: { onAfterRun: () => void }) {
  const [protocol, setProtocol] = useState('ks05_t_mpsi')
  const [n, setN] = useState('3')
  const [t, setT] = useState('3')
  const [autoCluster, setAutoCluster] = useState(true)
  const [customize, setCustomize] = useState(false)
  const [inputs, setInputs] = useState<string[][]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [result, setResult] = useState<DemoResult | null>(null)
  const globalBusy = useBusy()

  const loadDefaults = async (overrideSizes?: number[]) => {
    const N = Math.max(2, parseInt(n, 10) || 2)
    try {
      const d = await api.demoDefaults(N, overrideSizes)
      setInputs(d.inputs)
    } catch (e) { setErr(String((e as Error).message)) }
  }

  // Resize a single party's input list (deterministic, server-driven so the
  // overlap recipe stays consistent — only that party's row gets replaced so
  // edits the user made to other rows are preserved).
  const resizeParty = async (i: number, newSize: number) => {
    const N = parseInt(n, 10) || inputs.length
    if (newSize < 1) return
    const sizes = inputs.map((row) => row.length)
    sizes[i] = newSize
    try {
      const d = await api.demoDefaults(N, sizes)
      setInputs((prev) => {
        const next = prev.slice()
        if (d.inputs[i]) next[i] = d.inputs[i]
        return next
      })
    } catch (e) { setErr(String((e as Error).message)) }
  }

  const toggleCustomize = async (v: boolean) => {
    setCustomize(v)
    if (v && inputs.length === 0) await loadDefaults()
  }

  const run = async () => {
    setBusy(true); setErr(null); setResult(null)
    globalBusy.begin(`Running demo (${protocol}, N=${n}, t=${t})…`)
    try {
      const body: Parameters<typeof api.demo>[0] = {
        num_parties: parseInt(n, 10),
        threshold: parseInt(t, 10),
        protocol,
        auto_cluster: autoCluster,
      }
      if (customize && inputs.length > 0) body.inputs = inputs
      else if (customize) body.sizes = inputs.map((r) => r.length)
      const r = await api.demo(body)
      setResult(r)
    } catch (e) {
      let msg = String((e as Error).message)
      if (/Failed to fetch|NetworkError|connection refused/i.test(msg)) {
        msg += '\nIs the cluster running? Enable "Auto-manage cluster" or start it from the panel above.'
      }
      setErr(msg)
    } finally {
      setBusy(false)
      globalBusy.end()
      onAfterRun()
    }
  }

  return (
    <Card type="default">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 className="section-title">Demo — one-click run</h2>
      </div>
      <Divider type="wave-yellow" />
      <div className="row">
        <label className="field grow">
          <span>Protocol</span>
          <Select
            options={PROTOCOLS}
            value={protocol}
            onChange={(v) => setProtocol(v as string)}
            disabled={busy}
          />
        </label>
        <label className="field" style={{ width: 110 }}>
          <span>Parties (N)</span>
          <Input value={n} disabled={busy} onChange={(e) => {
            const x = e.target.value.replace(/\D/g, '')
            setN(x); if (parseInt(t, 10) > (parseInt(x, 10) || 0)) setT(x)
          }} />
        </label>
        <label className="field" style={{ width: 130 }}>
          <span>Threshold (t)</span>
          <Input value={t} disabled={busy} onChange={(e) => setT(e.target.value.replace(/\D/g, ''))} />
        </label>
      </div>
      <div className="row" style={{ marginTop: 8 }}>
        <label className="field" style={{ width: 220 }}>
          <span>Auto-manage cluster</span>
          <Switch checked={autoCluster} onChange={setAutoCluster} disabled={busy} />
          <small>Start &amp; stop psi_party processes automatically</small>
        </label>
        <label className="field" style={{ width: 220 }}>
          <span>Customize inputs per party</span>
          <Switch checked={customize} onChange={toggleCustomize} disabled={busy} />
          <small>Off uses curated demo input (known overlap)</small>
        </label>
      </div>

      {customize && inputs.length > 0 && (
        <>
          <Divider type="line-yellow" />
          <div className="col">
            <p className="section-title" style={{ fontSize: 14 }}>
              Per-party input sets — edit the text directly, or use the size
              field to regenerate that party with a different element count.
            </p>
            {inputs.map((row, i) => (
              <div key={i} className="col" style={{ gap: 6 }}>
                <div className="row tight" style={{ justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: 13 }}>Party {i}</strong>
                  <label className="row tight" style={{ alignItems: 'center', fontSize: 13 }}>
                    <span>size:</span>
                    <span style={{ width: 90 }}>
                      <Input
                        value={String(row.length)}
                        disabled={busy}
                        onChange={(e) => {
                          const v = parseInt(e.target.value.replace(/\D/g, ''), 10)
                          if (Number.isFinite(v) && v >= 1) void resizeParty(i, v)
                        }}
                      />
                    </span>
                  </label>
                </div>
                <textarea
                  className="aii-textarea"
                  value={row.join('\n')}
                  disabled={busy}
                  onChange={(e) => {
                    const copy = inputs.slice()
                    copy[i] = e.target.value
                      .split(/[\n,]/)
                      .map((s) => s.trim())
                      .filter(Boolean)
                    setInputs(copy)
                  }}
                />
              </div>
            ))}
            <Button type="dashed" size="small" disabled={busy} onClick={() => loadDefaults()}>
              Reset to demo defaults
            </Button>
          </div>
        </>
      )}

      <Divider />
      <div className="row">
        <Button type="primary" size="large" loading={busy} onClick={run}>
          Run demo
        </Button>
        {result && (
          <span className={'pill ' + (result.success ? 'ok' : 'bad')}>
            {result.success ? 'success' : 'failed'}
          </span>
        )}
      </div>

      {err && (
        <div className="banner bad" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
          {err}
        </div>
      )}

      {result && (
        <>
          <Divider type="line-brown" />
          <div className="col">
            <div className="row">
              <span className="pill">protocol: {result.protocol}</span>
              <span className="pill">N={result.num_parties} t={result.threshold}</span>
              <span className="pill ok">leader: {result.leader_address}</span>
            </div>
            <Card color="app-yellow">
              <strong>Expected intersection</strong> ({result.expected.length}):{' '}
              <Typewriter speed={20} trigger={result.expected.join(',')}>
                <code>{result.expected.join(', ') || '(empty)'}</code>
              </Typewriter>
            </Card>
            <div className="party-grid">
              {result.parties.map((p, i) => (
                <Card
                  key={i}
                  type="title"
                  color={PARTY_COLORS[i % PARTY_COLORS.length]}
                >
                  <div className="party-card-body">
                    <div className="row tight" style={{ justifyContent: 'space-between' }}>
                      <strong>{p.name}</strong>
                      <span className={'pill ' + (p.error ? 'bad' : 'ok')}>
                        {p.role}
                      </span>
                    </div>
                    <div className="kv">addr: {p.address}</div>
                    {p.error ? (
                      <div className="banner bad" style={{ marginTop: 6 }}>{p.error}</div>
                    ) : (
                      <>
                        <div style={{ marginTop: 6 }}>
                          input ({p.input.length}):
                          <code>{p.input.join(', ')}</code>
                        </div>
                        <div style={{ marginTop: 6 }}>
                          intersection ({p.intersection.length}):
                          <code>{p.intersection.join(', ') || '(empty)'}</code>
                        </div>
                      </>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

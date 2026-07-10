import { useEffect, useState } from 'react'
import { Button, Card, Input, Switch, Divider, Loading, Icon } from 'animal-island-ui'
import { api, formatApiError, formatApiProblem, type DemoResult } from '../api'
import { useProtocolSelection } from '../ProtocolSelectionContext'
import { useI18n } from '../i18n'
import { ProtocolPicker } from './ProtocolPicker'

const PARTY_COLORS = [
  'app-pink', 'app-blue', 'app-yellow', 'app-orange',
  'app-teal', 'app-green', 'lime-green', 'warm-peach-pink',
  'purple', 'yellow-green', 'app-red', 'brown',
] as const


export function DemoPanel({ onAfterRun }: { onAfterRun: () => void }) {
  const { t: tr } = useI18n()
  const { protocol } = useProtocolSelection()
  const [n, setN] = useState('3')
  const [t, setT] = useState('3')
  const [autoCluster, setAutoCluster] = useState(true)
  const [customize, setCustomize] = useState(false)
  const [inputs, setInputs] = useState<string[][]>([])
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [result, setResult] = useState<DemoResult | null>(null)

  // XZH26 is plain MPSI (intersection of all parties), so the threshold is
  // always N. DH PSI is exactly two-party PSI, so both N and t are fixed at 2.
  const isFullMpsi = protocol?.thresholdMode === 'all_parties'
  const isTwoPartyPsi = protocol?.thresholdMode === 'fixed_two'
  const requiresEqualSizes = protocol?.equalSize ?? false
  const effN = isTwoPartyPsi ? '2' : n
  const effT = isTwoPartyPsi ? '2' : isFullMpsi ? n : t
  const setupBadge = isTwoPartyPsi ? tr('protocol.chip.twoParty') : requiresEqualSizes ? tr('demo.equalSizeBadge') : tr('demo.thresholdBadge')
  const inputCount = inputs.reduce((sum, row) => sum + row.length, 0)

  useEffect(() => {
    if (!customize || !protocol) return
    const expectedParties = parseInt(effN, 10)
    if (inputs.length === expectedParties) return
    api.demoDefaults(expectedParties)
      .then((d) => setInputs(d.inputs))
      .catch((e) => setErr(formatApiError(e, tr)))
  }, [customize, effN, inputs.length, protocol, tr])

  const loadDefaults = async (overrideSizes?: number[]) => {
    const N = Math.max(2, parseInt(effN, 10) || 2)
    try {
      const d = await api.demoDefaults(N, overrideSizes)
      setInputs(d.inputs)
    } catch (e) { setErr(formatApiError(e, tr)) }
  }

  // Resize a single party's input list (deterministic, server-driven so the
  // overlap recipe stays consistent — only that party's row gets replaced so
  // edits the user made to other rows are preserved).
  const resizeParty = async (i: number, newSize: number) => {
    const N = parseInt(effN, 10) || inputs.length
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
    } catch (e) { setErr(formatApiError(e, tr)) }
  }

  const toggleCustomize = (v: boolean) => {
    setCustomize(v)
  }

  const run = async () => {
    setErr(null); setResult(null)
    const numParties = parseInt(effN, 10)
    const threshold = parseInt(effT, 10)
    if (!protocol) { setErr(tr('form.protocolUnavailable')); return }
    if (!Number.isFinite(numParties) || numParties < 2) { setErr(tr('form.invalidParties')); return }
    if (!Number.isFinite(threshold) || threshold < 2 || threshold > numParties) { setErr(tr('form.invalidThreshold')); return }

    setBusy(true)
    try {
      const body: Parameters<typeof api.demo>[0] = {
        num_parties: numParties,
        threshold,
        protocol: protocol.id,
        auto_cluster: autoCluster,
      }
      if (customize && inputs.length > 0) body.inputs = inputs
      else if (customize) body.sizes = inputs.map((r) => r.length)
      const r = await api.demo(body)
      setResult(r)
    } catch (e) {
      setErr(formatApiError(e, tr))
    } finally {
      setBusy(false)
      onAfterRun()
    }
  }

  return (
    <Card type="default" className="runner-card demo-card">
      <div className="panel-heading">
        <div>
          <span className="info-kicker">{tr('demo.kicker')}</span>
          <h2 className="section-title">{tr('demo.title')}</h2>
          <p>{tr('demo.lead')}</p>
        </div>
        <div className="runner-summary" aria-label={tr('demo.summary')}>
          <span><Icon name="icon-variant" size={18} />{protocol?.id ?? tr('protocol.noneAvailable')}</span>
          <span>N={effN}</span>
          <span>t={effT}</span>
          <span>{autoCluster ? tr('demo.autoCluster.on') : tr('demo.autoCluster.off')}</span>
        </div>
      </div>
      <Divider type="wave-yellow" />
      <div className="form-section">
        <div className="form-section-head">
          <strong>{tr('demo.setup')}</strong>
          <span>{setupBadge}</span>
        </div>
      <div className="form-grid demo-form-grid">
        <ProtocolPicker
          disabled={busy}
          hint={(
            <>
              {requiresEqualSizes && <small>{tr('protocol.equalSizeHint')}</small>}
              {isTwoPartyPsi && <small>{tr('protocol.twoPartyHint')}</small>}
            </>
          )}
        />
        <label className="field compact">
          <span>{tr('demo.n')}</span>
          <Input value={effN} disabled={busy || isTwoPartyPsi} onChange={(e) => {
            const x = e.target.value.replace(/\D/g, '')
            setN(x); if (parseInt(t, 10) > (parseInt(x, 10) || 0)) setT(x)
          }} />
        </label>
        <label className="field compact">
          <span>{tr('demo.t')}</span>
          <Input
            value={effT}
            disabled={busy || isFullMpsi || isTwoPartyPsi}
            onChange={(e) => setT(e.target.value.replace(/\D/g, ''))}
          />
          {isFullMpsi && <small>{tr('demo.t.lockedMpsi')}</small>}
          {isTwoPartyPsi && <small>{tr('demo.t.lockedTwoParty')}</small>}
        </label>
      </div>
      </div>
      <div className="toggle-grid">
        <label className="toggle-card field">
          <span>{tr('demo.autoCluster')}</span>
          <Switch checked={autoCluster} onChange={setAutoCluster} disabled={busy} />
          <small>{tr('demo.autoCluster.hint')}</small>
        </label>
        <label className="toggle-card field">
          <span>{tr('demo.customize')}</span>
          <Switch checked={customize} onChange={toggleCustomize} disabled={busy} />
          <small>{tr('demo.customize.hint')}</small>
        </label>
      </div>

      {customize && inputs.length > 0 && (
        <>
          <Divider type="line-yellow" />
          <div className="col">
            <div className="editor-heading">
              <div>
                <strong>{tr('demo.inputEditor')}</strong>
                <p>{tr('demo.perParty')}</p>
              </div>
              <span className="pill">{tr('demo.inputCount', { count: inputCount })}</span>
            </div>
            <div className="input-editor-grid">
            {inputs.map((row, i) => (
              <div key={i} className="party-input-card">
                <div className="row tight" style={{ justifyContent: 'space-between' }}>
                  <strong>{tr('demo.party')} {i}</strong>
                  <label className="row tight inline-size-field">
                    <span>{tr('demo.size')}</span>
                    <span>
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
            </div>
            <Button type="dashed" size="small" disabled={busy} onClick={() => loadDefaults()}>
              {tr('demo.reset')}
            </Button>
          </div>
        </>
      )}

      <Divider />
      <div className="action-row">
        <Button type="primary" size="large" loading={busy} disabled={!protocol} onClick={run}>
          {tr('demo.run')}
        </Button>
        {result && (
          <span className={'pill ' + (result.success ? 'ok' : 'bad')}>
            {result.success ? tr('demo.success') : tr('demo.failed')}
          </span>
        )}
      </div>

      {busy && (
        <div className="aii-busy-inline">
          <Loading active style={{ height: 320 }} />
          <div className="aii-busy-msg">
            {tr('demo.busy', { protocol: protocol?.id ?? '-', n: effN, t: effT })}
          </div>
        </div>
      )}

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
              <span className="pill">{tr('demo.protocol').toLowerCase()}: {result.protocol}</span>
              <span className="pill">N={result.num_parties} t={result.threshold}</span>
              <span className="pill ok">{tr('demo.leader')}: {result.leader_address}</span>
            </div>
            <div className="result-overview">
              <div>
                <span>{tr('demo.resultStatus')}</span>
                <strong>{result.success ? tr('demo.success') : tr('demo.failed')}</strong>
              </div>
              <div>
                <span>{tr('demo.expected')} ({result.expected.length})</span>
                <code>{result.expected.join(', ') || tr('demo.party.empty')}</code>
              </div>
            </div>
            <div className="party-grid">
              {result.parties.map((p, i) => (
                <Card
                  key={i}
                  type="title"
                  color={PARTY_COLORS[i % PARTY_COLORS.length]}
                >
                  <div className="party-card-body">
                    <div className="row tight" style={{ justifyContent: 'space-between' }}>
                      <strong>{tr('demo.party')} {i}</strong>
                      <span className={'pill ' + (p.error ? 'bad' : 'ok')}>
                        {p.role === 'leader' ? tr('demo.leader') : tr('demo.member')}
                      </span>
                    </div>
                    <div className="kv">{tr('demo.party.address')}: {p.address}</div>
                    {p.error ? (
                      <div className="banner bad" style={{ marginTop: 6 }}>
                        {formatApiProblem(p.error, p.error_code, p.error_params, tr)}
                      </div>
                    ) : (
                      <>
                        <div style={{ marginTop: 6 }}>
                          {tr('demo.party.input')} ({p.input.length}):
                          <code>{p.input.join(', ')}</code>
                        </div>
                        <div style={{ marginTop: 6 }}>
                          {tr('demo.party.intersection')} ({p.intersection.length}):
                          <code>{p.intersection.join(', ') || tr('demo.party.empty')}</code>
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

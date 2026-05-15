import { useState } from 'react'
import { Button, Card, Input, Select, Switch, Divider, Collapse } from 'animal-island-ui'
import { api, type SubmitResult } from '../api'

const PROTOCOLS = [
  { key: 'ks05_t_mpsi',   label: 'KS05 T-MPSI' },
  { key: 'beh21_t_mpsi',  label: 'BEH21 T-MPSI' },
  { key: 'yyh26_tt_mpsi', label: 'YYH26 TT-MPSI' },
]

const ROLES = [
  { key: 'member', label: 'Member' },
  { key: 'leader', label: 'Leader' },
]

export function PracticalPanel() {
  const [target, setTarget] = useState('127.0.0.1:53100')
  const [leader, setLeader] = useState('127.0.0.1:53002')
  const [role, setRole] = useState<'leader' | 'member'>('member')
  const [protocol, setProtocol] = useState('ks05_t_mpsi')
  const [n, setN] = useState('3')
  const [t, setT] = useState('3')
  const [elements, setElements] = useState('Alpha\nBravo\nCharlie\nDelta')
  const [tls, setTls] = useState(false)
  const [caCert, setCaCert] = useState('')
  const [clientCert, setClientCert] = useState('')
  const [clientKey, setClientKey] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [result, setResult] = useState<SubmitResult | null>(null)

  const submit = async () => {
    setBusy(true); setErr(null); setResult(null)
    try {
      const els = elements.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
      const body: Parameters<typeof api.submit>[0] = {
        target, leader_address: leader, role,
        elements: els,
        protocol,
        num_parties: parseInt(n, 10),
        threshold: parseInt(t, 10),
        tls,
      }
      if (tls) {
        if (caCert.trim()) body.ca_cert = caCert.trim()
        if (clientCert.trim()) body.client_cert = clientCert.trim()
        if (clientKey.trim()) body.client_key = clientKey.trim()
      }
      const r = await api.submit(body)
      setResult(r)
    } catch (e) {
      setErr(String((e as Error).message))
    } finally { setBusy(false) }
  }

  return (
    <Card type="default">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 className="section-title">🛰️  Practical — one party</h2>
        <span className="pill warn">this browser = one data owner</span>
      </div>
      <Divider type="wave-yellow" />
      <div className="row">
        <label className="field grow">
          <span>Your party endpoint (client API)</span>
          <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="host:port" />
        </label>
        <label className="field grow">
          <span>Leader inter-party address</span>
          <Input value={leader} onChange={(e) => setLeader(e.target.value)} placeholder="host:port" />
        </label>
      </div>
      <div className="row">
        <label className="field" style={{ width: 160 }}>
          <span>Role</span>
          <Select
            options={ROLES}
            value={role}
            onChange={(v) => setRole(v as 'leader' | 'member')}
          />
        </label>
        <label className="field grow">
          <span>Protocol</span>
          <Select
            options={PROTOCOLS}
            value={protocol}
            onChange={(v) => setProtocol(v as string)}
          />
        </label>
        <label className="field" style={{ width: 100 }}>
          <span>N</span>
          <Input value={n} onChange={(e) => setN(e.target.value.replace(/\D/g, ''))} />
        </label>
        <label className="field" style={{ width: 100 }}>
          <span>t</span>
          <Input value={t} onChange={(e) => setT(e.target.value.replace(/\D/g, ''))} />
        </label>
      </div>
      <label className="field">
        <span>Your private elements (one per line, or comma-separated)</span>
        <textarea
          className="aii-textarea"
          value={elements}
          onChange={(e) => setElements(e.target.value)}
        />
      </label>

      <Collapse
        question="mTLS settings (optional)"
        answer={
          <div className="col">
            <div className="row">
              <label className="field" style={{ width: 160 }}>
                <span>Use mTLS</span>
                <Switch checked={tls} onChange={setTls} />
              </label>
            </div>
            {tls && (
              <>
                <label className="field">
                  <span>CA certificate (PEM, optional)</span>
                  <textarea
                    className="aii-textarea"
                    value={caCert}
                    onChange={(e) => setCaCert(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Client certificate (PEM, optional)</span>
                  <textarea
                    className="aii-textarea"
                    value={clientCert}
                    onChange={(e) => setClientCert(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>Client key (PEM, optional)</span>
                  <textarea
                    className="aii-textarea"
                    value={clientKey}
                    onChange={(e) => setClientKey(e.target.value)}
                  />
                </label>
              </>
            )}
          </div>
        }
      />

      <Divider />
      <div className="row">
        <Button type="primary" size="large" loading={busy} onClick={submit}>
          📨 Submit
        </Button>
      </div>

      {err && (
        <div className="banner bad" style={{ marginTop: 12, whiteSpace: 'pre-wrap' }}>
          {err}
        </div>
      )}

      {result && (
        <>
          <Divider type="line-teal" />
          <Card color="app-green">
            <strong>Status:</strong> {result.status || '(empty)'}
            <br />
            <strong>Intersection ({result.intersection.length}):</strong>{' '}
            <code>{result.intersection.join(', ') || '(empty)'}</code>
          </Card>
        </>
      )}
    </Card>
  )
}

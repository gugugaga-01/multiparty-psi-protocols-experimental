import { useState } from 'react'
import { Button, Card, Input, Select, Switch, Divider, Collapse, Loading, Typewriter } from 'animal-island-ui'
import { api, type SubmitResult } from '../api'
import { useI18n } from '../i18n'

const PROTOCOLS = [
  { key: 'ks05_t_mpsi',   label: 'KS05 T-MPSI' },
  { key: 'beh21_t_mpsi',  label: 'BEH21 T-MPSI' },
  { key: 'yyh26_tt_mpsi', label: 'YYH26 TT-MPSI' },
]

export function PracticalPanel() {
  const { t: tr } = useI18n()
  const ROLES = [
    { key: 'member', label: tr('pr.role.member') },
    { key: 'leader', label: tr('pr.role.leader') },
  ]
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
        <h2 className="section-title">{tr('pr.title')}</h2>
        <span className="pill warn">{tr('pr.oneOwner')}</span>
      </div>
      <Divider type="wave-yellow" />
      <div className="row">
        <label className="field grow">
          <span>{tr('pr.target')}</span>
          <Input value={target} disabled={busy} onChange={(e) => setTarget(e.target.value)} placeholder="host:port" />
        </label>
        <label className="field grow">
          <span>{tr('pr.leader')}</span>
          <Input value={leader} disabled={busy} onChange={(e) => setLeader(e.target.value)} placeholder="host:port" />
        </label>
      </div>
      <div className="row">
        <label className="field" style={{ width: 160 }}>
          <span>{tr('pr.role')}</span>
          <Select
            options={ROLES}
            value={role}
            onChange={(v) => setRole(v as 'leader' | 'member')}
            disabled={busy}
          />
        </label>
        <label className="field grow">
          <span>{tr('pr.protocol')}</span>
          <Select
            options={PROTOCOLS}
            value={protocol}
            onChange={(v) => setProtocol(v as string)}
            disabled={busy}
          />
        </label>
        <label className="field" style={{ width: 100 }}>
          <span>N</span>
          <Input value={n} disabled={busy} onChange={(e) => setN(e.target.value.replace(/\D/g, ''))} />
        </label>
        <label className="field" style={{ width: 100 }}>
          <span>t</span>
          <Input value={t} disabled={busy} onChange={(e) => setT(e.target.value.replace(/\D/g, ''))} />
        </label>
      </div>
      <label className="field">
        <span>{tr('pr.elements')}</span>
        <textarea
          className="aii-textarea"
          value={elements}
          disabled={busy}
          onChange={(e) => setElements(e.target.value)}
        />
      </label>

      <Collapse
        question={tr('pr.mtls.title')}
        disabled={busy}
        answer={
          <div className="col">
            <div className="row">
              <label className="field" style={{ width: 160 }}>
                <span>{tr('pr.mtls.use')}</span>
                <Switch checked={tls} onChange={setTls} disabled={busy} />
              </label>
            </div>
            {tls && (
              <>
                <label className="field">
                  <span>{tr('pr.mtls.ca')}</span>
                  <textarea
                    className="aii-textarea"
                    value={caCert}
                    disabled={busy}
                    onChange={(e) => setCaCert(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{tr('pr.mtls.cert')}</span>
                  <textarea
                    className="aii-textarea"
                    value={clientCert}
                    disabled={busy}
                    onChange={(e) => setClientCert(e.target.value)}
                  />
                </label>
                <label className="field">
                  <span>{tr('pr.mtls.key')}</span>
                  <textarea
                    className="aii-textarea"
                    value={clientKey}
                    disabled={busy}
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
          {tr('pr.submit')}
        </Button>
      </div>

      {busy && (
        <div className="aii-busy-inline">
          <Loading active style={{ height: 280 }} />
          <div className="aii-busy-msg">
            {tr('pr.busy', { target, role: role === 'leader' ? tr('pr.role.leader') : tr('pr.role.member'), protocol })}
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
          <Divider type="line-teal" />
          <Card color="app-green">
            <strong>{tr('pr.status')}:</strong> {result.status || tr('demo.party.empty')}
            <br />
            <strong>{tr('pr.intersection')} ({result.intersection.length}):</strong>{' '}
            <Typewriter speed={25} trigger={result.intersection.join(',')}>
              <code>{result.intersection.join(', ') || tr('demo.party.empty')}</code>
            </Typewriter>
          </Card>
        </>
      )}
    </Card>
  )
}

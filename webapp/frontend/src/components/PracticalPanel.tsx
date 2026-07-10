import { useEffect, useState } from 'react'
import { Button, Card, Input, Select, Switch, Divider, Collapse, Loading, Icon } from 'animal-island-ui'
import { api, type SubmitResult } from '../api'
import { useI18n } from '../i18n'

const PROTOCOLS = [
  { key: 'ks05_t_mpsi',   label: 'KS05 T-MPSI' },
  { key: 'beh21_ot_mpsi', label: 'BEH21 T-MPSI' },
  { key: 'yyh26_tt_mpsi', label: 'YYH26 TT-MPSI' },
  { key: 'xzh26_ec_mpsi', label: 'XZH26 MPSI' },
  { key: 'dh_psi',        label: 'DH PSI' },
]

export function PracticalPanel({ available }: { available?: string[] | null }) {
  const { t: tr } = useI18n()
  const protocolOptions = available && available.length
    ? PROTOCOLS.filter((p) => available.includes(p.key))
    : PROTOCOLS
  const missingProtocols = available && available.length
    ? PROTOCOLS.filter((p) => !available.includes(p.key))
    : []
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

  const firstProtocol = protocolOptions[0]?.key
  const selectedProtocolAvailable = protocolOptions.some((p) => p.key === protocol)
  useEffect(() => {
    if (firstProtocol && !selectedProtocolAvailable) setProtocol(firstProtocol)
  }, [firstProtocol, selectedProtocolAvailable])

  // XZH26 is plain MPSI (intersection of all parties): threshold is always N.
  // DH PSI is exactly two-party PSI, so both N and t are fixed at 2.
  const isFullMpsi = protocol === 'xzh26_ec_mpsi'
  const isTwoPartyPsi = protocol === 'dh_psi'
  const requiresEqualSizes = protocol === 'xzh26_ec_mpsi' || protocol === 'beh21_ot_mpsi'
  const effN = isTwoPartyPsi ? '2' : n
  const effT = isTwoPartyPsi ? '2' : isFullMpsi ? n : t
  const setupBadge = isTwoPartyPsi ? tr('protocol.chip.twoParty') : requiresEqualSizes ? tr('demo.equalSizeBadge') : tr('demo.thresholdBadge')
  const elementCount = elements.split(/[\n,]/).map((s) => s.trim()).filter(Boolean).length

  useEffect(() => {
    if (!isTwoPartyPsi) return
    setN('2')
    setT('2')
    setLeader((prev) => prev === '127.0.0.1:53002' ? '127.0.0.1:53001' : prev)
  }, [isTwoPartyPsi])

  const submit = async () => {
    setErr(null); setResult(null)
    const els = elements.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
    const numParties = parseInt(effN, 10)
    const threshold = parseInt(effT, 10)
    if (!target.trim()) { setErr(tr('form.missingTarget')); return }
    if (!leader.trim()) { setErr(tr('form.missingLeader')); return }
    if (!selectedProtocolAvailable) { setErr(tr('form.protocolUnavailable')); return }
    if (!Number.isFinite(numParties) || numParties < 2) { setErr(tr('form.invalidParties')); return }
    if (!Number.isFinite(threshold) || threshold < 2 || threshold > numParties) { setErr(tr('form.invalidThreshold')); return }
    if (els.length === 0) { setErr(tr('form.missingElements')); return }

    setBusy(true)
    try {
      const body: Parameters<typeof api.submit>[0] = {
        target: target.trim(), leader_address: leader.trim(), role,
        elements: els,
        protocol,
        num_parties: numParties,
        threshold,
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
    <Card type="default" className="runner-card practical-card">
      <div className="panel-heading">
        <div>
          <span className="info-kicker">{tr('pr.kicker')}</span>
          <h2 className="section-title">{tr('pr.title')}</h2>
          <p>{tr('pr.lead')}</p>
        </div>
        <div className="runner-summary" aria-label={tr('pr.summary')}>
          <span><Icon name="icon-miles" size={18} />{role === 'leader' ? tr('pr.role.leader') : tr('pr.role.member')}</span>
          <span>{protocol}</span>
          <span>{tr('pr.elementCount', { count: elementCount })}</span>
        </div>
      </div>
      <Divider type="wave-yellow" />
      <div className="form-section">
        <div className="form-section-head">
          <strong>{tr('pr.endpointSection')}</strong>
          <span>{tr('pr.oneOwner')}</span>
        </div>
      <div className="form-grid two-col">
        <label className="field grow">
          <span>{tr('pr.target')}</span>
          <Input value={target} disabled={busy} onChange={(e) => setTarget(e.target.value)} placeholder="host:port" />
        </label>
        <label className="field grow">
          <span>{tr('pr.leader')}</span>
          <Input value={leader} disabled={busy} onChange={(e) => setLeader(e.target.value)} placeholder="host:port" />
        </label>
      </div>
      </div>
      <div className="form-section">
        <div className="form-section-head">
          <strong>{tr('pr.protocolSection')}</strong>
          <span>{setupBadge}</span>
        </div>
      <div className="form-grid practical-form-grid">
        <label className="field compact">
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
            options={protocolOptions}
            value={protocol}
            onChange={(v) => setProtocol(v as string)}
            disabled={busy}
          />
          {missingProtocols.length > 0 && (
            <small>{tr('protocol.notBuilt', { list: missingProtocols.map((p) => p.label).join(', ') })}</small>
          )}
          {requiresEqualSizes && <small>{tr('protocol.equalSizeHint')}</small>}
          {isTwoPartyPsi && <small>{tr('protocol.twoPartyHint')}</small>}
        </label>
        <label className="field compact">
          <span>N</span>
          <Input value={effN} disabled={busy || isTwoPartyPsi} onChange={(e) => setN(e.target.value.replace(/\D/g, ''))} />
          {isTwoPartyPsi && <small>{tr('protocol.twoPartyHint')}</small>}
        </label>
        <label className="field compact">
          <span>t</span>
          <Input
            value={effT}
            disabled={busy || isFullMpsi || isTwoPartyPsi}
            onChange={(e) => setT(e.target.value.replace(/\D/g, ''))}
          />
          {isTwoPartyPsi && <small>{tr('demo.t.lockedTwoParty')}</small>}
        </label>
      </div>
      </div>
      <label className="field element-editor">
        <span className="field-title-row">
          <span>{tr('pr.elements')}</span>
          <span className="pill">{tr('pr.elementCount', { count: elementCount })}</span>
        </span>
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
            <div className="form-grid tls-grid">
              <label className="toggle-card field">
                <span>{tr('pr.mtls.use')}</span>
                <Switch checked={tls} onChange={setTls} disabled={busy} />
                <small>{tls ? tr('cluster.mtlsOn') : tr('cluster.mtlsOff')}</small>
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
      <div className="action-row">
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
          <div className="result-overview practical-result">
            <div>
              <span>{tr('pr.status')}</span>
              <strong>{result.status || tr('demo.party.empty')}</strong>
            </div>
            <div>
              <span>{tr('pr.intersection')} ({result.intersection.length})</span>
              <code>{result.intersection.join(', ') || tr('demo.party.empty')}</code>
            </div>
          </div>
        </>
      )}
    </Card>
  )
}

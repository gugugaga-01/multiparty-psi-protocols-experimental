import { useEffect, useState } from 'react'
import { Button, Card, Input, Select, Switch, Collapse, Icon } from 'animal-island-ui'
import { api, formatApiError, type SubmitResult } from '../api'
import { useProtocolSelection } from '../ProtocolSelectionContext'
import { useI18n } from '../i18n'
import { ProtocolPicker } from './ProtocolPicker'

export function PracticalPanel() {
  const { t: tr } = useI18n()
  const { protocol } = useProtocolSelection()
  const ROLES = [
    { key: 'member', label: tr('pr.role.member') },
    { key: 'leader', label: tr('pr.role.leader') },
  ]
  const [target, setTarget] = useState('127.0.0.1:53100')
  const [leader, setLeader] = useState('127.0.0.1:53002')
  const [role, setRole] = useState<'leader' | 'member'>('member')
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

  // XZH26 is plain MPSI (intersection of all parties): threshold is always N.
  // DH PSI is exactly two-party PSI, so both N and t are fixed at 2.
  const isFullMpsi = protocol?.thresholdMode === 'all_parties'
  const isTwoPartyPsi = protocol?.thresholdMode === 'fixed_two'
  const requiresEqualSizes = protocol?.equalSize ?? false
  const effN = isTwoPartyPsi ? '2' : n
  const effT = isTwoPartyPsi ? '2' : isFullMpsi ? n : t
  const setupBadge = isTwoPartyPsi ? tr('protocol.chip.twoParty') : requiresEqualSizes ? tr('demo.equalSizeBadge') : tr('demo.thresholdBadge')
  const elementCount = elements.split(/[\n,]/).map((s) => s.trim()).filter(Boolean).length

  useEffect(() => {
    setLeader((current) => {
      if (isTwoPartyPsi && current === '127.0.0.1:53002') return '127.0.0.1:53001'
      if (!isTwoPartyPsi && current === '127.0.0.1:53001') return '127.0.0.1:53002'
      return current
    })
  }, [isTwoPartyPsi])

  const submit = async () => {
    setErr(null); setResult(null)
    const els = elements.split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
    const numParties = parseInt(effN, 10)
    const threshold = parseInt(effT, 10)
    if (!target.trim()) { setErr(tr('form.missingTarget')); return }
    if (!leader.trim()) { setErr(tr('form.missingLeader')); return }
    if (!protocol) { setErr(tr('form.protocolUnavailable')); return }
    if (!Number.isFinite(numParties) || numParties < 2) { setErr(tr('form.invalidParties')); return }
    if (!Number.isFinite(threshold) || threshold < 2 || threshold > numParties) { setErr(tr('form.invalidThreshold')); return }
    if (els.length === 0) { setErr(tr('form.missingElements')); return }

    setBusy(true)
    try {
      const body: Parameters<typeof api.submit>[0] = {
        target: target.trim(), leader_address: leader.trim(), role,
        elements: els,
        protocol: protocol.id,
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
      setErr(formatApiError(e, tr))
    } finally { setBusy(false) }
  }

  return (
    <Card type="default" className="runner-card practical-card modern-card">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">{tr('pr.kicker')}</span>
          <h2 className="section-title">{tr('pr.title')}</h2>
          <p>{tr('pr.lead')}</p>
        </div>
        <div className="runner-summary" aria-label={tr('pr.summary')}>
          <span><Icon name="icon-miles" size={18} />{role === 'leader' ? tr('pr.role.leader') : tr('pr.role.member')}</span>
          <span>{protocol?.id ?? tr('protocol.noneAvailable')}</span>
          <span>{tr('pr.elementCount', { count: elementCount })}</span>
        </div>
      </div>
      <div className="form-section numbered-section" data-step="1">
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
      <div className="form-section numbered-section" data-step="2">
        <div className="form-section-head">
          <strong>{tr('pr.protocolSection')}</strong>
          <span>{setupBadge}</span>
        </div>
      <div className="form-grid practical-form-grid">
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
          <span>{tr('pr.role')}</span>
          <Select
            options={ROLES}
            value={role}
            onChange={(v) => setRole(v as 'leader' | 'member')}
            disabled={busy}
          />
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
      <label className="field element-editor numbered-section" data-step="3">
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
        className="security-details"
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

      <div className="action-row">
        <Button type="primary" size="large" block loading={busy} disabled={!protocol} onClick={submit}>
          {tr('pr.submit')}
        </Button>
      </div>

      {busy && (
        <div className="progress-panel" role="status" aria-live="polite">
          <span className="progress-spinner" aria-hidden="true" />
          <div>
            <strong>{tr('run.progress.title')}</strong>
            <span>{tr('pr.busy', { target, role: role === 'leader' ? tr('pr.role.leader') : tr('pr.role.member'), protocol: protocol?.id ?? '-' })}</span>
            <small>{tr('run.progress.detail')}</small>
          </div>
        </div>
      )}

      {err && (
        <div className="banner bad error-summary" role="alert" tabIndex={-1}>
          <strong>{tr('demo.failed')}</strong>
          {err}
        </div>
      )}

      {result && (
        <>
          <div className="result-overview practical-result result-card" role="status">
            <div>
              <span>{tr('pr.status')}</span>
              <strong>
                {(result.role ?? role) === 'leader'
                  ? tr('pr.status.leader', { count: result.intersection.length })
                  : tr('pr.status.member')}
              </strong>
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

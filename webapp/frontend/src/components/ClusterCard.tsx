import { useEffect, useState } from 'react'
import { Button, Card, Input, Switch, Divider, Loading, Icon } from 'animal-island-ui'
import { api, formatApiError, type ClusterStatus } from '../api'
import { useProtocolSelection } from '../ProtocolSelectionContext'
import { useI18n } from '../i18n'
import { ProtocolPicker } from './ProtocolPicker'

export function ClusterCard({
  status,
  onChange,
  compact = false,
}: {
  status: ClusterStatus | null
  onChange: () => void
  compact?: boolean
}) {
  const { t } = useI18n()
  const { protocol } = useProtocolSelection()
  const [n, setN] = useState('3')
  const [tls, setTls] = useState(false)
  const [busy, setBusy] = useState(false)
  const [busyMsg, setBusyMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const isTwoPartyPsi = protocol?.thresholdMode === 'fixed_two'
  const effN = isTwoPartyPsi ? '2' : n

  useEffect(() => {
    if (!isTwoPartyPsi && status?.num_parties && status.num_parties > 0) {
      setN(String(status.num_parties))
    }
  }, [isTwoPartyPsi, status?.num_parties])

  const anyRunning =
    !!status &&
    (status.dealer.running ||
      status.parties.some((p) => p.running))
  const runningParties = status?.parties.filter((p) => p.running).length ?? 0
  const partyTotal = status?.num_parties ?? 0
  const partyPercent = partyTotal > 0 ? Math.round((runningParties / partyTotal) * 100) : 0
  const dealerTone = status?.dealer.running ? 'ok' : 'warn'
  const partyTone = runningParties === partyTotal && partyTotal > 0 ? 'ok' : runningParties > 0 ? 'warn' : 'bad'

  const start = async () => {
    setErr(null)
    const numParties = parseInt(effN, 10)
    if (!protocol) { setErr(t('form.protocolUnavailable')); return }
    if (!Number.isFinite(numParties) || numParties < 2) { setErr(t('form.invalidParties')); return }

    setBusy(true)
    setBusyMsg(t('cluster.busy.start', { protocol: protocol.id, n: numParties }))
    try {
      await api.clusterStart({
        num_parties: numParties,
        protocol: protocol.id,
        tls,
      })
      onChange()
    } catch (e) { setErr(formatApiError(e, t)) }
    finally { setBusy(false); setBusyMsg(null) }
  }
  const stop = async () => {
    setBusy(true); setErr(null); setBusyMsg(t('cluster.busy.stop'))
    try { await api.clusterStop(); onChange() }
    catch (e) { setErr(formatApiError(e, t)) }
    finally { setBusy(false); setBusyMsg(null) }
  }

  return (
    <Card type="default" className={`cluster-card${compact ? ' cluster-card-compact' : ''}`}>
      <div className="panel-heading">
        <div>
          <span className="info-kicker">{t('cluster.kicker')}</span>
          <h2 className="section-title">{t('cluster.title')}</h2>
          <p>{t('cluster.lead')}</p>
        </div>
        <div className="panel-heading-actions">
          <span className={'pill ' + (status?.built ? 'ok' : 'bad')}>
            {status?.built ? t('cluster.builtOk') : t('cluster.notBuilt')}
          </span>
        </div>
      </div>
      <Divider type="line-teal" />

      <div className="cluster-status-grid">
        <div className={'cluster-status-tile ' + (status?.built ? 'ok' : 'bad')}>
          <Icon name="icon-design" size={24} />
          <span>{t('cluster.binary')}</span>
          <strong>{status?.built ? t('cluster.builtOk') : t('cluster.notBuilt')}</strong>
        </div>
        <div className={'cluster-status-tile ' + dealerTone}>
          <Icon name="icon-helicopter" size={24} />
          <span>{t('cluster.dealer')}</span>
          <strong>{status?.dealer.running ? t('cluster.dealerUp') : t('cluster.dealerDown')}</strong>
        </div>
        <div className={'cluster-status-tile ' + partyTone}>
          <Icon name="icon-miles" size={24} />
          <span>{t('cluster.partyHealth')}</span>
          <strong>{runningParties}/{partyTotal}</strong>
        </div>
        <div className={'cluster-status-tile ' + (tls ? 'ok' : 'warn')}>
          <Icon name="icon-critterpedia" size={24} />
          <span>{t('cluster.transport')}</span>
          <strong>{tls ? t('cluster.mtlsOn') : t('cluster.mtlsOff')}</strong>
        </div>
      </div>
      <div className="cluster-meter" aria-label={t('cluster.partyHealth')}>
        <span style={{ width: String(partyPercent) + '%' }} />
      </div>

      <div className="form-grid cluster-form-grid">
        {!compact && <ProtocolPicker disabled={busy || anyRunning} />}
        <label className="field compact">
          <span>{t('cluster.parties')}</span>
          <Input
            value={effN}
            onChange={(e) => setN(e.target.value.replace(/\D/g, '') || '')}
            disabled={busy || anyRunning || isTwoPartyPsi}
          />
          {isTwoPartyPsi && <small>{t('protocol.twoPartyHint')}</small>}
        </label>
        <label className="field compact">
          <span>{t('cluster.mtls')}</span>
          <Switch checked={tls} onChange={setTls} disabled={busy || anyRunning} />
        </label>
      </div>
      <div className="action-row">
        <Button type="primary" loading={busy} disabled={anyRunning || !protocol} onClick={start}>
          {t('cluster.start')}
        </Button>
        <Button type="default" danger loading={busy} disabled={!anyRunning} onClick={stop}>
          {t('cluster.stop')}
        </Button>
        {status?.build_dir && (
          <span className="kv build-dir">
            {t('cluster.buildDir')}: {status.build_dir}
          </span>
        )}
      </div>
      {busy && (
        <div className="aii-busy-inline">
          <Loading active style={{ height: 220 }} />
          {busyMsg && <div className="aii-busy-msg">{busyMsg}</div>}
        </div>
      )}
      {err && <div className="banner bad" style={{ marginTop: 10 }}>{err}</div>}
    </Card>
  )
}

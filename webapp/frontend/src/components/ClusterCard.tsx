import { useEffect, useState } from 'react'
import { Button, Card, Input, Select, Switch, Divider, Loading, Icon } from 'animal-island-ui'
import { api, type ClusterStatus } from '../api'
import { useI18n } from '../i18n'

export function ClusterCard({
  status,
  onChange,
}: {
  status: ClusterStatus | null
  onChange: () => void
}) {
  const { t } = useI18n()
  const [protocol, setProtocol] = useState('ks05_t_mpsi')
  const [n, setN] = useState('3')
  const [tls, setTls] = useState(false)
  const [busy, setBusy] = useState(false)
  const [busyMsg, setBusyMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  // Protocol labels carry both the key and a brief role hint (translated).
  // We localise the hint suffix only, since the protocol IDs themselves are
  // technical names that read the same in any language.
  const allProtocols = [
    { key: 'ks05_t_mpsi',   label: 'KS05 T-MPSI' },
    { key: 'beh21_ot_mpsi', label: 'BEH21 T-MPSI' },
    { key: 'yyh26_tt_mpsi', label: 'YYH26 TT-MPSI' },
    { key: 'xzh26_ec_mpsi', label: 'XZH26 MPSI' },
    { key: 'dh_psi',        label: 'DH PSI' },
  ]
  // Only offer protocols compiled into psi_party; fall back to all when
  // availability is not yet known.
  const avail = status?.protocols_available
  const protocols = avail && avail.length
    ? allProtocols.filter((p) => avail.includes(p.key))
    : allProtocols
  const missingProtocols = avail && avail.length
    ? allProtocols.filter((p) => !avail.includes(p.key))
    : []
  const firstProtocol = protocols[0]?.key
  const selectedProtocolAvailable = protocols.some((p) => p.key === protocol)
  const isTwoPartyPsi = protocol === 'dh_psi'

  useEffect(() => {
    if (isTwoPartyPsi) setN('2')
  }, [isTwoPartyPsi])

  useEffect(() => {
    if (status?.protocol) setProtocol(status.protocol)
    if (status?.num_parties && status.num_parties > 0) setN(String(status.num_parties))
  }, [status?.protocol, status?.num_parties])

  const anyRunning =
    !!status &&
    (status.dealer.running ||
      status.parties.some((p) => p.running))
  const runningParties = status?.parties.filter((p) => p.running).length ?? 0
  const partyTotal = status?.num_parties ?? 0
  const partyPercent = partyTotal > 0 ? Math.round((runningParties / partyTotal) * 100) : 0
  const dealerTone = status?.dealer.running ? 'ok' : 'warn'
  const partyTone = runningParties === partyTotal && partyTotal > 0 ? 'ok' : runningParties > 0 ? 'warn' : 'bad'

  useEffect(() => {
    if (!anyRunning && firstProtocol && !selectedProtocolAvailable) setProtocol(firstProtocol)
  }, [anyRunning, firstProtocol, selectedProtocolAvailable])

  const start = async () => {
    setErr(null)
    const numParties = isTwoPartyPsi ? 2 : parseInt(n, 10)
    if (!selectedProtocolAvailable) { setErr(t('form.protocolUnavailable')); return }
    if (!Number.isFinite(numParties) || numParties < 2) { setErr(t('form.invalidParties')); return }

    setBusy(true)
    setBusyMsg(t('cluster.busy.start', { protocol, n: numParties }))
    try {
      await api.clusterStart({
        num_parties: numParties,
        protocol,
        tls,
      })
      onChange()
    } catch (e) { setErr(String((e as Error).message)) }
    finally { setBusy(false); setBusyMsg(null) }
  }
  const stop = async () => {
    setBusy(true); setErr(null); setBusyMsg(t('cluster.busy.stop'))
    try { await api.clusterStop(); onChange() }
    catch (e) { setErr(String((e as Error).message)) }
    finally { setBusy(false); setBusyMsg(null) }
  }

  return (
    <Card type="title" color="app-teal" className="cluster-card">
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
        <label className="field grow">
          <span>{t('cluster.protocol')}</span>
          <Select
            options={protocols}
            value={protocol}
            onChange={(v) => setProtocol(v as string)}
            disabled={busy || anyRunning}
          />
          {missingProtocols.length > 0 && (
            <small>{t('protocol.notBuilt', { list: missingProtocols.map((p) => p.label).join(', ') })}</small>
          )}
        </label>
        <label className="field compact">
          <span>{t('cluster.parties')}</span>
          <Input
            value={isTwoPartyPsi ? '2' : n}
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
        <Button type="primary" loading={busy} disabled={anyRunning} onClick={start}>
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

import { useEffect, useState } from 'react'
import { Button, Card, Input, Select, Switch, Divider, Loading } from 'animal-island-ui'
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
  const protocols = [
    { key: 'ks05_t_mpsi',   label: 'KS05 T-MPSI' },
    { key: 'beh21_ot_mpsi', label: 'BEH21 T-MPSI' },
    { key: 'yyh26_tt_mpsi', label: 'YYH26 TT-MPSI' },
    { key: 'xzh26_ec_mpsi', label: 'XZH26 MPSI' },
  ]

  useEffect(() => {
    if (status?.protocol) setProtocol(status.protocol)
    if (status?.num_parties && status.num_parties > 0) setN(String(status.num_parties))
  }, [status?.protocol, status?.num_parties])

  const anyRunning =
    !!status &&
    (status.dealer.running ||
      status.parties.some((p) => p.running))

  const start = async () => {
    setBusy(true); setErr(null)
    setBusyMsg(t('cluster.busy.start', { protocol, n }))
    try {
      await api.clusterStart({
        num_parties: parseInt(n, 10),
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
    <Card type="title" color="app-teal">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 className="section-title">{t('cluster.title')}</h2>
        <div className="row tight">
          <span className={'pill ' + (status?.built ? 'ok' : 'bad')}>
            {status?.built ? t('cluster.builtOk') : t('cluster.notBuilt')}
          </span>
          <span className={'pill ' + (status?.dealer.running ? 'ok' : 'warn')}>
            {status?.dealer.running ? t('cluster.dealerUp') : t('cluster.dealerDown')}
          </span>
          <span className={'pill ' + (anyRunning ? 'ok' : 'warn')}>
            {status?.parties.filter((p) => p.running).length ?? 0}/
            {status?.num_parties ?? 0} {t('cluster.parties').toLowerCase()}
          </span>
        </div>
      </div>
      <Divider type="line-teal" />
      <div className="row">
        <label className="field grow">
          <span>{t('cluster.protocol')}</span>
          <Select
            options={protocols}
            value={protocol}
            onChange={(v) => setProtocol(v as string)}
            disabled={busy || anyRunning}
          />
        </label>
        <label className="field" style={{ width: 120 }}>
          <span>{t('cluster.parties')}</span>
          <Input
            value={n}
            onChange={(e) => setN(e.target.value.replace(/\D/g, '') || '')}
            disabled={busy || anyRunning}
          />
        </label>
        <label className="field" style={{ width: 140 }}>
          <span>{t('cluster.mtls')}</span>
          <Switch checked={tls} onChange={setTls} disabled={busy || anyRunning} />
        </label>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <Button type="primary" loading={busy} disabled={anyRunning} onClick={start}>
          {t('cluster.start')}
        </Button>
        <Button type="default" danger loading={busy} disabled={!anyRunning} onClick={stop}>
          {t('cluster.stop')}
        </Button>
        <span className="kv">
          {status?.build_dir ? `${t('cluster.buildDir')}: ${status.build_dir}` : ''}
        </span>
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

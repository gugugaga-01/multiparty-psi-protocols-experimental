import { useEffect, useState } from 'react'
import { Button, Card, Input, Select, Switch, Divider, Loading } from 'animal-island-ui'
import { api, type ClusterStatus } from '../api'

const PROTOCOLS = [
  { key: 'ks05_t_mpsi',   label: 'KS05 T-MPSI (trusted dealer)' },
  { key: 'beh21_t_mpsi',  label: 'BEH21 T-MPSI (trusted dealer)' },
  { key: 'yyh26_tt_mpsi', label: 'YYH26 TT-MPSI (dealerless)' },
]

export function ClusterCard({
  status,
  onChange,
}: {
  status: ClusterStatus | null
  onChange: () => void
}) {
  const [protocol, setProtocol] = useState('ks05_t_mpsi')
  const [n, setN] = useState('3')
  const [tls, setTls] = useState(false)
  const [busy, setBusy] = useState(false)
  const [busyMsg, setBusyMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (status?.protocol) setProtocol(status.protocol)
    if (status?.num_parties && status.num_parties > 0) setN(String(status.num_parties))
  }, [status?.protocol, status?.num_parties])

  const anyRunning =
    !!status &&
    (status.dealer.running ||
      status.parties.some((p) => p.running))

  const start = async () => {
    setBusy(true); setErr(null); setBusyMsg(`Starting cluster (${protocol}, N=${n})…`)
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
    setBusy(true); setErr(null); setBusyMsg('Stopping cluster…')
    try { await api.clusterStop(); onChange() }
    catch (e) { setErr(String((e as Error).message)) }
    finally { setBusy(false); setBusyMsg(null) }
  }

  return (
    <Card type="title" color="app-teal">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h2 className="section-title">Cluster control</h2>
        <div className="row tight">
          <span className={'pill ' + (status?.built ? 'ok' : 'bad')}>
            {status?.built ? 'binaries OK' : 'NOT BUILT'}
          </span>
          <span className={'pill ' + (status?.dealer.running ? 'ok' : 'warn')}>
            dealer {status?.dealer.running ? 'up' : 'down'}
          </span>
          <span className={'pill ' + (anyRunning ? 'ok' : 'warn')}>
            {status?.parties.filter((p) => p.running).length ?? 0}/
            {status?.num_parties ?? 0} parties
          </span>
        </div>
      </div>
      <Divider type="line-teal" />
      <div className="row">
        <label className="field grow">
          <span>Protocol</span>
          <Select
            options={PROTOCOLS}
            value={protocol}
            onChange={(v) => setProtocol(v as string)}
            disabled={busy || anyRunning}
          />
        </label>
        <label className="field" style={{ width: 120 }}>
          <span>Parties</span>
          <Input
            value={n}
            onChange={(e) => setN(e.target.value.replace(/\D/g, '') || '')}
            disabled={busy || anyRunning}
          />
        </label>
        <label className="field" style={{ width: 140 }}>
          <span>mTLS</span>
          <Switch checked={tls} onChange={setTls} disabled={busy || anyRunning} />
        </label>
      </div>
      <div className="row" style={{ marginTop: 10 }}>
        <Button type="primary" loading={busy} disabled={anyRunning} onClick={start}>
          Start cluster
        </Button>
        <Button type="default" danger loading={busy} disabled={!anyRunning} onClick={stop}>
          Stop cluster
        </Button>
        <span className="kv">
          {status?.build_dir ? `build dir: ${status.build_dir}` : ''}
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

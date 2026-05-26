# psinsieme web console

A browser UI for running the PSI protocols without touching the shell. It wraps
the same `psi_party` / `psi_dealer` binaries that `service/demos/` drive, and
talks to them through the Python client SDK in `service/clients/python`.

Two modes:

- **Demo** — coordinator view. Fires N parallel client requests at a local
  cluster using a curated input set with known overlap (mirrors
  `service/demos/ks05/demo.sh`). Can auto-start and tear down the cluster for
  you (one-click "start cluster").
- **Practical** — single-party form. The browser represents one data owner; you
  point it at your party endpoint plus the leader's inter-party address and
  submit your private set.

## Prerequisites

- The service binaries built (`psi_party`, `psi_dealer`) — see the
  [top-level Quick Start](../README.md#quick-start). The console looks for them
  under `build/service/` by default.
- Node.js 18+ and npm (to build the frontend).
- Python 3.10+ with `grpcio` and `protobuf`:

  ```bash
  pip install -r requirements.txt
  ```

  (The HTTP server itself is stdlib-only; these are needed by the underlying
  `mpsi_client`.)

## Build and run

From the repository root, after building the service:

```bash
# 1. Build the frontend (produces webapp/frontend/dist/)
cd webapp/frontend
npm install
npm run build
cd ..

# 2. Start the web console (serves the built UI + API on :38888)
bash run.sh
```

Then open <http://127.0.0.1:38888>.

If you open the page before building the frontend, the server returns a "UI not
built" notice telling you to run the `npm` build above.

## Configuration

Environment variables read by `server.py`:

| Variable             | Default   | Meaning                                  |
|----------------------|-----------|------------------------------------------|
| `PSINSIEME_WEB_HOST` | `0.0.0.0` | Bind address.                            |
| `PSINSIEME_WEB_PORT` | `38888`   | Listen port.                             |
| `PSINSIEME_WEB_LOG`  | `INFO`    | Log level (`DEBUG` for verbose tracing). |

Logs go to stderr and to `webapp/logs/server.log` (rotating). Cluster process
logs (dealer + each party) land in `webapp/logs/`.

## Notes

- Only one auto-managed cluster runs at a time per server instance. The Demo
  mode reuses an already-running cluster when the protocol and party count
  match, otherwise it restarts it.
- `yyh26_tt_mpsi` is dealerless and must be compiled into `psi_party`
  (`-DMPSI_BUILD_YYH26=ON`) and have its experiment binary built — see
  [service/README.md](../service/README.md). The console detects a missing
  YYH26 build and reports it rather than failing cryptically at request time.

# psinsieme web console

A browser UI for running PSI and MPSI protocols without touching the shell. It wraps
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

## Install and Run

### Option 1: Docker Hub image

Use the Docker image when you just want to run the browser console. It already contains the frontend build, Python runtime, and prebuilt service binaries.

```bash
docker pull gugugaga001/psinsieme:latest

docker run --rm \
  -p 127.0.0.1:38888:38888 \
  -e PSINSIEME_WEB_HOST=0.0.0.0 \
  -e PSINSIEME_WEB_PUBLIC_BIND=1 \
  gugugaga001/psinsieme:latest
```

Open <http://127.0.0.1:38888>. For a pinned build, use `gugugaga001/psinsieme:slim-20260530` (`sha256:81453a39cfa76e8794426cef399db69726c598e2272cf36b910d6c221f11005a`).

For non-local exposure, set `PSINSIEME_WEB_TOKEN` and send it as `X-PSINSIEME-Token` on POST APIs. The command above publishes the container only on host loopback.

### Option 2: Build from source

Use a source build when developing the UI/service or changing compile-time protocol flags.

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
| `PSINSIEME_WEB_HOST` | `127.0.0.1` | Bind address.                            |
| `PSINSIEME_WEB_PORT` | `38888`   | Listen port.                             |
| `PSINSIEME_WEB_LOG`  | `INFO`    | Log level (`DEBUG` for verbose tracing). |

Logs go to stderr and to `webapp/logs/server.log` (rotating). Cluster process
logs (dealer + each party) land in `webapp/logs/`.

## Notes

- Only one auto-managed cluster runs at a time per server instance. The Demo
  mode reuses an already-running cluster when the protocol and party count
  match, otherwise it restarts it.
- **The protocol pickers only list protocols actually compiled into the
  `psi_party` binary.** The console scans the binary for each protocol's ID and
  hides the rest, with a small "not built" note naming them. A direct API call
  for a missing protocol returns a clear "not compiled into psi_party" error.
- **Equal set sizes**: `xzh26_ec_mpsi` and `beh21_ot_mpsi` require every party to
  hold the same number of elements (their hashing/OT machinery aborts otherwise).
  The Demo mode generates equal-size sets for these protocols automatically, and
  unequal custom inputs are rejected with a clear error.
- `xzh26_ec_mpsi` is plain MPSI, so the threshold is locked to N in the UI.
  `beh21_ot_mpsi` and `ks05_t_mpsi` are threshold protocols (t ≤ N is allowed).
- `dh_psi` is semi-honest two-party PSI. The UI locks `num_parties=2`
  and `threshold=2`; demo and submit APIs reject other values clearly.
- Dealer use: KS05 and BEH21 use the trusted dealer; XZH26, YYH26, and
  DH PSI are dealerless (XZH26 DKG runs in-protocol).
- XZH26 and YYH26 **cannot both be compiled into one `psi_party`** — they vendor
  conflicting copies of osuCrypto/cryptoTools. XZH26 is on by default; build
  YYH26 instead with `-DMPSI_BUILD_YYH26=ON -DMPSI_BUILD_XZH26=OFF`. DH PSI
  is controlled by `-DPSI_BUILD_DH=ON/OFF`; it is detected as `dh_psi` when
  compiled into `psi_party`. The build
  fails fast if both flags are set.

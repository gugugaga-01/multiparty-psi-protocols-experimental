# Security Notes

This repository includes a browser-accessible web console and PSI service
components. Raw scanner outputs are local-only and should not be committed; this
file tracks the actionable review status.

## Current Remediations

- Web console binding now defaults to `127.0.0.1`. Public binding requires
  `PSINSIEME_WEB_HOST=0.0.0.0` and explicit `PSINSIEME_WEB_PUBLIC_BIND=1`.
- Unsafe web API requests support `X-PSINSIEME-Token` when
  `PSINSIEME_WEB_TOKEN` is configured, and cross-origin POSTs with a mismatched
  `Origin`/`Host` are rejected.
- Web API request bodies, party counts, element counts, element length, and
  request timeouts are bounded with `PSINSIEME_WEB_MAX_*` environment overrides.
- `TlsMode::TLS` is treated as local-demo encrypt-only mode. Clients must use
  mTLS for verified identity, or explicitly set `MPSI_ALLOW_INSECURE_TLS=1` to
  allow encrypt-only TLS.
- The dealer now clears retained Paillier key material after the late-fetch grace
  period, and comments describe the actual key lifetime.
- Cppcheck-reported uninitialized YYH26 experimental hasher members are
  initialized in their constructors.

## Remaining Operational Guidance

- Do not expose the web console publicly without setting `PSINSIEME_WEB_TOKEN`
  and putting it behind normal service controls such as TLS termination and
  access logging.
- Prefer `--tls-mode mtls` for service processes. Plain `tls` is only for local
  demos because it does not verify peer identity.
- Keep scanner output directories local. Commit concise findings and decisions
  here instead of raw reports.

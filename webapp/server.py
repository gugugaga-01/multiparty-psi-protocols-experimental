"""psinsieme web frontend — stdlib-only HTTP server on :38888.

Two modes:
  - Demo:      coordinator-style; fires N parallel client requests at already
               running psi_party processes using a curated input set with
               known overlap (mirrors service/demos/ks05/demo.sh).
  - Practical: single-party form. The browser represents one data owner;
               you specify your party endpoint plus the leader's inter-party
               address and submit your private set.
"""

from __future__ import annotations

import json
import logging
import os
import sys
import threading
import time
import traceback
import uuid
from collections import Counter
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parent
PY_CLIENT = PROJECT_ROOT / "service" / "clients" / "python"
STATIC_DIR = ROOT / "static"
LOG_DIR = ROOT / "logs"

sys.path.insert(0, str(PY_CLIENT))
os.environ.setdefault("no_proxy", "127.0.0.1,localhost")

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
#
# Levels follow PSINSIEME_WEB_LOG (default INFO; set DEBUG for verbose tracing).
# Logs go to stderr AND to webapp/logs/server.log (rotating). Each request gets
# a short request_id stitched through every related log line so a single
# protocol run can be reconstructed from grep.
#

LOG_LEVEL = os.environ.get("PSINSIEME_WEB_LOG", "INFO").upper()
LOG_DIR.mkdir(exist_ok=True)


class _RequestIdFilter(logging.Filter):
    """Inject the current thread's request_id (or '-') into every record."""

    _local = threading.local()

    def filter(self, record: logging.LogRecord) -> bool:
        record.request_id = getattr(self._local, "request_id", "-")
        return True


_FILTER = _RequestIdFilter()


def _set_request_id(rid: str | None) -> None:
    if rid is None:
        try:
            del _RequestIdFilter._local.request_id
        except AttributeError:
            pass
    else:
        _RequestIdFilter._local.request_id = rid


def _setup_logging() -> logging.Logger:
    fmt = logging.Formatter(
        "%(asctime)s.%(msecs)03d %(levelname)-5s [%(request_id)s] %(name)s: %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

    root = logging.getLogger()
    root.setLevel(LOG_LEVEL)
    # Remove pre-existing handlers (avoids duplicate lines on reload).
    for h in list(root.handlers):
        root.removeHandler(h)

    stderr_h = logging.StreamHandler(sys.stderr)
    stderr_h.setFormatter(fmt)
    stderr_h.addFilter(_FILTER)
    root.addHandler(stderr_h)

    try:
        from logging.handlers import RotatingFileHandler
        file_h = RotatingFileHandler(
            LOG_DIR / "server.log",
            maxBytes=5 * 1024 * 1024,
            backupCount=3,
            encoding="utf-8",
        )
        file_h.setFormatter(fmt)
        file_h.addFilter(_FILTER)
        root.addHandler(file_h)
    except Exception as e:  # pragma: no cover — file handler is best-effort
        sys.stderr.write(f"[psinsieme-web] file logging disabled: {e}\n")

    return logging.getLogger("psinsieme.web")


log = _setup_logging()

from mpsi_client import PsiClient  # noqa: E402
import cluster  # noqa: E402  (local module — webapp/cluster.py)


# ---------------------------------------------------------------------------
# Demo input generator (mirrors service/demos/ks05/demo.sh)
# ---------------------------------------------------------------------------

ALL_COMMON = ["Alpha", "Bravo", "Charlie", "Delta"]
MOST_COMMON = ["Echo", "Foxtrot", "Golf", "Hotel"]
PAIR_COMMON = ["India", "Juliet"]
UNIQUE_POOL = [
    "Kilo", "Lima", "Mike", "November", "Oscar", "Papa",
    "Quebec", "Romeo", "Sierra", "Tango", "Uniform", "Victor",
    "Whiskey", "Xray", "Yankee", "Zulu",
    "Amber", "Blake", "Coral", "Drake", "Ember", "Frost",
    "Garnet", "Haven", "Ivory", "Jasper", "Karma", "Lotus",
    "Maple", "Noble", "Onyx", "Pearl", "Quartz", "Raven",
    "Sage", "Terra", "Unity", "Valor", "Willow", "Zenith",
    "Agate", "Birch", "Cedar", "Dune", "Elm", "Flint",
    "Glen", "Hawk", "Isle", "Jade", "Knoll", "Lark",
    "Moss", "Nest", "Opal", "Pine", "Ridge", "Stone",
]


def build_demo_inputs(n: int) -> list[list[str]]:
    inputs: list[list[str]] = []
    idx = 0
    for i in range(n):
        s = list(ALL_COMMON)
        if i > 0:
            s += MOST_COMMON
        if i == 0 or i == n - 1:
            s += PAIR_COMMON
        if i == 0:
            num_unique = 6
        elif i == n - 1:
            num_unique = 10
        else:
            num_unique = 8
        s += UNIQUE_POOL[idx:idx + num_unique]
        idx += num_unique
        inputs.append(s)
    return inputs


def expected_intersection(inputs: list[list[str]], t: int) -> set[str]:
    counter: Counter[str] = Counter()
    for s in inputs:
        for e in s:
            counter[e] += 1
    leader_set = set(inputs[-1])
    return {e for e in leader_set if counter[e] >= t}


# ---------------------------------------------------------------------------
# API handlers
# ---------------------------------------------------------------------------


def handle_demo(req: dict[str, Any]) -> dict[str, Any]:
    n = int(req.get("num_parties", 3))
    if n < 2:
        raise ValueError("num_parties must be >= 2")
    auto_cluster = bool(req.get("auto_cluster", True))
    t_raw = req.get("threshold")
    t = int(t_raw) if t_raw is not None else n
    if t < 2 or t > n:
        raise ValueError(f"threshold must be in [2, {n}]")
    protocol = str(req.get("protocol", "ks05_t_mpsi"))
    client_port_base = int(req.get("client_port_base", 53100))
    inter_port_base = int(req.get("inter_port_base", 53000))
    timeout = float(req.get("timeout", 300))

    raw_inputs = req.get("inputs")
    if raw_inputs is not None:
        if not isinstance(raw_inputs, list) or len(raw_inputs) != n:
            raise ValueError(f"inputs must be a list of {n} lists (one per party)")
        inputs: list[list[str]] = []
        for i, s in enumerate(raw_inputs):
            if not isinstance(s, list):
                raise ValueError(f"inputs[{i}] must be a list of strings")
            cleaned = [str(x).strip() for x in s if str(x).strip()]
            if not cleaned:
                raise ValueError(f"inputs[{i}] is empty (party {i} needs at least one element)")
            inputs.append(cleaned)
        log.info("demo: using custom inputs (sizes=%s)", [len(s) for s in inputs])
    else:
        inputs = build_demo_inputs(n)
    expected = expected_intersection(inputs, t)

    inter_addrs = [f"127.0.0.1:{inter_port_base + i}" for i in range(n)]
    client_addrs = [f"127.0.0.1:{client_port_base + i}" for i in range(n)]
    leader_address = sorted(inter_addrs)[-1]

    log.info(
        "demo: protocol=%s n=%d t=%d leader=%s client_ports=[%d..%d] inter_ports=[%d..%d] expected=%d auto_cluster=%s",
        protocol, n, t, leader_address,
        client_port_base, client_port_base + n - 1,
        inter_port_base, inter_port_base + n - 1,
        len(expected), auto_cluster,
    )

    # ---- auto-manage cluster ------------------------------------------------
    # If the demo's port bases match the cluster module's defaults, we can
    # transparently start/stop the cluster around this run. If a cluster is
    # already up with the right N, we reuse it (no teardown). If the user
    # picked custom ports, we leave cluster management alone.
    started_for_demo = False
    if auto_cluster and (
        client_port_base == cluster.CLIENT_PORT_BASE
        and inter_port_base == cluster.INTER_PORT_BASE
    ):
        cs = cluster.status()
        needs_dealer = protocol not in cluster.DEALERLESS_PROTOCOLS
        dealer_ok = (not needs_dealer) or cs["dealer"]["running"]
        already_matches = (
            dealer_ok
            and cs["num_parties"] == n
            and cs.get("protocol") == protocol
            and all(p["running"] and p["client_listening"] for p in cs["parties"])
        )
        if not already_matches:
            if cs["dealer"]["running"] or cs["num_parties"] > 0:
                log.info("demo: stopping mismatched cluster before auto-start "
                         "(running_protocol=%r want=%r)", cs.get("protocol"), protocol)
                cluster.stop()
            log.info("demo: auto-starting cluster (protocol=%s n=%d)", protocol, n)
            cluster.start(num_parties=n, protocol=protocol)
            started_for_demo = True
        else:
            log.info("demo: reusing already-running cluster (protocol=%s n=%d)", protocol, n)
    elif auto_cluster:
        log.info("demo: auto_cluster requested but custom ports in use — skipping auto-start")

    results: dict[int, dict[str, Any]] = {}
    parent_rid = getattr(_RequestIdFilter._local, "request_id", "-")

    def run(i: int) -> None:
        _set_request_id(f"{parent_rid}/p{i}")
        role = "leader" if inter_addrs[i] == leader_address else "member"
        target = client_addrs[i]
        log.debug("party %d (%s): connecting to %s, |input|=%d", i, role, target, len(inputs[i]))
        t0 = time.monotonic()
        try:
            with PsiClient(target) as c:
                intersection, status = c.compute_intersection(
                    inputs[i],
                    role=role,
                    leader_address=leader_address,
                    protocol=protocol,
                    num_parties=n,
                    threshold=t,
                    timeout=timeout,
                )
                dt = time.monotonic() - t0
                results[i] = {"intersection": list(intersection), "status": status, "role": role}
                log.info("party %d (%s) ok: |out|=%d status=%r elapsed=%.2fs",
                         i, role, len(intersection), status, dt)
        except Exception as e:
            dt = time.monotonic() - t0
            results[i] = {"intersection": [], "status": "", "role": role, "error": str(e)}
            log.exception("party %d (%s) failed after %.2fs: %s", i, role, dt, e)

    t_total = time.monotonic()
    try:
        threads = [threading.Thread(target=run, args=(i,), name=f"party-{i}") for i in range(n)]
        for th in threads:
            th.start()
        for th in threads:
            th.join(timeout=timeout + 30)
        log.info("demo: all parties joined in %.2fs", time.monotonic() - t_total)
    finally:
        if started_for_demo:
            log.info("demo: tearing down auto-started cluster")
            try:
                cluster.stop()
            except Exception as e:  # pragma: no cover
                log.error("demo: cluster.stop() failed: %s", e)

    parties = []
    success = True
    for i in range(n):
        r = results.get(i, {"intersection": [], "status": "", "role": "?", "error": "no result"})
        if r.get("error"):
            success = False
        parties.append({
            "name": f"Party {i}",
            "role": r["role"],
            "address": client_addrs[i],
            "input": inputs[i],
            "intersection": r["intersection"],
            "status": r["status"],
            "error": r.get("error"),
        })

    leader_idx = inter_addrs.index(leader_address)
    leader_result = set(results.get(leader_idx, {}).get("intersection", []))
    matched = leader_result == expected
    if not matched:
        success = False
        log.warning("demo: leader result %s != expected %s",
                    sorted(leader_result), sorted(expected))
    log.info("demo: success=%s matched_expected=%s", success, matched)

    return {
        "num_parties": n,
        "threshold": t,
        "protocol": protocol,
        "leader_address": leader_address,
        "expected": sorted(expected),
        "parties": parties,
        "success": success,
    }


def handle_submit(req: dict[str, Any]) -> dict[str, Any]:
    target = str(req.get("target", "")).strip()
    leader_address = str(req.get("leader_address", "")).strip()
    role = str(req.get("role", "member"))
    elements = req.get("elements") or []
    if not target or not leader_address:
        raise ValueError("target and leader_address are required")
    if role not in ("leader", "member"):
        raise ValueError("role must be 'leader' or 'member'")
    if not isinstance(elements, list) or not elements:
        raise ValueError("elements must be a non-empty list of strings")

    protocol = str(req.get("protocol", "ks05_t_mpsi"))
    num_parties = int(req.get("num_parties", 3))
    threshold = int(req.get("threshold", 3))
    timeout = float(req.get("timeout", 300))
    tls = bool(req.get("tls", False))

    kwargs: dict[str, Any] = {"tls": tls}
    if tls:
        kwargs.update(
            ca_cert=req.get("ca_cert"),
            client_cert=req.get("client_cert"),
            client_key=req.get("client_key"),
        )
    log.info(
        "submit: target=%s leader=%s role=%s protocol=%s n=%d t=%d |input|=%d tls=%s",
        target, leader_address, role, protocol, num_parties, threshold,
        len(elements), tls,
    )
    t0 = time.monotonic()
    try:
        with PsiClient(target, **kwargs) as c:
            intersection, status = c.compute_intersection(
                list(elements),
                role=role,
                leader_address=leader_address,
                protocol=protocol,
                num_parties=num_parties,
                threshold=threshold,
                timeout=timeout,
            )
    except Exception as e:
        log.exception("submit failed after %.2fs: %s", time.monotonic() - t0, e)
        raise
    dt = time.monotonic() - t0
    log.info("submit ok: |out|=%d status=%r elapsed=%.2fs", len(intersection), status, dt)
    return {"intersection": list(intersection), "status": status}


# ---------------------------------------------------------------------------
# HTTP server
# ---------------------------------------------------------------------------


CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8",
    ".js":   "application/javascript; charset=utf-8",
    ".css":  "text/css; charset=utf-8",
    ".svg":  "image/svg+xml",
    ".json": "application/json",
    ".ico":  "image/x-icon",
}


class Handler(BaseHTTPRequestHandler):
    server_version = "psinsieme-web/0.1"

    # Suppress BaseHTTPRequestHandler's default access log — we emit our own
    # via _finish_request() with timing + request_id.
    def log_message(self, fmt: str, *args: Any) -> None:  # noqa: A003
        return

    def log_error(self, fmt: str, *args: Any) -> None:
        log.error("http: " + fmt, *args)

    # ----- helpers ------------------------------------------------------

    # ----- per-request lifecycle ---------------------------------------

    def setup(self) -> None:
        super().setup()
        self._t0 = time.monotonic()
        self._status: int = 0
        self._bytes: int = 0
        rid = uuid.uuid4().hex[:8]
        _set_request_id(rid)

    def finish(self) -> None:
        try:
            dt_ms = (time.monotonic() - getattr(self, "_t0", time.monotonic())) * 1000.0
            log.info(
                "http %s %s -> %d %dB in %.1fms (from %s)",
                getattr(self, "command", "?"),
                getattr(self, "path", "?"),
                self._status,
                self._bytes,
                dt_ms,
                self.client_address[0] if self.client_address else "?",
            )
        finally:
            _set_request_id(None)
            super().finish()

    def _send_json(self, code: int, payload: Any) -> None:
        body = json.dumps(payload).encode("utf-8")
        self._status = code
        self._bytes = len(body)
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_file(self, path: Path) -> None:
        if not path.is_file():
            self._status = 404
            self.send_error(404, "Not found")
            return
        ct = CONTENT_TYPES.get(path.suffix.lower(), "application/octet-stream")
        data = path.read_bytes()
        self._status = 200
        self._bytes = len(data)
        self.send_response(200)
        self.send_header("Content-Type", ct)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _read_json(self) -> dict[str, Any]:
        length = int(self.headers.get("Content-Length") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    # ----- routing ------------------------------------------------------

    def do_GET(self) -> None:
        full_path = self.path
        path = full_path.split("?", 1)[0]
        if path == "/" or path == "/index.html":
            self._send_file(STATIC_DIR / "index.html")
            return
        if path == "/api/health":
            self._send_json(200, {"status": "ok"})
            return
        if path == "/api/cluster/status":
            self._send_json(200, cluster.status())
            return
        if path == "/api/demo/defaults":
            from urllib.parse import parse_qs, urlparse
            qs = parse_qs(urlparse(full_path).query)
            try:
                n = int((qs.get("n") or ["3"])[0])
            except ValueError:
                self._send_json(400, {"detail": "n must be an integer"})
                return
            if n < 2 or n > 32:
                self._send_json(400, {"detail": "n must be in [2, 32]"})
                return
            inputs = build_demo_inputs(n)
            t_default = n
            self._send_json(200, {
                "num_parties": n,
                "threshold": t_default,
                "inputs": inputs,
                "expected": sorted(expected_intersection(inputs, t_default)),
            })
            return
        if path.startswith("/static/"):
            rel = path[len("/static/"):].lstrip("/")
            target = (STATIC_DIR / rel).resolve()
            if STATIC_DIR.resolve() not in target.parents and target != STATIC_DIR.resolve():
                self.send_error(403, "Forbidden")
                return
            self._send_file(target)
            return
        self.send_error(404, "Not found")

    def do_POST(self) -> None:
        path = self.path.split("?", 1)[0]
        try:
            req = self._read_json()
        except json.JSONDecodeError as e:
            self._send_json(400, {"detail": f"invalid json: {e}"})
            return

        try:
            if path == "/api/demo":
                self._send_json(200, handle_demo(req))
                return
            if path == "/api/submit":
                self._send_json(200, handle_submit(req))
                return
            if path == "/api/cluster/start":
                n = int(req.get("num_parties", 3))
                use_tls = bool(req.get("tls", False))
                proto = str(req.get("protocol") or "ks05_t_mpsi")
                build_dir = req.get("build_dir") or None
                result = cluster.start(
                    num_parties=n, protocol=proto, use_tls=use_tls, build_dir=build_dir,
                )
                self._send_json(200, result)
                return
            if path == "/api/cluster/stop":
                self._send_json(200, cluster.stop())
                return
            self._status = 404
            self.send_error(404, "Not found")
        except (ValueError, RuntimeError) as e:
            log.warning("bad request to %s: %s", path, e)
            self._send_json(400, {"detail": str(e)})
        except Exception as e:
            log.error("handler %s failed: %s\n%s", path, e, traceback.format_exc())
            self._send_json(500, {"detail": str(e)})


def main() -> None:
    host = os.environ.get("PSINSIEME_WEB_HOST", "0.0.0.0")
    port = int(os.environ.get("PSINSIEME_WEB_PORT", "38888"))
    server = ThreadingHTTPServer((host, port), Handler)
    log.info("listening on http://%s:%d  (level=%s, log_dir=%s)",
             host, port, LOG_LEVEL, LOG_DIR)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log.info("shutting down (SIGINT)")
    finally:
        server.server_close()
        log.info("server closed")


if __name__ == "__main__":
    main()

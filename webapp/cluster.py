"""Manage local psi_dealer + psi_party subprocesses for the web UI.

The webapp can spawn the same processes that ``service/demos/ks05/demo.sh``
spawns, and tear them down on demand. Used to give the frontend a one-click
"start cluster" experience instead of asking the user to run a shell script.

Conventions match the demo:
  - dealer at  127.0.0.1:53050
  - party i inter-party at  127.0.0.1:(53000 + i)
  - party i client port at  127.0.0.1:(53100 + i)

State is held in module-level globals guarded by ``_LOCK`` — only one cluster
runs at a time per webserver instance.
"""

from __future__ import annotations

import atexit
import logging
import os
import signal
import socket
import subprocess
import threading
import time
from pathlib import Path
from typing import Any

log = logging.getLogger("psinsieme.web.cluster")


PROJECT_ROOT = Path(__file__).resolve().parent.parent
DEFAULT_BUILD_DIR = PROJECT_ROOT / "build"
LOG_DIR = Path(__file__).resolve().parent / "logs"

DEALER_PORT = 53050
INTER_PORT_BASE = 53000
CLIENT_PORT_BASE = 53100

# Protocols that don't use the trusted dealer (no Paillier key distribution).
DEALERLESS_PROTOCOLS = {"yyh26_tt_mpsi"}

# Protocols that must be selected at psi_party startup (vs per-request).
STARTUP_BOUND_PROTOCOLS = {"yyh26_tt_mpsi"}


_LOCK = threading.Lock()
_DEALER: subprocess.Popen | None = None
_PARTIES: list[subprocess.Popen | None] = []
_LOG_HANDLES: list[Any] = []  # file handles to close on stop
_CONFIG: dict[str, Any] = {}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def _binary_paths(build_dir: Path) -> tuple[Path, Path]:
    return build_dir / "service" / "psi_party", build_dir / "service" / "psi_dealer"


def _is_listening(port: int, host: str = "127.0.0.1", timeout: float = 0.2) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def _proc_alive(p: subprocess.Popen | None) -> bool:
    return bool(p and p.poll() is None)


def _wait_until_listening(port: int, deadline: float) -> bool:
    while time.monotonic() < deadline:
        if _is_listening(port):
            return True
        time.sleep(0.2)
    return False


def _open_log(name: str):
    LOG_DIR.mkdir(exist_ok=True)
    return open(LOG_DIR / f"{name}.log", "ab", buffering=0)


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------


def status() -> dict[str, Any]:
    """Snapshot of cluster state (no side effects)."""
    with _LOCK:
        build_dir = Path(_CONFIG.get("build_dir") or DEFAULT_BUILD_DIR)
        party_bin, dealer_bin = _binary_paths(build_dir)
        built = party_bin.is_file() and dealer_bin.is_file()

        n = len(_PARTIES)
        parties = []
        for i in range(n):
            p = _PARTIES[i]
            client_port = CLIENT_PORT_BASE + i
            inter_port = INTER_PORT_BASE + i
            parties.append({
                "i": i,
                "pid": p.pid if _proc_alive(p) else None,
                "running": _proc_alive(p),
                "client_port": client_port,
                "inter_port": inter_port,
                "client_listening": _is_listening(client_port),
                "log": f"party-{i}.log",
            })

        return {
            "built": built,
            "build_dir": str(build_dir),
            "party_bin": str(party_bin),
            "dealer_bin": str(dealer_bin),
            "dealer": {
                "pid": _DEALER.pid if _proc_alive(_DEALER) else None,
                "running": _proc_alive(_DEALER),
                "port": DEALER_PORT,
                "listening": _is_listening(DEALER_PORT),
                "log": "dealer.log",
            },
            "parties": parties,
            "num_parties": n,
        }


def start(
    num_parties: int = 3,
    *,
    protocol: str = "ks05_t_mpsi",
    use_tls: bool = False,
    build_dir: Path | None = None,
    startup_timeout: float = 30.0,
) -> dict[str, Any]:
    """Spawn dealer (if needed) + N parties for the given protocol."""
    if num_parties < 2 or num_parties > 16:
        raise ValueError("num_parties must be in [2, 16]")

    build_dir = Path(build_dir) if build_dir else DEFAULT_BUILD_DIR
    party_bin, dealer_bin = _binary_paths(build_dir)
    needs_dealer = protocol not in DEALERLESS_PROTOCOLS
    if not party_bin.is_file():
        raise RuntimeError(
            f"psi_party not found at {party_bin}. Build first: "
            "mkdir -p build && cd build && cmake .. && make -j$(nproc)"
        )
    if needs_dealer and not dealer_bin.is_file():
        raise RuntimeError(
            f"psi_dealer not found at {dealer_bin} (required for {protocol})."
        )

    # YYH26 needs the experiments binary + libOLE on the env.
    yyh26_env: dict[str, str] = {}
    if protocol == "yyh26_tt_mpsi":
        bin_path = os.environ.get("MPSI_YYH26_BINARY_PATH") or str(
            PROJECT_ROOT / "experiments" / "yyh26" / "bin" / "frontend.exe"
        )
        lib_path = os.environ.get("MPSI_YYH26_LIB_PATH") or str(
            PROJECT_ROOT / "experiments" / "yyh26" / "libOLE" / "bin" / "lib"
        )
        if not Path(bin_path).is_file():
            raise RuntimeError(
                f"YYH26 experiments binary not found at {bin_path}. "
                "Build it first: cd experiments/yyh26 && mkdir -p build && "
                "cd build && cmake .. -DCMAKE_BUILD_TYPE=Release && make -j$(nproc)"
            )
        yyh26_env = {
            "MPSI_YYH26_BINARY_PATH": bin_path,
            "MPSI_YYH26_LIB_PATH": lib_path,
        }

    global _DEALER, _PARTIES, _LOG_HANDLES, _CONFIG

    with _LOCK:
        if _proc_alive(_DEALER) or any(_proc_alive(p) for p in _PARTIES):
            raise RuntimeError("cluster already running; stop it first")

        # Reset state.
        _PARTIES = [None] * num_parties
        _LOG_HANDLES = []
        _CONFIG = {
            "build_dir": str(build_dir),
            "num_parties": num_parties,
            "use_tls": use_tls,
            "protocol": protocol,
            "started_at": time.time(),
        }

        env = dict(os.environ)
        env["no_proxy"] = "127.0.0.1,localhost"
        env.update(yyh26_env)

        # ---- dealer (skipped for dealerless protocols)
        dealer_addr = f"127.0.0.1:{DEALER_PORT}"
        if needs_dealer:
            dealer_log = _open_log("dealer")
            _LOG_HANDLES.append(dealer_log)
            dealer_args = [
                str(dealer_bin),
                "--parties", str(num_parties),
                "--listen", dealer_addr,
            ]
            if use_tls:
                dealer_args += ["--certs-dir", str(PROJECT_ROOT / "service" / "certs" / "test")]

            log.info("starting dealer (%s): %s", protocol, " ".join(dealer_args))
            _DEALER = subprocess.Popen(
                dealer_args,
                stdout=dealer_log, stderr=subprocess.STDOUT,
                env=env, start_new_session=True,
            )

            deadline = time.monotonic() + startup_timeout
            if not _wait_until_listening(DEALER_PORT, deadline):
                _stop_unlocked()
                raise RuntimeError(f"dealer did not start listening on :{DEALER_PORT} within {startup_timeout}s")
            log.info("dealer up (pid=%d, port=%d)", _DEALER.pid, DEALER_PORT)
        else:
            deadline = time.monotonic() + startup_timeout
            log.info("starting cluster without dealer (protocol=%s)", protocol)

        # ---- parties
        inter_addrs = [f"127.0.0.1:{INTER_PORT_BASE + i}" for i in range(num_parties)]
        for i in range(num_parties):
            others = ",".join(a for j, a in enumerate(inter_addrs) if j != i)
            client_addr = f"127.0.0.1:{CLIENT_PORT_BASE + i}"
            party_args = [
                str(party_bin),
                "--address", inter_addrs[i],
                "--addresses", others,
                "--listen", client_addr,
            ]
            if needs_dealer:
                party_args += ["--dealer", dealer_addr]
            if protocol in STARTUP_BOUND_PROTOCOLS:
                party_args += ["--protocol", protocol]
            if use_tls:
                party_args += ["--certs-dir", str(PROJECT_ROOT / "service" / "certs" / "test")]

            party_log = _open_log(f"party-{i}")
            _LOG_HANDLES.append(party_log)
            log.info("starting party %d: %s", i, " ".join(party_args))
            _PARTIES[i] = subprocess.Popen(
                party_args,
                stdout=party_log, stderr=subprocess.STDOUT,
                env=env, start_new_session=True,
            )

        # Wait for every party's client port to listen (mirrors demo.sh).
        for i in range(num_parties):
            port = CLIENT_PORT_BASE + i
            if not _wait_until_listening(port, deadline):
                _stop_unlocked()
                raise RuntimeError(f"party {i} did not start listening on :{port} within {startup_timeout}s")

        # For yyh26 (compile-time gated), confirm the binary actually has the
        # protocol registered. The party will start regardless and only fail
        # at request time with a cryptic "Unsupported protocol" — much better
        # to detect that here and tell the user to rebuild.
        if protocol == "yyh26_tt_mpsi":
            log0 = LOG_DIR / "party-0.log"
            try:
                head = log0.read_text(errors="replace") if log0.exists() else ""
            except Exception:
                head = ""
            if "yyh26" not in head.lower():
                _stop_unlocked()
                raise RuntimeError(
                    "psi_party at " + str(party_bin) + " does not have YYH26 compiled in.\n"
                    "Rebuild with: rm -rf build && mkdir build && cd build && "
                    "cmake .. -DMPSI_BUILD_YYH26=ON && make -j$(nproc)"
                )

        log.info("cluster up: %d parties + %s (protocol=%s)",
                 num_parties, "dealer" if needs_dealer else "no dealer", protocol)
        return status_unlocked()


def stop(grace: float = 3.0) -> dict[str, Any]:
    with _LOCK:
        return _stop_unlocked(grace=grace)


def _stop_unlocked(grace: float = 3.0) -> dict[str, Any]:
    """Caller must hold _LOCK."""
    global _DEALER, _PARTIES, _LOG_HANDLES, _CONFIG

    procs: list[tuple[str, subprocess.Popen | None]] = [("dealer", _DEALER)]
    for i, p in enumerate(_PARTIES):
        procs.append((f"party-{i}", p))

    killed = 0
    for name, p in procs:
        if not _proc_alive(p):
            continue
        try:
            os.killpg(os.getpgid(p.pid), signal.SIGTERM)
            log.info("stop: SIGTERM %s (pid=%d)", name, p.pid)
        except (ProcessLookupError, PermissionError) as e:
            log.warning("stop: %s SIGTERM failed: %s", name, e)

    deadline = time.monotonic() + grace
    for name, p in procs:
        if not _proc_alive(p):
            continue
        remaining = max(0.0, deadline - time.monotonic())
        try:
            p.wait(timeout=remaining)
        except subprocess.TimeoutExpired:
            try:
                os.killpg(os.getpgid(p.pid), signal.SIGKILL)
                log.warning("stop: SIGKILL %s (pid=%d)", name, p.pid)
            except (ProcessLookupError, PermissionError):
                pass
            try:
                p.wait(timeout=2.0)
            except subprocess.TimeoutExpired:
                pass
        if p.returncode is not None:
            killed += 1

    for fh in _LOG_HANDLES:
        try:
            fh.close()
        except Exception:
            pass

    _DEALER = None
    _PARTIES = []
    _LOG_HANDLES = []
    _CONFIG = {}
    log.info("cluster stopped (killed=%d)", killed)
    return {"stopped": True, "killed": killed}


def status_unlocked() -> dict[str, Any]:
    """status() without taking the lock — caller must already hold it."""
    build_dir = Path(_CONFIG.get("build_dir") or DEFAULT_BUILD_DIR)
    party_bin, dealer_bin = _binary_paths(build_dir)
    built = party_bin.is_file() and dealer_bin.is_file()
    n = len(_PARTIES)
    parties = []
    for i in range(n):
        p = _PARTIES[i]
        parties.append({
            "i": i,
            "pid": p.pid if _proc_alive(p) else None,
            "running": _proc_alive(p),
            "client_port": CLIENT_PORT_BASE + i,
            "inter_port": INTER_PORT_BASE + i,
            "client_listening": _is_listening(CLIENT_PORT_BASE + i),
            "log": f"party-{i}.log",
        })
    return {
        "built": built,
        "build_dir": str(build_dir),
        "party_bin": str(party_bin),
        "dealer_bin": str(dealer_bin),
        "dealer": {
            "pid": _DEALER.pid if _proc_alive(_DEALER) else None,
            "running": _proc_alive(_DEALER),
            "port": DEALER_PORT,
            "listening": _is_listening(DEALER_PORT),
            "log": "dealer.log",
        },
        "parties": parties,
        "num_parties": n,
        "protocol": _CONFIG.get("protocol"),
    }


@atexit.register
def _cleanup_at_exit() -> None:
    try:
        with _LOCK:
            if _proc_alive(_DEALER) or any(_proc_alive(p) for p in _PARTIES):
                log.info("atexit: stopping cluster")
                _stop_unlocked(grace=2.0)
    except Exception:
        pass

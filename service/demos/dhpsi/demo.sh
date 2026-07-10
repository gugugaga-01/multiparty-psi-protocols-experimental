#!/bin/bash
# ============================================================================
# DH PSI Protocol Demo
# ============================================================================
# Demonstrates semi-honest two-party private set intersection using the
# dealerless DH PSI protocol. The service contract is fixed at exactly two
# parties with threshold 2.
#
# Usage: ./demo.sh [--tls]
#   --tls           Enable mTLS for inter-party communication
# ============================================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SERVICE_ROOT="$SCRIPT_DIR/../.."
PROJECT_ROOT="$SERVICE_ROOT/.."
BUILD_DIR="$PROJECT_ROOT/build"
PSI_PARTY="$BUILD_DIR/service/psi_party"
PYTHON_CLIENT="$SERVICE_ROOT/clients/python"

NUM_PARTIES=2
THRESHOLD=2
PROTOCOL="dh_psi"
USE_TLS=""

while [ $# -gt 0 ]; do
    case "$1" in
        --tls) USE_TLS="yes"; shift ;;
        *) echo "Unknown option: $1"; exit 1 ;;
    esac
done

# TLS setup
if [ -n "$USE_TLS" ]; then
    CERTS_DIR="$SERVICE_ROOT/certs/test"
    if [ ! -f "$CERTS_DIR/party1.pem" ]; then
        echo "Generating mTLS certificates for $NUM_PARTIES parties..."
        bash "$SERVICE_ROOT/certs/gen_certs.sh" "$NUM_PARTIES" "$CERTS_DIR"
    fi
fi

# Check prerequisites
if [ ! -f "$PSI_PARTY" ]; then
    echo "ERROR: psi_party binary not found. Build first:"
    echo "  mkdir -p build && cd build && cmake .. -DPSI_BUILD_DH=ON && make -j\$(nproc)"
    exit 1
fi

if ! grep -a -q "$PROTOCOL" "$PSI_PARTY" 2>/dev/null; then
    echo "ERROR: psi_party was not built with DH PSI support. Rebuild with:"
    echo "  mkdir -p build && cd build && cmake .. -DPSI_BUILD_DH=ON && make -j\$(nproc)"
    exit 1
fi

python3 -c "import grpc" 2>/dev/null || {
    echo "ERROR: Python grpcio not installed. Run: pip3 install grpcio"
    exit 1
}

INTER_PARTY_ADDRS=("127.0.0.1:53000" "127.0.0.1:53001")
CLIENT_PORTS=(53100 53101)
LEADER_ADDR="${INTER_PARTY_ADDRS[1]}"

# ============================================================================
echo ""
echo "============================================================"
echo "  DH PSI Demo (2 parties, t=2, dealerless)"
echo "============================================================"

PYTHONPATH="$PYTHON_CLIENT:$PYTHONPATH" python3 -c "
import json, os

inputs = [
    ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo', 'Foxtrot'],
    ['Alpha', 'Bravo', 'Golf', 'Hotel', 'India'],
]
names = ['Party 0', 'Party 1']
expected = sorted(set(inputs[0]) & set(inputs[1]))

print()
print('  Two-party intersection (threshold = 2)')
print('  Elements appearing in both parties will be output by the leader.')
print()
for i, party_set in enumerate(inputs):
    role = ' (leader)' if i == 1 else ''
    print(f'  {names[i]}{role}: {len(party_set)} elements')
    print('    {' + ', '.join(sorted(party_set)) + '}')
print()
print(f'  Expected result ({len(expected)} elements): ' + '{' + ', '.join(expected) + '}')

data = {'inputs': inputs, 'names': names, 'expected': expected}
tmp = os.path.join('$SCRIPT_DIR', '.demo_data.json')
with open(tmp, 'w') as f:
    json.dump(data, f)
"

echo ""
echo "============================================================"
echo ""

PIDS=()
cleanup() {
    echo ""
    echo "[Demo] Shutting down..."
    for pid in "${PIDS[@]}"; do
        kill "$pid" 2>/dev/null || true
    done
    wait 2>/dev/null || true
    rm -f "$SCRIPT_DIR/.demo_data.json"
    echo "[Demo] Done."
}
trap cleanup EXIT

# Start parties. DH PSI is dealerless, so no psi_dealer is launched.
for i in $(seq 0 $((NUM_PARTIES - 1))); do
    MY_ADDR="${INTER_PARTY_ADDRS[$i]}"
    OTHER_IDX=$((1 - i))
    OTHERS="${INTER_PARTY_ADDRS[$OTHER_IDX]}"

    PARTY_ARGS=(
        --address "$MY_ADDR"
        --addresses "$OTHERS"
        --listen "127.0.0.1:${CLIENT_PORTS[$i]}"
    )

    if [ -n "$USE_TLS" ]; then
        PARTY_ARGS+=(--certs-dir "$CERTS_DIR")
        echo "[Demo] Starting Party $i with mTLS on port ${CLIENT_PORTS[$i]}"
    else
        echo "[Demo] Starting Party $i on port ${CLIENT_PORTS[$i]}"
    fi

    no_proxy=127.0.0.1,localhost "$PSI_PARTY" "${PARTY_ARGS[@]}" > /dev/null 2>&1 &
    PIDS+=($!)
done

# Wait until both party client ports are listening (up to 30 seconds)
echo "[Demo] Waiting for parties..."
TIMEOUT=30
ELAPSED=0
while [ "$ELAPSED" -lt "$TIMEOUT" ]; do
    ALL_READY=true
    for i in $(seq 0 $((NUM_PARTIES - 1))); do
        if ! ss -tln 2>/dev/null | grep -q ":${CLIENT_PORTS[$i]} " 2>/dev/null; then
            ALL_READY=false
            break
        fi
    done
    if $ALL_READY; then break; fi
    sleep 1
    ELAPSED=$((ELAPSED + 1))
done
if [ "$ELAPSED" -ge "$TIMEOUT" ]; then
    echo "[Demo] ERROR: Timed out waiting for parties to start"
    exit 1
fi
echo ""
echo "[Demo] Both parties running. Submitting inputs..."
echo ""

PYTHONPATH="$PYTHON_CLIENT:$PYTHONPATH" python3 -c "
import threading, sys, os, json

sys.path.insert(0, '$PYTHON_CLIENT')
os.environ['no_proxy'] = '127.0.0.1,localhost'

from mpsi_client import PsiClient

with open('$SCRIPT_DIR/.demo_data.json') as f:
    data = json.load(f)

inputs = data['inputs']
names = data['names']
expected = set(data['expected'])
ports = [53100, 53101]
leader_address = '$LEADER_ADDR'
results = {}
errors = {}

use_tls = '$USE_TLS' != ''
certs_dir = '$CERTS_DIR' if use_tls else ''

def run(i):
    try:
        role = 'leader' if i == 1 else 'member'
        if use_tls:
            c = PsiClient(f'127.0.0.1:{ports[i]}', tls=True,
                ca_cert=f'{certs_dir}/ca.pem',
                client_cert=f'{certs_dir}/party{i}.pem',
                client_key=f'{certs_dir}/party{i}-key.pem')
        else:
            c = PsiClient(f'127.0.0.1:{ports[i]}')
        with c:
            intersection, status = c.compute_intersection(
                inputs[i], role=role, leader_address=leader_address,
                protocol='dh_psi', num_parties=2, threshold=2, timeout=300)
            results[i] = (intersection, status)
    except Exception as e:
        errors[i] = str(e)

threads = [threading.Thread(target=run, args=(i,)) for i in range(2)]
for th in threads: th.start()
for th in threads: th.join(timeout=300)

if errors:
    for i, e in errors.items():
        print(f'  ERROR {names[i]}: {e}')
    sys.exit(1)

print('  Results:')
for i in range(2):
    intersection, status = results[i]
    if i == 1:
        result_str = ', '.join(sorted(intersection))
        print(f'    {names[i]} (leader): ' + '{' + result_str + '}')
    else:
        print(f'    {names[i]}: protocol completed (no output)')

leader_result = set(results[1][0])
print()
if leader_result == expected:
    expected_str = ', '.join(sorted(expected))
    print('  SUCCESS: DH PSI intersection = {' + expected_str + '}')
    print('  Member learned nothing about leader nonmatches.')
else:
    print(f'  FAILED: Expected {sorted(expected)}, got {sorted(leader_result)}')
    sys.exit(1)
"

echo ""
echo "============================================================"
TLS_MSG=""
if [ -n "$USE_TLS" ]; then
    TLS_MSG=" with mTLS"
fi
echo "  Demo completed successfully${TLS_MSG}"
echo "============================================================"
echo ""

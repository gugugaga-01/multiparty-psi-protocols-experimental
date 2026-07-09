#!/bin/bash
#
# Build upstream dependencies for yyh26.
#
# This script:
#   1. Initialises the git submodules (upstream, libOLE)
#   2. Patches upstream cryptoTools for modern Boost (>= 1.70) / GCC 13+
#   3. Builds miracl, cryptoTools, libOTe  -> upstream/lib/
#   4. Patches and builds libOLE (namespace rename, stdexcept, -fPIC)
#
# Prerequisites (install first):
#   sudo apt-get install build-essential cmake nasm \
#       libboost-system-dev libboost-thread-dev \
#       libgmp-dev libgmpxx4ldbl libmpfr-dev \
#       libbenchmark-dev
#   Also install NTL: https://libntl.org/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$SCRIPT_DIR"
PATCH_DIR="$SCRIPT_DIR/patches"

apply_submodule_patch() {
    local submodule="$1"
    local patch_file="$2"
    local label="$3"
    local patch_path="$PATCH_DIR/$patch_file"

    if git -C "$submodule" apply --reverse --check --whitespace=nowarn "$patch_path" >/dev/null 2>&1; then
        echo "  $label already applied"
    elif git -C "$submodule" apply --check --whitespace=nowarn "$patch_path" >/dev/null 2>&1; then
        git -C "$submodule" apply --whitespace=nowarn "$patch_path"
        echo "  Applied $label"
    else
        echo "  ERROR: $label patch does not apply cleanly" >&2
        echo "  Check $patch_path and the state of $submodule" >&2
        exit 1
    fi
}

echo "=== Step 1: Initialise submodules ==="
git submodule update --init --recursive

echo ""
echo "=== Step 2: Patch upstream for modern compilers ==="
apply_submodule_patch "upstream" "upstream-modern-build.patch" \
    "upstream modern compiler compatibility"

echo ""
echo "=== Step 3: Build miracl ==="
(
    cd upstream/thirdparty/linux/miracl/miracl/source
    if [ ! -f libmiracl.a ]; then
        bash linux64
        echo "  miracl built"
    else
        echo "  miracl already built"
    fi
)

echo ""
echo "=== Step 4: Build upstream (cryptoTools + libOTe) ==="
(
    cd upstream
    cmake . -DCMAKE_BUILD_TYPE=Release \
        -DBoost_USE_STATIC_RUNTIME=OFF \
        -DBoost_NO_BOOST_CMAKE=ON
    # Only build the two libraries we need (not upstream's own libOPRF/frontend)
    make cryptoTools libOTe -j"$(nproc)"
    echo "  upstream built -> upstream/lib/"
)

echo ""
echo "=== Step 5: Patch and build libOLE ==="
apply_submodule_patch "libOLE" "libOLE-modern-build.patch" \
    "libOLE namespace and build compatibility"
chmod +x libOLE/src/lib/bigint/run-testsuite

# Symlink upstream miracl for libOLE's linker.
MIRACL_TARGET="libOLE/third_party/cryptoTools/thirdparty/linux/miracl/miracl/source"
if [ ! -f "$MIRACL_TARGET/libmiracl.a" ]; then
    mkdir -p "$MIRACL_TARGET"
    ln -sf "$(pwd)/upstream/thirdparty/linux/miracl/miracl/source/libmiracl.a" \
        "$MIRACL_TARGET/libmiracl.a"
    echo "  Symlinked miracl for libOLE"
fi

# Build libOLE's cryptoTools with -fPIC and renamed namespace.
(
    cd libOLE/third_party/cryptoTools
    cmake . -DCMAKE_BUILD_TYPE=Release -DCMAKE_POSITION_INDEPENDENT_CODE=ON -DBoost_NO_BOOST_CMAKE=ON
    make cryptoTools -j"$(nproc)"
    echo "  libOLE cryptoTools built"
)

# Build libgazelle.
(
    cd libOLE
    make -j"$(nproc)" || true  # demo binaries may fail to link; library is ok
    if [ -f bin/lib/libgazelle.so ]; then
        echo "  libgazelle built -> libOLE/bin/lib/"
    else
        echo "  ERROR: libgazelle.so not found"
        exit 1
    fi
)

echo ""
echo "=== Done ==="
echo "Now build the project:"
echo "  mkdir -p build && cd build"
echo "  cmake .. -DCMAKE_BUILD_TYPE=Release"
echo "  make -j\$(nproc)"

# Stage 1: Build
FROM ubuntu:24.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN sed -i 's|http://archive.ubuntu.com/ubuntu|https://mirrors.ustc.edu.cn/ubuntu|g; s|http://security.ubuntu.com/ubuntu|https://mirrors.ustc.edu.cn/ubuntu|g' /etc/apt/sources.list.d/ubuntu.sources

# Install build dependencies
RUN mkdir -p /etc/ssl/certs
RUN --mount=type=secret,id=host_ca,target=/tmp/host-ca.crt,mode=0444 printf 'Acquire::https::CaInfo "/tmp/host-ca.crt";\n' > /etc/apt/apt.conf.d/99host-ca && apt-get update && apt-get install -y --no-install-recommends \
    build-essential cmake pkg-config \
    libntl-dev libgmp-dev \
    libgrpc++-dev libprotobuf-dev protobuf-compiler-grpc \
    libssl-dev libsodium-dev \
    libboost-system-dev libboost-thread-dev \
    libmpfr-dev \
    nasm \
    libomp-dev libgoogle-glog-dev libbenchmark-dev libdouble-conversion-dev \
    git ca-certificates \
    && rm -f /etc/apt/apt.conf.d/99host-ca && rm -rf /var/lib/apt/lists/*

WORKDIR /src
COPY . .

# Create a dummy git repo so vendor/setup.sh's "git submodule update" is a
# harmless no-op (the submodule content is already present from COPY).
RUN git init

# Remove stale CMake caches from host builds (paths differ inside container)
RUN find . -name CMakeCache.txt -delete && find . -name cmake_install.cmake -delete && \
    find . -type d -name CMakeFiles -exec rm -rf {} + 2>/dev/null || true

# Build the service. XZH26 is enabled by default; YYH26 is intentionally off
# because XZH26 and YYH26 vendor conflicting cryptoTools copies.
RUN mkdir -p build && cd build \
    && cmake .. -DMPSI_BUILD_TESTS=OFF \
    && make -j$(nproc)

# Use the frontend assets already present in the Docker build context.
RUN test -f webapp/frontend/dist/index.html

# Stage 2: Runtime
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN sed -i 's|http://archive.ubuntu.com/ubuntu|https://mirrors.ustc.edu.cn/ubuntu|g; s|http://security.ubuntu.com/ubuntu|https://mirrors.ustc.edu.cn/ubuntu|g' /etc/apt/sources.list.d/ubuntu.sources

# Install runtime dependencies
RUN mkdir -p /etc/ssl/certs
RUN --mount=type=secret,id=host_ca,target=/tmp/host-ca.crt,mode=0444 printf 'Acquire::https::CaInfo "/tmp/host-ca.crt";\n' > /etc/apt/apt.conf.d/99host-ca && apt-get update && apt-get install -y --no-install-recommends \
    python3 python3-pip python3-grpcio python3-protobuf ca-certificates \
    libntl44 libgmp10 \
    libgrpc++1.51t64 libprotobuf32t64 \
    libssl3t64 libsodium23 \
    libboost-system1.83.0 libboost-thread1.83.0 \
    libomp5 libgoogle-glog0v6t64 libbenchmark1.8.3 libdouble-conversion3 \
    openssl \
    && rm -f /etc/apt/apt.conf.d/99host-ca && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy binaries where the web console expects them.
COPY --from=builder /src/build/service/psi_party /app/build/service/psi_party
COPY --from=builder /src/build/service/psi_dealer /app/build/service/psi_dealer

# Copy web console and Python client runtime.
COPY --from=builder /src/webapp /app/webapp
RUN python3 -m pip install --break-system-packages --no-cache-dir -r /app/webapp/requirements.txt
COPY --from=builder /src/service/clients/python /app/service/clients/python

# Copy certificate generation script and entrypoint
COPY service/certs/gen_certs.sh /app/gen_certs.sh
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh /app/gen_certs.sh

# Add binaries to PATH
ENV PATH="/app/build/service:/app:${PATH}"

EXPOSE 38888 53050 53000-53016 53100-53116

ENTRYPOINT ["/app/docker-entrypoint.sh"]

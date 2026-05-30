# Runtime-only image. Build the native binaries and frontend assets on the host
# first, then copy only the files needed to run the web console and PSI service.
FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

COPY webapp/requirements.txt /tmp/webapp-requirements.txt

RUN --mount=type=secret,id=host_ca,target=/tmp/host-ca.crt,required=false,mode=0444 \
    if [ -f /tmp/host-ca.crt ]; then \
        printf 'Acquire::https::CaInfo "/tmp/host-ca.crt";\n' > /etc/apt/apt.conf.d/99host-ca; \
    fi \
    && apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        openssl \
        python3 \
        python3-pip \
        libgmp10 \
        libgrpc++1.51t64 \
        libprotobuf32t64 \
    && python3 -m pip install --break-system-packages --no-cache-dir --no-compile -r /tmp/webapp-requirements.txt \
    && apt-get purge -y --auto-remove python3-pip python3-setuptools python3-wheel \
    && rm -f /etc/apt/apt.conf.d/99host-ca /tmp/webapp-requirements.txt \
    && rm -rf /var/lib/apt/lists/* /root/.cache

WORKDIR /app

COPY build/service/psi_party /app/build/service/psi_party
COPY build/service/psi_dealer /app/build/service/psi_dealer

COPY webapp/server.py webapp/cluster.py webapp/run.sh /app/webapp/
COPY webapp/frontend/dist /app/webapp/frontend/dist
COPY service/clients/python/cli.py /app/service/clients/python/cli.py
COPY service/clients/python/mpsi_client /app/service/clients/python/mpsi_client

COPY service/certs/gen_certs.sh /app/gen_certs.sh
COPY docker-entrypoint.sh /app/docker-entrypoint.sh
RUN chmod +x /app/docker-entrypoint.sh /app/gen_certs.sh /app/webapp/run.sh

ENV PATH="/app/build/service:/app:${PATH}"

EXPOSE 38888 53050 53000-53016 53100-53116

ENTRYPOINT ["/app/docker-entrypoint.sh"]

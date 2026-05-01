#!/usr/bin/env bash
set -euo pipefail

SSH_TARGET="${SSH_TARGET:-nc}"
REMOTE_PATH="${REMOTE_PATH:-/home/hakan/student-hub}"
IMAGE_NAME="student-hub"
REMOTE_IMAGE="${IMAGE_NAME}:latest"
SSH_OPTS="-o ClearAllForwardings=yes"

echo "=== Building Docker image (linux/amd64) ==="
docker build --platform linux/amd64 -t "${REMOTE_IMAGE}" .

echo ""
echo "=== Saving image to tar ==="
docker save "${REMOTE_IMAGE}" -o /tmp/student-hub.tar

echo ""
echo "=== Copying image to ${SSH_TARGET} ==="
scp ${SSH_OPTS} /tmp/student-hub.tar "${SSH_TARGET}:/tmp/student-hub.tar"
rm /tmp/student-hub.tar

echo ""
echo "=== Copying compose file ==="
scp ${SSH_OPTS} docker-compose.prod.yml "${SSH_TARGET}:${REMOTE_PATH}/docker-compose.yml"

echo ""
echo "=== Loading image on server ==="
ssh ${SSH_OPTS} "${SSH_TARGET}" "docker load -i /tmp/student-hub.tar && rm /tmp/student-hub.tar"

echo ""
echo "=== Starting container ==="
ssh ${SSH_OPTS} "${SSH_TARGET}" "docker compose -f ${REMOTE_PATH}/docker-compose.yml up -d --remove-orphans"

echo ""
echo "=== Cleaning old images ==="
ssh ${SSH_OPTS} "${SSH_TARGET}" "docker image prune -f"

echo ""
echo "=== Deployment complete ==="
echo "App running at https://student.hknx.de"

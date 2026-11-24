#!/bin/sh
set -e

: "${DB_PATH:=/app/data/ruleta.db}"
: "${UPLOAD_DIR:=/app/uploads}"
: "${PORT:=4000}"
export DB_PATH UPLOAD_DIR PORT

mkdir -p "$(dirname "$DB_PATH")" "$UPLOAD_DIR"

# El seed es idempotente: crea admin/premios solo si la BD está vacía.
echo "[ruleta] Aplicando migraciones y verificando datos iniciales..."
node /app/backend/dist/scripts/seed.js

echo "[ruleta] Iniciando servidor en puerto ${PORT}..."
exec node /app/backend/dist/src/server.js

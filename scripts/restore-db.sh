#!/usr/bin/env bash
# ==============================================================================
# WAT-PROFILE: PostgreSQL Database Restore Script
# ==============================================================================
# Usage:
#   ./scripts/restore-db.sh /path/to/wat_db_backup_2026-08-20_020000.sql.gz
# ==============================================================================

set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <path-to-backup-file.sql.gz>"
  echo "Example: $0 ./backups/wat_db_backup_2026-08-20_020000.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "[ERROR] Backup file not found: ${BACKUP_FILE}" >&2
  exit 1
fi

# Load .env file if DATABASE_URL is not set
if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f "${PROJECT_ROOT}/backend/.env" ]; then
    export $(grep -E '^[A-Za-z_]+=' "${PROJECT_ROOT}/backend/.env" | xargs)
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[ERROR] DATABASE_URL is not set." >&2
  exit 1
fi

echo "=================================================="
echo " WARNING: THIS WILL OVERWRITE EXISTING DATA!"
echo " Target Database: ${DATABASE_URL}"
echo " Backup File    : ${BACKUP_FILE}"
echo "=================================================="
read -p "Are you sure you want to proceed with restore? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Restore cancelled."
  exit 0
fi

echo "Restoring database..."
gunzip -c "${BACKUP_FILE}" | psql "${DATABASE_URL}"

echo "Database restored successfully!"

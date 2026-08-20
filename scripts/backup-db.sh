#!/usr/bin/env bash
# ==============================================================================
# WAT-PROFILE: Automated PostgreSQL Database Backup Script
# ==============================================================================
# Usage:
#   ./scripts/backup-db.sh
#
# Environment variables required (can be in .env or passed directly):
#   DATABASE_URL : e.g. postgres://user:pass@localhost:5432/wat_profile?sslmode=disable
#   BACKUP_DIR   : Destination directory (default: ./backups)
#   RETENTION_DAYS : Number of days to keep backups (default: 30)
# ==============================================================================

set -euo pipefail

# Determine script and project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

# Load .env file if DATABASE_URL is not already set in environment
if [ -z "${DATABASE_URL:-}" ]; then
  if [ -f "${PROJECT_ROOT}/backend/.env" ]; then
    # Export variables from backend/.env safely
    export $(grep -v '^#' "${PROJECT_ROOT}/backend/.env" | xargs -0 2>/dev/null || grep -E '^[A-Za-z_]+=' "${PROJECT_ROOT}/backend/.env" | xargs)
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[ERROR] DATABASE_URL is not set. Please provide it in backend/.env or as an environment variable." >&2
  exit 1
fi

# Configuration
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_ROOT}/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
TIMESTAMP="$(date +'%Y-%m-%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/wat_db_backup_${TIMESTAMP}.sql.gz"

# Ensure backup directory exists
mkdir -p "${BACKUP_DIR}"

echo "=================================================="
echo " Starting PostgreSQL Database Backup"
echo " Timestamp : ${TIMESTAMP}"
echo " Output    : ${BACKUP_FILE}"
echo "=================================================="

# Check if pg_dump is installed
if ! command -v pg_dump &> /dev/null; then
  echo "[ERROR] pg_dump command not found. Please install postgresql-client." >&2
  exit 1
fi

# Execute pg_dump and pipe through gzip
echo "[1/3] Dumping database and compressing..."
pg_dump "${DATABASE_URL}" --clean --if-exists --no-owner --no-privileges | gzip > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[2/3] Backup completed successfully! (File size: ${FILE_SIZE})"

# Retention Policy: Clean up backups older than RETENTION_DAYS
echo "[3/3] Cleaning up old backups (older than ${RETENTION_DAYS} days)..."
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "wat_db_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l || true)
echo "      Cleaned up ${DELETED_COUNT} old backup file(s)."

echo "=================================================="
echo " Backup process finished successfully!"
echo "=================================================="

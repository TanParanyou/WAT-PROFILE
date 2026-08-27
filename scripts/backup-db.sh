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
echo "[1/4] Dumping database and compressing..."
pg_dump "${DATABASE_URL}" --clean --if-exists --no-owner --no-privileges | gzip > "${BACKUP_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[2/4] Local dump completed successfully! (File size: ${FILE_SIZE})"

# Optional: Upload to Cloudflare R2 (S3-Compatible API) Free Tier if configured
R2_BACKUP_BUCKET="${R2_BACKUP_BUCKET:-${R2_BUCKET:-}}"
R2_ENDPOINT_URL="${R2_ENDPOINT_URL:-${R2_ENDPOINT:-}}"

if [ -n "${R2_BACKUP_BUCKET}" ] && [ -n "${R2_ENDPOINT_URL}" ] && command -v aws &> /dev/null; then
  echo "[3/4] Uploading to Cloudflare R2 (${R2_BACKUP_BUCKET})..."
  if aws s3 cp "${BACKUP_FILE}" "s3://${R2_BACKUP_BUCKET}/backups/wat_db_backup_${TIMESTAMP}.sql.gz" --endpoint-url "${R2_ENDPOINT_URL}" > /dev/null 2>&1; then
    echo "      Uploaded to R2 bucket successfully."
  else
    echo "      [WARN] Could not upload to R2 (check AWS CLI S3 credentials). Keeping local copy only."
  fi
else
  echo "[3/4] Skipping Cloudflare R2 upload (AWS CLI or R2_BACKUP_BUCKET not configured)."
fi

# Update last backup timestamp in settings table if psql is available
if command -v psql &> /dev/null; then
  ISO_NOW="$(date -u +'%Y-%m-%dT%H:%M:%SZ')"
  psql "${DATABASE_URL}" -q -c "
    INSERT INTO settings (id, key, value, type, category, is_public, created_at, updated_at)
    VALUES (gen_random_uuid(), 'backup_last_automated_at', '${ISO_NOW}', 'string', 'system', false, NOW(), NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;

    INSERT INTO settings (id, key, value, type, category, is_public, created_at, updated_at)
    VALUES (gen_random_uuid(), 'backup_last_automated_status', 'success', 'string', 'system', false, NOW(), NOW())
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = EXCLUDED.updated_at;
  " > /dev/null 2>&1 || true
  echo "      Recorded last backup timestamp in database (${ISO_NOW})."
fi

# Retention Policy: Clean up local backups older than RETENTION_DAYS
echo "[4/4] Cleaning up local backups (older than ${RETENTION_DAYS} days)..."
DELETED_COUNT=$(find "${BACKUP_DIR}" -name "wat_db_backup_*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print 2>/dev/null | wc -l || true)
echo "      Cleaned up ${DELETED_COUNT} old local backup file(s)."

echo "=================================================="
echo " Backup process finished successfully!"
echo "=================================================="

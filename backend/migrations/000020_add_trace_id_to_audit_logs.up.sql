ALTER TABLE audit_logs ADD COLUMN trace_id VARCHAR(255);
CREATE INDEX idx_audit_logs_trace_id ON audit_logs(trace_id);

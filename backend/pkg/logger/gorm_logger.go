package logger

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/rs/zerolog"
	"gorm.io/gorm"
	gormlogger "gorm.io/gorm/logger"
)

// GormLogger is a custom GORM logger implementation backed by zerolog.
type GormLogger struct {
	SlowThreshold             time.Duration
	LogLevel                  gormlogger.LogLevel
	IgnoreRecordNotFoundError bool
}

// NewGormLogger creates a new GORM logger using zerolog
func NewGormLogger(slowThreshold time.Duration, ignoreRecordNotFound bool) *GormLogger {
	return &GormLogger{
		SlowThreshold:             slowThreshold,
		LogLevel:                  gormlogger.Warn,
		IgnoreRecordNotFoundError: ignoreRecordNotFound,
	}
}

// LogMode sets the log level for GormLogger
func (l *GormLogger) LogMode(level gormlogger.LogLevel) gormlogger.Interface {
	newLogger := *l
	newLogger.LogLevel = level
	return &newLogger
}

// Info logs info messages
func (l *GormLogger) Info(ctx context.Context, msg string, data ...interface{}) {
	if l.LogLevel >= gormlogger.Info {
		Log.Info().Msg(fmt.Sprintf(msg, data...))
	}
}

// Warn logs warning messages
func (l *GormLogger) Warn(ctx context.Context, msg string, data ...interface{}) {
	if l.LogLevel >= gormlogger.Warn {
		Log.Warn().Msg(fmt.Sprintf(msg, data...))
	}
}

// Error logs error messages
func (l *GormLogger) Error(ctx context.Context, msg string, data ...interface{}) {
	if l.LogLevel >= gormlogger.Error {
		Log.Error().Msg(fmt.Sprintf(msg, data...))
	}
}

// Trace logs SQL queries, latency, and slow query warnings
func (l *GormLogger) Trace(ctx context.Context, begin time.Time, fc func() (sql string, rowsAffected int64), err error) {
	if l.LogLevel <= gormlogger.Silent {
		return
	}

	elapsed := time.Since(begin)
	sql, rows := fc()

	var event *zerolog.Event

	switch {
	case err != nil && l.LogLevel >= gormlogger.Error && (!l.IgnoreRecordNotFoundError || !errors.Is(err, gorm.ErrRecordNotFound)):
		event = Log.Error().
			Err(err).
			Dur("elapsed", elapsed).
			Int64("rows", rows).
			Str("sql", sql)
		event.Msg("database error")

	case l.SlowThreshold != 0 && elapsed > l.SlowThreshold && l.LogLevel >= gormlogger.Warn:
		event = Log.Warn().
			Dur("elapsed", elapsed).
			Dur("threshold", l.SlowThreshold).
			Int64("rows", rows).
			Str("sql", sql)
		event.Msg("database slow query")

	case l.LogLevel == gormlogger.Info:
		event = Log.Debug().
			Dur("elapsed", elapsed).
			Int64("rows", rows).
			Str("sql", sql)
		event.Msg("database query")
	}
}

# Multi-stage build for Go Fiber backend and services
FROM golang:1.25.0-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Cache go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build application binaries
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/server ./cmd/app
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/operations-worker ./cmd/operations-worker
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/migrate ./cmd/migrate
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-w -s" -o /app/bin/seed ./cmd/seed

# Final stage - minimal runtime image
FROM alpine:3.20

RUN apk --no-cache add ca-certificates tzdata curl

WORKDIR /app

# Copy compiled binaries from builder
COPY --from=builder /app/bin/server /app/server
COPY --from=builder /app/bin/operations-worker /app/operations-worker
COPY --from=builder /app/bin/migrate /app/migrate
COPY --from=builder /app/bin/seed /app/seed

# Copy SQL migrations for runtime migration execution
COPY --from=builder /app/migrations /app/migrations

# Expose API server port
EXPOSE 8080

# Default command runs the web API server
CMD ["/app/server"]

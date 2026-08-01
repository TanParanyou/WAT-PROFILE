# WAT-PROFILE Makefile
# ใช้สำหรับจัดการ frontend (Next.js) และ backend (Go Fiber)

FE_PORT ?= 3002
BE_PORT ?= 8082

# ============================================================
# Frontend
# ============================================================

.PHONY: fe-install fe-dev fe-build fe-start fe-lint

fe-install: ## ติดตั้ง frontend dependencies
	cd frontend && npm install

fe-dev: ## รัน frontend dev server
	cd frontend && NEXT_PUBLIC_API_URL=http://localhost:$(BE_PORT) npm run dev -- -p $(FE_PORT)

fe-build: ## Build frontend สำหรับ production
	cd frontend && npm run build

fe-start: ## รัน frontend production server
	cd frontend && npm run start

fe-lint: ## ตรวจสอบ frontend code
	cd frontend && npm run lint

# ============================================================
# Backend
# ============================================================

.PHONY: be-tidy be-dev be-build be-migrate be-seed

be-tidy: ## จัดการ Go dependencies
	cd backend && go mod tidy

be-dev: ## รัน backend dev server
	cd backend && PORT=$(BE_PORT) go run cmd/app/main.go

be-build: ## Build backend binary
	cd backend && CGO_ENABLED=0 go build -o bin/server ./cmd/app

be-migrate: ## รัน database migrations
	cd backend && go run cmd/migrate/main.go

be-seed: ## Seed ข้อมูลเริ่มต้นใน database
	cd backend && go run cmd/seed/main.go

# ============================================================
# Docker
# ============================================================

.PHONY: docker-build docker-run

docker-build: ## Build Docker image สำหรับ backend
	cd backend && docker build -t wat-profile-api .

docker-run: ## รัน backend ผ่าน Docker
	cd backend && docker run -p 8080:8080 --env-file .env wat-profile-api

# ============================================================
# ทั้งหมด
# ============================================================

.PHONY: install dev clean help

install: fe-install be-tidy ## ติดตั้ง dependencies ทั้ง frontend และ backend

dev: ## รัน frontend + backend พร้อมกัน
	@echo "Starting frontend on port $(FE_PORT) and backend on port $(BE_PORT)..."
	@make fe-dev FE_PORT=$(FE_PORT) BE_PORT=$(BE_PORT) & make be-dev BE_PORT=$(BE_PORT) & wait

clean: ## ลบ build artifacts
	rm -rf frontend/.next frontend/node_modules backend/bin backend/tmp

# ============================================================
# Help
# ============================================================

help: ## แสดงคำสั่งทั้งหมด
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

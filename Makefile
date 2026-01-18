.PHONY: help dev dev-backend dev-frontend stop logs install

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

dev: dev-backend dev-frontend ## Start everything (backend + frontend)

dev-backend: ## Start backend services (PostgreSQL, Azurite, FastAPI)
	docker compose up -d

dev-frontend: ## Start frontend dev server
	cd src/frontend && npm run dev

stop: ## Stop all services
	docker compose down

logs: ## View backend logs
	docker compose logs -f

install: ## Install all dependencies
	cd src/frontend && npm install
	$(MAKE) -C src/backend install

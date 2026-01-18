.PHONY: dev dev-backend dev-frontend stop logs install

# Start everything
dev: dev-backend dev-frontend

# Start backend services (PostgreSQL, Azurite, FastAPI)
dev-backend:
	docker compose up -d

# Start frontend dev server
dev-frontend:
	cd src/frontend && npm run dev

# Stop all services
stop:
	docker compose down

# View backend logs
logs:
	docker compose logs -f

# Install all dependencies
install:
	cd src/frontend && npm install
	$(MAKE) -C src/backend install

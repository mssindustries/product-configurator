.PHONY: help install test lint format typecheck check clean build-debug debug

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-15s\033[0m %s\n", $$1, $$2}'

build-debug: ## Build API container with dev dependencies
	docker compose -f ../../docker-compose.yml -f ../../docker-compose.debug.yml build api

debug: ## Start API with debugpy (attach VS Code on port 5678)
	docker compose -f ../../docker-compose.yml -f ../../docker-compose.debug.yml up api

install: ## Install dependencies (including dev)
	uv sync

test: ## Run tests with coverage
	uv run pytest -v --cov=app --cov-report=term-missing

test-ci: ## Run tests for CI (with coverage threshold)
	uv run pytest --cov=app --cov-report=term-missing --cov-fail-under=50

lint: ## Check code style with ruff
	uv run ruff check app tests

format: ## Auto-format code with ruff
	uv run ruff format app tests

typecheck: ## Run type checking with mypy
	uv run mypy app

check: lint typecheck test ## Run lint, typecheck, and test

clean: ## Remove build artifacts
	rm -rf .pytest_cache .coverage htmlcov *.egg-info .venv
	find . -type d -name __pycache__ -exec rm -rf {} +

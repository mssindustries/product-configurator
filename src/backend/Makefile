.PHONY: install test lint format check clean

install:
	pip install -e ".[dev]"

test:
	pytest -v --cov=app --cov-report=term-missing

test-ci:
	pytest --cov=app --cov-report=term-missing --cov-fail-under=50

lint:
	ruff check app tests

format:
	ruff format app tests

check: lint test

clean:
	rm -rf .pytest_cache .coverage htmlcov *.egg-info
	find . -type d -name __pycache__ -exec rm -rf {} +

# Makefile — Standardized AI task runner
# Use these targets instead of guessing flags (e.g., pytest --very-fast-mode)

.PHONY: install dev build start lint test clean

# Install dependencies (run from repo root)
install:
	npm install

# Development (slower, hot reload)
dev:
	npm run dev

# Production build
build:
	npm run build

# Production server (faster, run after make build)
start:
	npm run start

# Lint (ESLint)
lint:
	npm run lint

# Tests
test:
	npm run test

# Clean build artifacts
clean:
	rm -rf .next out

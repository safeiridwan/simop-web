SHELL := /bin/bash

.PHONY: help install dev build preview test type-check lint check

help: ## Show available targets
	@grep -hE '^[a-zA-Z0-9_-]+:.*?## ' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

install: ## Install dependencies
	pnpm install

dev: ## Run the dev server (host)
	pnpm dev

build: ## Production build
	pnpm build

preview: ## Preview the production build
	pnpm preview

test: ## Run unit tests
	pnpm test

type-check: ## Type-check without emitting
	pnpm type-check

lint: ## Lint (alias for type-check until ESLint is added)
	pnpm type-check

check: install type-check test build ## Install/type-check/test/build gate

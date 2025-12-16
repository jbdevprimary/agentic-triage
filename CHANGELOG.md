# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Dependabot configuration for automated dependency updates
- GitHub Actions updates for improved CI/CD

### Changed
- Updated @ai-sdk/mcp to 1.0.0-beta.37
- Updated @types/node to 25.0.2
- Updated ai-sdk-ollama to 2.0.1
- Updated Docker base image to node:25-slim

## [0.2.1] - 2025-12-14

### Changed
- Migrated to agentic-control for model orchestration
- Updated AI SDK integration

## [0.2.0] - 2025-12-14

### Added
- GitHub Action for CI/CD integration
- Docker support with multi-stage builds
- Reusable triage workflow for external repositories
- Self-dogfooding triage workflow

### Fixed
- GHCR-only deployment (removed Docker Hub)
- Ollama Cloud URL configuration
- GraphQL MCP integration

## [0.1.0] - 2025-12-14

### Added
- Initial release of agentic-triage
- AI-powered GitHub issue triage
- PR review automation
- Sprint planning capabilities
- Security scanning
- Cascade automation
- CLI with multiple commands (assess, label, review, sprint, roadmap, security, cascade)
- Vercel AI SDK integration
- Ollama and Anthropic provider support
- MCP (Model Context Protocol) integration
- Playwright test reporter
- Vitest test reporter

[Unreleased]: https://github.com/jbdevprimary/agentic-triage/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/jbdevprimary/agentic-triage/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/jbdevprimary/agentic-triage/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/jbdevprimary/agentic-triage/releases/tag/v0.1.0

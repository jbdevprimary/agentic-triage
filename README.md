# agentic-triage

[![npm version](https://img.shields.io/npm/v/agentic-triage.svg)](https://www.npmjs.com/package/agentic-triage)
[![Coverage Status](https://coveralls.io/repos/github/jbdevprimary/agentic-triage/badge.svg?branch=main)](https://coveralls.io/github/jbdevprimary/agentic-triage?branch=main)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> AI-powered GitHub issue triage, PR review, and sprint planning CLI

**agentic-triage** is an autonomous development automation tool powered by [agentic-control](https://github.com/jbdevprimary/agentic-control). It handles the entire development lifecycle - from issue triage to release - using AI-driven automation with the Vercel AI SDK and Ollama.

## Installation

```bash
# npm
npm install -g agentic-triage

# pnpm
pnpm add -g agentic-triage

# Or run directly with npx
npx agentic-triage --help
```

## Quick Start

```bash
# Assess an issue with AI
agentic-triage assess 123

# Generate tests for a file
agentic-triage generate src/core/math/noise.ts --type unit

# Review a PR
agentic-triage review 144

# Run a full sprint planning cycle
agentic-triage sprint
```

## Commands

### Issue & PR Management

| Command | Description |
|---------|-------------|
| `assess <issue>` | AI analyzes issue and adds labels, estimates |
| `label <issue>` | Auto-label based on content |
| `plan <issue>` | Create implementation plan with sub-tasks |
| `develop <issue>` | AI implements the issue (creates PR) |
| `review <pr>` | AI code review with suggestions |
| `feedback <pr>` | Process review comments, resolve threads |
| `verify <pr>` | Run tests and validate PR |
| `automerge <pr> <action>` | Manage auto-merge (enable/disable/wait) |

### Testing & Quality

| Command | Description |
|---------|-------------|
| `test <issue>` | Generate and run tests for an issue |
| `generate <file>` | Generate unit/integration/e2e tests |
| `diagnose <report>` | Analyze test failures, create bug issues |
| `coverage <report>` | Find coverage gaps, create issues |
| `scan` | Run custom security scanner |
| `security` | Analyze CodeQL/Dependabot alerts |

### Planning & Automation

| Command | Description |
|---------|-------------|
| `sprint` | Weekly sprint planning with AI |
| `roadmap` | Generate quarterly roadmap |
| `cascade` | Run full automation cycle |
| `harness` | Execute test harness scenarios |
| `configure` | Configure repo settings for triage |

### Release

| Command | Description |
|---------|-------------|
| `release` | Full release cycle (changelog, tag, npm, GitHub) |

## Environment Variables

```bash
# Required
GH_TOKEN=ghp_xxx              # GitHub PAT with repo, workflow, security scopes
OLLAMA_API_KEY=xxx            # Ollama Cloud API key

# Optional
OLLAMA_HOST=https://ollama.com  # Ollama API endpoint (default: cloud)
OLLAMA_MODEL=glm-4.6:cloud      # Model to use (default: glm-4.6:cloud)
CONTEXT7_API_KEY=xxx            # Context7 API key for documentation lookup
```

## Architecture

agentic-triage uses a **MCP-first architecture** where all external operations go through Model Context Protocol servers. This isolates HTTP/fetch operations to subprocess communication, providing clean separation of concerns.

```text
agentic-triage/
├── src/
│   ├── cli.ts              # CLI entry point (commander.js)
│   ├── ai.ts               # Vercel AI SDK + Ollama
│   ├── mcp.ts              # MCP client manager (GitHub, GraphQL, Filesystem, Playwright)
│   ├── octokit.ts          # GitHub operations via MCP (REST + GraphQL wrappers)
│   ├── github.ts           # gh CLI helpers (fallback for local operations)
│   ├── commands/           # Command implementations
│   │   ├── assess.ts       # Issue assessment with AI
│   │   ├── review.ts       # PR code review
│   │   ├── sprint.ts       # Sprint planning
│   │   └── ...
│   ├── reporters/          # Test result reporters
│   │   ├── vitest.ts       # Vitest custom reporter
│   │   └── playwright.ts   # Playwright custom reporter
│   └── execution/          # Plan execution engine
│       ├── planner.ts      # Task planning
│       └── executor.ts     # Task execution
```

## Test Reporters

agentic-triage includes custom test reporters that integrate with the triage system:

### Vitest Reporter

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    reporters: ['default', 'agentic-triage/reporters/vitest'],
  },
});
```

### Playwright Reporter

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: [['list'], ['agentic-triage/reporters/playwright']],
});
```

## Development

### Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for:
- Development setup and workflow
- Code style guidelines
- Commit conventions
- Pull request process

### Testing

The project maintains **>81% test coverage** with comprehensive unit and integration tests. See [Testing Guide](./TESTING.md) for:
- Running tests locally
- Writing new tests
- VCR pattern for integration tests
- Coverage requirements

### Local Development

```bash
# Install dependencies
pnpm install

# Run tests
pnpm test

# Run tests with coverage
pnpm run test:coverage

# Format code
pnpm run format

# Lint code
pnpm run lint

# Type check
pnpm run typecheck

# Build
pnpm run build
```

## Related Projects

- [agentic-control](https://github.com/jbdevprimary/agentic-control) - Core AI agent control framework
- [agentic-crew](https://github.com/jbdevprimary/agentic-crew) - Multi-agent orchestration (coming soon)

## License

MIT

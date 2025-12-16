/**
 * @strata/triage - AI-Powered Development Automation
 *
 * The triage package provides a comprehensive CLI and SDK for automating
 * the entire development lifecycle of the Strata project:
 *
 * - **Issue Triage**: AI-powered assessment, labeling, and planning
 * - **Code Development**: Automated implementation from issues
 * - **Testing**: Test generation, execution, and failure diagnosis
 * - **Code Review**: AI-driven PR reviews and feedback handling
 * - **Security**: CodeQL analysis, custom scanning, SARIF generation
 * - **Releases**: Conventional commits, changelog, versioning, npm publish
 * - **Sprint Planning**: Weighted prioritization, backlog balancing
 *
 * @example CLI Usage
 * ```bash
 * # Assess an issue
 * triage assess 123
 *
 * # Review a PR
 * triage review 144
 *
 * # Generate tests
 * triage generate src/core/math/noise.ts --type unit
 *
 * # Run release
 * triage release --dry-run
 * ```
 *
 * @example SDK Usage
 * ```typescript
 * import { assess, generate } from '@strata/triage';
 *
 * // Assess an issue programmatically
 * await assess(123, { verbose: true });
 *
 * // Generate with AI
 * const result = await generate(prompt, { systemPrompt });
 * ```
 *
 * @packageDocumentation
 * @module @strata/triage
 */

// ============================================================================
// AI Integration
// ============================================================================

/**
 * AI generation with Vercel AI SDK + Ollama Cloud
 *
 * @example
 * ```typescript
 * import { aiGenerate, generateWithTools, getFilesystemTools } from '@strata/triage';
 *
 * // Simple generation
 * const analysis = await aiGenerate(prompt, { systemPrompt });
 *
 * // With filesystem tools
 * const client = await createInlineFilesystemClient('/path');
 * const result = await generateWithTools(prompt, {
 *   tools: await getFilesystemTools(client),
 * });
 * ```
 */
export {
    type AIConfig,
    CLOUD_HOST,
    DEFAULT_MODEL,
    type GenerateOptions as AIGenerateOptions,
    generate as aiGenerate,
    generateWithTools,
    getModel,
    getProvider,
} from './ai.js';

// ============================================================================
// Model Context Protocol (MCP)
// ============================================================================

/**
 * MCP (Model Context Protocol) Integration
 *
 * Provides unified access to all MCP servers:
 * - **Filesystem**: Read/write files (critical for Ollama's limited context)
 * - **GitHub**: Issues, PRs, projects, commits
 * - **Playwright**: Browser automation, E2E testing
 * - **Context7**: Library documentation (prevents hallucinations!)
 * - **Vite React**: React component debugging
 *
 * @example
 * ```typescript
 * import { runAgenticTask, initializeMCPClients } from '@strata/triage';
 *
 * // Simple agentic task
 * const result = await runAgenticTask({
 *     systemPrompt: 'You are a code fixer...',
 *     userPrompt: 'Fix the bug...',
 *     mcpClients: { filesystem: true, context7: true },
 * });
 *
 * // Manual client management
 * const clients = await initializeMCPClients({
 *     filesystem: process.cwd(),
 *     context7: true,
 *     github: true,
 * });
 * const tools = await getAllTools(clients);
 * // ... use tools ...
 * await closeMCPClients(clients);
 * ```
 */
export {
    type AgenticTaskOptions,
    type AgenticTaskResult,
    CONTEXT7_TOOLS,
    closeMCPClients,
    // Context7 MCP (prevents hallucinations!)
    createContext7Client,
    // Filesystem MCP
    createFilesystemClient,
    // GitHub MCP
    createGitHubClient,
    createInlineFilesystemClient,
    // Vite React MCP
    createViteReactClient,
    FILESYSTEM_TOOLS,
    getAllTools,
    getContext7Tools,
    getFilesystemTools,
    getGitHubTools,
    getViteReactTools,
    // Unified MCP access
    initializeMCPClients,
    // Types
    type MCPClient,
    type MCPClientOptions,
    type MCPClients,
    // Agentic task execution
    runAgenticTask,
    VITE_REACT_TOOLS,
} from './mcp.js';

/**
 * Playwright MCP for E2E test automation
 *
 * @example
 * ```typescript
 * import { createPlaywrightClient, getPlaywrightTools } from '@strata/triage';
 *
 * const client = await createPlaywrightClient();
 * const tools = await getPlaywrightTools(client);
 * ```
 */
export { createPlaywrightClient, getPlaywrightTools, PLAYWRIGHT_TOOLS, type PlaywrightOptions } from './playwright.js';

// ============================================================================
// GitHub (MCP)
// ============================================================================

/**
 * GitHub operations via MCP (no `gh`, no Octokit).
 *
 * This package intentionally uses MCP for GitHub access so that automation
 * runs through tool calls and can be recorded/replayed deterministically.
 */
export {
    // Comments / labels
    addIssueComment,
    addIssueLabels,
    areAllChecksPassing,
    type CheckRun,
    type CodeScanningAlert,
    commentOnPR,
    // PR Management
    convertPRToDraft,
    createCheckRun,
    createIssueComment,
    type DependabotAlert,
    disableAutoMerge,
    enableAutoMerge,
    formatAlertsForAI,
    // Checks
    getCheckRuns,
    // Security
    getCodeScanningAlerts,
    getDependabotAlerts,
    // Core issue/PR access
    getIssue,
    getPRCodeScanningAlerts,
    // Reviews
    getPRReviewComments,
    getPRReviews,
    getPullRequest,
    getRepoContext,
    markPRReadyForReview,
    type ReviewComment,
    replyToReviewComment,
    submitPRReview,
    waitForChecks,
} from './octokit.js';

// ============================================================================
// CLI Commands
// ============================================================================

/**
 * Triage CLI command implementations
 *
 * Each command is also available as a programmatic function:
 *
 * | Command | Function | Description |
 * |---------|----------|-------------|
 * | `assess` | `assess()` | AI issue assessment |
 * | `review` | `review()` | AI code review |
 * | `develop` | `develop()` | AI implementation |
 * | `test` | `test()` | Test generation |
 * | `diagnose` | `diagnose()` | Failure analysis |
 * | `security` | `security()` | Security scanning |
 * | `release` | `releaseCommand()` | Full release cycle |
 *
 * @example
 * ```typescript
 * import { assess, review, develop } from '@strata/triage';
 *
 * await assess(123, { dryRun: true });
 * await review(144, { verbose: true });
 * await develop(123, { approve: true });
 * ```
 */
export {
    type AssessOptions,
    type AutomergeOptions,
    assess,
    autoLabel,
    automerge,
    type CascadeCommandOptions,
    type CoverageOptions,
    cascade,
    coverage,
    type DevelopOptions,
    type DiagnoseOptions,
    develop,
    diagnose,
    type GenerateOptions,
    generateTests,
    type LabelOptions,
    type PlanOptions,
    plan,
    type ReviewOptions,
    type RoadmapCommandOptions,
    review,
    roadmap,
    type SecurityOptions,
    type SprintCommandOptions,
    security,
    sprint,
    type TestOptions,
    test,
    type VerifyOptions,
    verify,
} from './commands/index.js';

// ============================================================================
// Sprint Planning
// ============================================================================

/**
 * Sprint planning and roadmap generation
 *
 * Provides weighted issue prioritization, backlog health analysis,
 * sprint balancing, and automated roadmap generation.
 *
 * @example
 * ```typescript
 * import { calculateWeight, planSprint, generateRoadmap } from '@strata/triage';
 *
 * const weight = calculateWeight(issueMetrics);
 * await planSprint({ dryRun: true });
 * await generateRoadmap({ quarters: 2 });
 * ```
 */
export * from './planning/index.js';

// ============================================================================
// Execution Framework
// ============================================================================

/**
 * Structured execution for deterministic AI operations
 *
 * Provides:
 * - Execution plans with step-by-step operations
 * - Token estimation and plan splitting
 * - VCR-style HTTP recording for testing
 * - Sandboxed filesystem for isolation
 * - Fixture repositories for deterministic tests
 *
 * @example
 * ```typescript
 * import { TestHarness, createFixtureRepo, Sandbox } from '@strata/triage';
 *
 * const harness = new TestHarness();
 * const fixture = await createFixtureRepo({ commits: [...] });
 * const sandbox = new Sandbox();
 * ```
 */
export * from './execution/index.js';

// ============================================================================
// Test Results
// ============================================================================

/**
 * Test report parsing and analysis
 *
 * Parses custom JSON test reports from Vitest and Playwright,
 * extracts failures, coverage data, and formats for AI analysis.
 *
 * @example
 * ```typescript
 * import { parseTestReport, getFailedTests, formatForAI } from '@strata/triage';
 *
 * const report = parseTestReport('test-results/strata-report.json');
 * const failures = getFailedTests(report);
 * const aiPrompt = formatForAI(failures);
 * ```
 */
export {
    type CoverageData,
    type FileCoverage,
    formatForAI,
    getFailedTests,
    getLowCoverageFiles,
    getTestsByFile,
    getUncoveredFunctions,
    parseTestReport,
    type TestError,
    type TestFile,
    type TestReport,
    type TestResult,
} from './test-results.js';

// ============================================================================
// Triage Providers (Low-level)
// ============================================================================

/**
 * Multi-provider abstraction for issue tracking systems
 *
 * Similar to how agentic-control has multiple AI providers (Anthropic, OpenAI, etc.),
 * agentic-triage has multiple triage/issue providers:
 *
 * | Provider | Use Case |
 * |----------|----------|
 * | **GitHub** | GitHub Issues - standard GitHub workflow |
 * | **Beads** | Local-first, AI-native issue tracking with dependency graphs |
 * | **Jira** | Enterprise issue tracking (coming soon) |
 * | **Linear** | Modern issue tracking (coming soon) |
 *
 * @example
 * ```typescript
 * import { createProvider, createBestProvider } from 'agentic-triage';
 *
 * // Create a specific provider
 * const github = createProvider({ type: 'github', repo: 'owner/repo' });
 * const beads = createProvider({ type: 'beads', workingDir: process.cwd() });
 *
 * // Auto-detect best provider
 * const provider = await createBestProvider();
 *
 * // Unified interface
 * const issues = await provider.listIssues({ status: 'open' });
 * const ready = await provider.getReadyWork({ limit: 10 });
 * await provider.createIssue({ title: 'Bug fix', type: 'bug', priority: 'high' });
 * ```
 */
export {
    BeadsProvider,
    type BeadsProviderConfig,
    type CreateIssueOptions,
    clearProviders,
    createBeadsProvider,
    createBestProvider,
    createGitHubProvider,
    // Factory functions
    createProvider,
    type DependencyType,
    detectProviders,
    // Individual providers
    GitHubProvider,
    type GitHubProviderConfig,
    getAllProviders,
    getCombinedStats,
    getProvider as getTriageProvider,
    type IssueDependency,
    type IssuePriority,
    type IssueStatus,
    type IssueType,
    isBeadsInitialized,
    isBeadsInstalled,
    type JiraProviderConfig,
    type LinearProviderConfig,
    type ListIssuesOptions,
    // Utility functions
    normalizePriority,
    normalizeStatus,
    normalizeType,
    type ProviderConfig,
    type ProviderStats,
    priorityToNumber,
    type ReadyWork,
    // Provider registration
    registerProvider,
    // Utilities
    syncAllProviders,
    type TriageIssue,
    // Types
    type TriageProvider,
    type UpdateIssueOptions,
} from './providers/index.js';

// ============================================================================
// Triage Unified API & Tools (vendor-connectors pattern)
// ============================================================================

/**
 * Unified Triage API following the vendor-connectors pattern
 *
 * Provides TWO interfaces (like vendor-connectors):
 * 1. **Direct TypeScript API** - TriageConnectors class
 * 2. **Vercel AI SDK Tools** - for use with agentic-control agents
 *
 * @example Direct API (TriageConnectors)
 * ```typescript
 * import { TriageConnectors } from '@strata/triage';
 *
 * const triage = new TriageConnectors();
 *
 * // Issue operations
 * const issues = await triage.issues.list({ status: 'open' });
 * await triage.issues.create({ title: 'Fix bug', type: 'bug' });
 * await triage.issues.close('123', 'Fixed in PR #456');
 *
 * // Get ready work
 * const ready = await triage.issues.getReadyWork({ limit: 5 });
 * ```
 *
 * @example Vercel AI SDK Tools (for agentic-control)
 * ```typescript
 * import { getTriageTools } from '@strata/triage';
 * import { generateText } from 'ai';
 * import { anthropic } from '@ai-sdk/anthropic';
 *
 * const result = await generateText({
 *   model: anthropic('claude-sonnet-4-20250514'),
 *   tools: getTriageTools(),
 *   prompt: 'Create a high-priority bug for the login timeout issue',
 * });
 * ```
 */
export {
    // Individual tools for custom compositions
    addLabelsTool,
    closeIssueTool,
    createIssueTool,
    // Direct API
    createTriageConnectors,
    getCurrentSprintTool,
    getIssueStatsTool,
    getIssueTool,
    // Vercel AI SDK Tools - main entry points
    getIssueTools,
    getPRCommentsTool,
    getProjectTools,
    getReadyWorkTool,
    getReviewTools,
    getTriageTools,
    // Tool definitions for custom integrations
    ISSUE_TOOL_DEFINITIONS,
    listIssuesTool,
    listSprintsTool,
    PROJECT_TOOL_DEFINITIONS,
    REVIEW_TOOL_DEFINITIONS,
    removeLabelsTool,
    searchIssuesTool,
    // Utility for custom connector injection
    setTriageConnectors,
    TriageConnectors,
    type TriageConnectorsConfig,
    updateIssueTool,
} from './triage/index.js';

/**
 * @agentic/triage - AI-Powered Development Automation
 *
 * The triage package provides a comprehensive SDK for automating
 * the entire development lifecycle:
 *
 * - **Issue Triage**: AI-powered assessment, labeling, and planning
 * - **Code Development**: Automated implementation from issues
 * - **Testing**: Test generation, execution, and failure diagnosis
 * - **Code Review**: AI-driven PR reviews and feedback handling
 * - **Security**: CodeQL analysis, custom scanning, SARIF generation
 * - **Releases**: Conventional commits, changelog, versioning, npm publish
 * - **Sprint Planning**: Weighted prioritization, backlog balancing
 *
 * @example SDK Usage
 * ```typescript
 * import { aiGenerate, getTriageTools } from '@agentic/triage';
 *
 * // Generate with AI
 * const result = await aiGenerate(prompt, { systemPrompt });
 * ```
 *
 * @packageDocumentation
 * @module @agentic/triage
 */

// ============================================================================
// AI SDK Primitives (Schemas, Tools, Handlers)
// ============================================================================

export * as handlers from './handlers/index.js';
export * as schemas from './schemas/index.js';
export * as tools from './tools/index.js';

// ============================================================================
// AI Integration
// ============================================================================

/**
 * AI generation with Vercel AI SDK + Ollama Cloud
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

export {
    type AgenticTaskOptions,
    type AgenticTaskResult,
    CONTEXT7_TOOLS,
    closeMCPClients,
    createContext7Client,
    createFilesystemClient,
    createGitHubClient,
    createInlineFilesystemClient,
    createViteReactClient,
    FILESYSTEM_TOOLS,
    getAllTools,
    getContext7Tools,
    getFilesystemTools,
    getGitHubTools,
    getViteReactTools,
    initializeMCPClients,
    type MCPClient,
    type MCPClientOptions,
    type MCPClients,
    runAgenticTask,
    VITE_REACT_TOOLS,
} from './mcp.js';

export { createPlaywrightClient, getPlaywrightTools, PLAYWRIGHT_TOOLS, type PlaywrightOptions } from './playwright.js';

// ============================================================================
// GitHub (MCP)
// ============================================================================

export {
    addIssueComment,
    addIssueLabels,
    areAllChecksPassing,
    type CheckRun,
    type CodeScanningAlert,
    commentOnPR,
    convertPRToDraft,
    createCheckRun,
    createIssueComment,
    type DependabotAlert,
    disableAutoMerge,
    enableAutoMerge,
    formatAlertsForAI,
    getCheckRuns,
    getCodeScanningAlerts,
    getDependabotAlerts,
    getIssue,
    getPRCodeScanningAlerts,
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

export * from './planning/index.js';

// ============================================================================
// Execution Framework
// ============================================================================

export * from './execution/index.js';

// ============================================================================
// Test Results
// ============================================================================

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
// Triage Providers
// ============================================================================

export {
    BeadsProvider,
    type BeadsProviderConfig,
    type CreateIssueOptions,
    clearProviders,
    createBeadsProvider,
    createBestProvider,
    createGitHubProvider,
    createProvider,
    type DependencyType,
    detectProviders,
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
    normalizePriority,
    normalizeStatus,
    normalizeType,
    type ProviderConfig,
    type ProviderStats,
    priorityToNumber,
    type ReadyWork,
    registerProvider,
    syncAllProviders,
    type TriageIssue,
    type TriageProvider,
    type UpdateIssueOptions,
} from './providers/index.js';

// ============================================================================
// Triage Unified API & Tools
// ============================================================================

export {
    addLabelsTool,
    closeIssueTool,
    createIssueTool,
    createTriageConnectors,
    getCurrentSprintTool,
    getIssueStatsTool,
    getIssueTool,
    getIssueTools,
    getPRCommentsTool,
    getProjectTools,
    getReadyWorkTool,
    getReviewTools,
    getTriageTools,
    ISSUE_TOOL_DEFINITIONS,
    listIssuesTool,
    listSprintsTool,
    PROJECT_TOOL_DEFINITIONS,
    REVIEW_TOOL_DEFINITIONS,
    removeLabelsTool,
    searchIssuesTool,
    setTriageConnectors,
    TriageConnectors,
    type TriageConnectorsConfig,
    updateIssueTool,
} from './triage/index.js';

// ============================================================================
// Queue & Scoring (from main)
// ============================================================================

export * from './queue/index.js';
export * from './scoring/index.js';

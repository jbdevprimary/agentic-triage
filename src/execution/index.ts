/**
 * Execution Module
 *
 * Provides structured execution with:
 * - Plan generation before execution
 * - Token estimation and splitting
 * - VCR-style recording/playback
 * - Sandbox filesystem for testing
 * - Fixture repository generation
 * - Mock MCP providers
 */

// Executor
export {
    type ExecutorOptions,
    executePlan,
    executeWithFixture,
} from './executor.js';
// Fixture repositories
export {
    cleanupFixture,
    FIXTURE_SCENARIOS,
    type FixtureCommit,
    type FixtureDefinition,
    type FixtureExpectations,
    type FixtureFile,
    type FixtureIssue,
    type FixturePR,
    type FixtureRepo,
    type FixtureScenario,
    generateFixture,
    generateFromScenario,
    loadExpectations,
    loadMockIssues,
    loadMockPRs,
} from './fixtures.js';
// GitHub Project Sandbox
export {
    type CopiedIssue,
    cleanupAllSandboxes,
    copyIssueToSandbox,
    createProjectSandbox,
    deleteProjectSandbox,
    deleteSandboxIssue,
    listSandboxProjects,
    type ProjectSandboxOptions,
    type SandboxProject,
    withIssueSandbox,
    withProjectSandbox,
} from './github-sandbox.js';
// Mock MCP providers
export {
    createMockMCP,
    type MockMCPOptions,
    MockMCPProvider,
    type MockState,
    type MockTool,
    type TrackedOperation,
    type VerificationResult,
} from './mock-mcp.js';
// Plan types and utilities
export {
    addStep,
    createPlan,
    deserializePlan,
    type ExecutionMode,
    type ExecutionPlan,
    type ExecutionResult,
    type PlanContext,
    type PlanStep,
    type PlanTrigger,
    type ResourceEstimates,
    type StepConfig,
    type StepResult,
    serializePlan,
    type ValidationResult,
} from './plan.js';
// Planners
export {
    type PlannerOptions,
    planAssess,
    planDevelop,
    planReview,
    planTestGeneration,
    printPlanSummary,
    validatePlan,
} from './planner.js';
// VCR-style recording
export {
    createRecorder,
    HttpRecorder,
    type RecordedInteraction,
    type RecorderOptions,
    type Recording,
    withRecording,
} from './recorder.js';
// Sandbox filesystem
export {
    type ComparisonResult,
    createSandbox,
    type FileChange,
    Sandbox,
    type SandboxOptions,
    withSandbox,
} from './sandbox.js';
// Test Harness
export {
    createTestHarness,
    runTriageTests,
    TestHarness,
    type TestHarnessOptions,
    type TestResult,
    withTestHarness,
} from './test-harness.js';
// Tokenizer and cost estimation
export {
    analyzePlanForSplitting,
    type ContentChunk,
    estimateCost,
    estimateFileTokens,
    estimateStepTokens,
    estimateTokens,
    fitsInContext,
    groupFilesByDirectory,
    MODELS,
    type ModelConfig,
    type PlanSplitSuggestion,
    type SplitResult,
    splitForContext,
    splitWithMetadata,
} from './tokenizer.js';

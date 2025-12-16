/**
 * Vercel AI SDK Tools for Triage Operations
 *
 * Following the vendor-connectors pattern, this module provides tools
 * that work with the Vercel AI SDK (used by agentic-control).
 *
 * Pattern mirrors vendor-connectors/meshy/tools.ts:
 * - Tool definitions with metadata
 * - Framework-specific getters (get_tools, get_langchain_tools, etc.)
 * - Auto-detection of available frameworks
 *
 * @example With Vercel AI SDK (agentic-control)
 * ```typescript
 * import { getTriageTools } from '@strata/triage';
 * import { generateText } from 'ai';
 * import { anthropic } from '@ai-sdk/anthropic';
 *
 * const tools = getTriageTools();
 *
 * const result = await generateText({
 *   model: anthropic('claude-sonnet-4-20250514'),
 *   tools,
 *   prompt: 'List all open bugs and create a summary',
 * });
 * ```
 *
 * @example Individual tool sets
 * ```typescript
 * import { getIssueTools, getProjectTools } from '@strata/triage';
 *
 * // Just issue tools
 * const issueTools = getIssueTools();
 *
 * // Combine specific tool sets
 * const tools = { ...getIssueTools(), ...getProjectTools() };
 * ```
 */

import { tool } from 'ai';
import { z } from 'zod';
import { TriageConnectors } from './connectors.js';

// =============================================================================
// Shared Triage Connectors Instance
// =============================================================================

// Lazy-initialized singleton for tool execution
let _triageConnectors: TriageConnectors | null = null;

function getConnectors(): TriageConnectors {
    if (!_triageConnectors) {
        _triageConnectors = new TriageConnectors();
    }
    return _triageConnectors;
}

/**
 * Set a custom TriageConnectors instance for tool execution.
 * Useful for testing or custom configurations.
 */
export function setTriageConnectors(connectors: TriageConnectors): void {
    _triageConnectors = connectors;
}

// =============================================================================
// Issue Tools
// =============================================================================

/**
 * Tool: List issues with optional filters
 */
export const listIssuesTool = tool({
    description:
        'List issues from the issue tracker with optional filters. ' +
        'Returns an array of issues with id, title, status, priority, type, and labels.',
    inputSchema: z.object({
        status: z.enum(['open', 'in_progress', 'blocked', 'closed']).optional().describe('Filter by status'),
        priority: z.enum(['critical', 'high', 'medium', 'low', 'backlog']).optional().describe('Filter by priority'),
        type: z.enum(['bug', 'feature', 'task', 'epic', 'chore']).optional().describe('Filter by type'),
        labels: z.array(z.string()).optional().describe('Filter by labels (AND logic)'),
        limit: z.number().optional().describe('Maximum number of results'),
        assignee: z.string().optional().describe('Filter by assignee'),
    }),
    execute: async ({ status, priority, type, labels, limit, assignee }) => {
        const connectors = getConnectors();
        const issues = await connectors.issues.list({
            status,
            priority,
            type,
            labels,
            limit,
            assignee,
        });
        return {
            count: issues.length,
            issues: issues.map((i) => ({
                id: i.id,
                title: i.title,
                status: i.status,
                priority: i.priority,
                type: i.type,
                labels: i.labels,
                assignee: i.assignee,
                url: i.url,
            })),
        };
    },
});

/**
 * Tool: Get a specific issue by ID
 */
export const getIssueTool = tool({
    description: 'Get detailed information about a specific issue by its ID.',
    inputSchema: z.object({
        id: z.string().describe('The issue ID'),
    }),
    execute: async ({ id }) => {
        const connectors = getConnectors();
        const issue = await connectors.issues.get(id);
        if (!issue) {
            return { found: false, message: `Issue ${id} not found` };
        }
        return {
            found: true,
            issue: {
                id: issue.id,
                title: issue.title,
                description: issue.description,
                status: issue.status,
                priority: issue.priority,
                type: issue.type,
                labels: issue.labels,
                assignee: issue.assignee,
                createdAt: issue.createdAt,
                updatedAt: issue.updatedAt,
                url: issue.url,
            },
        };
    },
});

/**
 * Tool: Create a new issue
 */
export const createIssueTool = tool({
    description: 'Create a new issue in the issue tracker. ' + 'Returns the created issue with its assigned ID.',
    inputSchema: z.object({
        title: z.string().describe('Issue title'),
        description: z.string().optional().describe('Issue description/body'),
        type: z.enum(['bug', 'feature', 'task', 'epic', 'chore']).optional().default('task').describe('Issue type'),
        priority: z
            .enum(['critical', 'high', 'medium', 'low', 'backlog'])
            .optional()
            .default('medium')
            .describe('Issue priority'),
        labels: z.array(z.string()).optional().describe('Labels to add'),
        assignee: z.string().optional().describe('Assignee username'),
    }),
    execute: async ({ title, description, type, priority, labels, assignee }) => {
        const connectors = getConnectors();
        const issue = await connectors.issues.create({
            title,
            description,
            type,
            priority,
            labels,
            assignee,
        });
        return {
            success: true,
            issue: {
                id: issue.id,
                title: issue.title,
                status: issue.status,
                priority: issue.priority,
                type: issue.type,
                url: issue.url,
            },
        };
    },
});

/**
 * Tool: Update an existing issue
 */
export const updateIssueTool = tool({
    description: 'Update an existing issue. Only provided fields will be updated.',
    inputSchema: z.object({
        id: z.string().describe('The issue ID to update'),
        title: z.string().optional().describe('New title'),
        description: z.string().optional().describe('New description'),
        status: z.enum(['open', 'in_progress', 'blocked', 'closed']).optional().describe('New status'),
        priority: z.enum(['critical', 'high', 'medium', 'low', 'backlog']).optional().describe('New priority'),
        type: z.enum(['bug', 'feature', 'task', 'epic', 'chore']).optional().describe('New type'),
        assignee: z.string().optional().describe('New assignee'),
    }),
    execute: async ({ id, title, description, status, priority, type, assignee }) => {
        const connectors = getConnectors();
        const issue = await connectors.issues.update(id, {
            title,
            description,
            status,
            priority,
            type,
            assignee,
        });
        return {
            success: true,
            issue: {
                id: issue.id,
                title: issue.title,
                status: issue.status,
                priority: issue.priority,
            },
        };
    },
});

/**
 * Tool: Close an issue
 */
export const closeIssueTool = tool({
    description: 'Close an issue with an optional reason.',
    inputSchema: z.object({
        id: z.string().describe('The issue ID to close'),
        reason: z.string().optional().describe('Reason for closing (e.g., "Fixed in PR #123")'),
    }),
    execute: async ({ id, reason }) => {
        const connectors = getConnectors();
        const issue = await connectors.issues.close(id, reason);
        return {
            success: true,
            message: `Issue ${id} closed`,
            issue: {
                id: issue.id,
                title: issue.title,
                status: issue.status,
            },
        };
    },
});

/**
 * Tool: Search issues by text query
 */
export const searchIssuesTool = tool({
    description: 'Search issues by text query. Searches in title and description.',
    inputSchema: z.object({
        query: z.string().describe('Search query'),
        status: z.enum(['open', 'in_progress', 'blocked', 'closed']).optional().describe('Filter by status'),
        limit: z.number().optional().default(20).describe('Maximum results'),
    }),
    execute: async ({ query, status, limit }) => {
        const connectors = getConnectors();
        const issues = await connectors.issues.search(query, { status, limit });
        return {
            query,
            count: issues.length,
            issues: issues.map((i) => ({
                id: i.id,
                title: i.title,
                status: i.status,
                priority: i.priority,
                type: i.type,
            })),
        };
    },
});

/**
 * Tool: Get ready work (issues with no blockers)
 */
export const getReadyWorkTool = tool({
    description:
        'Get issues that are ready to work on (no blockers). ' +
        'Sorted by priority. Use this to find the next task to work on.',
    inputSchema: z.object({
        limit: z.number().optional().default(10).describe('Maximum number of results'),
    }),
    execute: async ({ limit }) => {
        const connectors = getConnectors();
        const readyWork = await connectors.issues.getReadyWork({ limit });
        return {
            count: readyWork.length,
            issues: readyWork.map((rw) => ({
                id: rw.issue.id,
                title: rw.issue.title,
                priority: rw.issue.priority,
                type: rw.issue.type,
                labels: rw.issue.labels,
                resolvedBlockers: rw.resolvedBlockers,
            })),
        };
    },
});

/**
 * Tool: Get issue statistics
 */
export const getIssueStatsTool = tool({
    description:
        'Get statistics about issues - counts by status, priority, and type. ' +
        'Useful for understanding the current state of the backlog.',
    inputSchema: z.object({}),
    execute: async () => {
        const connectors = getConnectors();
        const stats = await connectors.issues.getStats();
        return {
            total: stats.total,
            byStatus: {
                open: stats.open,
                inProgress: stats.inProgress,
                blocked: stats.blocked,
                closed: stats.closed,
            },
            byPriority: stats.byPriority,
            byType: stats.byType,
        };
    },
});

/**
 * Tool: Add labels to an issue
 */
export const addLabelsTool = tool({
    description: 'Add labels to an issue.',
    inputSchema: z.object({
        id: z.string().describe('The issue ID'),
        labels: z.array(z.string()).describe('Labels to add'),
    }),
    execute: async ({ id, labels }) => {
        const connectors = getConnectors();
        await connectors.issues.addLabels(id, labels);
        return {
            success: true,
            message: `Added labels [${labels.join(', ')}] to issue ${id}`,
        };
    },
});

/**
 * Tool: Remove labels from an issue
 */
export const removeLabelsTool = tool({
    description: 'Remove labels from an issue.',
    inputSchema: z.object({
        id: z.string().describe('The issue ID'),
        labels: z.array(z.string()).describe('Labels to remove'),
    }),
    execute: async ({ id, labels }) => {
        const connectors = getConnectors();
        await connectors.issues.removeLabels(id, labels);
        return {
            success: true,
            message: `Removed labels [${labels.join(', ')}] from issue ${id}`,
        };
    },
});

// =============================================================================
// Project Tools (Coming Soon)
// =============================================================================

/**
 * Tool: Get current sprint
 */
export const getCurrentSprintTool = tool({
    description: 'Get the current active sprint/iteration. Returns sprint details or null if no active sprint.',
    inputSchema: z.object({}),
    execute: async () => {
        const connectors = getConnectors();
        const sprint = await connectors.projects.getCurrentSprint();
        if (!sprint) {
            return { found: false, message: 'No active sprint found' };
        }
        return { found: true, sprint };
    },
});

/**
 * Tool: List sprints
 */
export const listSprintsTool = tool({
    description: 'List all sprints/iterations.',
    inputSchema: z.object({}),
    execute: async () => {
        const connectors = getConnectors();
        const sprints = await connectors.projects.getSprints();
        return {
            count: sprints.length,
            sprints,
        };
    },
});

// =============================================================================
// Review Tools (Coming Soon)
// =============================================================================

/**
 * Tool: Get PR review comments
 */
export const getPRCommentsTool = tool({
    description: 'Get review comments on a pull request.',
    inputSchema: z.object({
        prNumber: z.number().describe('The pull request number'),
    }),
    execute: async ({ prNumber }) => {
        const connectors = getConnectors();
        const comments = await connectors.reviews.getPRComments(prNumber);
        return {
            prNumber,
            count: comments.length,
            comments,
        };
    },
});

// =============================================================================
// Tool Definitions (for custom integrations)
// =============================================================================

/**
 * Issue tool definitions with metadata
 */
export const ISSUE_TOOL_DEFINITIONS = [
    { name: 'list_issues', tool: listIssuesTool, description: 'List issues with filters' },
    { name: 'get_issue', tool: getIssueTool, description: 'Get issue by ID' },
    { name: 'create_issue', tool: createIssueTool, description: 'Create a new issue' },
    { name: 'update_issue', tool: updateIssueTool, description: 'Update an issue' },
    { name: 'close_issue', tool: closeIssueTool, description: 'Close an issue' },
    { name: 'search_issues', tool: searchIssuesTool, description: 'Search issues by text' },
    { name: 'get_ready_work', tool: getReadyWorkTool, description: 'Get issues ready to work on' },
    { name: 'get_issue_stats', tool: getIssueStatsTool, description: 'Get issue statistics' },
    { name: 'add_labels', tool: addLabelsTool, description: 'Add labels to an issue' },
    { name: 'remove_labels', tool: removeLabelsTool, description: 'Remove labels from an issue' },
];

/**
 * Project tool definitions with metadata
 */
export const PROJECT_TOOL_DEFINITIONS = [
    { name: 'get_current_sprint', tool: getCurrentSprintTool, description: 'Get current sprint' },
    { name: 'list_sprints', tool: listSprintsTool, description: 'List all sprints' },
];

/**
 * Review tool definitions with metadata
 */
export const REVIEW_TOOL_DEFINITIONS = [
    { name: 'get_pr_comments', tool: getPRCommentsTool, description: 'Get PR review comments' },
];

// =============================================================================
// Tool Getters (following vendor-connectors pattern)
// =============================================================================

// Type for tool record - using 'any' to avoid complex generic inference issues
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ToolRecord = Record<string, ReturnType<typeof tool<any, any>>>;

/**
 * Get all issue management tools for Vercel AI SDK
 *
 * @example
 * ```typescript
 * import { getIssueTools } from '@strata/triage';
 * import { generateText } from 'ai';
 *
 * const result = await generateText({
 *   model: anthropic('claude-sonnet-4-20250514'),
 *   tools: getIssueTools(),
 *   prompt: 'List all open bugs',
 * });
 * ```
 */
export function getIssueTools(): ToolRecord {
    return Object.fromEntries(ISSUE_TOOL_DEFINITIONS.map((d) => [d.name, d.tool]));
}

/**
 * Get all project management tools for Vercel AI SDK
 */
export function getProjectTools(): ToolRecord {
    return Object.fromEntries(PROJECT_TOOL_DEFINITIONS.map((d) => [d.name, d.tool]));
}

/**
 * Get all review tools for Vercel AI SDK
 */
export function getReviewTools(): ToolRecord {
    return Object.fromEntries(REVIEW_TOOL_DEFINITIONS.map((d) => [d.name, d.tool]));
}

/**
 * Get ALL triage tools for Vercel AI SDK
 *
 * This is the main entry point - returns all tools for issues, projects, and reviews.
 * Similar to `get_tools()` in vendor-connectors.
 *
 * @example
 * ```typescript
 * import { getTriageTools } from '@strata/triage';
 * import { generateText } from 'ai';
 * import { anthropic } from '@ai-sdk/anthropic';
 *
 * const result = await generateText({
 *   model: anthropic('claude-sonnet-4-20250514'),
 *   tools: getTriageTools(),
 *   prompt: 'Create a bug for the login timeout issue and set it to high priority',
 * });
 * ```
 */
export function getTriageTools(): ToolRecord {
    return {
        ...getIssueTools(),
        ...getProjectTools(),
        ...getReviewTools(),
    };
}

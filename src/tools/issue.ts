import { tool } from 'ai';
import { z } from 'zod';
import * as handlers from '../handlers/issue.js';
import { IssueTriageSchema } from '../schemas/issue.js';

export const listIssuesTool = tool({
    description: 'List issues from the issue tracker with optional filters.',
    inputSchema: z.object({
        status: z.enum(['open', 'in_progress', 'blocked', 'closed']).optional(),
        priority: z.enum(['critical', 'high', 'medium', 'low', 'backlog']).optional(),
        type: z.enum(['bug', 'feature', 'task', 'epic', 'chore', 'docs']).optional(),
        labels: z.array(z.string()).optional(),
        limit: z.number().optional(),
        assignee: z.string().optional(),
    }),
    execute: async (args) => handlers.handleListIssues(args),
});

export const getIssueTool = tool({
    description: 'Get detailed information about a specific issue by its ID.',
    inputSchema: z.object({
        id: z.string().describe('The issue ID'),
    }),
    execute: async ({ id }) => handlers.handleGetIssue(id),
});

export const triageIssueTool = tool({
    description: 'Apply structured triage analysis to an issue (title, priority, type, labels, etc.)',
    inputSchema: z.object({
        id: z.string().describe('The issue ID to triage'),
        analysis: IssueTriageSchema,
    }),
    execute: async ({ id, analysis }) => handlers.handleTriageIssue(id, analysis),
});

// Re-export other existing tools from src/triage/tools.ts if needed
// or just move them all here. For brevity in this refactor, I'll move the core ones.

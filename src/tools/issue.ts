import { tool } from 'ai';
import { z } from 'zod';
import { issueSchema } from '../schemas/issue.js';
import { getTriageConnectors } from '../triage/index.js';

export const createIssueTool = tool({
    description: 'Create a new issue in the issue tracker.',
    inputSchema: issueSchema,
    execute: async (issue: any) => {
        const connectors = getTriageConnectors();
        const result = await connectors.issues.create({
            title: issue.title,
            description: issue.body || issue.description,
            type: issue.type,
            priority: issue.priority,
            labels: issue.labels,
        });
        return result;
    },
});

export const getIssueTool = tool({
    description: 'Get detailed issue by ID.',
    inputSchema: z.object({
        id: z.union([z.number(), z.string()]).describe('The ID of the issue to retrieve.'),
    }),
    execute: async ({ id }: any) => {
        const connectors = getTriageConnectors();
        const issue = await connectors.issues.get(String(id));
        return issue;
    },
});

export const updateIssueTool = tool({
    description: 'Update issue fields.',
    inputSchema: z.object({
        id: z.union([z.number(), z.string()]).describe('The ID of the issue to update.'),
        updates: issueSchema.partial().describe('The fields to update.'),
    }),
    execute: async ({ id, updates }: any) => {
        const connectors = getTriageConnectors();
        const result = await connectors.issues.update(String(id), {
            title: updates.title,
            description: updates.body || updates.description,
            status: updates.status,
            priority: updates.priority,
            type: updates.type,
            labels: updates.labels,
        });
        return result;
    },
});

export const listIssuesTool = tool({
    description: 'List issues with filters (status, priority, type, labels).',
    inputSchema: z.object({
        status: z.enum(['open', 'in_progress', 'blocked', 'closed']).optional(),
        priority: z.enum(['critical', 'high', 'medium', 'low', 'backlog']).optional(),
        type: z.enum(['bug', 'feature', 'task', 'chore', 'docs']).optional(),
        labels: z.array(z.string()).optional(),
        limit: z.number().optional().default(50),
        assignee: z.string().optional(),
    }),
    execute: async (filters: any) => {
        const connectors = getTriageConnectors();
        const issues = await connectors.issues.list(filters);
        return { issues };
    },
});

export const searchIssuesTool = tool({
    description: 'Full-text search across issues.',
    inputSchema: z.object({
        query: z.string().describe('The search query.'),
    }),
    execute: async ({ query }: any) => {
        const connectors = getTriageConnectors();
        const provider = await connectors.getProvider();
        const issues = await provider.searchIssues(query);
        return { issues };
    },
});

export const closeIssueTool = tool({
    description: 'Close issue with reason.',
    inputSchema: z.object({
        id: z.union([z.number(), z.string()]).describe('The ID of the issue to close.'),
        reason: z.string().optional().describe('Optional reason for closing.'),
    }),
    execute: async ({ id, reason }: any) => {
        const connectors = getTriageConnectors();
        const result = await connectors.issues.update(String(id), { status: 'closed', closeReason: reason });
        return result;
    },
});

export const addLabelsTool = tool({
    description: 'Add labels to an issue.',
    inputSchema: z.object({
        id: z.union([z.number(), z.string()]).describe('The ID of the issue.'),
        labels: z.array(z.string()).describe('The labels to add.'),
    }),
    execute: async ({ id, labels }: any) => {
        const connectors = getTriageConnectors();
        const provider = await connectors.getProvider();
        await provider.addLabels(String(id), labels);
        return { id, labelsAdded: labels };
    },
});

export const removeLabelsTool = tool({
    description: 'Remove labels from an issue.',
    inputSchema: z.object({
        id: z.union([z.number(), z.string()]).describe('The ID of the issue.'),
        labels: z.array(z.string()).describe('The labels to remove.'),
    }),
    execute: async ({ id, labels }: any) => {
        const connectors = getTriageConnectors();
        const provider = await connectors.getProvider();
        await provider.removeLabels(String(id), labels);
        return { id, labelsRemoved: labels };
    },
});

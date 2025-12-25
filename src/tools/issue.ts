import { tool } from 'ai';
import { z } from 'zod';
import { createIssue, getIssue, searchIssues, updateIssue } from '../octokit.js';
import { issueSchema } from '../schemas/issue.js';

export const createIssueTool = tool({
  description: 'Create a new issue in the issue tracker.',
  inputSchema: issueSchema.extend({
    owner: z.string().optional().describe('The owner of the repository.'),
    repo: z.string().optional().describe('The name of the repository.'),
  }),
  execute: async (issue) => {
    const repoContext =
      issue.owner && issue.repo ? { owner: issue.owner, repo: issue.repo } : undefined;
    const { number } = await createIssue(
      {
        title: issue.title,
        body: issue.body,
        labels: [...issue.labels, `type:${issue.type}`, `priority:${issue.priority}`],
      },
      repoContext
    );
    return { id: number, ...issue };
  },
});

export const getIssueTool = tool({
  description: 'Get detailed issue by ID.',
  inputSchema: z.object({
    id: z.number().describe('The ID of the issue to retrieve.'),
    owner: z.string().optional().describe('The owner of the repository.'),
    repo: z.string().optional().describe('The name of the repository.'),
  }),
  execute: async ({ id, owner, repo }) => {
    const repoContext = owner && repo ? { owner, repo } : undefined;
    const issue = await getIssue(id, repoContext);
    return {
      id: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      labels: issue.labels,
    };
  },
});

export const updateIssueTool = tool({
  description: 'Update issue fields.',
  inputSchema: z.object({
    id: z.number().describe('The ID of the issue to update.'),
    owner: z.string().optional().describe('The owner of the repository.'),
    repo: z.string().optional().describe('The name of the repository.'),
    updates: issueSchema.partial().describe('The fields to update.'),
  }),
  execute: async ({ id, owner, repo, updates }) => {
    const repoContext = owner && repo ? { owner, repo } : undefined;
    const labels = updates.labels ? [...updates.labels] : undefined;
    if (updates.type && labels) labels.push(`type:${updates.type}`);
    if (updates.priority && labels) labels.push(`priority:${updates.priority}`);

    await updateIssue(
      id,
      {
        title: updates.title,
        body: updates.body,
        labels,
      },
      repoContext
    );
    return { id, ...updates };
  },
});

export const listIssuesTool = tool({
  description: 'List issues with filters (status, priority, type, labels).',
  inputSchema: z.object({
    status: z.enum(['open', 'closed']).optional().default('open'),
    labels: z.array(z.string()).optional(),
    limit: z.number().optional().default(50),
    owner: z.string().optional().describe('The owner of the repository.'),
    repo: z.string().optional().describe('The name of the repository.'),
  }),
  execute: async ({ status, labels, owner, repo }) => {
    const repoContext = owner && repo ? { owner, repo } : undefined;
    let query = `is:${status}`;
    if (labels && labels.length > 0) {
      query += ` ${labels.map((l) => `label:"${l}"`).join(' ')}`;
    }
    const issues = await searchIssues(query, repoContext);
    return { issues };
  },
});

export const closeIssueTool = tool({
  description: 'Close issue with reason.',
  inputSchema: z.object({
    id: z.number().describe('The ID of the issue to close.'),
    reason: z.string().optional().describe('Optional reason for closing.'),
    owner: z.string().optional().describe('The owner of the repository.'),
    repo: z.string().optional().describe('The name of the repository.'),
  }),
  execute: async ({ id, reason, owner, repo }) => {
    const repoContext = owner && repo ? { owner, repo } : undefined;
    await updateIssue(id, { state: 'closed' }, repoContext);
    return { id, state: 'closed', reason };
  },
});

export const searchIssuesTool = tool({
  description: 'Full-text search across issues.',
  inputSchema: z.object({
    query: z.string().describe('The search query.'),
    owner: z.string().optional().describe('The owner of the repository.'),
    repo: z.string().optional().describe('The name of the repository.'),
  }),
  execute: async ({ query, owner, repo }) => {
    const repoContext = owner && repo ? { owner, repo } : undefined;
    const issues = await searchIssues(query, repoContext);
    return { issues };
  },
});

export const addLabelsTool = tool({
  description: 'Add labels to an issue.',
  inputSchema: z.object({
    id: z.number().describe('The ID of the issue.'),
    labels: z.array(z.string()).describe('The labels to add.'),
    owner: z.string().optional().describe('The owner of the repository.'),
    repo: z.string().optional().describe('The name of the repository.'),
  }),
  execute: async ({ id, labels, owner, repo }) => {
    // Note: addIssueLabels doesn't take repoContext yet in octokit.ts
    // but updateIssue does.
    const repoContext = owner && repo ? { owner, repo } : undefined;
    const issue = await getIssue(id, repoContext);
    const merged = Array.from(new Set([...issue.labels, ...labels]));
    await updateIssue(id, { labels: merged }, repoContext);
    return { id, labelsAdded: labels };
  },
});

export const removeLabelsTool = tool({
  description: 'Remove labels from an issue.',
  inputSchema: z.object({
    id: z.number().describe('The ID of the issue.'),
    labels: z.array(z.string()).describe('The labels to remove.'),
    owner: z.string().optional().describe('The owner of the repository.'),
    repo: z.string().optional().describe('The name of the repository.'),
  }),
  execute: async ({ id, labels, owner, repo }) => {
    const repoContext = owner && repo ? { owner, repo } : undefined;
    const issue = await getIssue(id, repoContext);
    const remainingLabels = issue.labels.filter((l) => !labels.includes(l));
    await updateIssue(id, { labels: remainingLabels }, repoContext);
    return { id, labelsRemoved: labels };
  },
});

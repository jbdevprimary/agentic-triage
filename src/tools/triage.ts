import { tool } from 'ai';
import { z } from 'zod';
import { getIssue, getPullRequest } from '../octokit.js';

export const triageTool = tool({
  description: 'Perform a triage analysis of an issue or pull request.',
  inputSchema: z.object({
    id: z.number().describe('The ID of the issue or pull request to triage.'),
    type: z.enum(['issue', 'pull-request']).describe('The type of item to triage.'),
    owner: z.string().optional().describe('The owner of the repository.'),
    repo: z.string().optional().describe('The name of the repository.'),
  }),
  execute: async ({ id, type, owner, repo }) => {
    const repoContext = owner && repo ? { owner, repo } : undefined;
    if (type === 'issue') {
      const issue = await getIssue(id, repoContext);
      return {
        id: issue.number,
        title: issue.title,
        body: issue.body,
        type: 'issue',
      };
    }
    // Note: getPullRequest doesn't take repoContext yet in octokit.ts
    // but we could add it if needed.
    const pr = await getPullRequest(id);
    return {
      id: pr.number,
      title: pr.title,
      body: pr.body,
      type: 'pull-request',
    };
  },
});

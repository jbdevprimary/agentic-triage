import { tool } from 'ai';
import { submitPRReview } from '../octokit.js';
import { codeReviewSchema } from '../schemas/review.js';

export const submitCodeReviewTool = tool({
    description: 'Submit a code review for a pull request.',
    parameters: codeReviewSchema,
    execute: async ({ pullRequestId, review }: any) => {
        await submitPRReview(pullRequestId, 'COMMENT', review.summary);
        return { success: true };
    },
} as any);

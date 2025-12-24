import { describe, expect, it } from 'vitest';
import { issueSchema } from '../src/schemas/issue.js';
import { codeReviewSchema } from '../src/schemas/review.js';
import { triageAnalysisSchema } from '../src/schemas/triage.js';

describe('Schemas', () => {
    describe('issueSchema', () => {
        it('should validate valid issue', () => {
            const validIssue = {
                title: 'Test Issue',
                body: 'Test Body',
                type: 'bug',
                priority: 'high',
                labels: ['label1'],
            };
            const result = issueSchema.safeParse(validIssue);
            expect(result.success).toBe(true);
        });

        it('should fail on invalid issue', () => {
            const invalidIssue = {
                title: 'Test Issue',
                type: 'invalid-type',
            };
            const result = issueSchema.safeParse(invalidIssue);
            expect(result.success).toBe(false);
        });
    });

    describe('codeReviewSchema', () => {
        it('should validate valid review', () => {
            const validReview = {
                summary: 'Good PR',
                comments: [
                    {
                        file: 'src/index.ts',
                        line: 10,
                        comment: 'Good change',
                    },
                ],
            };
            const result = codeReviewSchema.safeParse(validReview);
            expect(result.success).toBe(true);
        });
    });

    describe('triageAnalysisSchema', () => {
        it('should validate valid triage result', () => {
            const validTriage = {
                triage: 'Overall good',
                issueAnalysis: {
                    summary: 'Issue summary',
                    impact: 'High',
                    suggestions: ['fix it'],
                },
            };
            const result = triageAnalysisSchema.safeParse(validTriage);
            expect(result.success).toBe(true);
        });
    });
});

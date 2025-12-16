import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/octokit.js', () => {
    return {
        getIssue: vi.fn(() => ({
            number: 42,
            title: 'Test issue',
            body: 'Body',
            labels: ['needs-triage'],
            state: 'open',
        })),
        getPullRequest: vi.fn(() => ({
            number: 7,
            title: 'Test PR',
            body: 'PR body',
            state: 'open',
            head: { ref: 'branch', sha: 'abc' },
            base: { ref: 'main' },
            draft: false,
            mergeable: true,
        })),
    };
});

import { addStep, createPlan } from '../../src/execution/plan.ts';
import { planAssess, planDevelop, planReview, planTestGeneration, validatePlan } from '../../src/execution/planner.ts';

describe('execution/planner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('planAssess builds a 3-step plan with dependencies and estimates', async () => {
        const plan = await planAssess(42, { workingDir: '/tmp', verbose: false });
        expect(plan.steps).toHaveLength(3);
        expect(plan.steps[1].dependsOn).toEqual(['step-1']);
        expect(plan.estimates.aiCalls).toBe(1);
        expect(plan.estimates.apiCalls).toBe(2);

        validatePlan(plan);
        expect(plan.validation?.valid).toBe(true);
    });

    it('planDevelop includes file-read → ai-generate → ai-tool-call → git-operation → github-api', async () => {
        const plan = await planDevelop(42, { workingDir: '/tmp', verbose: false });
        expect(plan.steps.map((s) => s.type)).toEqual([
            'file-read',
            'ai-generate',
            'ai-tool-call',
            'git-operation',
            'github-api',
        ]);

        validatePlan(plan);
        expect(plan.validation?.valid).toBe(true);
    });

    it('planReview builds a review plan', async () => {
        const plan = await planReview(7, { workingDir: '/tmp', verbose: false });
        expect(plan.steps).toHaveLength(3);
        expect(plan.steps[0].type).toBe('github-api');
        expect(plan.steps[1].type).toBe('ai-generate');

        validatePlan(plan);
        expect(plan.validation?.valid).toBe(true);
    });

    it('planTestGeneration builds a generation plan', async () => {
        const plan = await planTestGeneration('src/x.ts', { workingDir: '/tmp', verbose: false });
        expect(plan.steps).toHaveLength(5);
        expect(plan.steps[0].type).toBe('file-read');
        expect(plan.steps[3].type).toBe('file-write');

        validatePlan(plan);
        expect(plan.validation?.valid).toBe(true);
    });

    it('validatePlan reports missing and circular dependencies', () => {
        const plan = createPlan(
            { type: 'manual', source: 'test', command: 'x' },
            { owner: 'o', repo: 'r', workingDirectory: '/tmp', environment: {} }
        );

        addStep(plan, {
            type: 'wait',
            description: 'a',
            config: { type: 'wait', duration: 1 },
            dependsOn: ['step-2'],
            estimatedTokens: 0,
            parallelizable: false,
        });

        addStep(plan, {
            type: 'wait',
            description: 'b',
            config: { type: 'wait', duration: 1 },
            dependsOn: ['step-1'],
            estimatedTokens: 0,
            parallelizable: false,
        });

        validatePlan(plan);
        expect(plan.validation?.valid).toBe(false);
        expect(plan.validation?.errors.some((e) => e.code === 'CIRCULAR_DEPENDENCY')).toBe(true);
        // step-1 depends on step-2 exists, so missing dep should be absent
        expect(plan.validation?.errors.some((e) => e.code === 'MISSING_DEPENDENCY')).toBe(false);
    });
});

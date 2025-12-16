import { describe, expect, it } from 'vitest';
import { addStep, createPlan, deserializePlan, type ExecutionPlan, serializePlan } from '../../src/execution/plan.ts';

describe('execution/plan', () => {
    it('createPlan initializes a valid empty plan', () => {
        const plan = createPlan(
            { type: 'manual', source: 'test', command: 'x' },
            { owner: 'o', repo: 'r', workingDirectory: '/tmp', environment: { A: '1' } }
        );

        expect(plan.version).toBe('1.0');
        expect(plan.mode).toBe('live');
        expect(plan.steps).toEqual([]);
        expect(plan.estimates.inputTokens).toBe(0);
    });

    it('addStep appends step with incrementing IDs', () => {
        const plan = createPlan(
            { type: 'manual', source: 'test', command: 'x' },
            { owner: 'o', repo: 'r', workingDirectory: '/tmp', environment: {} }
        );

        const s1 = addStep(plan, {
            type: 'file-read',
            description: 'read',
            config: { type: 'file-read', path: 'a.txt' },
            dependsOn: [],
            estimatedTokens: 1,
            parallelizable: true,
        });

        const s2 = addStep(plan, {
            type: 'wait',
            description: 'wait',
            config: { type: 'wait', duration: 1 },
            dependsOn: [s1.id],
            estimatedTokens: 0,
            parallelizable: false,
        });

        expect(s1.id).toBe('step-1');
        expect(s2.id).toBe('step-2');
        expect(plan.steps).toHaveLength(2);
    });

    it('serializePlan/deserializePlan round-trip', () => {
        const plan = createPlan(
            { type: 'manual', source: 'test', command: 'x' },
            { owner: 'o', repo: 'r', workingDirectory: '/tmp', environment: {} }
        );
        addStep(plan, {
            type: 'wait',
            description: 'wait',
            config: { type: 'wait', duration: 10 },
            dependsOn: [],
            estimatedTokens: 0,
            parallelizable: true,
        });

        const json = serializePlan(plan);
        const parsed = deserializePlan(json);

        expect(parsed.version).toBe('1.0');
        expect(parsed.steps).toHaveLength(1);
    });

    it('deserializePlan rejects unsupported version', () => {
        const bad: ExecutionPlan = {
            id: 'x',
            // @ts-expect-error - intentionally invalid
            version: '2.0',
            createdAt: new Date().toISOString(),
            trigger: { type: 'manual', source: 'x', command: 'x' },
            context: { owner: 'o', repo: 'r', workingDirectory: '/tmp', environment: {} },
            mode: 'live',
            steps: [],
            estimates: {
                inputTokens: 0,
                outputTokens: 0,
                estimatedCost: 0,
                estimatedDuration: 0,
                aiCalls: 0,
                apiCalls: 0,
                filesAffected: [],
            },
        };

        expect(() => deserializePlan(JSON.stringify(bad))).toThrow(/Unsupported plan version/);
    });
});

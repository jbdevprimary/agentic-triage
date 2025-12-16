import * as fs from 'node:fs';
import * as http from 'node:http';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/ai.js', () => {
    return {
        generate: vi.fn(async () => 'ai-output'),
        generateWithTools: vi.fn(async () => ({
            text: 'tool-output',
            toolCalls: [],
            toolResults: [],
            steps: [],
            finishReason: 'stop',
        })),
    };
});

import { executePlan } from '../../src/execution/executor.ts';
import { generateFromScenario } from '../../src/execution/fixtures.ts';
import { addStep, createPlan } from '../../src/execution/plan.ts';

describe('execution/executor', () => {
    it('executes plan-only steps as skipped', async () => {
        const plan = createPlan(
            { type: 'manual', source: 'test', command: 'x' },
            { owner: 'o', repo: 'r', workingDirectory: process.cwd(), environment: {} }
        );
        addStep(plan, {
            type: 'wait',
            description: 'wait',
            config: { type: 'wait', duration: 1 },
            dependsOn: [],
            estimatedTokens: 0,
            parallelizable: true,
        });

        const executed = await executePlan(plan, { mode: 'plan-only' });
        expect(executed.steps[0].result?.status).toBe('skipped');
        expect(executed.result?.status).toBe('success');
    });

    it('executes a dry-run plan against a fixture repo (includes shell skip + http request)', async () => {
        const server = http.createServer((req, res) => {
            if (req.url === '/ok') {
                res.setHeader('content-type', 'application/json');
                res.end(JSON.stringify({ ok: true }));
                return;
            }
            res.statusCode = 404;
            res.end();
        });

        await new Promise<void>((resolve) => server.listen(0, resolve));
        const port = (server.address() as any).port as number;

        const fixturesDir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-fixtures-'));
        const recordingsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-recordings-'));

        const fixture = await generateFromScenario('bug-report', fixturesDir);

        const plan = createPlan(
            { type: 'manual', source: 'test', command: 'x' },
            { owner: 'o', repo: 'r', workingDirectory: fixture.root, environment: {} }
        );

        addStep(plan, {
            type: 'file-read',
            description: 'read fixture file',
            config: { type: 'file-read', path: 'src/terrain.ts' },
            dependsOn: [],
            estimatedTokens: 1,
            parallelizable: true,
        });

        addStep(plan, {
            type: 'file-write',
            description: 'write fixture file',
            config: { type: 'file-write', path: 'src/new.txt', content: 'hello' },
            dependsOn: ['step-1'],
            estimatedTokens: 1,
            parallelizable: false,
        });

        addStep(plan, {
            type: 'shell-command',
            description: 'should be skipped in dry-run',
            config: { type: 'shell-command', command: 'node', args: ['-v'] },
            dependsOn: ['step-2'],
            estimatedTokens: 0,
            parallelizable: false,
        });

        addStep(plan, {
            type: 'http-request',
            description: 'local http request',
            config: { type: 'http-request', method: 'GET', url: `http://127.0.0.1:${port}/ok` },
            dependsOn: ['step-3'],
            estimatedTokens: 0,
            parallelizable: true,
        });

        try {
            const executed = await executePlan(plan, {
                mode: 'dry-run',
                fixture,
                recordingsDir,
                verbose: false,
                savePlan: false,
            });

            expect(executed.result?.status).toBe('success');
            expect(executed.steps.map((s) => s.result?.status)).toEqual(['success', 'success', 'success', 'success']);

            expect(executed.steps[2].result?.output).toEqual({ skipped: true, command: 'node' });
            expect(executed.steps[3].result?.output).toEqual({ ok: true });
        } finally {
            server.close();
            fs.rmSync(fixturesDir, { recursive: true, force: true });
            fs.rmSync(recordingsDir, { recursive: true, force: true });
        }
    });
});

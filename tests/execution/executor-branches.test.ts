import * as fs from 'node:fs';
import * as http from 'node:http';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

import { executePlan } from '../../src/execution/executor.ts';
import { addStep, createPlan } from '../../src/execution/plan.ts';

describe('execution/executor (branch coverage)', () => {
    it('skips dependent steps when a dependency fails (live mode)', async () => {
        const server = http.createServer((req, res) => {
            if (req.url === '/bad-json') {
                res.statusCode = 200;
                res.setHeader('content-type', 'text/plain');
                res.end('not-json');
                return;
            }
            res.statusCode = 404;
            res.end();
        });

        await new Promise<void>((resolve) => server.listen(0, resolve));
        const port = (server.address() as any).port as number;

        const plan = createPlan(
            { type: 'manual', source: 'test', command: 'x' },
            { owner: 'o', repo: 'r', workingDirectory: process.cwd(), environment: {} }
        );

        addStep(plan, {
            type: 'http-request',
            description: 'will fail (bad json)',
            config: { type: 'http-request', method: 'GET', url: `http://127.0.0.1:${port}/bad-json` },
            dependsOn: [],
            estimatedTokens: 0,
            parallelizable: true,
        });

        addStep(plan, {
            type: 'wait',
            description: 'should be skipped due to dependency failure',
            config: { type: 'wait', duration: 1 },
            dependsOn: ['step-1'],
            estimatedTokens: 0,
            parallelizable: false,
        });

        try {
            const executed = await executePlan(plan, { mode: 'live', verbose: false });
            expect(executed.steps[0].result?.status).toBe('failure');
            expect(executed.steps[1].result?.status).toBe('skipped');
            expect(executed.steps[1].result?.error).toBe('Dependency failed');
            expect(executed.result?.status).toBe('failure');
        } finally {
            server.close();
        }
    });

    it('executes shell-command in live mode', async () => {
        const plan = createPlan(
            { type: 'manual', source: 'test', command: 'x' },
            { owner: 'o', repo: 'r', workingDirectory: process.cwd(), environment: {} }
        );

        addStep(plan, {
            type: 'shell-command',
            description: 'node prints ok',
            config: { type: 'shell-command', command: 'node', args: ['-e', 'console.log("ok")'], timeout: 10_000 },
            dependsOn: [],
            estimatedTokens: 0,
            parallelizable: false,
        });

        const executed = await executePlan(plan, { mode: 'live', verbose: false });
        expect(executed.steps[0].result?.status).toBe('success');
        expect(String(executed.steps[0].result?.output)).toContain('ok');
    });

    it('uses sandbox mode (dry-run without fixture) for file writes', async () => {
        const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-executor-base-'));
        fs.writeFileSync(path.join(baseDir, 'a.txt'), 'a', 'utf-8');

        const plan = createPlan(
            { type: 'manual', source: 'test', command: 'x' },
            { owner: 'o', repo: 'r', workingDirectory: baseDir, environment: {} }
        );

        addStep(plan, {
            type: 'file-read',
            description: 'read file',
            config: { type: 'file-read', path: 'a.txt' },
            dependsOn: [],
            estimatedTokens: 0,
            parallelizable: true,
        });

        addStep(plan, {
            type: 'file-write',
            description: 'write new file',
            config: { type: 'file-write', path: 'b.txt', content: 'b' },
            dependsOn: ['step-1'],
            estimatedTokens: 0,
            parallelizable: false,
        });

        try {
            const executed = await executePlan(plan, { mode: 'dry-run', verbose: false, savePlan: false });
            expect(executed.steps[0].result?.status).toBe('success');
            expect(executed.steps[1].result?.status).toBe('success');
            // Base directory should remain unchanged (writes happen in sandbox)
            expect(fs.existsSync(path.join(baseDir, 'b.txt'))).toBe(false);
        } finally {
            fs.rmSync(baseDir, { recursive: true, force: true });
        }
    });
});

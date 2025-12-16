import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

import { createSandbox } from '../../src/execution/sandbox.ts';

describe('execution/sandbox (branch coverage)', () => {
    it('compareWithExpected reports mismatches, missing, and extra files', async () => {
        const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-sandbox-base-'));
        fs.mkdirSync(path.join(baseDir, 'sub'), { recursive: true });
        fs.writeFileSync(path.join(baseDir, 'sub', 'a.txt'), 'a', 'utf-8');

        const expectedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-sandbox-expected-'));
        fs.mkdirSync(path.join(expectedDir, 'sub'), { recursive: true });
        fs.writeFileSync(path.join(expectedDir, 'sub', 'a.txt'), 'DIFFERENT', 'utf-8');
        fs.writeFileSync(path.join(expectedDir, 'missing.txt'), 'x', 'utf-8');

        const sandbox = createSandbox(baseDir);
        await sandbox.init();

        try {
            sandbox.writeFile('extra.txt', 'extra');

            const comparison = sandbox.compareWithExpected(expectedDir);
            expect(comparison.mismatches.length).toBe(1);
            expect(comparison.missing).toEqual(['missing.txt']);
            expect(comparison.extra).toContain('extra.txt');
        } finally {
            sandbox.cleanup();
            fs.rmSync(baseDir, { recursive: true, force: true });
            fs.rmSync(expectedDir, { recursive: true, force: true });
        }
    });

    it('deleteFile records deletes when file exists', async () => {
        const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-sandbox-base-'));
        fs.writeFileSync(path.join(baseDir, 'a.txt'), 'a', 'utf-8');

        const sandbox = createSandbox(baseDir);
        await sandbox.init();

        try {
            sandbox.deleteFile('a.txt');
            const changes = sandbox.getChanges();
            expect(changes.some((c) => c.type === 'delete' && c.path === 'a.txt')).toBe(true);
        } finally {
            sandbox.cleanup();
            fs.rmSync(baseDir, { recursive: true, force: true });
        }
    });
});

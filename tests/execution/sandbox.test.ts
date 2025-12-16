import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSandbox } from '../../src/execution/sandbox.ts';

describe('execution/sandbox', () => {
    it('tracks create/modify/delete changes and can compare expected output', async () => {
        const baseDir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-sandbox-base-'));
        fs.writeFileSync(path.join(baseDir, 'a.txt'), 'original', 'utf-8');

        const expectedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-sandbox-expected-'));
        fs.writeFileSync(path.join(expectedDir, 'a.txt'), 'modified', 'utf-8');
        fs.writeFileSync(path.join(expectedDir, 'b.txt'), 'created', 'utf-8');

        const sandbox = createSandbox(baseDir);
        await sandbox.init();

        try {
            expect(sandbox.exists('a.txt')).toBe(true);
            expect(sandbox.readFile('a.txt')).toBe('original');

            sandbox.writeFile('a.txt', 'modified');
            sandbox.writeFile('b.txt', 'created');
            sandbox.deleteFile('nonexistent.txt');

            const changes = sandbox.getChanges();
            expect(changes.map((c) => c.type)).toEqual(['modify', 'create']);
            expect(sandbox.getDiffSummary()).toContain('M a.txt');
            expect(sandbox.getDiffSummary()).toContain('+ b.txt');

            const comparison = sandbox.compareWithExpected(expectedDir);
            expect(comparison.mismatches).toHaveLength(0);
            expect(comparison.missing).toHaveLength(0);
            expect(comparison.extra).toHaveLength(0);
        } finally {
            sandbox.cleanup();
            fs.rmSync(baseDir, { recursive: true, force: true });
            fs.rmSync(expectedDir, { recursive: true, force: true });
        }
    });
});

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

import {
    cleanupFixture,
    generateFromScenario,
    loadExpectations,
    loadMockIssues,
    loadMockPRs,
} from '../../src/execution/fixtures.ts';

describe('execution/fixtures', () => {
    it('generates fixture with base package.json + mock data loaders', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-fixtures-'));
        const fixture = await generateFromScenario('new-feature-request', dir);

        try {
            expect(fs.existsSync(path.join(fixture.root, 'package.json'))).toBe(true);

            const issues = loadMockIssues(fixture.root);
            const prs = loadMockPRs(fixture.root);
            const expectations = loadExpectations(fixture.root);

            expect(issues.length).toBeGreaterThan(0);
            expect(Array.isArray(prs)).toBe(true);
            expect(typeof expectations).toBe('object');
        } finally {
            cleanupFixture(fixture);
            expect(fs.existsSync(fixture.root)).toBe(false);
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('loaders return empty when fixture mock files are missing', () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-fixtures-empty-'));
        try {
            expect(loadMockIssues(dir)).toEqual([]);
            expect(loadMockPRs(dir)).toEqual([]);
            expect(loadExpectations(dir)).toEqual({});
        } finally {
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('applies scripted commits from overrides', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-fixtures-commits-'));
        const fixture = await generateFromScenario('bug-report', dir, {
            commits: [
                {
                    message: 'Add x.txt',
                    files: [{ path: 'x.txt', content: 'x' }],
                },
            ],
        });

        try {
            expect(fs.existsSync(path.join(fixture.root, 'x.txt'))).toBe(true);
            const log = fs.readFileSync(path.join(fixture.root, '.git', 'HEAD'), 'utf-8');
            expect(log.length).toBeGreaterThan(0);
        } finally {
            cleanupFixture(fixture);
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
});

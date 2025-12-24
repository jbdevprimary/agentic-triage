import { describe, expect, it } from 'vitest';
import {
    formatForAI,
    getFailedTests,
    getLowCoverageFiles,
    getTestsByFile,
    getUncoveredFunctions,
    parseTestReport,
    type TestReport,
} from '../src/test-results.js';

const mockReport: TestReport = {
    version: '1.0',
    timestamp: '2025-12-24T00:00:00Z',
    runner: 'vitest',
    type: 'unit',
    summary: {
        total: 2,
        passed: 1,
        failed: 1,
        skipped: 0,
        duration: 1000,
    },
    files: [
        {
            path: 'tests/example.test.ts',
            duration: 1000,
            tests: [
                {
                    id: '1',
                    name: 'test 1',
                    fullName: 'test 1',
                    file: 'tests/example.test.ts',
                    status: 'passed',
                    duration: 400,
                },
                {
                    id: '2',
                    name: 'test 2',
                    fullName: 'test 2',
                    file: 'tests/example.test.ts',
                    status: 'failed',
                    duration: 600,
                    error: {
                        message: 'Assertion failed',
                        codeFrame: 'line 10: expect(a).toBe(b)',
                        diff: '- a\n+ b',
                    },
                },
            ],
        },
    ],
    coverage: {
        lines: { total: 100, covered: 50, percentage: 50 },
        functions: { total: 10, covered: 5, percentage: 50 },
        branches: { total: 10, covered: 5, percentage: 50 },
        statements: { total: 100, covered: 50, percentage: 50 },
        files: [
            {
                path: 'src/example.ts',
                lines: { total: 100, covered: 50, percentage: 50 },
                uncoveredLines: [51, 52],
                functions: { total: 10, covered: 5, percentage: 50 },
                uncoveredFunctions: ['fn1', 'fn2'],
            },
        ],
    },
    git: {
        branch: 'main',
        commit: 'abcdef',
        message: 'feat: add feature',
    },
};

describe('test-results', () => {
    it('should parse test report', () => {
        const json = JSON.stringify(mockReport);
        const report = parseTestReport(json);
        expect(report.version).toBe('1.0');
        expect(report.summary.total).toBe(2);
    });

    it('should throw error for unsupported version', () => {
        const invalidReport = { ...mockReport, version: '2.0' };
        const json = JSON.stringify(invalidReport);
        expect(() => parseTestReport(json)).toThrow('Unsupported report version: 2.0');
    });

    it('should get failed tests', () => {
        const failed = getFailedTests(mockReport);
        expect(failed.length).toBe(1);
        expect(failed[0].id).toBe('2');
    });

    it('should get tests by file', () => {
        const tests = getTestsByFile(mockReport, 'tests/example.test.ts');
        expect(tests.length).toBe(2);

        const nonExistent = getTestsByFile(mockReport, 'non-existent.ts');
        expect(nonExistent.length).toBe(0);
    });

    it('should get low coverage files', () => {
        const lowCoverage = getLowCoverageFiles(mockReport, 80);
        expect(lowCoverage.length).toBe(1);
        expect(lowCoverage[0].path).toBe('src/example.ts');

        const highThreshold = getLowCoverageFiles(mockReport, 40);
        expect(highThreshold.length).toBe(0);
    });

    it('should return empty array for low coverage if coverage is missing', () => {
        const reportWithoutCoverage = { ...mockReport, coverage: undefined };
        expect(getLowCoverageFiles(reportWithoutCoverage)).toEqual([]);
    });

    it('should get uncovered functions', () => {
        const uncovered = getUncoveredFunctions(mockReport);
        expect(uncovered.length).toBe(1);
        expect(uncovered[0].functions).toEqual(['fn1', 'fn2']);
    });

    it('should return empty array for uncovered functions if coverage is missing', () => {
        const reportWithoutCoverage = { ...mockReport, coverage: undefined };
        expect(getUncoveredFunctions(reportWithoutCoverage)).toEqual([]);
    });

    it('should format for AI', () => {
        const formatted = formatForAI(mockReport);
        expect(formatted).toContain('# Test Report (vitest - unit)');
        expect(formatted).toContain('## Summary');
        expect(formatted).toContain('- Total: 2');
        expect(formatted).toContain('- Passed: 1 ✅');
        expect(formatted).toContain('- Failed: 1 ❌');
        expect(formatted).toContain('## Git Context');
        expect(formatted).toContain('- Branch: main');
        expect(formatted).toContain('## Failed Tests');
        expect(formatted).toContain('### test 2');
        expect(formatted).toContain('**Error:**');
        expect(formatted).toContain('Assertion failed');
        expect(formatted).toContain('## Coverage');
        expect(formatted).toContain('- Lines: 50.0%');
        expect(formatted).toContain('### Low Coverage Files (<80%)');
        expect(formatted).toContain('- src/example.ts: 50.0%');
    });
});

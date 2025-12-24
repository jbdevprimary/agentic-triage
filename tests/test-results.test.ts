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
            path: 'src/file1.ts',
            duration: 500,
            tests: [
                {
                    id: 'test1',
                    name: 'test 1',
                    fullName: 'file1 test 1',
                    file: 'src/file1.ts',
                    status: 'passed',
                    duration: 200,
                },
                {
                    id: 'test2',
                    name: 'test 2',
                    fullName: 'file1 test 2',
                    file: 'src/file1.ts',
                    status: 'failed',
                    duration: 300,
                    error: {
                        message: 'Error message',
                        diff: '- expected\n+ actual',
                    },
                },
            ],
        },
    ],
    coverage: {
        lines: { total: 100, covered: 50, percentage: 50 },
        functions: { total: 10, covered: 5, percentage: 50 },
        branches: { total: 20, covered: 10, percentage: 50 },
        statements: { total: 100, covered: 50, percentage: 50 },
        files: [
            {
                path: 'src/file1.ts',
                lines: { total: 100, covered: 50, percentage: 50 },
                uncoveredLines: [1, 2, 3],
                functions: { total: 10, covered: 5, percentage: 50 },
                uncoveredFunctions: ['func1'],
            },
        ],
    },
    git: {
        branch: 'main',
        commit: 'abcdef',
    },
};

describe('test-results', () => {
    describe('parseTestReport', () => {
        it('should parse valid JSON', () => {
            const json = JSON.stringify(mockReport);
            const report = parseTestReport(json);
            expect(report.version).toBe('1.0');
        });

        it('should throw for unsupported version', () => {
            const invalidReport = { ...mockReport, version: '2.0' };
            expect(() => parseTestReport(JSON.stringify(invalidReport))).toThrow('Unsupported report version');
        });
    });

    describe('getFailedTests', () => {
        it('should return failed tests', () => {
            const failed = getFailedTests(mockReport);
            expect(failed).toHaveLength(1);
            expect(failed[0].id).toBe('test2');
        });
    });

    describe('getTestsByFile', () => {
        it('should return tests for a file', () => {
            const tests = getTestsByFile(mockReport, 'src/file1.ts');
            expect(tests).toHaveLength(2);
        });

        it('should return empty array for non-existent file', () => {
            const tests = getTestsByFile(mockReport, 'non-existent.ts');
            expect(tests).toHaveLength(0);
        });
    });

    describe('getLowCoverageFiles', () => {
        it('should return files below threshold', () => {
            const low = getLowCoverageFiles(mockReport, 80);
            expect(low).toHaveLength(1);
            expect(low[0].path).toBe('src/file1.ts');
        });
    });

    describe('getUncoveredFunctions', () => {
        it('should return uncovered functions', () => {
            const uncovered = getUncoveredFunctions(mockReport);
            expect(uncovered).toHaveLength(1);
            expect(uncovered[0].functions).toContain('func1');
        });
    });

    describe('formatForAI', () => {
        it('should format report for AI', () => {
            const formatted = formatForAI(mockReport);
            expect(formatted).toContain('# Test Report (vitest - unit)');
            expect(formatted).toContain('## Summary');
            expect(formatted).toContain('- Failed: 1 ❌');
            expect(formatted).toContain('## Git Context');
            expect(formatted).toContain('## Failed Tests');
            expect(formatted).toContain('## Coverage');
        });
    });
});

import { describe, expect, it } from 'vitest';
import {
    formatForAI,
    getFailedTests,
    getLowCoverageFiles,
    getTestsByFile,
    getUncoveredFunctions,
    parseTestReport,
} from '../src/test-results.js';

describe('Test Results Utils', () => {
    const mockReport: any = {
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
                        name: 'test1',
                        fullName: 'suite > test1',
                        file: 'src/file1.ts',
                        status: 'passed',
                        duration: 100,
                    },
                ],
            },
            {
                path: 'src/file2.ts',
                duration: 500,
                tests: [
                    {
                        id: 'test2',
                        name: 'test2',
                        fullName: 'suite > test2',
                        file: 'src/file2.ts',
                        status: 'failed',
                        duration: 100,
                        error: {
                            message: 'test failed',
                            stack: 'error stack',
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
                    lines: { total: 50, covered: 50, percentage: 100 },
                    uncoveredLines: [],
                    functions: { total: 5, covered: 5, percentage: 100 },
                    uncoveredFunctions: [],
                },
                {
                    path: 'src/file2.ts',
                    lines: { total: 50, covered: 0, percentage: 0 },
                    uncoveredLines: [1, 2, 3],
                    functions: { total: 5, covered: 0, percentage: 0 },
                    uncoveredFunctions: ['func1'],
                },
            ],
        },
    };

    describe('parseTestReport', () => {
        it('should parse valid report', () => {
            const json = JSON.stringify(mockReport);
            const report = parseTestReport(json);
            expect(report.version).toBe('1.0');
        });

        it('should throw for invalid version', () => {
            const json = JSON.stringify({ version: '2.0' });
            expect(() => parseTestReport(json)).toThrow('Unsupported report version');
        });
    });

    describe('getFailedTests', () => {
        it('should return only failed tests', () => {
            const failed = getFailedTests(mockReport);
            expect(failed).toHaveLength(1);
            expect(failed[0].id).toBe('test2');
        });
    });

    describe('getTestsByFile', () => {
        it('should return tests for specific file', () => {
            const tests = getTestsByFile(mockReport, 'src/file1.ts');
            expect(tests).toHaveLength(1);
            expect(tests[0].id).toBe('test1');
        });

        it('should return empty array if file not found', () => {
            const tests = getTestsByFile(mockReport, 'non-existent.ts');
            expect(tests).toHaveLength(0);
        });
    });

    describe('getLowCoverageFiles', () => {
        it('should return files below threshold', () => {
            const low = getLowCoverageFiles(mockReport, 80);
            expect(low).toHaveLength(1);
            expect(low[0].path).toBe('src/file2.ts');
        });

        it('should return empty if no coverage data', () => {
            const reportWithoutCoverage = { ...mockReport };
            delete reportWithoutCoverage.coverage;
            expect(getLowCoverageFiles(reportWithoutCoverage)).toHaveLength(0);
        });
    });

    describe('getUncoveredFunctions', () => {
        it('should return files with uncovered functions', () => {
            const uncovered = getUncoveredFunctions(mockReport);
            expect(uncovered).toHaveLength(1);
            expect(uncovered[0].file).toBe('src/file2.ts');
            expect(uncovered[0].functions).toContain('func1');
        });
    });

    describe('formatForAI', () => {
        it('should format report as markdown', () => {
            const formatted = formatForAI(mockReport);
            expect(formatted).toContain('# Test Report (vitest - unit)');
            expect(formatted).toContain('## Summary');
            expect(formatted).toContain('- Passed: 1 ✅');
            expect(formatted).toContain('- Failed: 1 ❌');
            expect(formatted).toContain('## Failed Tests');
            expect(formatted).toContain('### suite > test2');
            expect(formatted).toContain('## Coverage');
            expect(formatted).toContain('- Lines: 50.0%');
        });
    });
});

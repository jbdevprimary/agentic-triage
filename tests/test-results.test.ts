import { describe, expect, it } from 'vitest';
import { formatForAI, getFailedTests, getLowCoverageFiles, parseTestReport } from '../src/test-results.js';

describe('Test Results', () => {
    const mockReport = {
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
                path: 'test1.ts',
                duration: 500,
                tests: [
                    {
                        id: '1',
                        name: 'test 1',
                        fullName: 'test 1',
                        file: 'test1.ts',
                        status: 'passed',
                        duration: 500,
                    },
                ],
            },
            {
                path: 'test2.ts',
                duration: 500,
                tests: [
                    {
                        id: '2',
                        name: 'test 2',
                        fullName: 'test 2',
                        file: 'test2.ts',
                        status: 'failed',
                        duration: 500,
                        error: {
                            message: 'test failed',
                            codeFrame: 'error at line 10',
                            diff: '- expected\n+ actual',
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
                    path: 'src/file1.ts',
                    lines: { total: 50, covered: 10, percentage: 20 },
                    uncoveredLines: [1, 2, 3],
                    functions: { total: 5, covered: 1, percentage: 20 },
                    uncoveredFunctions: ['func1'],
                },
            ],
        },
    };

    it('should parse a valid test report', () => {
        const json = JSON.stringify(mockReport);
        const report = parseTestReport(json);
        expect(report.version).toBe('1.0');
        expect(report.summary.total).toBe(2);
    });

    it('should throw error for invalid version', () => {
        const invalidReport = { ...mockReport, version: '2.0' };
        const json = JSON.stringify(invalidReport);
        expect(() => parseTestReport(json)).toThrow('Unsupported report version: 2.0');
    });

    it('should extract failed tests', () => {
        const failed = getFailedTests(mockReport as any);
        expect(failed).toHaveLength(1);
        expect(failed[0].id).toBe('2');
    });

    it('should identify low coverage files', () => {
        const lowCoverage = getLowCoverageFiles(mockReport as any, 80);
        expect(lowCoverage).toHaveLength(1);
        expect(lowCoverage[0].path).toBe('src/file1.ts');
    });

    it('should format report for AI', () => {
        const formatted = formatForAI(mockReport as any);
        expect(formatted).toContain('# Test Report (vitest - unit)');
        expect(formatted).toContain('Total: 2');
        expect(formatted).toContain('Failed Tests');
        expect(formatted).toContain('test 2');
        expect(formatted).toContain('Coverage');
    });
});

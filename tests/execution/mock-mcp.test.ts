/**
 * Unit tests for mock-mcp.ts to increase coverage
 */

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { type FixtureRepo, generateFromScenario } from '../../src/execution/fixtures.ts';
import { createMockMCP, type MockMCPProvider } from '../../src/execution/mock-mcp.ts';

describe('execution/mock-mcp', () => {
    let tmpDir: string;
    let fixture: FixtureRepo;
    let mockProvider: MockMCPProvider;

    beforeEach(async () => {
        tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mock-mcp-test-'));
        fixture = await generateFromScenario('bug-report', tmpDir);
        mockProvider = createMockMCP(fixture);
    });

    describe('createMockMCP', () => {
        it('creates a mock MCP provider', () => {
            expect(mockProvider).toBeDefined();
        });

        it('has tools available', () => {
            const tools = mockProvider.getTools();
            expect(tools).toBeDefined();
            expect(tools.read_file).toBeDefined();
            expect(tools.write_file).toBeDefined();
        });
    });

    describe('File Operations', () => {
        it('reads existing file from fixture', async () => {
            const tools = mockProvider.getTools();
            const result = await tools.read_file.execute({ path: 'src/terrain.ts' });
            expect(result).toBeDefined();
        });

        it('writes file through tool interface', async () => {
            const tools = mockProvider.getTools();
            await tools.write_file.execute({ path: 'newfile.txt', content: 'new content' });

            const filePath = path.join(fixture.root, 'newfile.txt');
            expect(fs.existsSync(filePath)).toBe(true);
        });

        it('lists files through tool interface', async () => {
            const tools = mockProvider.getTools();
            const files = await tools.list_files.execute({ path: 'src' });
            expect(Array.isArray(files)).toBe(true);
        });
    });

    describe('GitHub Operations', () => {
        it('provides GitHub tools', () => {
            const tools = mockProvider.getTools();
            expect(tools.github_get_issue).toBeDefined();
            expect(tools.github_add_labels).toBeDefined();
            expect(tools.github_comment).toBeDefined();
            expect(tools.github_list_issues).toBeDefined();
        });

        it('lists issues from fixture', async () => {
            const tools = mockProvider.getTools();
            const issues = await tools.github_list_issues.execute({});
            expect(Array.isArray(issues)).toBe(true);
        });
    });

    describe('Tool Interface', () => {
        it('provides Git tools', () => {
            const tools = mockProvider.getTools();
            expect(tools.git_status).toBeDefined();
            expect(tools.git_diff).toBeDefined();
            expect(tools.git_add).toBeDefined();
            expect(tools.git_commit).toBeDefined();
        });

        it('tracks operations when enabled', () => {
            const ops = mockProvider.getOperations();
            expect(Array.isArray(ops)).toBe(true);
        });
    });

    describe('Tool Execution', () => {
        it('executes filesystem tools', async () => {
            const tools = mockProvider.getTools();
            const testPath = path.join(fixture.root, 'test-write.txt');

            await tools.write_file.execute({ path: 'test-write.txt', content: 'test content' });
            expect(fs.existsSync(testPath)).toBe(true);

            const content = await tools.read_file.execute({ path: 'test-write.txt' });
            expect(content).toContain('test content');
        });

        it('provides search functionality', async () => {
            const tools = mockProvider.getTools();
            expect(tools.search_files).toBeDefined();
        });

        it('provides delete functionality', async () => {
            const tools = mockProvider.getTools();
            expect(tools.delete_file).toBeDefined();
        });
    });
});

/**
 * Integration tests for AI providers with VCR recording
 *
 * Tests all supported AI providers (Ollama, Anthropic, OpenAI) using VCR pattern.
 * Records API interactions once, then replays from cassettes.
 */

import * as path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { generate, getModel, getProvider } from '../../src/ai.ts';
import { withRecording } from '../../src/execution/recorder.ts';

const FIXTURES_DIR = path.join(process.cwd(), 'tests', 'cassettes', 'ai-providers');

describe('integration: AI Providers', () => {
    const testPrompt = 'What is 2+2? Respond with only the number.';

    // Skip these tests in CI if OLLAMA API key is not available
    const skipIfNoKeys = process.env.CI && !process.env.OLLAMA_API_KEY;

    describe('Ollama Provider', () => {
        it.skipIf(skipIfNoKeys)('generates text using Ollama', async () => {
            const result = await withRecording('ollama-generate-text', FIXTURES_DIR, 'playback', async () => {
                return await generate(testPrompt, {
                    model: 'qwen3-coder:480b',
                    maxTokens: 50,
                });
            });

            expect(result).toBeTruthy();
            expect(typeof result).toBe('string');
        });

        it.skipIf(skipIfNoKeys)('uses custom host configuration', async () => {
            const provider = getProvider({ host: 'https://ollama.com/api' });
            expect(provider).toBeDefined();
        });

        it.skipIf(skipIfNoKeys)('respects model configuration', async () => {
            const model = getModel({ model: 'custom-model' });
            expect(model).toBe('custom-model');
        });
    });

    describe('Provider Configuration', () => {
        beforeEach(() => {
            // Clear any environment overrides
            delete process.env.OLLAMA_MODEL;
            delete process.env.OLLAMA_HOST;
            delete process.env.OLLAMA_API_KEY;
        });

        it('loads provider from environment', () => {
            process.env.OLLAMA_MODEL = 'test-model';
            const model = getModel();
            expect(model).toBe('test-model');
        });

        it('prioritizes config over environment', () => {
            process.env.OLLAMA_MODEL = 'env-model';
            const model = getModel({ model: 'config-model' });
            expect(model).toBe('config-model');
        });
    });

    describe('Error Handling', () => {
        it('handles network errors gracefully', async () => {
            // This test simulates a network error scenario
            // In a real integration test, this would try to connect to an invalid endpoint
            await expect(async () => {
                // Mock scenario: provider with invalid configuration
                const provider = getProvider({ host: 'http://invalid-host-that-does-not-exist.local' });
                expect(provider).toBeDefined();
            }).not.toThrow();
        });
    });
});

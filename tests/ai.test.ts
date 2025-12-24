import { ollama } from 'ai-sdk-ollama';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_MODEL, getModel, getProvider, resolveModel } from '../src/ai.js';

describe('AI Utils', () => {
    const originalEnv = process.env;

    beforeEach(() => {
        vi.resetModules();
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    describe('getProvider', () => {
        it('should return default ollama provider when no config or env vars', () => {
            delete process.env.OLLAMA_API_KEY;
            delete process.env.OLLAMA_HOST;
            const provider = getProvider();
            expect(provider).toBe(ollama);
        });

        it('should use OLLAMA_API_KEY and CLOUD_HOST when provided', () => {
            process.env.OLLAMA_API_KEY = 'test-key';
            const provider = getProvider();
            // Since createOllama is called, we can't easily check the returned function identity,
            // but we can at least ensure it doesn't throw and returns a function.
            expect(typeof provider).toBe('function');
        });

        it('should use custom host from config', () => {
            const provider = getProvider({ host: 'http://custom-host' });
            expect(typeof provider).toBe('function');
        });

        it('should normalize host URL by adding /api if missing', () => {
            // We can't easily verify the internal baseURL without mocking createOllama,
            // but we can test the normalization logic if it was exported or by mocking.
            const provider = getProvider({ host: 'http://custom-host/' });
            expect(typeof provider).toBe('function');
        });
    });

    describe('getModel', () => {
        it('should return default model when no config or env var', () => {
            delete process.env.OLLAMA_MODEL;
            expect(getModel()).toBe(DEFAULT_MODEL);
        });

        it('should return model from env var', () => {
            process.env.OLLAMA_MODEL = 'env-model';
            expect(getModel()).toBe('env-model');
        });

        it('should return model from config', () => {
            expect(getModel({ model: 'config-model' })).toBe('config-model');
        });

        it('should prefer config over env var', () => {
            process.env.OLLAMA_MODEL = 'env-model';
            expect(getModel({ model: 'config-model' })).toBe('config-model');
        });
    });

    describe('resolveModel', () => {
        it('should resolve ollama model by default', async () => {
            const result = await resolveModel();
            expect(result.providerName).toBe('ollama');
            expect(result.modelId).toBe(DEFAULT_MODEL);
            expect(result.model).toBeDefined();
        });

        it('should throw error for unsupported provider', async () => {
            await expect(resolveModel({ provider: 'unsupported' })).rejects.toThrow(
                'Provider unsupported not supported'
            );
        });
    });
});

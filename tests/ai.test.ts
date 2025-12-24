import { createOllama, ollama } from 'ai-sdk-ollama';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CLOUD_HOST, DEFAULT_MODEL, getModel, getProvider, LOCAL_HOST, resolveModel } from '../src/ai.js';

vi.mock('ai-sdk-ollama', () => ({
    ollama: vi.fn(),
    createOllama: vi.fn(() => vi.fn()),
}));

describe('AI Utils', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.OLLAMA_API_KEY;
        delete process.env.OLLAMA_HOST;
        delete process.env.OLLAMA_MODEL;
        delete process.env.TRIAGE_PROVIDER;
    });

    describe('getProvider', () => {
        it('should return default ollama provider if no config or env vars', () => {
            const provider = getProvider();
            expect(provider).toBe(ollama);
        });

        it('should use OLLAMA_API_KEY from env', () => {
            process.env.OLLAMA_API_KEY = 'test-key';
            getProvider();
            expect(createOllama).toHaveBeenCalledWith(
                expect.objectContaining({
                    headers: { Authorization: 'Bearer test-key' },
                    baseURL: CLOUD_HOST,
                })
            );
        });

        it('should use custom host from config', () => {
            getProvider({ host: 'http://custom-host' });
            expect(createOllama).toHaveBeenCalledWith(
                expect.objectContaining({
                    baseURL: 'http://custom-host/api',
                })
            );
        });

        it('should use LOCAL_HOST if no API key and no custom host', () => {
            process.env.OLLAMA_HOST = ''; // Ensure it's empty
            getProvider({ host: '' }); // Trigger custom provider creation
            // Note: Since we are not providing apiKey or hostEnv in this test case properly
            // it might still return default ollama if we don't force it.
            // Let's force it by providing an empty config but setting one env var.
            process.env.OLLAMA_HOST = 'http://localhost:11434';
            getProvider();
            expect(createOllama).toHaveBeenCalledWith(
                expect.objectContaining({
                    baseURL: LOCAL_HOST,
                })
            );
        });
    });

    describe('getModel', () => {
        it('should return default model if no config or env vars', () => {
            expect(getModel()).toBe(DEFAULT_MODEL);
        });

        it('should use model from config', () => {
            expect(getModel({ model: 'custom-model' })).toBe('custom-model');
        });

        it('should use OLLAMA_MODEL from env', () => {
            process.env.OLLAMA_MODEL = 'env-model';
            expect(getModel()).toBe('env-model');
        });
    });

    describe('resolveModel', () => {
        it('should resolve ollama model by default', async () => {
            const result = await resolveModel();
            expect(result.providerName).toBe('ollama');
            expect(result.modelId).toBe(DEFAULT_MODEL);
        });

        it('should throw for unsupported provider', async () => {
            await expect(resolveModel({ provider: 'openai' })).rejects.toThrow('Provider openai not supported');
        });
    });
});

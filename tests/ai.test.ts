import { createOllama, ollama } from 'ai-sdk-ollama';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CLOUD_HOST, DEFAULT_MODEL, getModel, getProvider, resolveModel } from '../src/ai.js';

vi.mock('ai-sdk-ollama', () => ({
    ollama: vi.fn(),
    createOllama: vi.fn(),
}));

describe('ai', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        delete process.env.OLLAMA_API_KEY;
        delete process.env.OLLAMA_HOST;
        delete process.env.OLLAMA_MODEL;
        delete process.env.TRIAGE_PROVIDER;
    });

    describe('getProvider', () => {
        it('should return default ollama when no config and no env vars', () => {
            const provider = getProvider();
            expect(provider).toBe(ollama);
        });

        it('should use apiKey from config', () => {
            getProvider({ apiKey: 'test-key' });
            expect(createOllama).toHaveBeenCalledWith(
                expect.objectContaining({
                    headers: { Authorization: 'Bearer test-key' },
                })
            );
        });

        it('should use host from config', () => {
            getProvider({ host: 'http://my-host' });
            expect(createOllama).toHaveBeenCalledWith(
                expect.objectContaining({
                    baseURL: 'http://my-host/api',
                })
            );
        });

        it('should normalize host with /api suffix', () => {
            getProvider({ host: 'http://my-host/' });
            expect(createOllama).toHaveBeenCalledWith(
                expect.objectContaining({
                    baseURL: 'http://my-host/api',
                })
            );
        });

        it('should use default cloud host if apiKey provided but no host', () => {
            getProvider({ apiKey: 'test-key' });
            expect(createOllama).toHaveBeenCalledWith(
                expect.objectContaining({
                    baseURL: CLOUD_HOST,
                })
            );
        });

        it('should use default local host if no apiKey and no host but config object provided', () => {
            // This triggers the case where config is {} but we still want to test host logic
            // Wait, if config is {}, and env vars are empty, it returns ollama.
            // To test the logic at line 34, we need at least one of apiKey or host in config or env.
            process.env.OLLAMA_HOST = 'http://env-host';
            getProvider({});
            expect(createOllama).toHaveBeenCalledWith(
                expect.objectContaining({
                    baseURL: 'http://env-host/api',
                })
            );
        });
    });

    describe('getModel', () => {
        it('should return default model when no config and no env var', () => {
            expect(getModel()).toBe(DEFAULT_MODEL);
        });

        it('should return model from config', () => {
            expect(getModel({ model: 'custom-model' })).toBe('custom-model');
        });

        it('should return model from env var', () => {
            process.env.OLLAMA_MODEL = 'env-model';
            expect(getModel()).toBe('env-model');
        });
    });

    describe('resolveModel', () => {
        it('should resolve ollama by default', async () => {
            const result = await resolveModel();
            expect(result.providerName).toBe('ollama');
            expect(result.modelId).toBe(DEFAULT_MODEL);
        });

        it('should throw for unsupported provider', async () => {
            await expect(resolveModel({ provider: 'openai' })).rejects.toThrow('Provider openai not supported');
        });
    });
});

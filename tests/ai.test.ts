import { createOllama, ollama } from 'ai-sdk-ollama';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CLOUD_HOST, DEFAULT_MODEL, getModel, getProvider, resolveModel } from '../src/ai.js';

vi.mock('ai-sdk-ollama', () => ({
    createOllama: vi.fn(),
    ollama: vi.fn(),
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
        it('should return default ollama provider if no config or env', () => {
            const provider = getProvider();
            expect(provider).toBe(ollama);
            expect(createOllama).not.toHaveBeenCalled();
        });

        it('should create custom provider if apiKey is provided', () => {
            getProvider({ apiKey: 'test-key' });
            expect(createOllama).toHaveBeenCalledWith({
                baseURL: CLOUD_HOST,
                headers: { Authorization: 'Bearer test-key' },
            });
        });

        it('should create custom provider if host is provided', () => {
            getProvider({ host: 'http://custom-host' });
            expect(createOllama).toHaveBeenCalledWith({
                baseURL: 'http://custom-host/api',
                headers: undefined,
            });
        });

        it('should use OLLAMA_API_KEY from env', () => {
            process.env.OLLAMA_API_KEY = 'env-key';
            getProvider();
            expect(createOllama).toHaveBeenCalledWith({
                baseURL: CLOUD_HOST,
                headers: { Authorization: 'Bearer env-key' },
            });
        });

        it('should use OLLAMA_HOST from env', () => {
            process.env.OLLAMA_HOST = 'http://env-host';
            getProvider();
            expect(createOllama).toHaveBeenCalledWith({
                baseURL: 'http://env-host/api',
                headers: undefined,
            });
        });

        it('should normalize host URL by adding /api if missing', () => {
            getProvider({ host: 'http://host/' });
            expect(createOllama).toHaveBeenCalledWith(
                expect.objectContaining({
                    baseURL: 'http://host/api',
                })
            );
        });
    });

    describe('getModel', () => {
        it('should return default model', () => {
            expect(getModel()).toBe(DEFAULT_MODEL);
        });

        it('should return model from config', () => {
            expect(getModel({ model: 'custom-model' })).toBe('custom-model');
        });

        it('should return model from env', () => {
            process.env.OLLAMA_MODEL = 'env-model';
            expect(getModel()).toBe('env-model');
        });
    });

    describe('resolveModel', () => {
        it('should resolve ollama model by default', async () => {
            const mockOllamaInstance = vi.fn();
            (ollama as any).mockReturnValue(mockOllamaInstance);

            const result = await resolveModel();
            expect(result.providerName).toBe('ollama');
            expect(result.modelId).toBe(DEFAULT_MODEL);
            // Since we're using the mock, ollama(DEFAULT_MODEL) returns the result of the mock call
        });

        it('should throw for unsupported provider', async () => {
            await expect(resolveModel({ provider: 'openai' })).rejects.toThrow('Provider openai not supported');
        });
    });
});

import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { HttpRecorder } from '../../src/execution/recorder.ts';

describe('execution/recorder (VCR)', () => {
    it('records and redacts sensitive headers', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-recorder-'));

        const recorder = new HttpRecorder({
            fixturesDir: dir,
            mode: 'record',
            hosts: ['example.com'],
            redactHeaders: ['authorization'],
        });

        const originalFetch = global.fetch;
        global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
            const req = new Request(input, init);
            expect(req.method).toBe('POST');
            expect(req.headers.get('authorization')).toBe('Bearer secret');
            return new Response(JSON.stringify({ ok: true }), {
                status: 200,
                headers: { 'content-type': 'application/json' },
            });
        };

        recorder.start('My Recording');
        try {
            const res = await fetch('https://example.com/api', {
                method: 'POST',
                headers: { Authorization: 'Bearer secret' },
                body: JSON.stringify({ a: 1 }),
            });
            expect(await res.json()).toEqual({ ok: true });
        } finally {
            recorder.stop();
            global.fetch = originalFetch;
        }

        const cassettePath = path.join(dir, 'my-recording.json');
        const cassette = JSON.parse(fs.readFileSync(cassettePath, 'utf-8')) as {
            interactions: Array<{ request: { headers: Record<string, string> } }>;
        };

        expect(cassette.interactions).toHaveLength(1);
        // Request header keys are normalized to lowercase by the Fetch Headers API
        expect(cassette.interactions[0].request.headers.authorization).toBe('[REDACTED]');
    });

    it('replays recorded interactions deterministically', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-recorder-'));
        const cassettePath = path.join(dir, 'replay.json');

        fs.writeFileSync(
            cassettePath,
            JSON.stringify(
                {
                    id: '1',
                    createdAt: new Date('2025-01-01T00:00:00Z').toISOString(),
                    description: 'Replay',
                    interactions: [
                        {
                            id: 'i1',
                            timestamp: new Date('2025-01-01T00:00:00Z').toISOString(),
                            duration: 1,
                            request: {
                                method: 'GET',
                                url: 'https://example.com/v1/hello',
                                headers: {},
                            },
                            response: {
                                status: 200,
                                headers: { 'content-type': 'application/json' },
                                body: { hello: 'world' },
                            },
                        },
                    ],
                },
                null,
                2
            )
        );

        const recorder = new HttpRecorder({
            fixturesDir: dir,
            mode: 'playback',
            hosts: ['example.com'],
        });

        recorder.start('Replay');
        try {
            const res = await fetch('https://example.com/v1/hello', { method: 'GET' });
            expect(await res.json()).toEqual({ hello: 'world' });
        } finally {
            recorder.stop();
        }
    });
});

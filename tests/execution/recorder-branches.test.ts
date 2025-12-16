import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';

import { HttpRecorder } from '../../src/execution/recorder.ts';

describe('execution/recorder (branch coverage)', () => {
    it('throws on playback mismatch when updateOnMismatch is false', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-recorder-'));
        fs.writeFileSync(
            path.join(dir, 'mismatch.json'),
            JSON.stringify(
                {
                    id: '1',
                    createdAt: new Date().toISOString(),
                    description: 'Mismatch',
                    interactions: [
                        {
                            id: 'i1',
                            timestamp: new Date().toISOString(),
                            duration: 1,
                            request: { method: 'GET', url: 'https://example.com/a', headers: {} },
                            response: {
                                status: 200,
                                headers: { 'content-type': 'application/json' },
                                body: { ok: true },
                            },
                        },
                    ],
                },
                null,
                2
            )
        );

        const recorder = new HttpRecorder({ fixturesDir: dir, mode: 'playback', hosts: ['example.com'] });
        recorder.start('Mismatch');
        try {
            await expect(fetch('https://example.com/b')).rejects.toThrow(/No recorded interaction|Request mismatch/);
        } finally {
            recorder.stop();
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('updateOnMismatch falls back to live request in playback mode', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-recorder-'));

        fs.writeFileSync(
            path.join(dir, 'update-on-mismatch.json'),
            JSON.stringify(
                {
                    id: '1',
                    createdAt: new Date().toISOString(),
                    description: 'Update On Mismatch',
                    interactions: [
                        {
                            id: 'i1',
                            timestamp: new Date().toISOString(),
                            duration: 1,
                            request: { method: 'GET', url: 'https://example.com/a', headers: {} },
                            response: {
                                status: 200,
                                headers: { 'content-type': 'application/json' },
                                body: { ok: true },
                            },
                        },
                    ],
                },
                null,
                2
            )
        );

        const originalFetch = global.fetch;
        global.fetch = async () => {
            return new Response('hello', { status: 200, headers: { 'content-type': 'text/plain' } });
        };

        const recorder = new HttpRecorder({
            fixturesDir: dir,
            mode: 'playback',
            hosts: ['example.com'],
            updateOnMismatch: true,
        });

        recorder.start('Update On Mismatch');
        try {
            const res = await fetch('https://example.com/b');
            expect(await res.text()).toBe('hello');
        } finally {
            recorder.stop();
            global.fetch = originalFetch;
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });

    it('buildResponse handles undefined bodies and non-JSON bodies', async () => {
        const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'triage-recorder-'));

        fs.writeFileSync(
            path.join(dir, 'response-shapes.json'),
            JSON.stringify(
                {
                    id: '1',
                    createdAt: new Date().toISOString(),
                    description: 'Response Shapes',
                    interactions: [
                        {
                            id: 'i1',
                            timestamp: new Date().toISOString(),
                            duration: 1,
                            request: { method: 'GET', url: 'https://example.com/empty', headers: {} },
                            response: { status: 204, headers: { 'content-type': 'text/plain' }, body: undefined },
                        },
                        {
                            id: 'i2',
                            timestamp: new Date().toISOString(),
                            duration: 1,
                            request: { method: 'GET', url: 'https://example.com/obj', headers: {} },
                            response: { status: 200, headers: { 'content-type': 'text/plain' }, body: { a: 1 } },
                        },
                    ],
                },
                null,
                2
            )
        );

        const recorder = new HttpRecorder({ fixturesDir: dir, mode: 'playback', hosts: ['example.com'] });
        recorder.start('Response Shapes');
        try {
            const r1 = await fetch('https://example.com/empty');
            expect(r1.status).toBe(204);
            expect(await r1.text()).toBe('');

            const r2 = await fetch('https://example.com/obj');
            expect(r2.status).toBe(200);
            expect(await r2.text()).toBe('[object Object]');
        } finally {
            recorder.stop();
            fs.rmSync(dir, { recursive: true, force: true });
        }
    });
});

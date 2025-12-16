import * as fs from 'node:fs';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { withRecording } from '../../src/execution/recorder.ts';

describe('integration: VCR recording/playback', () => {
    it('replays GitHub API responses from cassette (no network required)', async () => {
        const fixturesDir = path.join(process.cwd(), 'tests', 'cassettes');
        const cassettePath = path.join(fixturesDir, 'github-api-root.json');
        expect(fs.existsSync(cassettePath)).toBe(true);

        const out = await withRecording('GitHub API Root', fixturesDir, 'playback', async () => {
            const res = await fetch('https://api.github.com/', {
                headers: { 'user-agent': 'agentic-triage-tests' },
            });
            return res.json();
        });

        expect(out).toHaveProperty('current_user_url');
    });
});

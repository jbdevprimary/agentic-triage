import type {
    CreateIssueOptions,
    IssuePriority,
    IssueStatus,
    IssueType,
    ListIssuesOptions,
    ProviderStats,
    ReadyWork,
    TriageIssue,
    TriageProvider,
    UpdateIssueOptions,
} from './types.js';

export class BeadsProvider implements TriageProvider {
    readonly name = 'beads';
    readonly displayName = 'Beads';

    constructor(_config: { root?: string }) {
        // Implementation for Beads provider would go here
    }

    async isReady(): Promise<boolean> {
        return false;
    }

    async createIssue(_options: CreateIssueOptions): Promise<TriageIssue> {
        throw new Error('Beads provider not implemented');
    }

    async getIssue(_id: string): Promise<TriageIssue | null> {
        throw new Error('Beads provider not implemented');
    }

    async updateIssue(_id: string, _options: UpdateIssueOptions): Promise<TriageIssue> {
        throw new Error('Beads provider not implemented');
    }

    async closeIssue(_id: string, _reason?: string): Promise<TriageIssue> {
        throw new Error('Beads provider not implemented');
    }

    async reopenIssue(_id: string, _reason?: string): Promise<TriageIssue> {
        throw new Error('Beads provider not implemented');
    }

    async listIssues(_options?: ListIssuesOptions): Promise<TriageIssue[]> {
        return [];
    }

    async getReadyWork(_options?: { limit?: number; priority?: IssuePriority }): Promise<ReadyWork[]> {
        return [];
    }

    async getBlockedIssues(): Promise<TriageIssue[]> {
        return [];
    }

    async searchIssues(_query: string, _options?: ListIssuesOptions): Promise<TriageIssue[]> {
        return [];
    }

    async addLabels(_id: string, _labels: string[]): Promise<void> {
        throw new Error('Beads provider not implemented');
    }

    async removeLabels(_id: string, _labels: string[]): Promise<void> {
        throw new Error('Beads provider not implemented');
    }

    async getStats(): Promise<ProviderStats> {
<<<<<<< HEAD
        try {
            const result = this.bd(['stats', '--json']);
            const data = JSON.parse(result);

            return {
                total: data.total || 0,
                open: data.open || 0,
                inProgress: data.in_progress || 0,
                blocked: data.blocked || 0,
                closed: data.closed || 0,
                byPriority: {
                    critical: data.byPriority?.['0'] || 0,
                    high: data.byPriority?.['1'] || 0,
                    medium: data.byPriority?.['2'] || 0,
                    low: data.byPriority?.['3'] || 0,
                    backlog: data.byPriority?.['4'] || 0,
                },
                byType: {
                    bug: data.byType?.bug || 0,
                    feature: data.byType?.feature || 0,
                    task: data.byType?.task || 0,
                    epic: data.byType?.epic || 0,
                    chore: data.byType?.chore || 0,
                    docs: data.byType?.docs || 0,
                },
            };
        } catch {
            // Fall back to computing from list
            const all = await this.listIssues({ limit: 10000 });

            const stats: ProviderStats = {
                total: all.length,
                open: 0,
                inProgress: 0,
                blocked: 0,
                closed: 0,
                byPriority: { critical: 0, high: 0, medium: 0, low: 0, backlog: 0 },
                byType: { bug: 0, feature: 0, task: 0, epic: 0, chore: 0, docs: 0 },
            };

            for (const issue of all) {
                switch (issue.status) {
                    case 'open':
                        stats.open++;
                        break;
                    case 'in_progress':
                        stats.inProgress++;
                        break;
                    case 'blocked':
                        stats.blocked++;
                        break;
                    case 'closed':
                        stats.closed++;
                        break;
                }
                stats.byPriority[issue.priority]++;
                stats.byType[issue.type]++;
            }

            return stats;
        }
    }

    // =========================================================================
    // Sync
    // =========================================================================

    async sync(): Promise<void> {
        this.bd(['sync']);
    }

    async init(directory?: string): Promise<void> {
        const cwd = directory || this.workingDir;
        execFileSync(this.bdPath, ['init', '--quiet'], {
            cwd,
            encoding: 'utf-8',
        });
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private bd(args: string[]): string {
        const env = { ...process.env };

        if (!this.useDaemon) {
            env.BEADS_USE_DAEMON = '0';
        }

        const result = spawnSync(this.bdPath, args, {
            cwd: this.workingDir,
            encoding: 'utf-8',
            env,
            maxBuffer: 10 * 1024 * 1024,
        });

        if (result.error) {
            throw result.error;
        }

        if (result.status !== 0) {
            throw new Error(result.stderr || `bd ${args[0]} failed`);
        }

        return result.stdout.trim();
    }

    private mapBeadsIssue(data: BeadsIssueData): TriageIssue {
=======
>>>>>>> origin/main
        return {
            total: 0,
            open: 0,
            inProgress: 0,
            blocked: 0,
            closed: 0,
            byPriority: { critical: 0, high: 0, medium: 0, low: 0, backlog: 0 },
            byType: { bug: 0, feature: 0, task: 0, epic: 0, chore: 0 },
        };
    }
}

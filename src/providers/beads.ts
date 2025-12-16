/**
 * Beads Issue Tracker Provider
 *
 * Implements TriageProvider for Beads (https://github.com/steveyegge/beads)
 * Local-first, AI-native issue tracking with dependency graphs.
 *
 * Features:
 * - Git-versioned issue database (distributed via git)
 * - Four dependency types: blocks, related, parent-child, discovered-from
 * - Ready work detection (issues with no blockers)
 * - Hierarchical issue IDs (bd-a1b2.1, bd-a1b2.2)
 * - Agent Mail for multi-agent coordination
 *
 * Install beads: npm install -g @beads/bd
 */

import { execFileSync, spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
    type BeadsProviderConfig,
    type CreateIssueOptions,
    type DependencyType,
    type IssueDependency,
    type IssuePriority,
    type ListIssuesOptions,
    normalizePriority,
    normalizeStatus,
    normalizeType,
    type ProviderStats,
    priorityToNumber,
    type ReadyWork,
    type TriageIssue,
    type TriageProvider,
    type UpdateIssueOptions,
} from './types.js';

/**
 * Beads Issue Tracker Provider
 *
 * Wraps the `bd` CLI for local-first issue tracking.
 */
export class BeadsProvider implements TriageProvider {
    readonly name = 'beads';
    readonly displayName = 'Beads Issue Tracker';

    private workingDir: string;
    private bdPath: string;
    private useDaemon: boolean;

    constructor(config: BeadsProviderConfig) {
        this.workingDir = config.workingDir || process.cwd();
        this.bdPath = config.bdPath || 'bd';
        this.useDaemon = config.useDaemon ?? true;
    }

    async isReady(): Promise<boolean> {
        try {
            // Check if bd is installed
            const version = this.bd(['version']);
            if (!version) return false;

            // Check if .beads directory exists
            const beadsDir = path.join(this.workingDir, '.beads');
            return fs.existsSync(beadsDir);
        } catch {
            return false;
        }
    }

    // =========================================================================
    // Issue CRUD
    // =========================================================================

    async createIssue(options: CreateIssueOptions): Promise<TriageIssue> {
        const args = ['create', options.title];

        if (options.description) {
            args.push('-d', options.description);
        }

        if (options.type) {
            args.push('-t', options.type);
        }

        if (options.priority) {
            args.push('-p', String(priorityToNumber(options.priority)));
        }

        if (options.labels && options.labels.length > 0) {
            args.push('-l', options.labels.join(','));
        }

        if (options.assignee) {
            args.push('-a', options.assignee);
        }

        args.push('--json');

        const result = this.bd(args);
        const data = JSON.parse(result);

        // If parent specified, add discovered-from dependency
        if (options.parentId) {
            await this.addDependency(data.id, options.parentId, 'discovered-from');
        }

        return this.mapBeadsIssue(data);
    }

    async getIssue(id: string): Promise<TriageIssue | null> {
        try {
            const result = this.bd(['show', id, '--json']);
            const data = JSON.parse(result);
            return this.mapBeadsIssue(data);
        } catch {
            return null;
        }
    }

    async updateIssue(id: string, options: UpdateIssueOptions): Promise<TriageIssue> {
        // Handle status changes specially
        if (options.status === 'closed') {
            return this.closeIssue(id, options.closeReason);
        }

        if (options.status === 'open') {
            return this.reopenIssue(id);
        }

        const args = ['update', id];

        if (options.status) {
            args.push('--status', options.status);
        }

        if (options.priority) {
            args.push('-p', String(priorityToNumber(options.priority)));
        }

        if (options.type) {
            args.push('-t', options.type);
        }

        if (options.assignee) {
            args.push('-a', options.assignee);
        }

        if (options.description) {
            args.push('--notes', options.description);
        }

        args.push('--json');

        const result = this.bd(args);
        const data = JSON.parse(result);
        return this.mapBeadsIssue(data);
    }

    async closeIssue(id: string, reason?: string): Promise<TriageIssue> {
        const args = ['close', id];

        if (reason) {
            args.push('--reason', reason);
        }

        args.push('--json');

        const result = this.bd(args);
        const data = JSON.parse(result);
        return this.mapBeadsIssue(data);
    }

    async reopenIssue(id: string, reason?: string): Promise<TriageIssue> {
        const args = ['reopen', id];

        if (reason) {
            args.push('--reason', reason);
        }

        args.push('--json');

        const result = this.bd(args);
        const data = JSON.parse(result);
        return this.mapBeadsIssue(data);
    }

    async deleteIssue(id: string): Promise<void> {
        this.bd(['delete', id, '--force']);
    }

    // =========================================================================
    // Querying
    // =========================================================================

    async listIssues(options?: ListIssuesOptions): Promise<TriageIssue[]> {
        const args = ['list', '--json'];

        // Status filter
        if (options?.status) {
            const statuses = Array.isArray(options.status) ? options.status : [options.status];
            // Beads uses --status flag
            for (const status of statuses) {
                args.push('--status', status);
            }
        }

        // Priority filter
        if (options?.priority) {
            const priorities = Array.isArray(options.priority) ? options.priority : [options.priority];
            for (const p of priorities) {
                args.push('--priority', String(priorityToNumber(p)));
            }
        }

        // Type filter
        if (options?.type) {
            const types = Array.isArray(options.type) ? options.type : [options.type];
            for (const t of types) {
                args.push('--type', t);
            }
        }

        // Label filters
        if (options?.labels && options.labels.length > 0) {
            args.push('--label', options.labels.join(','));
        }

        if (options?.labelsAny && options.labelsAny.length > 0) {
            args.push('--label-any', options.labelsAny.join(','));
        }

        // Assignee filter
        if (options?.assignee) {
            args.push('--assignee', options.assignee);
        }

        // Search filters
        if (options?.titleContains) {
            args.push('--title-contains', options.titleContains);
        }

        if (options?.descriptionContains) {
            args.push('--desc-contains', options.descriptionContains);
        }

        // Date filters
        if (options?.createdAfter) {
            args.push('--created-after', options.createdAfter);
        }

        if (options?.createdBefore) {
            args.push('--created-before', options.createdBefore);
        }

        // Limit
        if (options?.limit) {
            args.push('--limit', String(options.limit));
        }

        const result = this.bd(args);
        const data = JSON.parse(result);

        return (Array.isArray(data) ? data : [data])
            .filter(Boolean)
            .map((item: BeadsIssueData) => this.mapBeadsIssue(item));
    }

    async getReadyWork(options?: { limit?: number; priority?: IssuePriority }): Promise<ReadyWork[]> {
        const args = ['ready', '--json'];

        if (options?.limit) {
            args.push('--limit', String(options.limit));
        }

        if (options?.priority) {
            args.push('--priority', String(priorityToNumber(options.priority)));
        }

        const result = this.bd(args);
        const data = JSON.parse(result);

        return (Array.isArray(data) ? data : [data]).filter(Boolean).map((item: BeadsIssueData) => ({
            issue: this.mapBeadsIssue(item),
        }));
    }

    async getBlockedIssues(): Promise<TriageIssue[]> {
        const result = this.bd(['blocked', '--json']);
        const data = JSON.parse(result);

        return (Array.isArray(data) ? data : [data])
            .filter(Boolean)
            .map((item: BeadsIssueData) => this.mapBeadsIssue(item));
    }

    async searchIssues(query: string, options?: ListIssuesOptions): Promise<TriageIssue[]> {
        const args = ['search', query, '--json'];

        if (options?.limit) {
            args.push('--limit', String(options.limit));
        }

        try {
            const result = this.bd(args);
            const data = JSON.parse(result);

            return (Array.isArray(data) ? data : [data])
                .filter(Boolean)
                .map((item: BeadsIssueData) => this.mapBeadsIssue(item));
        } catch {
            // Fall back to list with title filter
            return this.listIssues({
                ...options,
                titleContains: query,
            });
        }
    }

    // =========================================================================
    // Dependencies
    // =========================================================================

    async addDependency(from: string, to: string, type: DependencyType): Promise<void> {
        this.bd(['dep', 'add', from, to, '--type', type]);
    }

    async removeDependency(from: string, to: string): Promise<void> {
        this.bd(['dep', 'remove', from, to]);
    }

    async getDependencies(id: string): Promise<IssueDependency[]> {
        try {
            const result = this.bd(['show', id, '--json']);
            const data = JSON.parse(result);

            const deps: IssueDependency[] = [];

            // Map beads dependency structure
            if (data.dependencies) {
                for (const dep of data.dependencies) {
                    deps.push({
                        from: id,
                        to: dep.id || dep,
                        type: dep.type || 'blocks',
                    });
                }
            }

            if (data.blockedBy) {
                for (const blocker of data.blockedBy) {
                    deps.push({
                        from: id,
                        to: typeof blocker === 'string' ? blocker : blocker.id,
                        type: 'blocks',
                    });
                }
            }

            return deps;
        } catch {
            return [];
        }
    }

    async getBlockers(id: string): Promise<TriageIssue[]> {
        const deps = await this.getDependencies(id);
        const blockerIds = deps.filter((d) => d.type === 'blocks').map((d) => d.to);

        const blockers: TriageIssue[] = [];
        for (const blockerId of blockerIds) {
            const issue = await this.getIssue(blockerId);
            if (issue && issue.status !== 'closed') {
                blockers.push(issue);
            }
        }

        return blockers;
    }

    async getBlocking(id: string): Promise<TriageIssue[]> {
        // Issues that this issue blocks
        const allIssues = await this.listIssues({ status: 'open' });
        const blocking: TriageIssue[] = [];

        for (const issue of allIssues) {
            const deps = await this.getDependencies(issue.id);
            if (deps.some((d) => d.to === id && d.type === 'blocks')) {
                blocking.push(issue);
            }
        }

        return blocking;
    }

    // =========================================================================
    // Labels
    // =========================================================================

    async addLabels(id: string, labels: string[]): Promise<void> {
        for (const label of labels) {
            this.bd(['label', 'add', id, label]);
        }
    }

    async removeLabels(id: string, labels: string[]): Promise<void> {
        for (const label of labels) {
            this.bd(['label', 'remove', id, label]);
        }
    }

    async getAvailableLabels(): Promise<string[]> {
        try {
            const result = this.bd(['label', 'list-all', '--json']);
            const data = JSON.parse(result);
            return data.map((l: { name: string; count: number }) => l.name);
        } catch {
            return [];
        }
    }

    // =========================================================================
    // Statistics
    // =========================================================================

    async getStats(): Promise<ProviderStats> {
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
                byType: { bug: 0, feature: 0, task: 0, epic: 0, chore: 0 },
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
        return {
            id: data.id,
            title: data.title,
            description: data.description || data.notes || undefined,
            status: normalizeStatus(data.status),
            priority: normalizePriority(data.priority),
            type: normalizeType(data.type || 'task'),
            labels: data.labels || [],
            assignee: data.assignee || undefined,
            createdAt: data.created_at || data.createdAt || new Date().toISOString(),
            updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
            closedAt: data.closed_at || data.closedAt || undefined,
            url: undefined, // Beads is local-first
            metadata: {
                raw: data,
                hasBlockers: (data.blockedBy?.length ?? 0) > 0,
                childCount: data.children?.length || 0,
            },
        };
    }
}

interface BeadsIssueData {
    id: string;
    title: string;
    description?: string;
    notes?: string;
    status: string;
    priority: number | string;
    type?: string;
    labels?: string[];
    assignee?: string;
    created_at?: string;
    createdAt?: string;
    updated_at?: string;
    updatedAt?: string;
    closed_at?: string;
    closedAt?: string;
    blockedBy?: Array<string | { id: string }>;
    dependencies?: Array<{ id: string; type: string }>;
    children?: string[];
}

/**
 * Create a Beads provider instance
 */
export function createBeadsProvider(config: BeadsProviderConfig): BeadsProvider {
    return new BeadsProvider(config);
}

/**
 * Check if beads is installed
 */
export function isBeadsInstalled(): boolean {
    try {
        execFileSync('bd', ['version'], { encoding: 'utf-8' });
        return true;
    } catch {
        return false;
    }
}

/**
 * Check if beads is initialized in a directory
 */
export function isBeadsInitialized(directory: string = process.cwd()): boolean {
    return fs.existsSync(path.join(directory, '.beads'));
}

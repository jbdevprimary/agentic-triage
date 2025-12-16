/**
 * GitHub Issues Provider
 *
 * Implements TriageProvider for GitHub Issues.
 * Wraps existing github.ts and octokit.ts functionality.
 */

import { execFileSync } from 'node:child_process';
import {
    type CreateIssueOptions,
    type GitHubProviderConfig,
    type IssuePriority,
    type IssueStatus,
    type IssueType,
    type ListIssuesOptions,
    normalizePriority,
    normalizeType,
    type ProviderStats,
    priorityToNumber,
    type ReadyWork,
    type TriageIssue,
    type TriageProvider,
    type UpdateIssueOptions,
} from './types.js';

/**
 * GitHub Issues Provider
 *
 * Uses `gh` CLI for operations, with Octokit for advanced features.
 */
export class GitHubProvider implements TriageProvider {
    readonly name = 'github';
    readonly displayName = 'GitHub Issues';

    private repo: string;
    private token?: string;

    constructor(config: GitHubProviderConfig) {
        this.repo = config.repo;
        this.token = config.token;
    }

    async isReady(): Promise<boolean> {
        try {
            this.gh(['repo', 'view', this.repo, '--json', 'name']);
            return true;
        } catch {
            return false;
        }
    }

    // =========================================================================
    // Issue CRUD
    // =========================================================================

    async createIssue(options: CreateIssueOptions): Promise<TriageIssue> {
        const args = ['issue', 'create', '--repo', this.repo];

        args.push('--title', options.title);

        if (options.description) {
            args.push('--body', options.description);
        }

        const labels: string[] = [...(options.labels || [])];

        // Map type to label
        if (options.type) {
            labels.push(`type:${options.type}`);
        }

        // Map priority to label
        if (options.priority) {
            labels.push(`priority:${options.priority}`);
        }

        if (labels.length > 0) {
            args.push('--label', labels.join(','));
        }

        if (options.assignee) {
            args.push('--assignee', options.assignee);
        }

        const result = this.gh(args);
        // gh issue create returns the issue URL
        const match = result.match(/\/issues\/(\d+)/);
        const id = match ? match[1] : result.trim();

        const issue = await this.getIssue(id);
        if (!issue) {
            throw new Error(`Failed to retrieve created issue ${id}`);
        }
        return issue;
    }

    async getIssue(id: string): Promise<TriageIssue | null> {
        try {
            const result = this.gh([
                'issue',
                'view',
                id,
                '--repo',
                this.repo,
                '--json',
                'number,title,body,state,labels,assignees,createdAt,updatedAt,closedAt,url',
            ]);
            const data = JSON.parse(result);
            return this.mapGitHubIssue(data);
        } catch {
            return null;
        }
    }

    async updateIssue(id: string, options: UpdateIssueOptions): Promise<TriageIssue> {
        const args = ['issue', 'edit', id, '--repo', this.repo];

        if (options.title) {
            args.push('--title', options.title);
        }

        if (options.description) {
            args.push('--body', options.description);
        }

        // Handle status changes
        if (options.status === 'closed') {
            await this.closeIssue(id, options.closeReason);
        } else if (options.status === 'open') {
            await this.reopenIssue(id);
        }

        // Handle labels
        if (options.labels) {
            args.push('--add-label', options.labels.join(','));
        }

        if (options.assignee) {
            args.push('--add-assignee', options.assignee);
        }

        // Add priority/type labels if specified
        if (options.priority) {
            args.push('--add-label', `priority:${options.priority}`);
        }

        if (options.type) {
            args.push('--add-label', `type:${options.type}`);
        }

        if (args.length > 4) {
            // More than just 'issue edit id --repo'
            this.gh(args);
        }

        const issue = await this.getIssue(id);
        if (!issue) {
            throw new Error(`Failed to retrieve updated issue ${id}`);
        }
        return issue;
    }

    async closeIssue(id: string, reason?: string): Promise<TriageIssue> {
        const args = ['issue', 'close', id, '--repo', this.repo];

        if (reason) {
            args.push('--comment', reason);
        }

        this.gh(args);

        const issue = await this.getIssue(id);
        if (!issue) {
            throw new Error(`Failed to retrieve closed issue ${id}`);
        }
        return issue;
    }

    async reopenIssue(id: string, reason?: string): Promise<TriageIssue> {
        const args = ['issue', 'reopen', id, '--repo', this.repo];

        if (reason) {
            args.push('--comment', reason);
        }

        this.gh(args);

        const issue = await this.getIssue(id);
        if (!issue) {
            throw new Error(`Failed to retrieve reopened issue ${id}`);
        }
        return issue;
    }

    // =========================================================================
    // Querying
    // =========================================================================

    async listIssues(options?: ListIssuesOptions): Promise<TriageIssue[]> {
        const args = [
            'issue',
            'list',
            '--repo',
            this.repo,
            '--json',
            'number,title,body,state,labels,assignees,createdAt,updatedAt,closedAt,url',
        ];

        // Status filter
        if (options?.status) {
            const statuses = Array.isArray(options.status) ? options.status : [options.status];
            // GitHub only supports open/closed
            if (statuses.includes('closed')) {
                args.push('--state', 'closed');
            } else if (statuses.every((s) => s !== 'closed')) {
                args.push('--state', 'open');
            } else {
                args.push('--state', 'all');
            }
        }

        // Label filters
        if (options?.labels && options.labels.length > 0) {
            args.push('--label', options.labels.join(','));
        }

        // Assignee filter
        if (options?.assignee) {
            args.push('--assignee', options.assignee);
        }

        // Search filter
        if (options?.titleContains) {
            args.push('--search', options.titleContains);
        }

        // Limit
        if (options?.limit) {
            args.push('--limit', String(options.limit));
        }

        const result = this.gh(args);
        const data = JSON.parse(result);

        let issues = data.map((item: GitHubIssueData) => this.mapGitHubIssue(item));

        // Post-filter by priority/type (label-based)
        if (options?.priority) {
            const priorities = Array.isArray(options.priority) ? options.priority : [options.priority];
            issues = issues.filter((i: TriageIssue) => priorities.includes(i.priority));
        }

        if (options?.type) {
            const types = Array.isArray(options.type) ? options.type : [options.type];
            issues = issues.filter((i: TriageIssue) => types.includes(i.type));
        }

        return issues;
    }

    async getReadyWork(options?: { limit?: number; priority?: IssuePriority }): Promise<ReadyWork[]> {
        // For GitHub, "ready" means open issues without blocking labels
        const issues = await this.listIssues({
            status: 'open',
            limit: options?.limit || 20,
            priority: options?.priority,
        });

        // Filter out blocked issues (those with 'blocked' or 'waiting' labels)
        const readyIssues = issues.filter(
            (issue) =>
                !issue.labels.some((l) => l.toLowerCase().includes('blocked') || l.toLowerCase().includes('waiting'))
        );

        // Sort by priority
        readyIssues.sort((a, b) => priorityToNumber(a.priority) - priorityToNumber(b.priority));

        return readyIssues.map((issue) => ({ issue }));
    }

    async getBlockedIssues(): Promise<TriageIssue[]> {
        const issues = await this.listIssues({ status: 'open' });

        return issues.filter((issue) =>
            issue.labels.some((l) => l.toLowerCase().includes('blocked') || l.toLowerCase().includes('waiting'))
        );
    }

    async searchIssues(query: string, options?: ListIssuesOptions): Promise<TriageIssue[]> {
        return this.listIssues({
            ...options,
            titleContains: query,
        });
    }

    // =========================================================================
    // Labels
    // =========================================================================

    async addLabels(id: string, labels: string[]): Promise<void> {
        this.gh(['issue', 'edit', id, '--repo', this.repo, '--add-label', labels.join(',')]);
    }

    async removeLabels(id: string, labels: string[]): Promise<void> {
        this.gh(['issue', 'edit', id, '--repo', this.repo, '--remove-label', labels.join(',')]);
    }

    async getAvailableLabels(): Promise<string[]> {
        const result = this.gh(['label', 'list', '--repo', this.repo, '--json', 'name']);
        const data = JSON.parse(result);
        return data.map((l: { name: string }) => l.name);
    }

    // =========================================================================
    // Statistics
    // =========================================================================

    async getStats(): Promise<ProviderStats> {
        const [open, closed] = await Promise.all([
            this.listIssues({ status: 'open', limit: 1000 }),
            this.listIssues({ status: 'closed', limit: 1000 }),
        ]);

        const all = [...open, ...closed];

        const byPriority: Record<IssuePriority, number> = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0,
            backlog: 0,
        };
        const byType: Record<IssueType, number> = {
            bug: 0,
            feature: 0,
            task: 0,
            epic: 0,
            chore: 0,
        };

        for (const issue of all) {
            byPriority[issue.priority]++;
            byType[issue.type]++;
        }

        const inProgress = open.filter((i) => i.status === 'in_progress').length;
        const blocked = open.filter((i) => i.status === 'blocked').length;

        return {
            total: all.length,
            open: open.length,
            inProgress,
            blocked,
            closed: closed.length,
            byPriority,
            byType,
        };
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    private gh(args: string[]): string {
        const env = { ...process.env };
        if (this.token) {
            env.GH_TOKEN = this.token;
        }

        return execFileSync('gh', args, {
            encoding: 'utf-8',
            env,
            maxBuffer: 10 * 1024 * 1024,
        }).trim();
    }

    private mapGitHubIssue(data: GitHubIssueData): TriageIssue {
        const labels = (data.labels || []).map((l: { name: string } | string) => (typeof l === 'string' ? l : l.name));

        // Extract priority from labels
        let priority: IssuePriority = 'medium';
        for (const label of labels) {
            if (label.startsWith('priority:')) {
                priority = normalizePriority(label.replace('priority:', ''));
                break;
            }
            if (label.match(/^p[0-4]$/i)) {
                priority = normalizePriority(label);
                break;
            }
        }

        // Extract type from labels
        let type: IssueType = 'task';
        for (const label of labels) {
            if (label.startsWith('type:')) {
                type = normalizeType(label.replace('type:', ''));
                break;
            }
            if (['bug', 'feature', 'enhancement', 'task', 'epic', 'chore'].includes(label.toLowerCase())) {
                type = normalizeType(label);
                break;
            }
        }

        // Determine status
        let status: IssueStatus = data.state === 'closed' ? 'closed' : 'open';
        if (status === 'open') {
            if (labels.some((l) => l.toLowerCase().includes('blocked'))) {
                status = 'blocked';
            } else if (
                labels.some((l) => l.toLowerCase().includes('in-progress') || l.toLowerCase().includes('in_progress'))
            ) {
                status = 'in_progress';
            }
        }

        return {
            id: String(data.number),
            title: data.title,
            description: data.body || undefined,
            status,
            priority,
            type,
            labels: labels.filter(
                (l: string) =>
                    !l.startsWith('priority:') &&
                    !l.startsWith('type:') &&
                    !['bug', 'feature', 'enhancement', 'task', 'epic', 'chore'].includes(l.toLowerCase())
            ),
            assignee: data.assignees?.[0]?.login,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
            closedAt: data.closedAt || undefined,
            url: data.url,
            metadata: { raw: data },
        };
    }
}

interface GitHubIssueData {
    number: number;
    title: string;
    body?: string;
    state: string;
    labels?: Array<{ name: string } | string>;
    assignees?: Array<{ login: string }>;
    createdAt: string;
    updatedAt: string;
    closedAt?: string;
    url?: string;
}

/**
 * Create a GitHub provider instance
 */
export function createGitHubProvider(config: GitHubProviderConfig): GitHubProvider {
    return new GitHubProvider(config);
}

/**
 * Triage Providers
 */

export { GitHubProvider } from './github.js';
export { JiraProvider } from './jira.js';
export { LinearProvider, type LinearConfig } from './linear.js';
export { BeadsProvider } from './beads.js';
export * from './types.js';

import { GitHubProvider } from './github.js';
import { JiraProvider } from './jira.js';
import { LinearProvider, type LinearConfig } from './linear.js';
import { BeadsProvider } from './beads.js';
import type { 
    ProviderConfig, 
    TriageProvider,
    TriageIssue,
    IssueStatus,
    IssuePriority,
    IssueType
} from './types.js';

/**
 * Create a triage provider from configuration
 */
export function createProvider(config: ProviderConfig | any): TriageProvider {
    const type = config.type || config.provider;
    switch (type) {
        case 'github':
            return new GitHubProvider(config.github || config);

        case 'jira':
            return new JiraProvider(config.jira || config);

        case 'linear':
            return new LinearProvider(config.linear || config);

        case 'beads':
            return new BeadsProvider(config.beads || config);

        default:
            throw new Error(`Unknown provider type: ${type}`);
    }
}

/**
 * Detect and create the best provider based on environment
 */
export async function createBestProvider(options: { repo?: string } = {}): Promise<TriageProvider> {
    if (options.repo) {
        return new GitHubProvider({ type: 'github', repo: options.repo });
    }

    // Try to detect from environment or git
    const repo = process.env.GITHUB_REPOSITORY;
    if (repo) {
        return new GitHubProvider({ type: 'github', repo });
    }

    throw new Error('Could not auto-detect provider. Please provide configuration.');
}

// Backward compatibility with the PR branch's TriageConnectors
export interface TriageConnectorsConfig {
    provider: 'github' | 'linear' | 'beads' | 'jira';
    github?: {
        owner?: string;
        repo?: string;
    };
    linear?: LinearConfig;
    beads?: {
        root?: string;
    };
    jira?: any;
}

export class TriageConnectors {
    private provider: TriageProvider;

    constructor(config: TriageConnectorsConfig) {
        this.provider = createProvider(config);
    }

    getProvider(): TriageProvider {
        return this.provider;
    }

    // Proxy methods for convenience
    async listIssues(filters?: {
        status?: IssueStatus;
        priority?: IssuePriority;
        type?: IssueType;
        labels?: string[];
        limit?: number;
        assignee?: string;
    }) {
        return this.provider.listIssues(filters);
    }

    async getIssue(id: string) {
        return this.provider.getIssue(id);
    }

    async createIssue(issue: {
        title: string;
        body?: string;
        type?: IssueType;
        priority?: IssuePriority;
        labels?: string[];
        assignee?: string;
    }) {
        return this.provider.createIssue(issue);
    }

    async updateIssue(id: string, updates: Partial<TriageIssue>) {
        return this.provider.updateIssue(id, updates);
    }

    async searchIssues(query: string) {
        return this.provider.searchIssues(query);
    }
}

let _connectors: TriageConnectors | null = null;

export function setTriageConnectors(connectors: TriageConnectors) {
    _connectors = connectors;
}

export function getTriageConnectors(): TriageConnectors {
    if (!_connectors) {
        // Default to GitHub if not set, for backward compatibility
        _connectors = new TriageConnectors({ provider: 'github' });
    }
    return _connectors;
}

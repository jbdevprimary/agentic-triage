import { LinearClient, type Issue, type IssueConnection } from '@linear/sdk';
import type { 
    TriageIssue, 
    TriageProvider, 
    IssueStatus, 
    IssuePriority, 
    IssueType 
} from './base.js';

export interface LinearConfig {
    apiKey: string;
    teamId: string;
}

export class LinearProvider implements TriageProvider {
    private client: LinearClient;
    private teamId: string;

    constructor(config: LinearConfig) {
        if (!config.apiKey || !config.apiKey.startsWith('lin_api_')) {
            throw new Error('Invalid Linear API key. Must start with lin_api_');
        }
        if (!config.teamId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(config.teamId)) {
            throw new Error('Invalid Linear team ID. Must be a valid UUID');
        }
        this.client = new LinearClient({ apiKey: config.apiKey });
        this.teamId = config.teamId;
    }

    private async mapIssue(issue: Issue): Promise<TriageIssue> {
        const state = await issue.state;
        const labels = await issue.labels();
        const assignee = await issue.assignee;
        
        const labelNames = labels.nodes.map(l => l.name);
        
        // Derive type from labels
        const typeLabel = labelNames.find(l => 
            ['bug', 'feature', 'task', 'chore', 'docs'].includes(l.toLowerCase())
        );

        return {
            id: issue.id,
            title: issue.title,
            body: issue.description || '',
            status: (state?.name || 'unknown') as IssueStatus,
            priority: this.mapPriorityFromLinear(issue.priority),
            type: typeLabel?.toLowerCase() as IssueType,
            labels: labelNames,
            assignee: assignee?.name,
            url: issue.url,
        };
    }

    private mapPriorityFromLinear(priority: number): IssuePriority {
        switch (priority) {
            case 1: return 'critical';
            case 2: return 'high';
            case 3: return 'medium';
            case 4: return 'low';
            default: return 'backlog';
        }
    }

    private mapPriorityToLinear(priority?: IssuePriority): number {
        switch (priority) {
            case 'critical': return 1;
            case 'high': return 2;
            case 'medium': return 3;
            case 'low': return 4;
            default: return 0;
        }
    }

    private mapStatusToLinear(status?: IssueStatus): string | undefined {
        switch (status) {
            case 'open': return 'Todo';
            case 'in_progress': return 'In Progress';
            case 'blocked': return 'Blocked';
            case 'closed': return 'Done';
            default: return undefined;
        }
    }

    async listIssues(filters?: {
        status?: IssueStatus;
        priority?: IssuePriority;
        type?: IssueType;
        labels?: string[];
        limit?: number;
        assignee?: string;
    }): Promise<TriageIssue[]> {
        const issues = await this.client.issues({
            filter: {
                team: { id: { eq: this.teamId } },
                ...(filters?.status && { state: { name: { eq: this.mapStatusToLinear(filters.status) } } }),
                ...(filters?.priority && { priority: { eq: this.mapPriorityToLinear(filters.priority) } }),
            },
            first: filters?.limit || 50,
        });

        return Promise.all(issues.nodes.map(issue => this.mapIssue(issue)));
    }

    async getIssue(id: string): Promise<TriageIssue> {
        const issue = await this.client.issue(id);
        if (!issue) {
            throw new Error(`Issue ${id} not found`);
        }
        return this.mapIssue(issue);
    }

    async createIssue(issue: {
        title: string;
        body?: string;
        type?: IssueType;
        priority?: IssuePriority;
        labels?: string[];
        assignee?: string;
    }): Promise<TriageIssue> {
        const labels = [...(issue.labels || [])];
        if (issue.type) labels.push(issue.type);

        // Linear needs label IDs usually. For now we just create the issue.
        // If we wanted to support label names, we'd need to fetch or create them.
        
        const response = await this.client.createIssue({
            teamId: this.teamId,
            title: issue.title,
            description: issue.body,
            priority: this.mapPriorityToLinear(issue.priority),
            // labelIds: ... we need IDs here
        });

        const newIssue = await response.issue;
        if (!newIssue) {
            throw new Error('Failed to create Linear issue');
        }

        return this.mapIssue(newIssue);
    }

    async updateIssue(id: string, updates: Partial<TriageIssue>): Promise<TriageIssue> {
        const response = await this.client.updateIssue(id, {
            title: updates.title,
            description: updates.body,
            priority: updates.priority ? this.mapPriorityToLinear(updates.priority) : undefined,
            // mapping back other fields if needed
        });

        const updatedIssue = await response.issue;
        if (!updatedIssue) {
            throw new Error(`Failed to update Linear issue ${id}`);
        }

        return this.mapIssue(updatedIssue);
    }

    async searchIssues(query: string): Promise<TriageIssue[]> {
        const issues = await this.client.issues({
            filter: {
                team: { id: { eq: this.teamId } },
                or: [
                    { title: { contains: query } },
                    { description: { contains: query } },
                ],
            },
        });

        return Promise.all(issues.nodes.map(issue => this.mapIssue(issue)));
    }

    async listSprints(): Promise<any[]> {
        const team = await this.client.team(this.teamId);
        const cycles = await team.cycles();
        return cycles.nodes.map(cycle => ({
            id: cycle.id,
            name: `Cycle ${cycle.number}`,
            startsAt: cycle.startsAt,
            endsAt: cycle.endsAt,
            state: cycle.completedAt ? 'completed' : (cycle.startsAt <= new Date() && cycle.endsAt >= new Date() ? 'active' : 'upcoming'),
        }));
    }

    async getCurrentSprint(): Promise<any> {
        const team = await this.client.team(this.teamId);
        const cycles = await team.cycles();
        const now = new Date();
        const current = cycles.nodes.find(cycle => 
            !cycle.completedAt && 
            cycle.startsAt <= now && 
            cycle.endsAt >= now
        );
        if (!current) return null;
        return {
            id: current.id,
            name: `Cycle ${current.number}`,
            startsAt: current.startsAt,
            endsAt: current.endsAt,
            state: 'active',
        };
    }
}

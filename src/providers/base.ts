export type IssueStatus = 'open' | 'in_progress' | 'blocked' | 'closed';
export type IssuePriority = 'critical' | 'high' | 'medium' | 'low' | 'backlog';
export type IssueType = 'bug' | 'feature' | 'task' | 'chore' | 'docs';

export interface TriageIssue {
    id: string;
    title: string;
    body: string;
    status: IssueStatus;
    priority?: IssuePriority;
    type?: IssueType;
    labels: string[];
    assignee?: string;
    url?: string;
}

export interface TriageProvider {
    listIssues(filters?: {
        status?: IssueStatus;
        priority?: IssuePriority;
        type?: IssueType;
        labels?: string[];
        limit?: number;
        assignee?: string;
    }): Promise<TriageIssue[]>;
    getIssue(id: string): Promise<TriageIssue>;
    createIssue(issue: {
        title: string;
        body?: string;
        type?: IssueType;
        priority?: IssuePriority;
        labels?: string[];
        assignee?: string;
    }): Promise<TriageIssue>;
    updateIssue(id: string, updates: Partial<TriageIssue>): Promise<TriageIssue>;
    searchIssues(query: string): Promise<TriageIssue[]>;
    
    // Project/Sprint tools
    listSprints?(): Promise<any[]>;
    getCurrentSprint?(): Promise<any>;
    getReadyWork?(): Promise<TriageIssue[]>;
}

# Agent Integration Guide

This document describes how to integrate agentic-triage tools into your AI agent system.

## Overview

agentic-triage provides **portable triage primitives** for AI agents. These are Vercel AI SDK-compatible tools that can be used with any model provider (Anthropic, OpenAI, Ollama, etc.).

## Tool Categories

### Issue Tools (`getIssueTools()`)

| Tool | Description |
|------|-------------|
| `listIssues` | List issues with filters (status, priority, type, labels) |
| `getIssue` | Get detailed issue by ID |
| `createIssue` | Create a new issue |
| `updateIssue` | Update issue fields |
| `closeIssue` | Close issue with reason |
| `searchIssues` | Full-text search across issues |
| `addLabels` | Add labels to an issue |
| `removeLabels` | Remove labels from an issue |

### Project Tools (`getProjectTools()`)

| Tool | Description |
|------|-------------|
| `listSprints` | List all sprints |
| `getCurrentSprint` | Get the current active sprint |
| `getReadyWork` | Get work items ready to start |
| `getIssueStats` | Get issue statistics |

### Review Tools (`getReviewTools()`)

| Tool | Description |
|------|-------------|
| `getPRComments` | Get comments on a PR |

## Integration Examples

### Basic Agent Setup

```typescript
import { getTriageTools } from 'agentic-triage';
import { generateText } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';

async function runTriageAgent(prompt: string) {
  const result = await generateText({
    model: anthropic('claude-sonnet-4-20250514'),
    tools: getTriageTools(),
    maxSteps: 10,
    prompt,
  });
  
  return result.text;
}

// Example usage
await runTriageAgent('Find all critical bugs and create a triage plan');
```

### With agentic-control

```typescript
import { getTriageTools } from 'agentic-triage';
import { AgentFleet } from 'agentic-control';

const fleet = new AgentFleet({
  agents: {
    triage: {
      tools: getTriageTools(),
      systemPrompt: 'You are a triage specialist...',
    },
  },
});

await fleet.dispatch('triage', 'Review all open issues');
```

### Selective Tool Import

```typescript
import { 
  listIssuesTool, 
  createIssueTool,
  searchIssuesTool 
} from 'agentic-triage';

// Only give agent the tools it needs
const minimalTools = {
  listIssues: listIssuesTool,
  createIssue: createIssueTool,
  searchIssues: searchIssuesTool,
};
```

### Custom Provider Configuration

```typescript
import { setTriageConnectors, TriageConnectors } from 'agentic-triage';
import { getTriageTools } from 'agentic-triage';

// Configure before using tools
const connectors = new TriageConnectors({
  provider: 'github',
  github: { owner: 'myorg', repo: 'myrepo' }
});
setTriageConnectors(connectors);

// Now tools will use this configuration
const tools = getTriageTools();
```

## Tool Schemas

All tools use Zod schemas for type-safe parameters. Here's an example:

### listIssues

```typescript
{
  description: 'List issues from the issue tracker with optional filters',
  parameters: {
    status: z.enum(['open', 'in_progress', 'blocked', 'closed']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low', 'backlog']).optional(),
    type: z.enum(['bug', 'feature', 'task', 'chore', 'docs']).optional(),
    labels: z.array(z.string()).optional(),
    limit: z.number().optional().default(50),
    assignee: z.string().optional(),
  }
}
```

### createIssue

```typescript
{
  description: 'Create a new issue in the issue tracker',
  parameters: {
    title: z.string().describe('Issue title'),
    body: z.string().optional().describe('Issue description'),
    type: z.enum(['bug', 'feature', 'task', 'chore', 'docs']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low', 'backlog']).optional(),
    labels: z.array(z.string()).optional(),
    assignee: z.string().optional(),
  }
}
```

## Provider-Specific Notes

### GitHub

- Uses GitHub Issues API
- Requires `GH_TOKEN` environment variable
- Labels map directly to GitHub labels
- Priority is stored as a label (e.g., `priority:high`)

### Beads

- Uses local `.beads/` directory
- No authentication required
- Native support for priorities, types, and relationships
- Supports blocking/blocked-by relationships

## Error Handling

Tools return structured errors that agents can understand:

```typescript
// Success
{ issues: [...], count: 10 }

// Error
{ error: 'Issue not found', code: 'NOT_FOUND' }
```

## Best Practices

1. **Use selective imports** - Only give agents the tools they need
2. **Configure providers early** - Set up connectors before tool usage
3. **Handle errors gracefully** - Tools may fail, design prompts accordingly
4. **Limit tool steps** - Use `maxSteps` to prevent infinite loops
5. **Log tool calls** - Monitor what tools agents are using

## Related

- [README.md](./README.md) - Main documentation
- [agentic-control](https://github.com/jbdevprimary/agentic-control) - Agent fleet orchestration

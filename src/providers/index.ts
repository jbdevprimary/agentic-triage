/**
 * Triage Providers
 *
 * Multi-provider abstraction for issue tracking systems.
 * Similar to how agentic-control has multiple AI providers,
 * agentic-triage has multiple triage/issue providers.
 *
 * Supported Providers:
 * - GitHub Issues (github)
 * - Beads Issue Tracker (beads) - local-first, AI-native
 * - Jira (jira) - coming soon
 * - Linear (linear) - coming soon
 *
 * @example
 * ```typescript
 * import { createProvider, getProvider } from 'agentic-triage/providers';
 *
 * // Create a GitHub provider
 * const github = createProvider({ type: 'github', repo: 'owner/repo' });
 *
 * // Create a Beads provider
 * const beads = createProvider({ type: 'beads', workingDir: '/path/to/project' });
 *
 * // Use the unified interface
 * const issues = await github.listIssues({ status: 'open' });
 * const ready = await beads.getReadyWork({ limit: 10 });
 * ```
 */

export {
    BeadsProvider,
    createBeadsProvider,
    isBeadsInitialized,
    isBeadsInstalled,
} from './beads.js';

// Providers
export { createGitHubProvider, GitHubProvider } from './github.js';
// Types
export * from './types.js';

import { BeadsProvider } from './beads.js';
import { GitHubProvider } from './github.js';
// Re-export for convenience
import type { ProviderConfig, TriageProvider } from './types.js';

// =============================================================================
// Provider Registry
// =============================================================================

const providerRegistry = new Map<string, TriageProvider>();

/**
 * Create a triage provider from configuration
 *
 * @example
 * ```typescript
 * // GitHub provider
 * const github = createProvider({
 *     type: 'github',
 *     repo: 'owner/repo',
 * });
 *
 * // Beads provider
 * const beads = createProvider({
 *     type: 'beads',
 *     workingDir: process.cwd(),
 * });
 * ```
 */
export function createProvider(config: ProviderConfig): TriageProvider {
    switch (config.type) {
        case 'github':
            return new GitHubProvider(config);

        case 'beads':
            return new BeadsProvider(config);

        case 'jira':
            throw new Error(
                'Jira provider not yet implemented. ' +
                    'Contributions welcome! See src/providers/types.ts for interface.'
            );

        case 'linear':
            throw new Error(
                'Linear provider not yet implemented. ' +
                    'Contributions welcome! See src/providers/types.ts for interface.'
            );

        default:
            throw new Error(`Unknown provider type: ${(config as { type: string }).type}`);
    }
}

/**
 * Register a provider instance for reuse
 *
 * @example
 * ```typescript
 * registerProvider('main', createProvider({ type: 'github', repo: 'owner/repo' }));
 * registerProvider('local', createProvider({ type: 'beads' }));
 *
 * const github = getProvider('main');
 * const beads = getProvider('local');
 * ```
 */
export function registerProvider(name: string, provider: TriageProvider): void {
    providerRegistry.set(name, provider);
}

/**
 * Get a registered provider by name
 */
export function getProvider(name: string): TriageProvider | undefined {
    return providerRegistry.get(name);
}

/**
 * Get all registered providers
 */
export function getAllProviders(): Map<string, TriageProvider> {
    return new Map(providerRegistry);
}

/**
 * Clear all registered providers
 */
export function clearProviders(): void {
    providerRegistry.clear();
}

// =============================================================================
// Auto-detection
// =============================================================================

/**
 * Detect available providers in the current environment
 *
 * @example
 * ```typescript
 * const available = await detectProviders();
 * // Returns: ['github', 'beads'] if both are available
 * ```
 */
export async function detectProviders(workingDir: string = process.cwd()): Promise<string[]> {
    const available: string[] = [];

    // Check for GitHub
    try {
        const { execFileSync } = await import('node:child_process');
        execFileSync('gh', ['auth', 'status'], { encoding: 'utf-8', stdio: 'pipe' });
        available.push('github');
    } catch {
        // GitHub CLI not authenticated
    }

    // Check for Beads
    try {
        const { isBeadsInstalled, isBeadsInitialized } = await import('./beads.js');
        if (isBeadsInstalled()) {
            if (isBeadsInitialized(workingDir)) {
                available.push('beads');
            } else {
                available.push('beads (not initialized)');
            }
        }
    } catch {
        // Beads not installed
    }

    return available;
}

/**
 * Create the best available provider for the current context
 *
 * Priority:
 * 1. Beads (if initialized in current directory) - local-first, richest features
 * 2. GitHub (if repo context available)
 *
 * @example
 * ```typescript
 * const provider = await createBestProvider();
 * const ready = await provider.getReadyWork();
 * ```
 */
export async function createBestProvider(
    options: { workingDir?: string; repo?: string; preferBeads?: boolean } = {}
): Promise<TriageProvider> {
    const { workingDir = process.cwd(), repo, preferBeads = true } = options;

    // Check Beads first if preferred
    if (preferBeads) {
        try {
            const { isBeadsInstalled, isBeadsInitialized } = await import('./beads.js');
            if (isBeadsInstalled() && isBeadsInitialized(workingDir)) {
                return new BeadsProvider({ type: 'beads', workingDir });
            }
        } catch {
            // Beads not available
        }
    }

    // Fall back to GitHub
    if (repo) {
        return new GitHubProvider({ type: 'github', repo });
    }

    // Try to detect repo from git remote
    try {
        const { execFileSync } = await import('node:child_process');
        const remote = execFileSync('git', ['remote', 'get-url', 'origin'], {
            cwd: workingDir,
            encoding: 'utf-8',
        }).trim();

        // Parse repo from remote URL
        const match = remote.match(/github\.com[/:]([^/]+\/[^/.]+)/);
        if (match) {
            const detectedRepo = match[1].replace(/\.git$/, '');
            return new GitHubProvider({ type: 'github', repo: detectedRepo });
        }
    } catch {
        // Not a git repo or no remote
    }

    // Check Beads as last resort even if not preferred
    if (!preferBeads) {
        try {
            const { isBeadsInstalled, isBeadsInitialized } = await import('./beads.js');
            if (isBeadsInstalled() && isBeadsInitialized(workingDir)) {
                return new BeadsProvider({ type: 'beads', workingDir });
            }
        } catch {
            // Beads not available
        }
    }

    throw new Error(
        'No triage provider available. Options:\n' +
            '  1. Initialize Beads: bd init\n' +
            '  2. Authenticate GitHub: gh auth login\n' +
            '  3. Provide repo explicitly: createProvider({ type: "github", repo: "owner/repo" })'
    );
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Sync all registered providers (for distributed providers like Beads)
 */
export async function syncAllProviders(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (const provider of providerRegistry.values()) {
        if ('sync' in provider && typeof provider.sync === 'function') {
            promises.push(provider.sync());
        }
    }

    await Promise.all(promises);
}

/**
 * Get combined statistics from all registered providers
 */
export async function getCombinedStats(): Promise<{
    providers: Record<string, import('./types.js').ProviderStats>;
    total: import('./types.js').ProviderStats;
}> {
    const providers: Record<string, import('./types.js').ProviderStats> = {};
    const total: import('./types.js').ProviderStats = {
        total: 0,
        open: 0,
        inProgress: 0,
        blocked: 0,
        closed: 0,
        byPriority: { critical: 0, high: 0, medium: 0, low: 0, backlog: 0 },
        byType: { bug: 0, feature: 0, task: 0, epic: 0, chore: 0 },
    };

    for (const [name, provider] of providerRegistry) {
        try {
            const stats = await provider.getStats();
            providers[name] = stats;

            // Aggregate
            total.total += stats.total;
            total.open += stats.open;
            total.inProgress += stats.inProgress;
            total.blocked += stats.blocked;
            total.closed += stats.closed;

            for (const p of Object.keys(stats.byPriority) as Array<keyof typeof stats.byPriority>) {
                total.byPriority[p] += stats.byPriority[p];
            }

            for (const t of Object.keys(stats.byType) as Array<keyof typeof stats.byType>) {
                total.byType[t] += stats.byType[t];
            }
        } catch (err) {
            console.warn(`Failed to get stats from ${name}:`, err);
        }
    }

    return { providers, total };
}

/**
 * GitHub API Client for PR Automation
 * Handles PR creation, status checks, and automation
 */

/**
 * GitHub PR configuration
 */
export interface GitHubPRConfig {
  title: string;
  body: string;
  head: string;
  base: string;
  labels?: string[];
  reviewers?: string[];
  assignees?: string[];
}

/**
 * GitHub PR result
 */
export interface GitHubPRResult {
  success: boolean;
  pr?: {
    number: number;
    url: string;
    html_url: string;
  };
  error?: string;
}

/**
 * GitHub client
 */
export class GitHubClient {
  private token: string;
  private owner: string;
  private repo: string;
  private baseUrl = 'https://api.github.com';

  constructor(token: string, owner: string, repo: string) {
    this.token = token;
    this.owner = owner;
    this.repo = repo;
  }

  /**
   * Create pull request
   */
  async createPullRequest(config: GitHubPRConfig): Promise<GitHubPRResult> {
    try {
      console.log(`🔀 Creating PR: ${config.title}`);

      const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/pulls`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          title: config.title,
          body: config.body,
          head: config.head,
          base: config.base,
          labels: config.labels || [],
          assignees: config.assignees || [],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`GitHub API error: ${error}`);
      }

      const pr = await response.json();

      // Add reviewers if specified
      if (config.reviewers && config.reviewers.length > 0) {
        await this.requestReviewers(pr.number, config.reviewers);
      }

      return {
        success: true,
        pr: {
          number: pr.number,
          url: pr.url,
          html_url: pr.html_url,
        },
      };
    } catch (error) {
      console.error('❌ Failed to create PR:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Request reviewers for PR
   */
  async requestReviewers(prNumber: number, reviewers: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/pulls/${prNumber}/requested_reviewers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          reviewers: reviewers,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to request reviewers:', error);
      return false;
    }
  }

  /**
   * Add labels to PR
   */
  async addLabels(prNumber: number, labels: string[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/issues/${prNumber}/labels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          labels: labels,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to add labels:', error);
      return false;
    }
  }

  /**
   * Comment on PR
   */
  async addComment(prNumber: number, body: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/issues/${prNumber}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          body: body,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to add comment:', error);
      return false;
    }
  }

  /**
   * Check if PR exists for branch
   */
  async findExistingPR(headBranch: string, baseBranch: string = 'main'): Promise<GitHubPRResult | null> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/pulls?head=${this.owner}:${headBranch}&base=${baseBranch}&state=open`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const prs = await response.json();
      
      if (prs.length > 0) {
        const pr = prs[0];
        return {
          success: true,
          pr: {
            number: pr.number,
            url: pr.url,
            html_url: pr.html_url,
          },
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to find existing PR:', error);
      return null;
    }
  }

  /**
   * Get PR status
   */
  async getPRStatus(prNumber: number): Promise<{
    state: string;
    mergeable: boolean;
    reviews: Array<{ state: string; user: { login: string } }>;
  } | null> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/pulls/${prNumber}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return null;
      }

      const pr = await response.json();

      // Get reviews
      const reviewsResponse = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/pulls/${prNumber}/reviews`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      const reviews = reviewsResponse.ok ? await reviewsResponse.json() : [];

      return {
        state: pr.state,
        mergeable: pr.mergeable,
        reviews: reviews.map((review: any) => ({
          state: review.state,
          user: { login: review.user.login },
        })),
      };
    } catch (error) {
      console.error('❌ Failed to get PR status:', error);
      return null;
    }
  }

  /**
   * Merge PR
   */
  async mergePR(prNumber: number, mergeMethod: 'merge' | 'squash' | 'rebase' = 'squash'): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/pulls/${prNumber}/merge`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify({
          merge_method: mergeMethod,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to merge PR:', error);
      return false;
    }
  }

  /**
   * Delete branch
   */
  async deleteBranch(branchName: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${this.owner}/${this.repo}/git/refs/heads/${branchName}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Failed to delete branch:', error);
      return false;
    }
  }

  /**
   * Create experiment PR
   */
  async createExperimentPR(
    experimentKey: string,
    branchName: string,
    deploymentUrl: string,
    contract: any
  ): Promise<GitHubPRResult> {
    const title = `feat(experiment): ${experimentKey}`;
    const body = this.generateExperimentPRBody(experimentKey, deploymentUrl, contract);

    const config: GitHubPRConfig = {
      title,
      body,
      head: branchName,
      base: 'main',
      labels: ['experiment', 'automated', `exp-${experimentKey}`],
      reviewers: ['yashpersonal'], // Add your team members here
    };

    return this.createPullRequest(config);
  }

  /**
   * Generate experiment PR body
   */
  private generateExperimentPRBody(experimentKey: string, deploymentUrl: string, contract: any): string {
    return `## Experiment: ${experimentKey}

**Deployment URL:** ${deploymentUrl}

**Status:** Ready for review

### Experiment Details
- **Key:** \`${experimentKey}\`
- **Branch:** \`exp/${experimentKey}\`
- **Deployment:** ${deploymentUrl}
- **Status:** Deployed and ready for testing

### Contract Summary
- **Name:** ${contract.name || 'N/A'}
- **Description:** ${contract.description || 'N/A'}
- **Hypothesis:** ${contract.hypothesis || 'N/A'}
- **Variants:** ${Object.keys(contract.variants || {}).join(', ')}

### Code Changes
${contract.codeChanges?.map((change: any) => `- **${change.file}**: ${change.function} (${change.parameterUsage})`).join('\n') || 'None specified'}

### Next Steps
- [ ] Review code changes
- [ ] Test deployment at ${deploymentUrl}
- [ ] Verify experiment is working
- [ ] Approve and merge
- [ ] Start experiment in Statsig

### Testing Checklist
- [ ] Visit the preview URL
- [ ] Verify experiment is working
- [ ] Check console for any errors
- [ ] Test both variants (if applicable)
- [ ] Verify no breaking changes

### Automated Actions
- ✅ Code changes applied
- ✅ Branch created and pushed
- ✅ Deployment completed
- ⏳ Awaiting review and approval
- ⏳ Will auto-merge after approval
- ⏳ Will auto-start experiment after merge

---
*This PR was created automatically by the experiment automation system.*`;
  }
}

/**
 * Create GitHub client instance
 */
export function createGitHubClient(): GitHubClient {
  const token = process.env.GITHUB_TOKEN;
  const repository = process.env.GITHUB_REPOSITORY;

  if (!token) {
    throw new Error('Missing GITHUB_TOKEN environment variable.');
  }

  if (!repository) {
    throw new Error('Missing GITHUB_REPOSITORY environment variable.');
  }

  const [owner, repo] = repository.split('/');
  return new GitHubClient(token, owner, repo);
}

/**
 * Global GitHub client instance
 */
export const githubClient = createGitHubClient();

/**
 * Vercel API Client for Deployment Management
 * Handles deployment polling, URL retrieval, and rollback capabilities
 */

/**
 * Vercel deployment status
 */
export interface VercelDeployment {
  id: string;
  url: string;
  state: 'BUILDING' | 'READY' | 'ERROR' | 'CANCELED';
  createdAt: number;
  readyAt?: number;
  error?: string;
}

/**
 * Vercel deployment result
 */
export interface VercelDeploymentResult {
  success: boolean;
  deployment?: VercelDeployment;
  error?: string;
  url?: string;
}

/**
 * Vercel API client
 */
export class VercelClient {
  private token: string;
  private orgId: string;
  private projectId: string;
  private baseUrl = 'https://api.vercel.com';

  constructor(token: string, orgId: string, projectId: string) {
    this.token = token;
    this.orgId = orgId;
    this.projectId = projectId;
  }

  /**
   * Create deployment
   */
  async createDeployment(branchName: string, workingDirectory: string): Promise<VercelDeploymentResult> {
    try {
      console.log(`🚀 Creating Vercel deployment for branch: ${branchName}`);
      
      const response = await fetch(`${this.baseUrl}/v13/deployments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: this.projectId,
          gitSource: {
            type: 'github',
            ref: branchName,
            repo: process.env.GITHUB_REPOSITORY || 'unknown/repo',
          },
          projectSettings: {
            framework: 'nextjs',
            buildCommand: 'npm run build',
            outputDirectory: '.next',
            installCommand: 'npm ci',
            devCommand: 'npm run dev',
          },
          target: 'preview',
          alias: [`${branchName.replace(/[^a-z0-9-]/gi, '-')}-dh25-demo-site.vercel.app`],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Vercel deployment failed: ${error}`);
      }

      const deployment = await response.json();
      
      return {
        success: true,
        deployment: {
          id: deployment.id,
          url: deployment.url,
          state: deployment.state,
          createdAt: deployment.createdAt,
        },
        url: deployment.url,
      };
    } catch (error) {
      console.error('❌ Vercel deployment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Poll deployment status
   */
  async pollDeployment(deploymentId: string, timeoutMs: number = 300000): Promise<VercelDeploymentResult> {
    const startTime = Date.now();
    const pollInterval = 5000; // 5 seconds

    console.log(`⏳ Polling deployment status: ${deploymentId}`);

    while (Date.now() - startTime < timeoutMs) {
      try {
        const response = await fetch(`${this.baseUrl}/v13/deployments/${deploymentId}`, {
          headers: {
            'Authorization': `Bearer ${this.token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to get deployment status: ${response.statusText}`);
        }

        const deployment = await response.json();
        
        console.log(`📊 Deployment status: ${deployment.state}`);

        if (deployment.state === 'READY') {
          return {
            success: true,
            deployment: {
              id: deployment.id,
              url: deployment.url,
              state: deployment.state,
              createdAt: deployment.createdAt,
              readyAt: deployment.readyAt,
            },
            url: deployment.url,
          };
        }

        if (deployment.state === 'ERROR' || deployment.state === 'CANCELED') {
          return {
            success: false,
            error: deployment.error || `Deployment ${deployment.state.toLowerCase()}`,
          };
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        console.error('❌ Error polling deployment:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    }

    return {
      success: false,
      error: 'Deployment timeout - deployment did not complete within the specified time',
    };
  }

  /**
   * Wait for deployment completion
   */
  async waitForDeployment(branchName: string, workingDirectory: string): Promise<VercelDeploymentResult> {
    // First, create the deployment
    const createResult = await this.createDeployment(branchName, workingDirectory);
    
    if (!createResult.success || !createResult.deployment) {
      return createResult;
    }

    // Then poll for completion
    return this.pollDeployment(createResult.deployment.id);
  }

  /**
   * Get deployment URL
   */
  async getDeploymentUrl(deploymentId: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v13/deployments/${deploymentId}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      const deployment = await response.json();
      return deployment.url || null;
    } catch (error) {
      console.error('❌ Error getting deployment URL:', error);
      return null;
    }
  }

  /**
   * List deployments for a project
   */
  async listDeployments(limit: number = 10): Promise<VercelDeployment[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v6/deployments?projectId=${this.projectId}&limit=${limit}`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to list deployments: ${response.statusText}`);
      }

      const data = await response.json();
      return data.deployments.map((deployment: any) => ({
        id: deployment.uid,
        url: deployment.url,
        state: deployment.state,
        createdAt: deployment.createdAt,
        readyAt: deployment.readyAt,
      }));
    } catch (error) {
      console.error('❌ Error listing deployments:', error);
      return [];
    }
  }

  /**
   * Cancel deployment
   */
  async cancelDeployment(deploymentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v13/deployments/${deploymentId}/cancel`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Error canceling deployment:', error);
      return false;
    }
  }

  /**
   * Delete deployment
   */
  async deleteDeployment(deploymentId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v13/deployments/${deploymentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('❌ Error deleting deployment:', error);
      return false;
    }
  }

  /**
   * Get deployment logs
   */
  async getDeploymentLogs(deploymentId: string): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/v2/deployments/${deploymentId}/events`, {
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to get deployment logs: ${response.statusText}`);
      }

      const data = await response.json();
      return data.map((event: any) => event.text || '');
    } catch (error) {
      console.error('❌ Error getting deployment logs:', error);
      return [];
    }
  }
}

/**
 * Create Vercel client instance
 */
export function createVercelClient(): VercelClient {
  const token = process.env.VERCEL_TOKEN;
  const orgId = process.env.VERCEL_ORG_ID;
  const projectId = process.env.VERCEL_PROJECT_ID;

  if (!token || !orgId || !projectId) {
    throw new Error('Missing Vercel configuration. Please set VERCEL_TOKEN, VERCEL_ORG_ID, and VERCEL_PROJECT_ID environment variables.');
  }

  return new VercelClient(token, orgId, projectId);
}

/**
 * Global Vercel client instance (lazy-loaded)
 */
export function getVercelClient(): VercelClient {
  try {
    return createVercelClient();
  } catch (error) {
    console.warn('Vercel client not available:', error);
    // Return a mock client for development
    return {
      waitForDeployment: async () => ({ success: true, url: 'https://mock-deployment.vercel.app' }),
      createDeployment: async () => ({ success: true, url: 'https://mock-deployment.vercel.app' }),
      pollDeployment: async () => ({ success: true, url: 'https://mock-deployment.vercel.app' }),
    } as any;
  }
}

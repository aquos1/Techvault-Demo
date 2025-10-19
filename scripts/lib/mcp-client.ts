/**
 * MCP Client Wrapper for Statsig API Operations
 * Provides typed interface for MCP Statsig tools
 */

import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * MCP Tool Response Interface
 */
export interface MCPResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Statsig Experiment Configuration
 */
export interface StatsigExperimentConfig {
  id: string;
  name: string;
  description: string;
  hypothesis: string;
  groups: Array<{
    name: string;
    id?: string;
    size: number;
    parameterValues: Record<string, any>;
    disabled?: boolean;
    description?: string;
  }>;
  primaryMetrics: Array<{
    name: string;
    type: string;
    direction?: 'increase' | 'decrease';
    hypothesizedValue?: number;
  }>;
  secondaryMetrics?: Array<{
    name: string;
    type: string;
    direction?: 'increase' | 'decrease';
    hypothesizedValue?: number;
  }>;
  idType: string;
  targetingGateID?: string;
  tags?: string[];
}

/**
 * MCP Client for Statsig Operations
 */
export class MCPClient {
  private mcpConfig: any;
  private baseUrl: string;

  constructor() {
    this.loadMCPConfig();
    this.baseUrl = 'https://api.statsig.com/v1/mcp';
  }

  /**
   * Load MCP configuration from cursor config
   */
  private loadMCPConfig(): void {
    try {
      const configPath = join(process.env.HOME || '', '.cursor', 'mcp.json');
      const configContent = readFileSync(configPath, 'utf-8');
      this.mcpConfig = JSON.parse(configContent);
    } catch (error) {
      console.error('Failed to load MCP config:', error);
      throw new Error('MCP configuration not found. Please ensure MCP is properly configured.');
    }
  }

  /**
   * Get authentication token from MCP config or environment
   */
  private getAuthToken(): string {
    // First try environment variable
    if (process.env.STATSIG_CONSOLE_API_KEY) {
      console.log(`🔑 Using STATSIG_CONSOLE_API_KEY from environment`);
      return process.env.STATSIG_CONSOLE_API_KEY;
    }
    
    // Fallback to MCP config
    const statsigConfig = this.mcpConfig?.mcpServers?.statsig;
    if (!statsigConfig?.env?.AUTH_TOKEN) {
      console.log(`❌ No STATSIG_CONSOLE_API_KEY found in environment`);
      console.log(`Available env vars:`, Object.keys(process.env).filter(k => k.includes('STATSIG')));
      throw new Error('Statsig AUTH_TOKEN not found in MCP configuration or environment');
    }
    return statsigConfig.env.AUTH_TOKEN;
  }

  /**
   * Make MCP API call
   */
  private async callMCPTool(toolName: string, params: any): Promise<MCPResponse> {
    try {
      const authToken = this.getAuthToken();
      
      // For now, we'll use a mock implementation that simulates MCP calls
      // In a real implementation, this would use the actual MCP protocol
      console.log(`🔧 Calling MCP tool: ${toolName}`, { params });
      
      // Simulate MCP tool response based on tool name
      return await this.simulateMCPResponse(toolName, params);
    } catch (error) {
      console.error(`❌ MCP tool call failed: ${toolName}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Simulate MCP response (replace with real MCP implementation)
   */
  private async simulateMCPResponse(toolName: string, params: any): Promise<MCPResponse> {
    // This simulates the MCP tool responses
    // In production, this would be replaced with actual MCP protocol calls
    
    switch (toolName) {
      case 'mcp_statsig-local_Create_Experiment':
        return {
          success: true,
          data: {
            id: `exp_${Date.now()}`,
            name: params['application/json']?.name || 'New Experiment',
            status: 'setup'
          }
        };

      case 'mcp_statsig-local_Get_Experiment_Details_by_ID':
        return {
          success: true,
          data: {
            id: params.path_id,
            name: 'Mock Experiment',
            status: 'setup',
            groups: [],
            primaryMetrics: [],
            description: 'Mock experiment for testing'
          }
        };

      case 'mcp_statsig-local_Update_Experiment_Entirely':
        return {
          success: true,
          data: {
            id: params.path_id,
            status: 'active',
            updated: new Date().toISOString()
          }
        };

      case 'mcp_statsig-local_Get_List_of_Experiments':
        return {
          success: true,
          data: {
            experiments: [
              {
                id: 'exp_1',
                name: 'Prime Banner Test',
                status: 'active'
              }
            ]
          }
        };

      default:
        return {
          success: true,
          data: { message: `Mock response for ${toolName}` }
        };
    }
  }

  /**
   * Create experiment in Statsig
   */
  async createExperiment(config: StatsigExperimentConfig): Promise<MCPResponse> {
    return this.callMCPTool('mcp_statsig-local_Create_Experiment', {
      'application/json': config
    });
  }

  /**
   * Get experiment details by ID
   */
  async getExperimentDetails(experimentId: string): Promise<MCPResponse> {
    return this.callMCPTool('mcp_statsig-local_Get_Experiment_Details_by_ID', {
      path_id: experimentId
    });
  }

  /**
   * Update experiment entirely
   */
  async updateExperiment(experimentId: string, config: any): Promise<MCPResponse> {
    return this.callMCPTool('mcp_statsig-local_Update_Experiment_Entirely', {
      path_id: experimentId,
      'application/json': config
    });
  }

  /**
   * Start experiment
   */
  async startExperiment(experimentId: string): Promise<MCPResponse> {
    // Get current experiment details first
    const currentDetails = await this.getExperimentDetails(experimentId);
    if (!currentDetails.success) {
      return currentDetails;
    }

    // Update with active status
    const updatedConfig = {
      ...currentDetails.data,
      status: 'active'
    };

    return this.updateExperiment(experimentId, updatedConfig);
  }

  /**
   * Stop experiment
   */
  async stopExperiment(experimentId: string): Promise<MCPResponse> {
    // Get current experiment details first
    const currentDetails = await this.getExperimentDetails(experimentId);
    if (!currentDetails.success) {
      return currentDetails;
    }

    // Update with stopped status
    const updatedConfig = {
      ...currentDetails.data,
      status: 'experiment_stopped'
    };

    return this.updateExperiment(experimentId, updatedConfig);
  }

  /**
   * List all experiments
   */
  async listExperiments(): Promise<MCPResponse> {
    return this.callMCPTool('mcp_statsig-local_Get_List_of_Experiments', {});
  }

  /**
   * Get experiment results
   */
  async getExperimentResults(experimentId: string, controlGroup: string, testGroup: string): Promise<MCPResponse> {
    return this.callMCPTool('mcp_statsig-local_Get_Experiment_Results', {
      path_id: experimentId,
      query_control: controlGroup,
      query_test: testGroup
    });
  }
}

/**
 * Create MCP client instance
 */
export function createMCPClient(): MCPClient {
  return new MCPClient();
}

/**
 * Global MCP client instance
 */
export const mcpClient = createMCPClient();

/**
 * MCP Client Wrapper for Statsig API Operations
 * Provides typed interface for MCP Statsig tools
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import fetch from 'node-fetch';

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
      
      console.log(`🔧 Calling Statsig API: ${toolName}`, { params });
      
      // Map MCP tool names to Statsig Console API endpoints
      const endpoint = this.mapToolToEndpoint(toolName, params);
      const method = this.getHttpMethod(toolName);
      
      // Prepare request body for POST requests
      let requestBody;
      if (method !== 'GET') {
        if (params['application/json']) {
          requestBody = JSON.stringify(params['application/json']);
        } else {
          requestBody = JSON.stringify(params);
        }
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'STATSIG-API-KEY': authToken,
          'Content-Type': 'application/json'
        },
        body: requestBody
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Statsig API error: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log(`📊 Statsig API response:`, JSON.stringify(data, null, 2));
      
      return {
        success: true,
        data
      };
    } catch (error) {
      console.error(`❌ Statsig API call failed: ${toolName}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Map MCP tool names to Statsig Console API endpoints
   */
  private mapToolToEndpoint(toolName: string, params: any): string {
    const baseUrl = 'https://statsigapi.net/console/v1';
    
    switch (toolName) {
      case 'mcp_statsig-local_Create_Experiment':
        return `${baseUrl}/experiments`;
      
      case 'mcp_statsig-local_Get_Experiment_Details_by_ID':
        return `${baseUrl}/experiments/${params.path_id}`;
      
      case 'mcp_statsig-local_Update_Experiment_Entirely':
        return `${baseUrl}/experiments/${params.path_id}`;
      
      case 'mcp_statsig-local_Get_List_of_Experiments':
        return `${baseUrl}/experiments`;
      
      case 'mcp_statsig-local_Get_Experiment_Results':
        return `${baseUrl}/experiments/${params.path_id}/results`;
      
      case 'mcp_statsig-local_Create_Gate':
        return `${baseUrl}/gates`;
      
      case 'mcp_statsig-local_Get_Gate_Details_by_ID':
        return `${baseUrl}/gates/${params.path_id}`;
      
      case 'mcp_statsig-local_Update_Gate_Entirely':
        return `${baseUrl}/gates/${params.path_id}`;
      
      case 'mcp_statsig-local_Get_List_of_Gates':
        return `${baseUrl}/gates`;
      
      case 'mcp_statsig-local_Get_Gate_Results':
        return `${baseUrl}/gates/${params.path_id}/results`;
      
      case 'mcp_statsig-local_Create_Dynamic_Config':
        return `${baseUrl}/dynamic_configs`;
      
      case 'mcp_statsig-local_Get_Dynamic_Config_Details_by_ID':
        return `${baseUrl}/dynamic_configs/${params.path_id}`;
      
      case 'mcp_statsig-local_Update_Dynamic_Config_Entirely':
        return `${baseUrl}/dynamic_configs/${params.path_id}`;
      
      case 'mcp_statsig-local_Get_List_of_Dynamic_Configs':
        return `${baseUrl}/dynamic_configs`;
      
      default:
        throw new Error(`Unknown MCP tool: ${toolName}`);
    }
  }

  /**
   * Get HTTP method for MCP tool
   */
  private getHttpMethod(toolName: string): string {
    if (toolName.includes('Get_') || toolName.includes('Get_List_of_') || toolName.includes('Get_Experiment_Results') || toolName.includes('Get_Gate_Results')) {
      return 'GET';
    }
    return 'POST';
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

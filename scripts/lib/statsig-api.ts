/**
 * Statsig MCP Wrapper
 * Provides a clean interface for Statsig Console API operations
 */

import type { ExperimentContract, TargetingRule, PrimaryMetric } from './contract-schema.js';
import { mcpClient, type MCPResponse } from './mcp-client.js';

/**
 * Statsig experiment configuration
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
 * Statsig API wrapper for MCP tools
 */
export class StatsigAPI {
  /**
   * Create experiment from contract
   */
  async createExperiment(contract: ExperimentContract): Promise<string> {
    try {
      const config = this.buildExperimentConfig(contract);
      
      // Use MCP client to create experiment
      const result = await mcpClient.createExperiment(config);

      if (result.success && result.data?.id) {
        console.log(`✅ Created experiment: ${config.name} (ID: ${result.data.id})`);
        return result.data.id;
      } else {
        throw new Error(`Failed to create experiment: ${result.error || 'No ID returned'}`);
      }
    } catch (error) {
      console.error('❌ Failed to create experiment:', error);
      throw error;
    }
  }

  /**
   * Update experiment with targeting rules
   */
  async updateExperimentTargeting(
    experimentId: string,
    contract: ExperimentContract
  ): Promise<void> {
    try {
      const targetingConfig = this.buildTargetingConfig(contract);
      
      const result = await mcpClient.updateExperiment(experimentId, targetingConfig);

      if (result.success) {
        console.log(`✅ Updated experiment targeting: ${experimentId}`);
      } else {
        throw new Error(`Failed to update experiment targeting: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Failed to update experiment targeting:', error);
      throw error;
    }
  }

  /**
   * Start experiment
   */
  async startExperiment(experimentId: string): Promise<void> {
    try {
      const result = await mcpClient.startExperiment(experimentId);

      if (result.success) {
        console.log(`✅ Started experiment: ${experimentId}`);
      } else {
        throw new Error(`Failed to start experiment: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Failed to start experiment:', error);
      throw error;
    }
  }

  /**
   * Stop experiment
   */
  async stopExperiment(experimentId: string): Promise<void> {
    try {
      const result = await mcpClient.stopExperiment(experimentId);

      if (result.success) {
        console.log(`✅ Stopped experiment: ${experimentId}`);
      } else {
        throw new Error(`Failed to stop experiment: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Failed to stop experiment:', error);
      throw error;
    }
  }

  /**
   * Get experiment status
   */
  async getExperimentStatus(experimentId: string): Promise<string> {
    try {
      const result = await mcpClient.getExperimentDetails(experimentId);

      if (result.success && result.data) {
        return result.data.status || 'unknown';
      } else {
        throw new Error(`Failed to get experiment status: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Failed to get experiment status:', error);
      throw error;
    }
  }

  /**
   * Build experiment configuration from contract
   */
  private buildExperimentConfig(contract: ExperimentContract): StatsigExperimentConfig {
    const variants = Object.entries(contract.variants);
    const totalPercentage = variants.reduce((sum, [, variant]) => sum + variant.passPercentage, 0);
    
    // Normalize percentages if they don't add up to 100
    const normalizedVariants = variants.map(([name, variant]) => ({
      name: variant.name,
      id: name,
      size: Math.round((variant.passPercentage / totalPercentage) * 100),
      parameterValues: variant.parameters,
      description: variant.description,
    }));

    return {
      id: contract.experimentKey,
      name: contract.name,
      description: contract.description || `Experiment: ${contract.experimentKey}`,
      hypothesis: contract.hypothesis || 'Testing new feature',
      groups: normalizedVariants,
      primaryMetrics: [],
      secondaryMetrics: [],
      idType: this.mapIdType(contract.statsig.idType),
      targetingGateID: contract.statsig.targetingGateID,
      tags: ['★ Core'],
    };
  }

  /**
   * Build targeting configuration from contract
   */
  private buildTargetingConfig(contract: ExperimentContract) {
    // Convert targeting rules to Statsig format
    const rules = contract.targetingRules.map(rule => ({
      name: rule.name,
      passPercentage: rule.passPercentage,
      conditions: rule.conditions.map(condition => ({
        type: this.mapConditionType(condition.type),
        operator: condition.operator,
        targetValue: condition.targetValue,
        field: condition.field,
      })),
      returnValue: {},
      environments: rule.environments || ['development'],
    }));

    return {
      description: contract.description || `Experiment: ${contract.experimentKey}`,
      idType: this.mapIdType(contract.statsig.idType),
      hypothesis: contract.hypothesis || 'Testing new feature',
      groups: Object.entries(contract.variants).map(([name, variant]) => ({
        name: variant.name,
        size: variant.passPercentage,
        parameterValues: variant.parameters,
      })),
      allocation: contract.allocation,
      targetingGateID: contract.statsig.targetingGateID || null,
      bonferroniCorrection: false,
      defaultConfidenceInterval: '95',
      status: 'setup',
    };
  }

  /**
   * Map condition types to Statsig format
   */
  private mapConditionType(type: string): string {
    const mapping: Record<string, string> = {
      branch: 'custom_field',
      url: 'url',
      user_id: 'user_id',
      custom_field: 'custom_field',
      environment: 'environment_tier',
    };
    return mapping[type] || 'custom_field';
  }

  /**
   * Map idType to Statsig Console API format
   */
  private mapIdType(idType: string): string {
    const mapping: Record<string, string> = {
      'user_id': 'userID',
      'stable_id': 'stableID',
      'userID': 'userID',
      'stableID': 'stableID'
    };
    return mapping[idType] || 'userID';
  }

}

/**
 * Create Statsig API instance
 */
export function createStatsigAPI(): StatsigAPI {
  return new StatsigAPI();
}

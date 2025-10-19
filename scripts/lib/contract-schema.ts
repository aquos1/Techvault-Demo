/**
 * Contract Schema for Experiment Configuration
 * Defines the structure and validation for experiment contracts
 */

import { z } from 'zod';

/**
 * Schema for individual variant configuration
 */
export const VariantSchema = z.object({
  name: z.string().min(1, 'Variant name is required'),
  description: z.string().optional(),
  parameters: z.record(z.string(), z.any()).default({}),
  passPercentage: z.number().min(0).max(100).default(50),
});

/**
 * Schema for code change instructions
 */
export const CodeChangeSchema = z.object({
  file: z.string().min(1, 'File path is required'),
  function: z.string().min(1, 'Function/component name is required'),
  wrapWith: z.enum(['getExperiment', 'getExperimentParams']).default('getExperiment'),
  parameterUsage: z.string().min(1, 'Parameter usage is required'),
  insertionPoint: z.enum(['before', 'after', 'replace']).default('before'),
  customCode: z.string().optional(),
});

/**
 * Schema for targeting conditions
 */
export const TargetingConditionSchema = z.object({
  type: z.enum(['branch', 'url', 'user_id', 'custom_field', 'environment']),
  field: z.string().optional(),
  operator: z.enum(['equals', 'contains', 'starts_with', 'ends_with', 'in', 'not_in']).default('equals'),
  targetValue: z.union([z.string(), z.array(z.string()), z.number()]),
});

/**
 * Schema for targeting rules
 */
export const TargetingRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  conditions: z.array(TargetingConditionSchema).min(1, 'At least one condition is required'),
  passPercentage: z.number().min(0).max(100).default(100),
  environments: z.array(z.string()).optional(),
});

/**
 * Schema for primary metrics
 */
export const PrimaryMetricSchema = z.object({
  name: z.string().min(1, 'Metric name is required'),
  type: z.enum(['count', 'ratio', 'revenue', 'duration']).default('count'),
  direction: z.enum(['increase', 'decrease']).default('increase'),
  hypothesizedValue: z.number().optional(),
});

/**
 * Main Contract Schema
 */
export const ExperimentContractSchema = z.object({
  // Basic experiment info
  experimentKey: z.string().min(1, 'Experiment key is required'),
  name: z.string().min(1, 'Experiment name is required'),
  description: z.string().optional(),
  hypothesis: z.string().optional(),
  
  // Experiment configuration
  variants: z.record(z.string(), VariantSchema).refine(
    (variants) => Object.keys(variants).length >= 2,
    'At least 2 variants are required (control and treatment)'
  ),
  
  // Code changes to implement
  codeChanges: z.array(CodeChangeSchema).min(1, 'At least one code change is required'),
  
  // Targeting and rollout
  targetingRules: z.array(TargetingRuleSchema).default([]),
  allocation: z.number().min(0).max(100).default(100),
  
  // Metrics
  primaryMetrics: z.array(PrimaryMetricSchema).default([]),
  secondaryMetrics: z.array(PrimaryMetricSchema).default([]),
  
  // Branch configuration (CRITICAL for branch-based experiments)
  branchConfig: z.object({
    branchName: z.string().regex(/^exp\/[a-z0-9_-]+$/i, 'Branch name must match exp/<key> pattern'),
    targetBranch: z.string().default('main'),
    createFromBranch: z.string().default('main'),
  }),
  
  // Deployment configuration
  deployment: z.object({
    platform: z.enum(['vercel', 'netlify', 'other']).default('vercel'),
    previewDomain: z.string().optional(),
    waitForDeployment: z.boolean().default(true),
    deploymentTimeout: z.number().default(300000), // 5 minutes
  }),
  
  // Statsig configuration
  statsig: z.object({
    idType: z.enum(['user_id', 'unit_id']).default('user_id'),
    environment: z.enum(['development', 'staging', 'production']).default('development'),
    autoStart: z.boolean().default(false),
    targetingGateID: z.string().optional(),
  }),
  
  // Metadata
  metadata: z.object({
    author: z.string().optional(),
    tags: z.array(z.string()).default([]),
    estimatedDuration: z.string().optional(),
    successCriteria: z.string().optional(),
  }).default(() => ({ tags: [] })),
});

/**
 * Type definitions derived from schemas
 */
export type Variant = z.infer<typeof VariantSchema>;
export type CodeChange = z.infer<typeof CodeChangeSchema>;
export type TargetingCondition = z.infer<typeof TargetingConditionSchema>;
export type TargetingRule = z.infer<typeof TargetingRuleSchema>;
export type PrimaryMetric = z.infer<typeof PrimaryMetricSchema>;
export type ExperimentContract = z.infer<typeof ExperimentContractSchema>;

/**
 * Validate experiment contract
 */
export function validateContract(contract: unknown): ExperimentContract {
  try {
    return ExperimentContractSchema.parse(contract);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.issues.map((err: any) => 
        `${err.path.join('.')}: ${err.message}`
      ).join('\n');
      throw new Error(`Contract validation failed:\n${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Create default contract template
 */
export function createDefaultContract(experimentKey: string): Partial<ExperimentContract> {
  return {
    experimentKey,
    name: `Experiment: ${experimentKey}`,
    description: 'Experiment description goes here',
    hypothesis: 'What we expect to happen',
    variants: {
      control: {
        name: 'Control',
        description: 'Baseline experience',
        parameters: {},
        passPercentage: 50,
      },
      treatment: {
        name: 'Treatment',
        description: 'New experience',
        parameters: {},
        passPercentage: 50,
      },
    },
    codeChanges: [],
    targetingRules: [
      {
        name: 'Branch-based targeting',
        conditions: [
          {
            type: 'branch',
            operator: 'equals',
            targetValue: `exp/${experimentKey}`,
          },
        ],
        passPercentage: 100,
        environments: ['development'],
      },
    ],
    branchConfig: {
      branchName: `exp/${experimentKey}`,
      targetBranch: 'main',
      createFromBranch: 'main',
    },
    deployment: {
      platform: 'vercel',
      waitForDeployment: true,
      deploymentTimeout: 300000,
    },
    statsig: {
      idType: 'user_id',
      environment: 'development',
      autoStart: false,
    },
    metadata: {
      tags: ['automated', 'branch-based'],
    },
  };
}

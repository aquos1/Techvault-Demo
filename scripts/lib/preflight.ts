/**
 * Preflight Validation System
 * Comprehensive validation before experiment deployment and activation
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';
import { validateContract, type ExperimentContract } from './contract-schema.js';
import { mcpClient } from './mcp-client.js';
import { validateEnvironment } from './env-validator.js';

/**
 * Preflight validation result
 */
export interface PreflightResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    contract: boolean;
    environment: boolean;
    codeChanges: boolean;
    statsigConnectivity: boolean;
    branchState: boolean;
    deployment: boolean;
  };
}

/**
 * Preflight validator class
 */
export class PreflightValidator {
  private projectRoot: string;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Run complete preflight validation
   */
  async validateExperiment(experimentKey: string): Promise<PreflightResult> {
    const result: PreflightResult = {
      success: true,
      errors: [],
      warnings: [],
      checks: {
        contract: false,
        environment: false,
        codeChanges: false,
        statsigConnectivity: false,
        branchState: false,
        deployment: false,
      },
    };

    console.log(`🔍 Running preflight checks for experiment: ${experimentKey}\n`);

    // 1. Contract validation
    await this.validateContract(experimentKey, result);

    // 2. Environment validation
    await this.validateEnvironment(result);

    // 3. Code changes validation
    await this.validateCodeChanges(experimentKey, result);

    // 4. Statsig connectivity
    await this.validateStatsigConnectivity(result);

    // 5. Branch state validation
    await this.validateBranchState(experimentKey, result);

    // 6. Deployment readiness
    await this.validateDeploymentReadiness(result);

    // Determine overall success
    result.success = result.errors.length === 0;

    return result;
  }

  /**
   * Validate experiment contract
   */
  private async validateContract(experimentKey: string, result: PreflightResult): Promise<void> {
    console.log('📋 Validating experiment contract...');

    try {
      const contractPath = join(this.projectRoot, 'contract', `${experimentKey}.json`);
      
      if (!existsSync(contractPath)) {
        result.errors.push(`Contract file not found: contract/${experimentKey}.json`);
        return;
      }

      const contractContent = readFileSync(contractPath, 'utf-8');
      const contractData = JSON.parse(contractContent);
      
      // Validate contract schema
      const validatedContract = validateContract(contractData);
      
      // Additional contract checks
      if (!validatedContract.variants || Object.keys(validatedContract.variants).length < 2) {
        result.errors.push('Contract must have at least 2 variants');
      }

      if (!validatedContract.codeChanges || validatedContract.codeChanges.length === 0) {
        result.errors.push('Contract must specify code changes to implement');
      }

      if (result.errors.length === 0) {
        result.checks.contract = true;
        console.log('✅ Contract validation passed');
      }
    } catch (error) {
      result.errors.push(`Contract validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate environment configuration
   */
  private async validateEnvironment(result: PreflightResult): Promise<void> {
    console.log('🔧 Validating environment configuration...');

    try {
      const envResult = validateEnvironment();
      
      if (!envResult.success) {
        result.errors.push(...envResult.errors);
      }
      
      if (envResult.warnings.length > 0) {
        result.warnings.push(...envResult.warnings);
      }

      if (envResult.success) {
        result.checks.environment = true;
        console.log('✅ Environment validation passed');
      }
    } catch (error) {
      result.errors.push(`Environment validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate code changes
   */
  private async validateCodeChanges(experimentKey: string, result: PreflightResult): Promise<void> {
    console.log('💻 Validating code changes...');

    try {
      const contractPath = join(this.projectRoot, 'contract', `${experimentKey}.json`);
      const contractContent = readFileSync(contractPath, 'utf-8');
      const contractData = JSON.parse(contractContent);
      const contract = validateContract(contractData);

      // Check if target files exist
      for (const codeChange of contract.codeChanges) {
        const filePath = join(this.projectRoot, codeChange.file);
        
        if (!existsSync(filePath)) {
          result.errors.push(`Target file not found: ${codeChange.file}`);
          continue;
        }

        // Check if function/component exists in file
        const fileContent = readFileSync(filePath, 'utf-8');
        const functionPatterns = [
          `function ${codeChange.function}(`,
          `const ${codeChange.function} = (`,
          `const ${codeChange.function} = function`,
          `export function ${codeChange.function}(`,
          `export const ${codeChange.function} = (`,
          `export default function ${codeChange.function}(`,
          `export default const ${codeChange.function} = (`,
        ];

        const functionExists = functionPatterns.some(pattern => 
          fileContent.includes(pattern)
        );

        if (!functionExists) {
          result.errors.push(`Function/component '${codeChange.function}' not found in ${codeChange.file}`);
        }
      }

      if (result.errors.length === 0) {
        result.checks.codeChanges = true;
        console.log('✅ Code changes validation passed');
      }
    } catch (error) {
      result.errors.push(`Code changes validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate Statsig connectivity
   */
  private async validateStatsigConnectivity(result: PreflightResult): Promise<void> {
    console.log('🔗 Testing Statsig connectivity...');

    try {
      // Test MCP client connectivity
      const testResult = await mcpClient.listExperiments();
      
      if (testResult.success) {
        result.checks.statsigConnectivity = true;
        console.log('✅ Statsig connectivity test passed');
      } else {
        result.errors.push(`Statsig connectivity failed: ${testResult.error}`);
      }
    } catch (error) {
      result.errors.push(`Statsig connectivity test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate branch state
   */
  private async validateBranchState(experimentKey: string, result: PreflightResult): Promise<void> {
    console.log('🌿 Validating branch state...');

    try {
      const branchName = `exp/${experimentKey}`;
      
      // Check if we're on the correct branch
      const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
      
      if (currentBranch !== branchName) {
        result.warnings.push(`Not on experiment branch. Current: ${currentBranch}, Expected: ${branchName}`);
      }

      // Check if branch has uncommitted changes
      const status = execSync('git status --porcelain', { encoding: 'utf8' }).trim();
      if (status) {
        result.warnings.push('Branch has uncommitted changes');
      }

      // Check if branch is up to date with remote
      try {
        execSync('git fetch origin', { stdio: 'pipe' });
        const localCommit = execSync(`git rev-parse ${branchName}`, { encoding: 'utf8' }).trim();
        const remoteCommit = execSync(`git rev-parse origin/${branchName}`, { encoding: 'utf8' }).trim();
        
        if (localCommit !== remoteCommit) {
          result.warnings.push('Branch is not up to date with remote');
        }
      } catch {
        result.warnings.push('Could not check remote branch status');
      }

      result.checks.branchState = true;
      console.log('✅ Branch state validation passed');
    } catch (error) {
      result.errors.push(`Branch state validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate deployment readiness
   */
  private async validateDeploymentReadiness(result: PreflightResult): Promise<void> {
    console.log('🚀 Validating deployment readiness...');

    try {
      // Check if build succeeds
      console.log('  - Testing build...');
      execSync('npm run build', { 
        cwd: this.projectRoot,
        stdio: 'pipe',
        timeout: 60000 // 1 minute timeout
      });

      // Check if linting passes
      console.log('  - Testing linting...');
      execSync('npm run lint', { 
        cwd: this.projectRoot,
        stdio: 'pipe',
        timeout: 30000 // 30 second timeout
      });

      result.checks.deployment = true;
      console.log('✅ Deployment readiness validation passed');
    } catch (error) {
      result.errors.push(`Deployment readiness failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Print preflight results
   */
  printResults(result: PreflightResult): void {
    console.log('\n📊 Preflight Validation Results\n');

    // Print check status
    const checks = result.checks;
    console.log('Check Status:');
    console.log(`  📋 Contract: ${checks.contract ? '✅' : '❌'}`);
    console.log(`  🔧 Environment: ${checks.environment ? '✅' : '❌'}`);
    console.log(`  💻 Code Changes: ${checks.codeChanges ? '✅' : '❌'}`);
    console.log(`  🔗 Statsig Connectivity: ${checks.statsigConnectivity ? '✅' : '❌'}`);
    console.log(`  🌿 Branch State: ${checks.branchState ? '✅' : '❌'}`);
    console.log(`  🚀 Deployment: ${checks.deployment ? '✅' : '❌'}`);

    // Print errors
    if (result.errors.length > 0) {
      console.log('\n❌ Errors:');
      result.errors.forEach(error => console.log(`  - ${error}`));
    }

    // Print warnings
    if (result.warnings.length > 0) {
      console.log('\n⚠️  Warnings:');
      result.warnings.forEach(warning => console.log(`  - ${warning}`));
    }

    // Print overall status
    console.log(`\n🎯 Overall Status: ${result.success ? 'READY FOR DEPLOYMENT' : 'NOT READY'}`);
    
    if (result.success) {
      console.log('✅ All preflight checks passed! Experiment is ready to deploy.');
    } else {
      console.log('❌ Preflight checks failed. Please fix the errors above before deploying.');
    }
  }
}

/**
 * Main preflight function
 */
export async function runPreflight(experimentKey: string): Promise<PreflightResult> {
  const validator = new PreflightValidator();
  const result = await validator.validateExperiment(experimentKey);
  validator.printResults(result);
  return result;
}

/**
 * CLI entry point
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const experimentKey = args[0];

  if (!experimentKey) {
    console.error('❌ Experiment key is required');
    console.log('Usage: npm run experiment:preflight <experiment-key>');
    process.exit(1);
  }

  try {
    const result = await runPreflight(experimentKey);
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Preflight validation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

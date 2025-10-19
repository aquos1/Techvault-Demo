#!/usr/bin/env tsx

/**
 * Main Experiment Orchestration Script
 * Automates the full workflow from contract to live experiment
 */

import { readFileSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { execSync } from 'child_process';
import { validateContract, createDefaultContract, type ExperimentContract } from './lib/contract-schema.js';
import { CodeGenerator } from './lib/code-generator.js';
import { StatsigAPI } from './lib/statsig-api.js';
import { getVercelClient } from './lib/vercel-client.js';
import { getGitHubClient } from './lib/github-client.js';

/**
 * Main experiment runner
 */
class ExperimentRunner {
  private projectRoot: string;
  private statsigAPI: StatsigAPI;
  private codeGenerator: CodeGenerator;

  constructor() {
    this.projectRoot = resolve(process.cwd());
    this.statsigAPI = new StatsigAPI();
    this.codeGenerator = new CodeGenerator(this.projectRoot);
  }

  /**
   * Run complete experiment workflow
   */
  async runExperiment(experimentKey: string, contractPath?: string): Promise<void> {
    console.log(`🚀 Starting experiment workflow for: ${experimentKey}`);
    
    try {
      // Step 1: Load and validate contract
      const contract = await this.loadContract(experimentKey, contractPath);
      console.log(`✅ Loaded contract for experiment: ${contract.experimentKey}`);

      // Step 2: Create experiment branch
      const branchName = contract.branchConfig.branchName;
      await this.createExperimentBranch(branchName, contract.branchConfig.createFromBranch);
      console.log(`✅ Created and checked out branch: ${branchName}`);

      // Step 3: Apply code changes
      const codeResults = await this.codeGenerator.applyCodeChanges(contract);
      const failedChanges = codeResults.filter(result => !result.success);
      
      if (failedChanges.length > 0) {
        console.error('❌ Some code changes failed:');
        failedChanges.forEach(result => {
          console.error(`  - ${result.file}: ${result.errors.join(', ')}`);
        });
        throw new Error('Code changes failed');
      }
      console.log(`✅ Applied ${codeResults.length} code changes`);

      // Step 4: Commit and push changes
      await this.commitAndPushChanges(contract);
      console.log(`✅ Committed and pushed changes to branch: ${branchName}`);

      // Step 5: Wait for deployment (if enabled)
      let previewUrl = '';
      if (contract.deployment.waitForDeployment) {
        previewUrl = await this.waitForDeployment(branchName, contract);
        console.log(`✅ Deployment ready at: ${previewUrl}`);
      } else {
        // Fallback URL for when deployment is disabled
        previewUrl = `https://${branchName.replace(/[^a-z0-9-]/gi, '-')}-dh25-demo-site.vercel.app`;
        console.log(`⚠️  Using fallback URL: ${previewUrl}`);
      }

      // Step 6: Create experiment in Statsig
      const experimentId = await this.statsigAPI.createExperiment(contract);
      console.log(`✅ Created experiment in Statsig: ${experimentId}`);

      // Step 7: Configure targeting rules
      await this.statsigAPI.updateExperimentTargeting(experimentId, contract);
      console.log(`✅ Configured targeting rules for experiment: ${experimentId}`);

      // Step 8: Create Pull Request (DISABLED FOR TESTING)
      console.log(`⏭️  Skipping PR creation (disabled for testing)`);
      // const prResult = await this.createPullRequest(experimentKey, branchName, previewUrl, contract);
      // if (prResult.success) {
      //   console.log(`✅ Created PR #${prResult.pr?.number}: ${prResult.pr?.html_url}`);
      // } else {
      //   console.log(`⚠️  Failed to create PR: ${prResult.error}`);
      // }

      // Step 9: Start experiment (if auto-start enabled)
      if (contract.statsig.autoStart) {
        await this.statsigAPI.startExperiment(experimentId);
        console.log(`✅ Started experiment: ${experimentId}`);
      } else {
        console.log(`⏸️  Experiment created but not started. Use 'npm run experiment:start ${experimentKey}' to start it.`);
      }

      console.log(`🎉 Experiment workflow completed successfully!`);
      console.log(`📊 Experiment ID: ${experimentId}`);
      console.log(`🌿 Branch: ${branchName}`);
      console.log(`🔗 Preview URL: ${previewUrl}`);
      console.log(`\n✨ Check your Statsig console to see the experiment: https://console.statsig.com/experiments`);

    } catch (error) {
      console.error('❌ Experiment workflow failed:', error);
      process.exit(1);
    }
  }

  /**
   * Load and validate experiment contract
   */
  private async loadContract(experimentKey: string, contractPath?: string): Promise<ExperimentContract> {
    const contractFile = contractPath || join(this.projectRoot, 'contract', `${experimentKey}.json`);
    
    if (!existsSync(contractFile)) {
      console.log(`📝 Contract file not found. Creating default contract: ${contractFile}`);
      const defaultContract = createDefaultContract(experimentKey);
      
      // Write default contract to file
      const fs = await import('fs');
      fs.writeFileSync(contractFile, JSON.stringify(defaultContract, null, 2));
      console.log(`✅ Created default contract: ${contractFile}`);
    }

    const contractContent = readFileSync(contractFile, 'utf-8');
    const contractData = JSON.parse(contractContent);
    
    // Validate contract
    return validateContract(contractData);
  }

  /**
   * Create and checkout experiment branch
   */
  private async createExperimentBranch(branchName: string, fromBranch: string): Promise<void> {
    try {
      // Check if branch already exists
      const branchExists = this.gitBranchExists(branchName);
      
      if (branchExists) {
        console.log(`⚠️  Branch ${branchName} already exists. Checking it out...`);
        execSync(`git checkout ${branchName}`, { stdio: 'inherit' });
      } else {
        console.log(`🌿 Creating new branch: ${branchName} from ${fromBranch}`);
        
        // Ensure we're on the base branch
        execSync(`git checkout ${fromBranch}`, { stdio: 'inherit' });
        execSync(`git pull origin ${fromBranch}`, { stdio: 'inherit' });
        
        // Create and checkout new branch
        execSync(`git checkout -b ${branchName}`, { stdio: 'inherit' });
      }
    } catch (error) {
      throw new Error(`Failed to create/checkout branch: ${error}`);
    }
  }

  /**
   * Commit and push changes
   */
  private async commitAndPushChanges(contract: ExperimentContract): Promise<void> {
    try {
      // Add all changes
      execSync('git add .', { stdio: 'inherit' });
      
      // Commit with descriptive message
      const commitMessage = `feat(experiment): implement ${contract.experimentKey}

${contract.description || 'Experiment implementation'}

- Experiment: ${contract.name}
- Branch: ${contract.branchConfig.branchName}
- Variants: ${Object.keys(contract.variants).join(', ')}
- Files modified: ${contract.codeChanges.map(c => c.file).join(', ')}`;
      
      execSync(`git commit -m "${commitMessage}"`, { stdio: 'inherit' });
      
      // Push branch
      execSync(`git push -u origin ${contract.branchConfig.branchName}`, { stdio: 'inherit' });
      
    } catch (error) {
      throw new Error(`Failed to commit/push changes: ${error}`);
    }
  }

  /**
   * Wait for Vercel deployment
   */
  private async waitForDeployment(branchName: string, contract: ExperimentContract): Promise<string> {
    console.log(`⏳ Waiting for Vercel deployment...`);
    
    try {
      const vercelClient = getVercelClient();
      const result = await vercelClient.waitForDeployment(branchName, this.projectRoot);
      
      if (result.success && result.url) {
        console.log(`✅ Deployment ready at: ${result.url}`);
        return result.url;
      } else {
        throw new Error(`Deployment failed: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Vercel deployment failed:', error);
      // Fallback to mock URL for development
      const fallbackUrl = `https://${branchName.replace(/[^a-z0-9-]/gi, '-')}-dh25-demo-site.vercel.app`;
      console.log(`⚠️  Using fallback URL: ${fallbackUrl}`);
      return fallbackUrl;
    }
  }

  /**
   * Create Pull Request
   */
  private async createPullRequest(
    experimentKey: string,
    branchName: string,
    deploymentUrl: string,
    contract: ExperimentContract
  ): Promise<{ success: boolean; pr?: { number: number; html_url: string }; error?: string }> {
    try {
      console.log(`🔀 Creating Pull Request for experiment: ${experimentKey}`);
      
      const githubClient = getGitHubClient();
      const result = await githubClient.createExperimentPR(
        experimentKey,
        branchName,
        deploymentUrl,
        contract
      );

      return result;
    } catch (error) {
      console.error('❌ Failed to create PR:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Check if git branch exists
   */
  private gitBranchExists(branchName: string): boolean {
    try {
      execSync(`git rev-parse --verify ${branchName}`, { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * CLI interface
 */
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
Usage: npm run experiment:create <experiment-key> [contract-path]

Examples:
  npm run experiment:create prime_banner
  npm run experiment:create button_color apps/contracts/button_test.json

This will:
1. Load/validate the experiment contract
2. Create a new branch (exp/<experiment-key>)
3. Apply code changes based on contract
4. Commit and push changes
5. Wait for Vercel deployment
6. Create experiment in Statsig
7. Configure targeting rules
8. Start experiment (if auto-start enabled)
`);
    process.exit(1);
  }

  const experimentKey = args[0];
  const contractPath = args[1];

  const runner = new ExperimentRunner();
  await runner.runExperiment(experimentKey, contractPath);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ExperimentRunner };

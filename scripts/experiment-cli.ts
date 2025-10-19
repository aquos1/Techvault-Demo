#!/usr/bin/env tsx

/**
 * Experiment CLI Interface
 * User-friendly command-line interface for experiment management
 */

import { ExperimentRunner } from './run-experiment.js';
import { StatsigAPI } from './lib/statsig-api.js';
import { runPreflight } from './lib/preflight.js';

/**
 * CLI command handler
 */
class ExperimentCLI {
  private runner: ExperimentRunner;
  private statsigAPI: StatsigAPI;

  constructor() {
    this.runner = new ExperimentRunner();
    this.statsigAPI = new StatsigAPI();
  }

  /**
   * Main CLI entry point
   */
  async run(args: string[]): Promise<void> {
    const command = args[0];
    const experimentKey = args[1];

    if (!command) {
      this.showHelp();
      return;
    }

    if (!experimentKey && command !== 'list') {
      console.error('❌ Experiment key is required');
      this.showHelp();
      process.exit(1);
    }

    try {
      switch (command) {
        case 'create':
          await this.runner.runExperiment(experimentKey, args[2]);
          break;
          
        case 'verify':
          await this.verifyExperiment(experimentKey);
          break;
          
        case 'status':
          await this.showExperimentStatus(experimentKey);
          break;
          
        case 'start':
          await this.startExperiment(experimentKey);
          break;
          
        case 'stop':
          await this.stopExperiment(experimentKey);
          break;
          
        case 'preflight':
          await this.runPreflight(experimentKey);
          break;
          
        case 'list':
          await this.listExperiments();
          break;
          
        case 'help':
        case '--help':
        case '-h':
          this.showHelp();
          break;
          
        default:
          console.error(`❌ Unknown command: ${command}`);
          this.showHelp();
          process.exit(1);
      }
    } catch (error) {
      console.error(`❌ Command failed: ${error}`);
      process.exit(1);
    }
  }

  /**
   * Verify experiment setup
   */
  private async verifyExperiment(experimentKey: string): Promise<void> {
    console.log(`🔍 Verifying experiment setup for: ${experimentKey}`);
    
    try {
      // Check if contract exists
      const contractPath = `contract/${experimentKey}.json`;
      const fs = await import('fs');
      
      if (!fs.existsSync(contractPath)) {
        throw new Error(`Contract file not found: ${contractPath}`);
      }
      console.log(`✅ Contract file found: ${contractPath}`);

      // Check if branch exists
      const branchName = `exp/${experimentKey}`;
      const { execSync } = await import('child_process');
      
      try {
        execSync(`git rev-parse --verify ${branchName}`, { stdio: 'pipe' });
        console.log(`✅ Branch exists: ${branchName}`);
      } catch {
        console.log(`⚠️  Branch not found: ${branchName}`);
      }

      // Check if experiment exists in Statsig
      try {
        const status = await this.statsigAPI.getExperimentStatus(experimentKey);
        console.log(`✅ Experiment exists in Statsig: ${experimentKey} (Status: ${status})`);
      } catch {
        console.log(`⚠️  Experiment not found in Statsig: ${experimentKey}`);
      }

      console.log(`✅ Verification completed for: ${experimentKey}`);
      
    } catch (error) {
      console.error(`❌ Verification failed: ${error}`);
      throw error;
    }
  }

  /**
   * Show experiment status
   */
  private async showExperimentStatus(experimentKey: string): Promise<void> {
    console.log(`📊 Experiment status for: ${experimentKey}`);
    
    try {
      const status = await this.statsigAPI.getExperimentStatus(experimentKey);
      
      console.log(`\n📈 Statsig Status: ${status}`);
      
      // Show branch status
      const branchName = `exp/${experimentKey}`;
      const { execSync } = await import('child_process');
      
      try {
        const branchCommit = execSync(`git rev-parse ${branchName}`, { encoding: 'utf8' }).trim();
        const lastCommit = execSync(`git log -1 --pretty=format:"%h - %s" ${branchName}`, { encoding: 'utf8' }).trim();
        
        console.log(`🌿 Branch: ${branchName}`);
        console.log(`📝 Last commit: ${lastCommit}`);
        console.log(`🔗 Commit hash: ${branchCommit}`);
      } catch {
        console.log(`⚠️  Branch not found: ${branchName}`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to get experiment status: ${error}`);
      throw error;
    }
  }

  /**
   * Start experiment
   */
  private async startExperiment(experimentKey: string): Promise<void> {
    console.log(`▶️  Starting experiment: ${experimentKey}`);
    
    try {
      await this.statsigAPI.startExperiment(experimentKey);
      console.log(`✅ Experiment started: ${experimentKey}`);
    } catch (error) {
      console.error(`❌ Failed to start experiment: ${error}`);
      throw error;
    }
  }

  /**
   * Stop experiment
   */
  private async stopExperiment(experimentKey: string): Promise<void> {
    console.log(`⏹️  Stopping experiment: ${experimentKey}`);
    
    try {
      await this.statsigAPI.stopExperiment(experimentKey);
      console.log(`✅ Experiment stopped: ${experimentKey}`);
    } catch (error) {
      console.error(`❌ Failed to stop experiment: ${error}`);
      throw error;
    }
  }

  /**
   * Run preflight validation
   */
  private async runPreflight(experimentKey: string): Promise<void> {
    console.log(`🔍 Running preflight validation for: ${experimentKey}`);
    
    try {
      const result = await runPreflight(experimentKey);
      if (!result.success) {
        throw new Error('Preflight validation failed');
      }
    } catch (error) {
      console.error(`❌ Preflight validation failed: ${error}`);
      throw error;
    }
  }

  /**
   * List all experiments
   */
  private async listExperiments(): Promise<void> {
    console.log(`📋 Listing all experiments...`);
    
    try {
      // List contract files
      const fs = await import('fs');
      const path = await import('path');
      
      const contractDir = 'contract';
      if (fs.existsSync(contractDir)) {
        const files = fs.readdirSync(contractDir)
          .filter(file => file.endsWith('.json'))
          .map(file => path.basename(file, '.json'));
        
        console.log(`\n📝 Contract files found:`);
        files.forEach(key => {
          console.log(`  - ${key}`);
        });
      } else {
        console.log(`⚠️  No contract directory found`);
      }

      // List git branches
      const { execSync } = await import('child_process');
      
      try {
        const branches = execSync('git branch -a', { encoding: 'utf8' })
          .split('\n')
          .filter(branch => branch.includes('exp/'))
          .map(branch => branch.trim().replace('* ', '').replace('remotes/origin/', ''));
        
        console.log(`\n🌿 Experiment branches:`);
        branches.forEach(branch => {
          console.log(`  - ${branch}`);
        });
      } catch {
        console.log(`⚠️  Could not list git branches`);
      }
      
    } catch (error) {
      console.error(`❌ Failed to list experiments: ${error}`);
      throw error;
    }
  }

  /**
   * Show help information
   */
  private showHelp(): void {
    console.log(`
🧪 Experiment CLI - Automated A/B Testing Workflow

Usage:
  npm run experiment <command> [experiment-key] [options]

Commands:
  create <key> [contract-path]  Create and deploy a new experiment
  verify <key>                  Verify experiment setup
  status <key>                  Show experiment status
  start <key>                   Start an experiment
  stop <key>                    Stop an experiment
  preflight <key>               Run preflight validation
  list                          List all experiments
  help                          Show this help message

Examples:
  npm run experiment create prime_banner
  npm run experiment create button_color contracts/button_test.json
  npm run experiment verify prime_banner
  npm run experiment status prime_banner
  npm run experiment start prime_banner
  npm run experiment stop prime_banner
  npm run experiment preflight prime_banner
  npm run experiment list

Workflow:
  1. Create contract JSON in contract/<key>.json
  2. Run 'create' command to deploy experiment
  3. Verify setup with 'verify' command
  4. Start experiment with 'start' command
  5. Monitor with 'status' command
  6. Stop with 'stop' command when done

Branch Strategy:
  - All experiments run on separate branches (exp/<key>)
  - Main branch remains unaffected
  - Preview deployments for safe testing
  - Branch-based targeting in Statsig
`);
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const cli = new ExperimentCLI();
  await cli.run(args);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { ExperimentCLI };

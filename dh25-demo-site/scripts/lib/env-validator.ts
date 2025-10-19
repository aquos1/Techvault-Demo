/**
 * Environment Variable Validator
 * Validates all required environment variables for experiment automation
 */

import { existsSync } from 'fs';
import { join } from 'path';

// Load environment variables from .env.local
try {
  const dotenv = require('dotenv');
  const envPath = join(process.cwd(), '.env.local');
  if (existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
} catch (error) {
  // dotenv not available, continue without it
}

/**
 * Environment validation result
 */
export interface EnvValidationResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  missing: string[];
}

/**
 * Required environment variables
 */
const REQUIRED_VARS = [
  'NEXT_PUBLIC_STATSIG_CLIENT_KEY',
  'STATSIG_CONSOLE_API_KEY',
  'NEXT_PUBLIC_STATSIG_TIER',
] as const;

/**
 * Optional environment variables
 */
const OPTIONAL_VARS = [
  'EXPERIMENT_BRANCH',
  'VERCEL_TOKEN',
  'VERCEL_ORG_ID',
  'VERCEL_PROJECT_ID',
  'GITHUB_TOKEN',
  'SLACK_WEBHOOK_URL',
] as const;

/**
 * Validate environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const result: EnvValidationResult = {
    success: true,
    errors: [],
    warnings: [],
    missing: [],
  };

  // Check for .env.local file
  const envFile = join(process.cwd(), '.env.local');
  if (!existsSync(envFile)) {
    result.warnings.push('No .env.local file found. Using system environment variables.');
  }

  // Validate required variables
  for (const varName of REQUIRED_VARS) {
    const value = process.env[varName];
    if (!value || value.includes('***')) {
      result.success = false;
      result.errors.push(`Missing or invalid ${varName}`);
      result.missing.push(varName);
    }
  }

  // Check optional variables
  for (const varName of OPTIONAL_VARS) {
    const value = process.env[varName];
    if (!value || value.includes('***')) {
      result.warnings.push(`Optional variable ${varName} not set`);
    }
  }

  // Validate Statsig client key format
  const clientKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;
  if (clientKey && !clientKey.startsWith('client-')) {
    result.warnings.push('NEXT_PUBLIC_STATSIG_CLIENT_KEY should start with "client-"');
  }

  // Validate Statsig console key format
  const consoleKey = process.env.STATSIG_CONSOLE_API_KEY;
  if (consoleKey && !consoleKey.startsWith('console-')) {
    result.warnings.push('STATSIG_CONSOLE_API_KEY should start with "console-"');
  }

  // Validate tier
  const tier = process.env.NEXT_PUBLIC_STATSIG_TIER;
  if (tier && !['development', 'staging', 'production'].includes(tier)) {
    result.warnings.push('NEXT_PUBLIC_STATSIG_TIER should be development, staging, or production');
  }

  return result;
}

/**
 * Print validation results
 */
export function printValidationResults(result: EnvValidationResult): void {
  console.log('🔍 Environment Validation Results\n');

  if (result.success) {
    console.log('✅ All required environment variables are set');
  } else {
    console.log('❌ Missing required environment variables:');
    result.errors.forEach(error => console.log(`  - ${error}`));
  }

  if (result.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    result.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  if (result.missing.length > 0) {
    console.log('\n📝 Missing variables:');
    result.missing.forEach(varName => console.log(`  - ${varName}`));
    console.log('\n💡 Copy env.example to .env.local and fill in the values');
  }

  console.log('\n🔧 Environment Status:', result.success ? 'READY' : 'NEEDS SETUP');
}

/**
 * Main validation function
 */
async function main(): Promise<void> {
  const result = validateEnvironment();
  printValidationResults(result);
  
  if (!result.success) {
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { validateEnvironment as default };

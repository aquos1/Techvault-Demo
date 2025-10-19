/**
 * FAST Code Generation Logic for Experiment Implementation
 * Uses simple string replacement for near-instantaneous code modification
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import type { CodeChange, ExperimentContract } from './contract-schema.js';

/**
 * Code modification result
 */
export interface CodeModificationResult {
  success: boolean;
  file: string;
  changes: string[];
  errors: string[];
}

/**
 * Fast experiment code modifications using string replacement
 */
export class FastCodeGenerator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Apply all code changes from contract (FAST)
   */
  async applyCodeChanges(contract: ExperimentContract): Promise<CodeModificationResult[]> {
    const results: CodeModificationResult[] = [];

    for (const codeChange of contract.codeChanges) {
      try {
        console.log(`⚡ Fast code change: ${codeChange.file}`);
        
        const result = await this.applyCodeChange(codeChange, contract);
        results.push(result);
        
        if (result.success) {
          console.log(`✅ Fast modification successful: ${codeChange.file}`);
        } else {
          console.error(`❌ Fast modification failed: ${codeChange.file}`);
        }
      } catch (error) {
        console.error(`❌ Error in fast modification ${codeChange.file}:`, error);
        results.push({
          success: false,
          file: codeChange.file,
          changes: [],
          errors: [error instanceof Error ? error.message : 'Unknown error']
        });
      }
    }

    return results;
  }

  /**
   * Apply individual code change using fast string replacement
   */
  private async applyCodeChange(
    codeChange: CodeChange,
    contract: ExperimentContract
  ): Promise<CodeModificationResult> {
    const filePath = join(this.projectRoot, codeChange.file);
    const result: CodeModificationResult = {
      success: false,
      file: codeChange.file,
      changes: [],
      errors: [],
    };

    try {
      // Read existing file content
      const originalContent = readFileSync(filePath, 'utf-8');
      
      // Fast string replacement
      const modifiedContent = this.fastStringReplace(
        originalContent,
        codeChange,
        contract
      );

      if (modifiedContent !== originalContent) {
        // Write modified content back to file
        writeFileSync(filePath, modifiedContent);
        
        result.success = true;
        result.changes = ['Applied experiment logic via fast string replacement'];
      } else {
        result.errors.push('No changes were made to the file');
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Fast string replacement for specific file types
   */
  private fastStringReplace(
    content: string,
    codeChange: CodeChange,
    contract: ExperimentContract
  ): string {
    const experimentKey = contract.experimentKey;
    const parameterName = codeChange.parameterUsage;
    const functionName = codeChange.function;

    // Handle ProductCard.tsx specifically
    if (codeChange.file.includes('ProductCard.tsx')) {
      return this.modifyProductCard(content, experimentKey, parameterName);
    }

    // Handle other component files
    if (codeChange.file.includes('.tsx') || codeChange.file.includes('.ts')) {
      return this.modifyGenericComponent(content, functionName, experimentKey, parameterName);
    }

    return content;
  }

  /**
   * Fast modification for ProductCard component
   */
  private modifyProductCard(content: string, experimentKey: string, parameterName: string): string {
    console.log(`🔍 Debug: Looking for ProductCard function in file...`);
    
    // Add import if not present
    if (!content.includes('getExperiment')) {
      console.log(`📦 Adding Statsig import...`);
      const importLine = "import { getExperiment, logExposure } from '../lib/statsigClient';";
      content = content.replace(
        /import.*from.*react.*;/,
        `$&\n${importLine}`
      );
    }

    // Try multiple patterns for ProductCard function
    const patterns = [
      /(export default function ProductCard\(\{ product, onAddToCart \}: ProductCardProps\) => \{)/,
      /(export default function ProductCard\(\{ product, onAddToCart \}: ProductCardProps\) \{)/,
      /(export default function ProductCard\(\{ product \}: ProductCardProps\) => \{)/,
      /(export default function ProductCard\(\{ product \}: ProductCardProps\) \{)/,
      /(function ProductCard\(\{ product, onAddToCart \}: ProductCardProps\) => \{)/,
      /(function ProductCard\(\{ product, onAddToCart \}: ProductCardProps\) \{)/,
      /(const ProductCard = \(\{ product, onAddToCart \}: ProductCardProps\) => \{)/,
    ];

    let found = false;
    for (const pattern of patterns) {
      if (pattern.test(content)) {
        console.log(`✅ Found ProductCard function with pattern: ${pattern}`);
        const experimentLogic = `
  // Experiment: ${experimentKey}
  const experiment = await getExperiment('${experimentKey}');
  const ${parameterName} = experiment.metadata?.config?.${parameterName} ?? false;
  
  // Log exposure when user sees this experiment
  await logExposure('${experimentKey}', experiment.variant, {
    component: 'ProductCard',
    parameter: '${parameterName}'
  });`;

        content = content.replace(pattern, `$1${experimentLogic}`);
        found = true;
        break;
      }
    }

    if (!found) {
      console.log(`❌ No ProductCard function pattern matched. File content preview:`);
      console.log(content.substring(0, 500));
    }

    return content;
  }

  /**
   * Fast modification for generic components
   */
  private modifyGenericComponent(
    content: string, 
    functionName: string, 
    experimentKey: string, 
    parameterName: string
  ): string {
    // Add import if not present
    if (!content.includes('getExperiment')) {
      const importLine = "import { getExperiment, logExposure } from '../lib/statsigClient';";
      content = content.replace(
        /import.*from.*react.*;/,
        `$&\n${importLine}`
      );
    }

    // Find and modify the target function
    const functionPattern = new RegExp(`(const ${functionName} = \\([^)]*\\) => \\{)`);
    if (functionPattern.test(content)) {
      const experimentLogic = `
  // Experiment: ${experimentKey}
  const experiment = await getExperiment('${experimentKey}');
  const ${parameterName} = experiment.metadata?.config?.${parameterName} ?? false;
  
  // Log exposure when user sees this experiment
  await logExposure('${experimentKey}', experiment.variant, {
    component: '${functionName}',
    parameter: '${parameterName}'
  });`;

      content = content.replace(
        functionPattern,
        `$1${experimentLogic}`
      );
    }

    return content;
  }
}

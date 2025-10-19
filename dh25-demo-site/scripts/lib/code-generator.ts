/**
 * Code Generation Logic for Experiment Implementation
 * Intelligently modifies code files based on contract specifications
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
 * Generate experiment code modifications
 */
export class CodeGenerator {
  private projectRoot: string;

  constructor(projectRoot: string) {
    this.projectRoot = projectRoot;
  }

  /**
   * Apply all code changes from contract
   */
  async applyCodeChanges(contract: ExperimentContract): Promise<CodeModificationResult[]> {
    const results: CodeModificationResult[] = [];

    for (const codeChange of contract.codeChanges) {
      try {
        const result = await this.applyCodeChange(codeChange, contract);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          file: codeChange.file,
          changes: [],
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        });
      }
    }

    return results;
  }

  /**
   * Apply individual code change
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
      
      // Generate modified content
      const modifiedContent = this.generateModifiedCode(
        originalContent,
        codeChange,
        contract
      );

      if (modifiedContent !== originalContent) {
        // Write modified content back to file
        writeFileSync(filePath, modifiedContent, 'utf-8');
        result.success = true;
        result.changes.push(`Modified ${codeChange.function} to include experiment check`);
      } else {
        result.errors.push('No changes were made to the file');
      }
    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Unknown error');
    }

    return result;
  }

  /**
   * Generate modified code with experiment checks
   */
  private generateModifiedCode(
    originalContent: string,
    codeChange: CodeChange,
    contract: ExperimentContract
  ): string {
    const lines = originalContent.split('\n');
    const modifiedLines: string[] = [];
    
    let inTargetFunction = false;
    let functionDepth = 0;
    let insertIndex = -1;
    let foundFunction = false;
    let functionStartLine = -1;

    // Find the target function/component
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if we found the target function
      if (this.isTargetFunction(line, codeChange.function)) {
        foundFunction = true;
        inTargetFunction = true;
        insertIndex = i;
        functionStartLine = i;
        
        // Add import statements if needed (at the top of file)
        if (!this.hasStatsigImport(originalContent)) {
          // Find the best place to insert imports
          const importInsertIndex = this.findImportInsertIndex(lines);
          if (importInsertIndex >= 0) {
            lines.splice(importInsertIndex, 0, "import { getExperiment, logExposure } from '../lib/statsigClient';");
            lines.splice(importInsertIndex + 1, 0, '');
          }
        }
        
        // Add the modified function
        modifiedLines.push(this.generateExperimentFunction(line, codeChange, contract));
        continue;
      }

      // Track function depth
      if (inTargetFunction) {
        if (line.includes('{')) functionDepth++;
        if (line.includes('}')) functionDepth--;
        
        if (functionDepth === 0 && inTargetFunction) {
          // End of function, add closing brace
          modifiedLines.push(line);
          inTargetFunction = false;
          continue;
        }
      }

      modifiedLines.push(line);
    }

    if (!foundFunction) {
      throw new Error(`Function/component '${codeChange.function}' not found in file`);
    }

    return modifiedLines.join('\n');
  }

  /**
   * Check if line contains target function
   */
  private isTargetFunction(line: string, functionName: string): boolean {
    const cleanLine = line.trim();
    const patterns = [
      `function ${functionName}(`,
      `const ${functionName} = (`,
      `const ${functionName} = function`,
      `export function ${functionName}(`,
      `export const ${functionName} = (`,
      `export default function ${functionName}(`,
      `export default const ${functionName} = (`,
    ];

    return patterns.some(pattern => cleanLine.startsWith(pattern));
  }

  /**
   * Check if file already has Statsig imports
   */
  private hasStatsigImport(content: string): boolean {
    return content.includes('from \'../lib/statsigClient\'') || 
           content.includes('from "../lib/statsigClient"');
  }

  /**
   * Find the best place to insert imports
   */
  private findImportInsertIndex(lines: string[]): number {
    // Look for existing imports
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('import ') && !line.includes('from \'../lib/statsigClient\'')) {
        // Find the end of import section
        let j = i;
        while (j < lines.length && (lines[j].trim().startsWith('import ') || lines[j].trim() === '')) {
          j++;
        }
        return j;
      }
    }
    
    // If no imports found, insert at the beginning
    return 0;
  }

  /**
   * Generate experiment-enhanced function
   */
  private generateExperimentFunction(
    originalLine: string,
    codeChange: CodeChange,
    contract: ExperimentContract
  ): string {
    const functionName = codeChange.function;
    const experimentKey = contract.experimentKey;
    const parameterName = codeChange.parameterUsage;

    // Check if function is async
    const isAsync = originalLine.includes('async');
    
    return `${originalLine}
  // Experiment: ${experimentKey}
  ${isAsync ? '' : 'const experiment = await getExperiment(\'' + experimentKey + '\');'}
  ${isAsync ? 'const experiment = await getExperiment(\'' + experimentKey + '\');' : ''}
  const variant = experiment.variant;
  
  // Log exposure when user sees this experiment
  await logExposure('${experimentKey}', variant, {
    component: '${functionName}',
    parameter: '${parameterName}'
  });
  
  // Use experiment parameter: ${parameterName}
  const ${parameterName} = experiment.metadata?.config?.${parameterName} ?? false;
  
  // Original function logic continues...`;
  }

  /**
   * Generate a simple component wrapper for React components
   */
  generateReactComponentWrapper(
    componentName: string,
    experimentKey: string,
    parameterName: string
  ): string {
    return `
import { getExperiment, logExposure } from '../lib/statsigClient';

export async function ${componentName}() {
  // Experiment: ${experimentKey}
  const experiment = await getExperiment('${experimentKey}');
  const variant = experiment.variant;
  
  // Log exposure when user sees this experiment
  await logExposure('${experimentKey}', variant, {
    component: '${componentName}',
    parameter: '${parameterName}'
  });
  
  // Use experiment parameter
  const ${parameterName} = experiment.metadata?.config?.${parameterName} ?? false;
  
  return (
    <div>
      {/* Your component JSX here */}
      {${parameterName} && <div>Experiment feature enabled</div>}
    </div>
  );
}`;
  }

  /**
   * Validate generated code
   */
  async validateGeneratedCode(filePath: string): Promise<{ success: boolean; errors: string[] }> {
    const errors: string[] = [];
    
    try {
      // Check if file compiles (TypeScript check)
      const { execSync } = await import('child_process');
      execSync(`npx tsc --noEmit ${filePath}`, { 
        cwd: this.projectRoot,
        stdio: 'pipe',
        timeout: 30000
      });
    } catch (error) {
      errors.push(`TypeScript compilation failed: ${error}`);
    }

    try {
      // Check ESLint
      const { execSync } = await import('child_process');
      execSync(`npx eslint ${filePath}`, { 
        cwd: this.projectRoot,
        stdio: 'pipe',
        timeout: 30000
      });
    } catch (error) {
      errors.push(`ESLint validation failed: ${error}`);
    }

    return {
      success: errors.length === 0,
      errors
    };
  }

  /**
   * Add rollback capability
   */
  async createRollback(filePath: string, originalContent: string): Promise<void> {
    const rollbackPath = `${filePath}.rollback`;
    const fs = await import('fs');
    fs.writeFileSync(rollbackPath, originalContent);
    console.log(`Created rollback file: ${rollbackPath}`);
  }

  /**
   * Restore from rollback
   */
  async restoreFromRollback(filePath: string): Promise<void> {
    const rollbackPath = `${filePath}.rollback`;
    const fs = await import('fs');
    
    if (fs.existsSync(rollbackPath)) {
      const originalContent = fs.readFileSync(rollbackPath, 'utf-8');
      fs.writeFileSync(filePath, originalContent);
      fs.unlinkSync(rollbackPath);
      console.log(`Restored file from rollback: ${filePath}`);
    } else {
      throw new Error(`No rollback file found: ${rollbackPath}`);
    }
  }

  /**
   * Generate contract JSON from existing code
   */
  generateContractFromCode(filePath: string, experimentKey: string): Partial<ExperimentContract> {
    const content = readFileSync(join(this.projectRoot, filePath), 'utf-8');
    
    // Simple extraction of component/function names
    const functionMatches = content.match(/(?:function|const)\s+(\w+)\s*[=(]/g);
    const functions = functionMatches?.map(match => 
      match.replace(/(?:function|const)\s+/, '').replace(/\s*[=(].*/, '')
    ) || [];

    return {
      experimentKey,
      name: `Experiment: ${experimentKey}`,
      codeChanges: functions.map(func => ({
        file: filePath,
        function: func,
        wrapWith: 'getExperiment' as const,
        parameterUsage: 'enabled',
        insertionPoint: 'before' as const,
      })),
    };
  }
}

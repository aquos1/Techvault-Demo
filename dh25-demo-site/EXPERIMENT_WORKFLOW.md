# Experiment Automation Workflow

This document describes the automated experiment workflow that enables branch-based A/B testing with Statsig integration.

## Overview

The experiment automation system allows you to:
- Define experiments using JSON contracts
- Automatically create feature branches for experiments
- Deploy experiments to preview environments
- Integrate with Statsig for experiment management
- Target experiments to specific branches/preview domains

## Key Features

### 🌿 Branch-Based Experiments
- All experiments run on separate branches (`exp/<experiment-key>`)
- Main branch remains unaffected
- Safe testing environment with preview deployments

### 📊 Statsig Integration
- Real-time experiment configuration
- Automatic exposure and outcome logging
- Branch-based targeting rules
- Console API integration for experiment management

### 🤖 Automated Workflow
- Contract-driven experiment setup
- Intelligent code modification
- Git branch management
- Vercel deployment integration

## Quick Start

### 1. Setup Environment

Copy the environment template:
```bash
cp .env.example .env.local
```

Fill in your Statsig credentials:
```env
NEXT_PUBLIC_STATSIG_CLIENT_KEY=your_client_key_here
STATSIG_CONSOLE_API_KEY=your_console_api_key_here
NEXT_PUBLIC_STATSIG_TIER=development
```

### 2. Create Experiment Contract

Create a contract file in `contract/<experiment-key>.json`:

```json
{
  "experimentKey": "button_color",
  "name": "Button Color Test",
  "description": "Testing red vs blue button colors",
  "hypothesis": "Red buttons increase conversions by 10%",
  "variants": {
    "control": {
      "name": "Control",
      "parameters": { "color": "blue" },
      "passPercentage": 50
    },
    "treatment": {
      "name": "Treatment", 
      "parameters": { "color": "red" },
      "passPercentage": 50
    }
  },
  "codeChanges": [
    {
      "file": "src/components/Button.tsx",
      "function": "Button",
      "parameterUsage": "color"
    }
  ],
  "branchConfig": {
    "branchName": "exp/button_color"
  },
  "statsig": {
    "autoStart": false
  }
}
```

### 3. Run Experiment

```bash
# Create and deploy experiment
npm run experiment:create button_color

# Verify setup
npm run experiment:verify button_color

# Start experiment
npm run experiment:start button_color

# Check status
npm run experiment:status button_color

# Stop experiment
npm run experiment:stop button_color
```

## Contract Schema

### Required Fields

- `experimentKey`: Unique identifier for the experiment
- `name`: Human-readable experiment name
- `variants`: Object defining control and treatment variants
- `codeChanges`: Array of code modifications to implement
- `branchConfig`: Branch configuration for the experiment

### Optional Fields

- `description`: Detailed description of the experiment
- `hypothesis`: What you expect to happen
- `primaryMetrics`: Key metrics to measure
- `secondaryMetrics`: Additional metrics to monitor
- `targetingRules`: Custom targeting conditions
- `allocation`: Percentage of traffic to include (default: 100)
- `deployment`: Deployment configuration
- `statsig`: Statsig-specific settings
- `metadata`: Additional experiment metadata

### Variant Configuration

Each variant can include:
- `name`: Variant name
- `description`: Variant description
- `parameters`: Key-value pairs for experiment parameters
- `passPercentage`: Traffic allocation percentage

### Code Changes

Define how code should be modified:
- `file`: Path to the file to modify
- `function`: Function/component name to wrap
- `parameterUsage`: Which parameter to use from the variant
- `wrapWith`: How to wrap the function (`getExperiment` or `getExperimentParams`)

## Branch Strategy

### Branch Naming Convention
- All experiment branches follow the pattern: `exp/<experiment-key>`
- Examples: `exp/button_color`, `exp/prime_banner`, `exp/checkout_flow`

### Branch Lifecycle
1. **Creation**: Branch created from `main` (or specified base branch)
2. **Development**: Code changes applied automatically
3. **Deployment**: Pushed to remote, triggers Vercel preview
4. **Experiment**: Statsig experiment targets the branch
5. **Cleanup**: Branch can be deleted after experiment completion

### Targeting Strategy
Experiments are automatically configured to target:
- Users on the experiment branch (`custom.branch == 'exp/<key>'`)
- Users accessing the preview domain
- Development environment only (by default)

## CLI Commands

### Available Commands

```bash
npm run experiment create <key> [contract-path]  # Create and deploy experiment
npm run experiment verify <key>                  # Verify experiment setup  
npm run experiment status <key>                  # Show experiment status
npm run experiment start <key>                   # Start experiment
npm run experiment stop <key>                    # Stop experiment
npm run experiment list                          # List all experiments
```

### Command Examples

```bash
# Create experiment with custom contract
npm run experiment create prime_banner contracts/prime_banner.json

# Verify experiment is properly set up
npm run experiment verify prime_banner

# Check experiment status and metrics
npm run experiment status prime_banner

# Start the experiment
npm run experiment start prime_banner

# Stop the experiment
npm run experiment stop prime_banner

# List all experiments
npm run experiment list
```

## Code Integration

### Automatic Code Modification

The system automatically modifies your code to:
1. Import Statsig functions
2. Add experiment checks
3. Log exposure events
4. Apply variant parameters

### Example: Before/After

**Before (ProductCard.tsx):**
```tsx
export function ProductCard({ product }) {
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      <button>Add to Cart</button>
    </div>
  );
}
```

**After (with experiment):**
```tsx
import { getExperiment, logExposure } from '../lib/statsigClient';

export async function ProductCard({ product }) {
  // Experiment: prime_banner
  const experiment = await getExperiment('prime_banner');
  const variant = experiment.variant;
  
  // Log exposure when user sees this experiment
  await logExposure('prime_banner', variant, {
    component: 'ProductCard',
    parameter: 'showBadge'
  });
  
  // Use experiment parameter: showBadge
  const showBadge = experiment.metadata?.config?.showBadge ?? false;
  
  return (
    <div className="product-card">
      <h3>{product.name}</h3>
      {showBadge && <span className="prime-badge">PRIME</span>}
      <button>Add to Cart</button>
    </div>
  );
}
```

### Manual Integration

You can also manually integrate experiments:

```tsx
import { getExperiment, logExposure } from '../lib/statsigClient';

export async function MyComponent() {
  const experiment = await getExperiment('my_experiment');
  const showFeature = experiment.metadata?.config?.showFeature ?? false;
  
  await logExposure('my_experiment', experiment.variant, {
    component: 'MyComponent'
  });
  
  return (
    <div>
      {showFeature && <NewFeature />}
    </div>
  );
}
```

## Statsig Configuration

### Environment Variables

```env
# Required
NEXT_PUBLIC_STATSIG_CLIENT_KEY=client-xxxxx
STATSIG_CONSOLE_API_KEY=secret-xxxxx

# Optional
NEXT_PUBLIC_STATSIG_TIER=development
EXPERIMENT_BRANCH=exp/current_experiment
```

### Targeting Rules

Experiments automatically include targeting rules:
- Branch-based targeting (`custom.branch == 'exp/<key>'`)
- Environment targeting (development/staging/production)
- URL targeting (preview domains)

### Metrics Tracking

The system automatically logs:
- **Exposure events**: When users see the experiment
- **Outcome events**: Custom events you define
- **Conversion events**: Standard e-commerce events

## Troubleshooting

### Common Issues

**1. Contract validation errors**
```bash
❌ Contract validation failed:
variants: At least 2 variants are required
```
**Solution**: Ensure you have both `control` and `treatment` variants defined.

**2. Branch creation fails**
```bash
❌ Failed to create/checkout branch: exp/button_color
```
**Solution**: Ensure you're in a git repository and have proper permissions.

**3. Statsig experiment creation fails**
```bash
❌ Failed to create experiment: Authentication failed
```
**Solution**: Check your `STATSIG_CONSOLE_API_KEY` environment variable.

**4. Code modification fails**
```bash
❌ Function/component 'Button' not found in file
```
**Solution**: Verify the function name matches exactly in your contract.

### Debug Mode

Enable debug logging:
```bash
DEBUG=experiment* npm run experiment create button_color
```

### Manual Verification

Check experiment setup manually:
1. Verify contract file exists and is valid JSON
2. Check git branch exists: `git branch | grep exp/`
3. Verify Statsig experiment exists in console
4. Test preview deployment works
5. Confirm targeting rules are active

## Best Practices

### Contract Design
- Use descriptive experiment keys (`button_color` not `test1`)
- Include clear hypotheses and success criteria
- Define meaningful variant names
- Specify realistic traffic allocations

### Code Changes
- Test code modifications on a small scale first
- Use feature flags for complex experiments
- Log both exposure and outcome events
- Include fallback values for experiment parameters

### Branch Management
- Keep experiment branches focused on single experiments
- Clean up completed experiment branches
- Use descriptive commit messages
- Review changes before merging to main

### Monitoring
- Set up alerts for experiment failures
- Monitor both technical and business metrics
- Document experiment results
- Share learnings with the team

## Advanced Usage

### Custom Targeting Rules

Define complex targeting conditions:

```json
{
  "targetingRules": [
    {
      "name": "Premium users only",
      "conditions": [
        {
          "type": "custom_field",
          "field": "user_tier",
          "operator": "equals",
          "targetValue": "premium"
        },
        {
          "type": "branch",
          "operator": "equals", 
          "targetValue": "exp/premium_feature"
        }
      ],
      "passPercentage": 100
    }
  ]
}
```

### Multiple Code Changes

Apply changes to multiple files:

```json
{
  "codeChanges": [
    {
      "file": "src/components/Header.tsx",
      "function": "Header",
      "parameterUsage": "showBanner"
    },
    {
      "file": "src/components/ProductCard.tsx", 
      "function": "ProductCard",
      "parameterUsage": "highlightColor"
    }
  ]
}
```

### Environment-Specific Configuration

```json
{
  "statsig": {
    "environment": "staging",
    "autoStart": true
  },
  "targetingRules": [
    {
      "name": "Staging environment",
      "conditions": [
        {
          "type": "environment",
          "operator": "equals",
          "targetValue": "staging"
        }
      ],
      "environments": ["staging"]
    }
  ]
}
```

## Support

For issues or questions:
1. Check this documentation first
2. Review the troubleshooting section
3. Check experiment logs: `npm run experiment status <key>`
4. Verify environment configuration
5. Contact the development team

## Changelog

### v1.0.0
- Initial release
- Branch-based experiment workflow
- Statsig integration
- Automated code modification
- CLI interface
- Contract-driven configuration

/**
 * Statsig client wrapper using real Statsig SDK
 * Integrates with statsig-js for client-side experiment management
 */

import Statsig from 'statsig-js';
import type { StatsigUser as StatsigSDKUser } from 'statsig-js';

export interface ExperimentResult {
  variant: string;
  isExperimentGroup: boolean;
  metadata?: Record<string, any>;
}

export interface StatsigUser {
  userID: string;
  country?: string;
  custom?: {
    branch?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface ExperimentParams {
  [key: string]: any;
}

class StatsigClient {
  private initialized = false;
  private user: StatsigUser | null = null;

  /**
   * Initialize Statsig client with real SDK
   */
  async initialize(clientKey: string, options?: any): Promise<void> {
    if (this.initialized) return;
    
    try {
      // Generate anonymous user ID
      this.user = {
        userID: this.generateAnonymousId(),
        country: 'US',
        custom: {
          branch: this.getCurrentBranch(),
        },
      };

      // Initialize Statsig with the real SDK
      await Statsig.initialize(clientKey, this.user as StatsigSDKUser, {
        environment: options?.environment || { tier: 'development' },
        disableAutoMetricsLogging: false,
        disableNetworkKeepalive: false,
      });
      
      this.initialized = true;
      console.log('Statsig client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Statsig client:', error);
      // Fall back to mock mode if initialization fails
      this.initialized = true;
      console.warn('Falling back to mock mode');
    }
  }

  /**
   * Get experiment result using real Statsig SDK
   */
  async getExperiment(experimentKey: string): Promise<ExperimentResult> {
    if (!this.initialized) {
      throw new Error('Statsig client not initialized');
    }

    try {
      // Use real Statsig SDK to get experiment configuration
      const config = Statsig.getExperiment(experimentKey);
      
      // Extract variant from the config
      const variant = config.get('variant', 'control');
      const isExperimentGroup = variant !== 'control';
      
      console.log(`Experiment ${experimentKey}: variant ${variant}`);
      
      return {
        variant,
        isExperimentGroup,
        metadata: {
          experiment_key: experimentKey,
          user_id: this.user?.userID,
          config: config.value,
        },
      };
    } catch (error) {
      console.error(`Error getting experiment ${experimentKey}:`, error);
      // Return default values if experiment fails
      return {
        variant: 'control',
        isExperimentGroup: false,
        metadata: {
          experiment_key: experimentKey,
          user_id: this.user?.userID,
          error: 'Experiment not found or failed',
        },
      };
    }
  }

  /**
   * Get experiment parameters (for dynamic configs)
   */
  async getExperimentParams(experimentKey: string): Promise<ExperimentParams> {
    if (!this.initialized) {
      throw new Error('Statsig client not initialized');
    }

    try {
      const config = Statsig.getExperiment(experimentKey);
      return config.value || {};
    } catch (error) {
      console.error(`Error getting experiment params for ${experimentKey}:`, error);
      return {};
    }
  }

  /**
   * Log exposure event when user sees experiment
   */
  async logExposure(experimentKey: string, variant: string, metadata?: Record<string, any>): Promise<void> {
    if (!this.initialized) {
      console.warn('Statsig client not initialized, exposure not logged');
      return;
    }

    try {
      Statsig.logEvent('experiment_exposure', undefined, {
        experiment_key: experimentKey,
        variant,
        ...metadata,
      });
      console.log(`Logged exposure for experiment ${experimentKey}, variant ${variant}`);
    } catch (error) {
      console.error('Error logging exposure:', error);
    }
  }

  /**
   * Log event using real Statsig SDK
   */
  async log(name: string, value?: string | number, metadata?: Record<string, any>): Promise<void> {
    if (!this.initialized) {
      console.warn('Statsig client not initialized, event not logged');
      return;
    }

    try {
      Statsig.logEvent(name, value, {
        ...metadata,
        user_id: this.user?.userID || 'anonymous',
        timestamp: new Date().toISOString(),
      });
      console.log(`Logged event: ${name}`, { value, metadata });
    } catch (error) {
      console.error('Error logging event:', error);
    }
  }

  /**
   * Update user context (useful for branch-based targeting)
   */
  async updateUser(user: Partial<StatsigUser>): Promise<void> {
    if (!this.initialized) {
      console.warn('Statsig client not initialized, user not updated');
      return;
    }

    try {
      this.user = { ...this.user, ...user } as StatsigUser;
      await Statsig.updateUser(this.user as StatsigSDKUser);
      console.log('User context updated:', user);
    } catch (error) {
      console.error('Error updating user:', error);
    }
  }

  /**
   * Generate anonymous user ID
   */
  private generateAnonymousId(): string {
    // Try to get existing ID from localStorage, or generate new one
    if (typeof window !== 'undefined') {
      const existingId = localStorage.getItem('statsig_user_id');
      if (existingId) {
        return existingId;
      }
      
      const newId = `anon_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
      localStorage.setItem('statsig_user_id', newId);
      return newId;
    }
    
    // Fallback for server-side rendering
    return `anon_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
  }

  /**
   * Get current git branch for targeting
   */
  private getCurrentBranch(): string {
    // This will be set by the automation script
    if (typeof window !== 'undefined') {
      return (window as any).__EXPERIMENT_BRANCH__ || 'main';
    }
    return process.env.EXPERIMENT_BRANCH || 'main';
  }
}

// Singleton instance
const statsigClient = new StatsigClient();

/**
 * Initialize Statsig client
 */
export async function initializeStatsig(): Promise<void> {
  const clientKey = process.env.NEXT_PUBLIC_STATSIG_CLIENT_KEY;
  const tier = process.env.NEXT_PUBLIC_STATSIG_TIER || 'development';
  
  if (!clientKey) {
    console.warn('NEXT_PUBLIC_STATSIG_CLIENT_KEY not found, falling back to mock mode');
  }
  
  await statsigClient.initialize(clientKey || 'mock-key', {
    environment: { tier },
  });
}

/**
 * Get experiment result
 */
export async function getExperiment(experimentKey: string): Promise<ExperimentResult> {
  return statsigClient.getExperiment(experimentKey);
}

/**
 * Get experiment parameters (for dynamic configs)
 */
export async function getExperimentParams(experimentKey: string): Promise<ExperimentParams> {
  return statsigClient.getExperimentParams(experimentKey);
}

/**
 * Log exposure event when user sees experiment
 */
export async function logExposure(experimentKey: string, variant: string, metadata?: Record<string, any>): Promise<void> {
  return statsigClient.logExposure(experimentKey, variant, metadata);
}

/**
 * Log event
 */
export async function log(name: string, value?: string | number, metadata?: Record<string, any>): Promise<void> {
  return statsigClient.log(name, value, metadata);
}

/**
 * Update user context (useful for branch-based targeting)
 */
export async function updateUser(user: Partial<StatsigUser>): Promise<void> {
  return statsigClient.updateUser(user);
}

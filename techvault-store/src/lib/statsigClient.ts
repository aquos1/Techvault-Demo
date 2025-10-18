/**
 * Statsig client wrapper - designed to be compatible with real Statsig SDK
 * Currently returns mock data until Statsig is integrated
 */

export interface ExperimentResult {
  variant: 'X' | 'Y';
  isExperimentGroup: boolean;
  metadata?: Record<string, any>;
}

export interface StatsigUser {
  userID: string;
  country?: string;
  [key: string]: any;
}

class StatsigClient {
  private initialized = false;
  private user: StatsigUser | null = null;

  /**
   * Initialize Statsig client (stub implementation)
   */
  async initialize(clientKey: string, options?: any): Promise<void> {
    if (this.initialized) return;
    
    // Generate anonymous user ID
    this.user = {
      userID: this.generateAnonymousId(),
      country: 'US',
    };
    
    this.initialized = true;
    console.log('Statsig client initialized (mock mode)');
  }

  /**
   * Get experiment result (stub implementation)
   */
  async getExperiment(experimentKey: string): Promise<ExperimentResult> {
    if (!this.initialized) {
      throw new Error('Statsig client not initialized');
    }

    // Mock experiment logic - in real implementation this would call Statsig
    const hash = this.hashString(`${this.user?.userID}-${experimentKey}`);
    const variant = hash % 2 === 0 ? 'X' : 'Y';
    
    console.log(`Experiment ${experimentKey}: variant ${variant}`);
    
    return {
      variant,
      isExperimentGroup: true,
      metadata: {
        experiment_key: experimentKey,
        user_id: this.user?.userID,
      },
    };
  }

  /**
   * Log event (stub implementation)
   */
  async log(name: string, value?: string | number, metadata?: Record<string, any>): Promise<void> {
    if (!this.initialized) {
      console.warn('Statsig client not initialized, event not logged');
      return;
    }

    const event = {
      name,
      value,
      metadata: {
        ...metadata,
        user_id: this.user?.userID,
        timestamp: new Date().toISOString(),
      },
    };

    console.log('Statsig Event:', event);
  }

  /**
   * Generate anonymous user ID
   */
  private generateAnonymousId(): string {
    return `anon_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`;
  }

  /**
   * Simple hash function for consistent experiment assignment
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
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
    console.warn('NEXT_PUBLIC_STATSIG_CLIENT_KEY not found, using mock mode');
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
 * Log event
 */
export async function log(name: string, value?: string | number, metadata?: Record<string, any>): Promise<void> {
  return statsigClient.log(name, value, metadata);
}

/**
 * Demo script showing how to use the Statsig SDK
 * This demonstrates the event logging capabilities
 */

import { getStatsigClient } from '../app/components/StatsigProvider';

/**
 * Demo function showing how to log events with the Statsig SDK
 */
export async function demoStatsigEvents() {
  const statsigClient = getStatsigClient();
  
  if (!statsigClient) {
    console.warn('Statsig client not initialized yet');
    return;
  }

  try {
    // Example 1: Log a simple event
    statsigClient.logEvent("user_action", "button_click", {
      button_name: "demo_button",
      page: "home"
    });

    // Example 2: Log a purchase event
    statsigClient.logEvent("purchase", "order_123", {
      price: 29.99,
      item_name: "Wireless Headphones",
      category: "electronics"
    });

    // Example 3: Log an experiment exposure
    statsigClient.logEvent("experiment_exposure", "prime_banner", {
      experiment_key: "prime_banner",
      variant: "treatment",
      component: "ProductCard"
    });

    // Example 4: Log a custom business event
    statsigClient.logEvent("custom_business_event", "user_engagement", {
      engagement_type: "high",
      session_duration: 300,
      pages_viewed: 5
    });

    console.log('✅ Demo events logged to Statsig SDK');

    // Optional: Flush events immediately (normally they're batched)
    await statsigClient.flush();
    console.log('✅ Events flushed to Statsig');

  } catch (error) {
    console.error('❌ Error logging events to Statsig SDK:', error);
  }
}

/**
 * Demo function showing how to get experiment data
 */
export async function demoExperimentUsage() {
  const statsigClient = getStatsigClient();
  
  if (!statsigClient) {
    console.warn('Statsig client not initialized yet');
    return;
  }

  try {
    // Get experiment configuration
    const experiment = await statsigClient.getExperiment('prime_banner');
    console.log('🔬 Experiment data:', experiment);

    // Get feature flag
    const feature = await statsigClient.getFeatureGate('new_checkout_flow');
    console.log('🚩 Feature flag:', feature);

    // Get dynamic config
    const config = await statsigClient.getDynamicConfig('banner_config');
    console.log('⚙️ Dynamic config:', config);

  } catch (error) {
    console.error('❌ Error getting experiment data:', error);
  }
}

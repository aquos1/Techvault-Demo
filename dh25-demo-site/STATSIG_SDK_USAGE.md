# Statsig SDK Usage Guide

This document explains how the Statsig SDK is integrated and used in this e-commerce demo application.

## 🚀 **SDK Initialization**

The Statsig SDK is initialized in `src/app/components/StatsigProvider.tsx`:

```typescript
import { StatsigClient } from '@statsig/js-client';
import { StatsigSessionReplayPlugin } from '@statsig/session-replay';
import { StatsigAutoCapturePlugin } from '@statsig/web-analytics';

const myStatsigClient = new StatsigClient(
  "client-4DsBceek0WiriSJ73PPFijQC6HdgQduAin3kxERJ64t", 
  { userID: "user-id" },
  {
    plugins: [
      new StatsigSessionReplayPlugin(),
      new StatsigAutoCapturePlugin(),
    ],
  }
);

await myStatsigClient.initializeAsync();
```

## 📊 **Event Logging**

### **1. Automatic Event Logging**

The app automatically logs events to both the existing `statsigClient` and the new Statsig SDK:

```typescript
// In src/lib/analytics.ts
export async function logAddToCart(product: Product, variant?: 'X' | 'Y') {
  // Log to existing statsigClient
  await log('add_to_cart', product.price, { ... });

  // Log to Statsig SDK
  const statsigClient = getStatsigClient();
  if (statsigClient) {
    statsigClient.logEvent("add_to_cart", product.id, {
      price: product.price,
      item_name: product.name,
      category: product.category || "electronics",
      variant: variant || "control"
    });
  }
}
```

### **2. Available Events**

The following events are automatically logged:

- **`page_view`** - When users visit pages
- **`add_to_cart`** - When products are added to cart
- **`checkout_start`** - When checkout process begins
- **`purchase`** - When orders are completed
- **`action_click`** - When CTA buttons are clicked
- **`experiment_exposure`** - When users see experiments

### **3. Manual Event Logging**

You can also log custom events directly:

```typescript
import { getStatsigClient } from '../app/components/StatsigProvider';

const statsigClient = getStatsigClient();
if (statsigClient) {
  statsigClient.logEvent("custom_event", "event_value", {
    custom_property: "value",
    user_segment: "premium"
  });
}
```

## 🧪 **Experiment Usage**

### **1. Getting Experiment Data**

```typescript
// Get experiment configuration
const experiment = await statsigClient.getExperiment('prime_banner');
const showBadge = experiment.metadata?.config?.showBadge ?? false;
```

### **2. Feature Flags**

```typescript
// Check feature flags
const feature = await statsigClient.getFeatureGate('new_checkout_flow');
if (feature.value) {
  // Show new checkout flow
}
```

### **3. Dynamic Configs**

```typescript
// Get dynamic configuration
const config = await statsigClient.getDynamicConfig('banner_config');
const bannerText = config.get('text', 'Default Banner');
```

## 🔧 **Integration Points**

### **1. ProductCard Component**
- Logs experiment exposure when users see the prime banner
- Automatically logs add-to-cart events with experiment variants

### **2. VariantCTA Component**
- Logs action clicks with A/B test variants
- Tracks conversion events for experiment analysis

### **3. Analytics Library**
- All analytics functions now log to both systems
- Maintains backward compatibility
- Adds rich metadata for experiment analysis

## 📈 **Analytics Benefits**

### **1. Dual Logging**
- **Existing System**: Maintains current analytics pipeline
- **Statsig SDK**: Provides rich experiment data and session replay

### **2. Experiment Analysis**
- Track which variants users see
- Measure conversion rates by variant
- Analyze user behavior with session replay

### **3. Real-time Insights**
- Events are logged immediately
- Optional `flush()` for immediate data transmission
- Automatic batching for performance

## 🎯 **Usage Examples**

### **Example 1: E-commerce Event**
```typescript
// When user adds product to cart
statsigClient.logEvent("add_to_cart", "SKU_12345", {
  price: 29.99,
  item_name: "Wireless Headphones",
  category: "electronics",
  variant: "treatment"
});
```

### **Example 2: Experiment Exposure**
```typescript
// When user sees experiment
statsigClient.logEvent("experiment_exposure", "prime_banner", {
  experiment_key: "prime_banner",
  variant: "treatment",
  component: "ProductCard"
});
```

### **Example 3: Business Event**
```typescript
// Custom business metric
statsigClient.logEvent("user_engagement", "high", {
  engagement_type: "high",
  session_duration: 300,
  pages_viewed: 5
});
```

## 🔍 **Debugging**

### **1. Check Initialization**
```typescript
const statsigClient = getStatsigClient();
if (statsigClient) {
  console.log('✅ Statsig SDK is ready');
} else {
  console.warn('⚠️ Statsig SDK not initialized');
}
```

### **2. View Logged Events**
Events are automatically logged to the browser console. Check the Network tab to see API calls to Statsig.

### **3. Test Events**
Use the demo script in `src/lib/statsig-demo.ts` to test event logging:

```typescript
import { demoStatsigEvents } from './lib/statsig-demo';
await demoStatsigEvents();
```

## 🚀 **Next Steps**

1. **View Events**: Check your Statsig console to see logged events
2. **Create Experiments**: Use the experiment management tools
3. **Analyze Data**: Review experiment results and user behavior
4. **Optimize**: Use insights to improve conversion rates

The Statsig SDK is now fully integrated and ready for advanced A/B testing and analytics!

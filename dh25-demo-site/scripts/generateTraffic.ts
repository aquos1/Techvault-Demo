#!/usr/bin/env tsx

/**
 * Synthetic traffic generator for Statsig demo
 * Simulates realistic user journeys with A/B testing
 * Note: This is a stub implementation ready for Statsig integration
 */

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category?: string;
  unit?: string;
  freshness?: string;
}

interface User {
  id: string;
  country: string;
  device: 'web' | 'mobile_web';
}

interface AnalyticsEvent {
  name: string;
  value?: string | number;
  metadata: Record<string, any>;
}

// Configuration
const DEFAULT_USERS = 100;
const DEFAULT_ACTIONS = 5;
const BASE_URL = process.env.TRAFFIC_BASE_URL || 'http://localhost:3000';

// Product data (matches the client)
const PRODUCTS: Product[] = [
  { id: '1', name: 'Organic Bananas', price: 1.99, image: '/api/placeholder/300/200', description: 'Fresh organic bananas, perfect for snacking or baking. Sold by the bunch.', category: 'Fresh Produce', unit: 'per bunch', freshness: 'Fresh' },
  { id: '2', name: 'Whole Milk', price: 3.49, image: '/api/placeholder/300/200', description: 'Fresh whole milk, perfect for cereal, coffee, and baking.', category: 'Dairy & Eggs', unit: 'per gallon', freshness: 'Fresh' },
  { id: '3', name: 'Ground Beef 80/20', price: 5.99, image: '/api/placeholder/300/200', description: 'Fresh ground beef, perfect for burgers, meatballs, and tacos.', category: 'Meat & Seafood', unit: 'per lb', freshness: 'Fresh' },
  { id: '4', name: 'Organic Spinach', price: 2.99, image: '/api/placeholder/300/200', description: 'Fresh organic spinach leaves, perfect for salads and cooking.', category: 'Fresh Produce', unit: 'per bag', freshness: 'Fresh' },
  { id: '5', name: 'Free Range Eggs', price: 4.99, image: '/api/placeholder/300/200', description: 'Fresh free-range eggs from local farms.', category: 'Dairy & Eggs', unit: 'per dozen', freshness: 'Fresh' },
  { id: '6', name: 'Salmon Fillet', price: 12.99, image: '/api/placeholder/300/200', description: 'Fresh Atlantic salmon fillet, perfect for grilling or baking.', category: 'Meat & Seafood', unit: 'per lb', freshness: 'Fresh' },
  { id: '7', name: 'Organic Avocados', price: 2.49, image: '/api/placeholder/300/200', description: 'Fresh organic avocados, perfect for guacamole and toast.', category: 'Fresh Produce', unit: 'each', freshness: 'Fresh' },
  { id: '8', name: 'Greek Yogurt', price: 4.49, image: '/api/placeholder/300/200', description: 'Creamy Greek yogurt, high in protein and perfect for breakfast.', category: 'Dairy & Eggs', unit: 'per container', freshness: 'Fresh' },
  { id: '9', name: 'Chicken Breast', price: 6.99, image: '/api/placeholder/300/200', description: 'Fresh boneless chicken breast, perfect for grilling or baking.', category: 'Meat & Seafood', unit: 'per lb', freshness: 'Fresh' },
  { id: '10', name: 'Organic Strawberries', price: 3.99, image: '/api/placeholder/300/200', description: 'Sweet organic strawberries, perfect for desserts and snacking.', category: 'Fresh Produce', unit: 'per container', freshness: 'Fresh' },
  { id: '11', name: 'Cheddar Cheese', price: 5.99, image: '/api/placeholder/300/200', description: 'Sharp cheddar cheese, perfect for sandwiches and cooking.', category: 'Dairy & Eggs', unit: 'per block', freshness: 'Fresh' },
  { id: '12', name: 'Fresh Bread', price: 2.99, image: '/api/placeholder/300/200', description: 'Freshly baked artisan bread, perfect for sandwiches and toast.', category: 'Bakery', unit: 'per loaf', freshness: 'Fresh' }
];

// Countries for realistic geo distribution
const COUNTRIES = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'BR'];

/**
 * Generate random user
 */
function generateUser(): User {
  return {
    id: `user_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
    country: COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)],
    device: Math.random() > 0.3 ? 'web' : 'mobile_web',
  };
}

/**
 * Get experiment variant for user (stub implementation)
 * In real implementation, this would call Statsig.getExperiment()
 */
async function getExperimentVariant(user: User): Promise<'X' | 'Y'> {
  // Mock experiment logic - in real implementation this would call Statsig
  const hash = user.id.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  const variant = Math.abs(hash) % 2 === 0 ? 'X' : 'Y';
  
  console.log(`User ${user.id} assigned to variant ${variant}`);
  return variant;
}

/**
 * Log event (stub implementation)
 * In real implementation, this would call Statsig.logEvent()
 */
async function logEvent(user: User, event: AnalyticsEvent): Promise<void> {
  console.log(`Event for user ${user.id}:`, {
    name: event.name,
    value: event.value,
    metadata: {
      ...event.metadata,
      user_id: user.id,
      country: user.country,
      device: user.device,
      timestamp: new Date().toISOString(),
    },
  });
}

/**
 * Simulate page view
 */
async function simulatePageView(user: User, page: string, metadata: Record<string, any> = {}): Promise<void> {
  await logEvent(user, {
    name: 'page_view',
    value: page,
    metadata: {
      page,
      ...metadata,
    },
  });
}

/**
 * Simulate add to cart
 */
async function simulateAddToCart(user: User, product: Product, variant: 'X' | 'Y'): Promise<void> {
  await logEvent(user, {
    name: 'add_to_cart',
    value: product.price,
    metadata: {
      product_id: product.id,
      product_name: product.name,
      price: product.price,
      variant,
    },
  });
}

/**
 * Simulate checkout start
 */
async function simulateCheckoutStart(user: User, cart: Product[]): Promise<void> {
  const total = cart.reduce((sum, product) => sum + product.price, 0);
  await logEvent(user, {
    name: 'checkout_start',
    value: total,
    metadata: {
      total,
      item_count: cart.length,
      items: cart.map(p => ({ product_id: p.id, price: p.price })),
    },
  });
}

/**
 * Simulate purchase
 */
async function simulatePurchase(user: User, cart: Product[]): Promise<void> {
  const total = cart.reduce((sum, product) => sum + product.price, 0);
  await logEvent(user, {
    name: 'purchase',
    value: total,
    metadata: {
      order_id: `order_${user.id}_${Date.now()}`,
      total,
      item_count: cart.length,
      items: cart.map(p => ({ product_id: p.id, price: p.price })),
    },
  });
}

/**
 * Simulate user journey
 */
async function simulateUserJourney(user: User, maxActions: number): Promise<void> {
  const variant = await getExperimentVariant(user);
  const cart: Product[] = [];
  let actions = 0;

  // Always start with home page view
  await simulatePageView(user, 'home');
  actions++;

  // Random number of product views (1-3)
  const productViews = Math.floor(Math.random() * 3) + 1;
  const viewedProducts: Product[] = [];

  for (let i = 0; i < productViews && actions < maxActions; i++) {
    const product = PRODUCTS[Math.floor(Math.random() * PRODUCTS.length)];
    viewedProducts.push(product);
    
    await simulatePageView(user, 'product', { product_id: product.id });
    actions++;

    // 40-60% chance to add to cart
    if (Math.random() < 0.5) {
      cart.push(product);
      await simulateAddToCart(user, product, variant);
      actions++;
    }
  }

  // 20-30% chance to start checkout
  if (cart.length > 0 && Math.random() < 0.25) {
    await simulateCheckoutStart(user, cart);
    actions++;

    // 5-12% chance to complete purchase
    if (Math.random() < 0.08) {
      await simulatePurchase(user, cart);
      actions++;
    }
  }

  console.log(`User ${user.id} completed ${actions} actions (variant: ${variant})`);
}

/**
 * Main traffic generation function
 */
async function generateTraffic(userCount: number, maxActions: number): Promise<void> {
  console.log(`Generating traffic for ${userCount} users with max ${maxActions} actions each...`);
  console.log(`Base URL: ${BASE_URL}`);
  
  // Check for server secret (for future Statsig integration)
  const serverSecret = process.env.STATSIG_SERVER_SECRET;
  if (!serverSecret) {
    console.warn('STATSIG_SERVER_SECRET not found - running in mock mode');
  } else {
    console.log('Statsig server secret found - ready for integration');
  }

  // Generate users and simulate journeys
  const users: User[] = [];
  for (let i = 0; i < userCount; i++) {
    users.push(generateUser());
  }

  console.log(`Generated ${users.length} users`);

  // Simulate journeys in batches to avoid overwhelming the system
  const batchSize = 10;
  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize);
    const promises = batch.map(user => simulateUserJourney(user, maxActions));
    
    try {
      await Promise.all(promises);
      console.log(`Completed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(users.length / batchSize)}`);
    } catch (error) {
      console.error(`Error in batch ${Math.floor(i / batchSize) + 1}:`, error);
    }
  }

  console.log('Traffic generation completed!');
  console.log('Note: This is a mock implementation. For real Statsig integration:');
  console.log('1. Install statsig-node: npm install statsig-node');
  console.log('2. Set STATSIG_SERVER_SECRET in .env.traffic.local');
  console.log('3. Replace mock functions with real Statsig API calls');
}

/**
 * Parse command line arguments
 */
function parseArgs(): { users: number; actions: number } {
  const args = process.argv.slice(2);
  let users = DEFAULT_USERS;
  let actions = DEFAULT_ACTIONS;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--users' && args[i + 1]) {
      users = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--actions' && args[i + 1]) {
      actions = parseInt(args[i + 1], 10);
      i++;
    }
  }

  return { users, actions };
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  const { users, actions } = parseArgs();
  
  console.log('TechVault Store Traffic Generator');
  console.log('==================================');
  
  try {
    await generateTraffic(users, actions);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}
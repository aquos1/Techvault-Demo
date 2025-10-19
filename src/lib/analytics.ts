/**
 * Typed analytics event logging wrappers
 * Ready for Statsig integration
 */

import { log } from './statsigClient';
import { getStatsigClient } from '../app/components/StatsigProvider';

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  description: string;
  category?: string;
  unit?: string;
  freshness?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Order {
  total: number;
  items: CartItem[];
  orderId: string;
}

/**
 * Log page view event
 */
export async function logPageView(
  page: 'home' | 'product' | 'checkout',
  metadata?: Record<string, any>
): Promise<void> {
  // Log to existing statsigClient
  await log('page_view', page, {
    page,
    ...metadata,
  });

  // Log to Statsig SDK (client-side only)
  if (typeof window !== 'undefined') {
    const statsigClient = getStatsigClient();
    if (statsigClient) {
      try {
        statsigClient.logEvent("page_view", page, {
          page,
          ...metadata,
        });
      } catch (error) {
        console.warn('Failed to log to Statsig SDK:', error);
      }
    }
  }
}

/**
 * Log add to cart event
 */
export async function logAddToCart(
  product: Product,
  variant?: 'X' | 'Y'
): Promise<void> {
  // Log to existing statsigClient
  await log('add_to_cart', product.price, {
    product_id: product.id,
    product_name: product.name,
    price: product.price,
    variant,
  });

  // Log to Statsig SDK (client-side only)
  if (typeof window !== 'undefined') {
    const statsigClient = getStatsigClient();
    if (statsigClient) {
      try {
        statsigClient.logEvent("add_to_cart", product.id, {
          price: product.price.toString(),
          item_name: product.name,
          category: product.category || "electronics",
          variant: variant || "control"
        });
      } catch (error) {
        console.warn('Failed to log to Statsig SDK:', error);
      }
    }
  }
}

/**
 * Log checkout start event
 */
export async function logCheckoutStart(cart: CartItem[]): Promise<void> {
  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  // Log to existing statsigClient
  await log('checkout_start', total, {
    total,
    item_count: itemCount,
    items: cart.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
    })),
  });

  // Log to Statsig SDK (client-side only)
  if (typeof window !== 'undefined') {
    const statsigClient = getStatsigClient();
    if (statsigClient) {
      try {
        statsigClient.logEvent("checkout_start", "checkout", {
          total: total.toString(),
          item_count: itemCount.toString(),
          cart_value: total.toString()
        });
      } catch (error) {
        console.warn('Failed to log to Statsig SDK:', error);
      }
    }
  }
}

/**
 * Log purchase event
 */
export async function logPurchase(order: Order): Promise<void> {
  // Log to existing statsigClient
  await log('purchase', order.total, {
    order_id: order.orderId,
    total: order.total,
    item_count: order.items.reduce((sum, item) => sum + item.quantity, 0),
    items: order.items.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
    })),
  });

  // Log to Statsig SDK (client-side only)
  if (typeof window !== 'undefined') {
    const statsigClient = getStatsigClient();
    if (statsigClient) {
      try {
        statsigClient.logEvent("purchase", order.orderId, {
          order_id: order.orderId,
          total: order.total.toString(),
          item_count: order.items.reduce((sum, item) => sum + item.quantity, 0).toString(),
          revenue: order.total.toString()
        });
      } catch (error) {
        console.warn('Failed to log to Statsig SDK:', error);
      }
    }
  }
}

/**
 * Log CTA action click event
 */
export async function logActionClick(
  action: string,
  location: string,
  productId?: string,
  variant?: 'X' | 'Y'
): Promise<void> {
  // Log to existing statsigClient
  await log('action_click', action, {
    action,
    location,
    product_id: productId,
    variant,
  });

  // Log to Statsig SDK (client-side only)
  if (typeof window !== 'undefined') {
    const statsigClient = getStatsigClient();
    if (statsigClient) {
      try {
        statsigClient.logEvent("action_click", action, {
          action,
          location,
          product_id: productId || "unknown",
          variant: variant || "control"
        });
      } catch (error) {
        console.warn('Failed to log to Statsig SDK:', error);
      }
    }
  }
}

/**
 * Log experiment exposure event to Statsig SDK
 */
export async function logExperimentExposure(
  experimentKey: string,
  variant: string,
  metadata?: Record<string, any>
): Promise<void> {
  // Only log on client-side
  if (typeof window !== 'undefined') {
    const statsigClient = getStatsigClient();
    if (statsigClient) {
      try {
        statsigClient.logEvent("experiment_exposure", experimentKey, {
          experiment_key: experimentKey,
          variant,
          ...metadata,
        });
      } catch (error) {
        console.warn('Failed to log experiment exposure to Statsig SDK:', error);
      }
    }
  }
}

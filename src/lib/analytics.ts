/**
 * Typed analytics event logging wrappers
 * Ready for Statsig integration
 */

import { log } from './statsigClient';

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
  await log('page_view', page, {
    page,
    ...metadata,
  });
}

/**
 * Log add to cart event
 */
export async function logAddToCart(
  product: Product,
  variant?: 'X' | 'Y'
): Promise<void> {
  await log('add_to_cart', product.price, {
    product_id: product.id,
    product_name: product.name,
    price: product.price,
    variant,
  });
}

/**
 * Log checkout start event
 */
export async function logCheckoutStart(cart: CartItem[]): Promise<void> {
  const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  
  await log('checkout_start', total, {
    total,
    item_count: itemCount,
    items: cart.map(item => ({
      product_id: item.product.id,
      quantity: item.quantity,
      price: item.product.price,
    })),
  });
}

/**
 * Log purchase event
 */
export async function logPurchase(order: Order): Promise<void> {
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
  await log('action_click', action, {
    action,
    location,
    product_id: productId,
    variant,
  });
}

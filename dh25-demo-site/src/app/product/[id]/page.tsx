'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Product, CartItem, Order } from '@/lib/analytics';
import { logPageView, logPurchase } from '@/lib/analytics';
import { initializeStatsig } from '@/lib/statsigClient';
import Header from '@/components/Header';
import VariantCTA from '@/components/VariantCTA';
import CartDrawer from '@/components/CartDrawer';
import productsData from '@/data/products.json';

export default function ProductPage() {
  const params = useParams();
  const productId = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);

  // Initialize Statsig and log page view
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeStatsig();
        await logPageView('product', { product_id: productId });
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsInitialized(true); // Continue even if Statsig fails
      }
    };

    initialize();
  }, [productId]);

  // Load product and cart from localStorage
  useEffect(() => {
    const foundProduct = productsData.find(p => p.id === productId);
    setProduct(foundProduct || null);

    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, [productId]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prevCart => prevCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart(prevCart =>
        prevCart.map(item =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        )
      );
    }
  };

  const handlePurchase = async () => {
    if (cart.length === 0) return;
    
    setIsPurchasing(true);
    try {
      const order: Order = {
        orderId: `order_${Date.now()}`,
        total: cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0),
        items: cart,
      };

      await logPurchase(order);
      
      // Clear cart after purchase
      setCart([]);
      localStorage.removeItem('cart');
      
      alert('Purchase completed! Thank you for shopping with TechVault!');
    } catch (error) {
      console.error('Error processing purchase:', error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Header
          cartCount={cartCount}
          onCartClick={() => setIsCartOpen(true)}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to TechVault
          </Link>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
      />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to TechVault
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Image */}
          <div>
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-96 object-cover rounded-lg"
            />
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <p className="text-3xl font-bold text-blue-600 mt-2">${product.price}</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600">{product.description}</p>
            </div>

            {/* CTA Section */}
            <div className="space-y-4">
              <VariantCTA
                product={product}
                onAddToCart={addToCart}
                location="product_detail"
              />
              
              {/* Buy Now Button */}
              <button
                onClick={handlePurchase}
                disabled={cart.length === 0 || isPurchasing}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-md font-medium transition-colors"
              >
                {isPurchasing ? 'Processing...' : 'Complete Purchase'}
              </button>
            </div>
          </div>
        </div>
      </main>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveItem={removeFromCart}
        onUpdateQuantity={updateQuantity}
      />
    </div>
  );
}

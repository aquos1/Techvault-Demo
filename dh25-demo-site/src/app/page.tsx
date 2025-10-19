'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Product, CartItem } from '@/lib/analytics';
import { logPageView } from '@/lib/analytics';
import { initializeStatsig } from '@/lib/statsigClient';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import CartDrawer from '@/components/CartDrawer';
import productsData from '@/data/products.json';

export default function HomePage() {
  const [products] = useState<Product[]>(productsData);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Statsig and log page view
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeStatsig();
        await logPageView('home');
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing app:', error);
        setIsInitialized(true); // Continue even if Statsig fails
      }
    };

    initialize();
  }, []);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
      }
    }
  }, []);

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

  return (
    <div className="min-h-screen">
      <Header
        cartCount={cartCount}
        onCartClick={() => setIsCartOpen(true)}
      />
      
      <main className="bg-gray-100 min-h-screen">
        {/* Hero banner */}
        <div className="bg-gradient-to-r from-purple-600 to-purple-800 text-white py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold mb-2">TechVault Prime</h1>
              <p className="text-xl">Top 100+ Tech Innovations</p>
              <button className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded mt-4">
                Shop Now
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Content sections in Amazon-style grid */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Keep shopping for */}
            <div className="amazon-card p-4">
              <h3 className="font-bold text-lg mb-4">Keep shopping for</h3>
              <div className="amazon-grid">
                {products.slice(0, 4).map((product) => (
                  <div key={product.id} className="text-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                    <p className="text-sm text-gray-600 line-clamp-2">{product.name}</p>
                    <p className="text-xs text-gray-500">2 viewed</p>
                  </div>
                ))}
              </div>
              <Link href="#" className="text-blue-600 text-sm hover:underline">View your browsing history</Link>
            </div>

            {/* Buy again */}
            <div className="amazon-card p-4">
              <h3 className="font-bold text-lg mb-4">Buy again</h3>
              <div className="amazon-grid">
                {products.slice(4, 8).map((product) => (
                  <div key={product.id} className="text-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                    <p className="text-sm text-gray-600 line-clamp-2">{product.name}</p>
                    <p className="text-xs text-gray-500">$29.99</p>
                  </div>
                ))}
              </div>
              <Link href="#" className="text-blue-600 text-sm hover:underline">More in Buy Again</Link>
            </div>

            {/* Continue shopping deals */}
            <div className="amazon-card p-4">
              <h3 className="font-bold text-lg mb-4">Continue shopping deals</h3>
              <div className="amazon-grid">
                {products.slice(0, 4).map((product) => (
                  <div key={product.id} className="text-center">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-24 object-cover rounded mb-2"
                    />
                    <p className="text-sm text-gray-600 line-clamp-2">{product.name}</p>
                    <p className="text-xs text-gray-500">$19.99</p>
                  </div>
                ))}
              </div>
              <Link href="#" className="text-blue-600 text-sm hover:underline">See more deals</Link>
            </div>

            {/* Today's deals */}
            <div className="amazon-card p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Shop Today&apos;s Deals</h3>
                <Link href="#" className="text-blue-600 text-sm hover:underline">See all deals</Link>
              </div>
              <div className="space-y-4">
                <div className="text-center">
                  <img
                    src="/api/placeholder/200/150"
                    alt="French Press"
                    className="w-full h-32 object-cover rounded mb-2"
                  />
                  <p className="text-sm font-medium">French Press Coffee Maker</p>
                  <p className="text-lg font-bold text-red-600">$24.99</p>
                  <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">prime</span>
                </div>
                <div className="border-t pt-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <img
                      src="/api/placeholder/60/60"
                      alt="Door Lock"
                      className="w-12 h-12 object-cover rounded"
                    />
                    <div>
                      <p className="text-sm font-medium">Evanshow Fingerprint Door Lock</p>
                      <div className="flex items-center space-x-1">
                        <div className="flex text-yellow-400">
                          ★★★★★
                        </div>
                        <span className="text-xs text-gray-500">350</span>
                      </div>
                      <p className="text-lg font-bold text-red-600">$29.99</p>
                      <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">prime</span>
                      <span className="text-xs text-gray-500 ml-2">Sponsored</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Featured products section */}
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-6">Featured Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                />
              ))}
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

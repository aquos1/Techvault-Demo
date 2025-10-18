'use client';

import { useState, useEffect } from 'react';
import { Product } from '@/lib/analytics';
import { logAddToCart, logActionClick } from '@/lib/analytics';
import { getExperiment } from '@/lib/statsigClient';

interface VariantCTAProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  location: string;
}

export default function VariantCTA({ product, onAddToCart, location }: VariantCTAProps) {
  const [variant, setVariant] = useState<'X' | 'Y'>('X');
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExperiment = async () => {
      try {
        const experiment = await getExperiment('cta_button_test');
        setVariant(experiment.variant);
      } catch (error) {
        console.error('Error loading experiment:', error);
        // Default to variant X on error
        setVariant('X');
      } finally {
        setIsLoading(false);
      }
    };

    loadExperiment();
  }, []);

  const handleCTAClick = async () => {
    try {
      // Log the action click
      await logActionClick('cta_click', location, product.id, variant);
      
      if (variant === 'Y') {
        // Variant Y: Show follow-up panel on first click
        if (!showFollowUp) {
          setShowFollowUp(true);
          return;
        }
      }
      
      // Add to cart and log the event
      await logAddToCart(product, variant);
      onAddToCart(product);
    } catch (error) {
      console.error('Error handling CTA click:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-10 bg-gray-200 rounded-md"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Primary CTA Button */}
      <button
        onClick={handleCTAClick}
        className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
          variant === 'Y' 
            ? 'bg-green-600 hover:bg-green-700 text-white text-lg' 
            : 'amazon-btn-primary'
        }`}
      >
        {variant === 'X' ? 'Add to Cart' : 'Try It Now'}
      </button>

      {/* Variant Y Follow-up Panel */}
      {variant === 'Y' && showFollowUp && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <p className="text-green-800 text-sm mb-3">
            Experience the difference! This product is designed to enhance your daily routine with cutting-edge technology.
          </p>
          <button
            onClick={handleCTAClick}
            className="w-full amazon-btn-primary text-sm"
          >
            Add to Cart
          </button>
        </div>
      )}
    </div>
  );
}

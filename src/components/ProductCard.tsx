'use client';

import Link from 'next/link';
import { Product, CartItem, logExperimentExposure } from '@/lib/analytics';
import VariantCTA from './VariantCTA';
import { getExperiment, logExposure } from '../lib/statsigClient';
import { useState, useEffect } from 'react';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
  // Experiment: prime_banner
  const experiment = await getExperiment('prime_banner');
  const showBadge = experiment.metadata?.config?.showBadge ?? false;
  
  // Log exposure when user sees this experiment
  await logExposure('prime_banner', experiment.variant, {
    component: 'ProductCard',
    parameter: 'showBadge'
  });
  // Experiment: prime_banner
  const experiment = await getExperiment('prime_banner');
  const showBadge = experiment.metadata?.config?.showBadge ?? false;
  
  // Log exposure when user sees this experiment
  await logExposure('prime_banner', experiment.variant, {
    component: 'ProductCard',
    parameter: 'showBadge'
  });
  // Experiment: prime_banner
  const experiment = await getExperiment('prime_banner');
  const showBadge = experiment.metadata?.config?.showBadge ?? false;
  
  // Log exposure when user sees this experiment
  await logExposure('prime_banner', experiment.variant, {
    component: 'ProductCard',
    parameter: 'showBadge'
  });
  // Experiment: prime_banner
  const experiment = await getExperiment('prime_banner');
  const showBadge = experiment.metadata?.config?.showBadge ?? false;
  
  // Log exposure when user sees this experiment
  await logExposure('prime_banner', experiment.variant, {
    component: 'ProductCard',
    parameter: 'showBadge'
  });
  // Experiment: prime_banner
  const experiment = await getExperiment('prime_banner');
  const showBadge = experiment.metadata?.config?.showBadge ?? false;
  
  // Log exposure when user sees this experiment
  await logExposure('prime_banner', experiment.variant, {
    component: 'ProductCard',
    parameter: 'showBadge'
  });
  const [showBadge, setShowBadge] = useState(false);
  const [experimentVariant, setExperimentVariant] = useState('control');

  useEffect(() => {
    const fetchExperiment = async () => {
      try {
        // Experiment: prime_banner
        const experiment = await getExperiment('prime_banner');
        setShowBadge(experiment.metadata?.config?.showBadge ?? false);
        setExperimentVariant(experiment.variant);
        
        // Log exposure when user sees this experiment
        await logExposure('prime_banner', experiment.variant, {
          component: 'ProductCard',
          parameter: 'showBadge'
        });

        // Also log to Statsig SDK
        await logExperimentExposure('prime_banner', experiment.variant, {
          component: 'ProductCard',
          parameter: 'showBadge'
        });
      } catch (error) {
        console.error('Error fetching experiment or logging exposure:', error);
      }
    };

    fetchExperiment();
  }, []);

  return (
    <div className="amazon-card p-4 hover:shadow-lg transition-shadow">
      <Link href={`/product/${product.id}`}>
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-48 object-cover rounded mb-3"
        />
      </Link>
      
      <div>
        <Link href={`/product/${product.id}`}>
          <h3 className="text-sm font-medium text-gray-900 hover:text-blue-600 transition-colors line-clamp-2 mb-2">
            {product.name}
          </h3>
        </Link>
        
        {/* Freshness indicator */}
        {product.freshness && (
          <div className="flex items-center mb-2">
            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
              {product.freshness}
            </span>
          </div>
        )}
        
        {/* Star rating */}
        <div className="flex items-center space-x-1 mb-2">
          <div className="flex text-yellow-400">
            ★★★★★
          </div>
          <span className="text-xs text-gray-500">(1,234)</span>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-lg font-bold text-red-600">
              ${product.price}
            </span>
            {product.unit && (
              <span className="text-xs text-gray-500 ml-1">
                {product.unit}
              </span>
            )}
          </div>
          {showBadge && (
            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded">prime</span>
          )}
        </div>
        
        <div className="text-xs text-gray-500 mb-3">
          FREE delivery on orders over $35
        </div>
        
        <div>
          <VariantCTA
            product={product}
            onAddToCart={onAddToCart}
            location="product_card"
          />
        </div>
      </div>
    </div>
  );
}
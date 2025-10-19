'use client';

import Link from 'next/link';
import { Product, CartItem } from '@/lib/analytics';
import VariantCTA from './VariantCTA';

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
}

export default function ProductCard({ product, onAddToCart }: ProductCardProps) {
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
        
        {/* Star rating */}
        <div className="flex items-center space-x-1 mb-2">
          <div className="flex text-yellow-400">
            ★★★★★
          </div>
          <span className="text-xs text-gray-500">(1,234)</span>
        </div>
        
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-bold text-red-600">
            ${product.price}
          </span>
          <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">prime</span>
        </div>
        
        <div className="text-xs text-gray-500 mb-3">
          FREE delivery on orders over $25
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

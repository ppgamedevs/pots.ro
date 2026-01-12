'use client';

/**
 * Component pentru afișarea unui produs în grid
 */

import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/money';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    price: number;
    currency: string;
    images: string[];
    seller: {
      id: string;
      name: string;
      slug: string;
    };
    category: {
      id: string;
      name: string;
      slug: string;
    };
    status: 'active' | 'draft' | 'archived';
    createdAt: string;
    updatedAt: string;
  };
}

export function ProductCard({ product }: ProductCardProps) {
  const productUrl = `/p/${product.slug}`;
  const sellerUrl = `/s/${product.seller.slug}`;

  return (
    <div className="group relative bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Image */}
      <div className="aspect-square relative overflow-hidden bg-gray-100">
        {product.images.length > 0 ? (
          <Image
            src={product.images[0]}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Status Badge */}
        <div className="absolute top-2 left-2">
          <Badge 
            variant={product.status === 'active' ? 'default' : 'secondary'}
            className="text-xs"
          >
            {product.status === 'active' ? 'Activ' : 
             product.status === 'draft' ? 'Draft' : 'Arhivat'}
          </Badge>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Seller */}
        <Link 
          href={sellerUrl}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          {product.seller.name}
        </Link>

        {/* Title */}
        <Link href={productUrl}>
          <h3 className="font-medium text-gray-900 mt-1 line-clamp-2 group-hover:text-green-600 transition-colors">
            {product.title}
          </h3>
        </Link>

        {/* Category */}
        <div className="mt-2">
          <Badge variant="outline" className="text-xs">
            {product.category.name}
          </Badge>
        </div>

        {/* Price */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-lg font-semibold text-gray-900">
            {formatCurrency(product.price, product.currency)}
          </span>
        </div>
      </div>
    </div>
  );
}

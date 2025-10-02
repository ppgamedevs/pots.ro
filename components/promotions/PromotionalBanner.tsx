'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface Banner {
  id: string;
  title: string;
  type: string;
  startAt: string;
  endAt: string;
  targetCategorySlug?: string;
  targetProductId?: string;
  sellerId?: string;
}

interface PromotionalBannerProps {
  categorySlug?: string;
  sellerId?: string;
  productId?: string;
}

export function PromotionalBanner({ categorySlug, sellerId, productId }: PromotionalBannerProps) {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const params = new URLSearchParams();
        if (categorySlug) params.append('category', categorySlug);
        if (sellerId) params.append('sellerId', sellerId);
        if (productId) params.append('productId', productId);

        const response = await fetch(`/api/promotions/active?${params.toString()}`);
        const data = await response.json();

        if (data.banner) {
          setBanner(data.banner);
        }
      } catch (error) {
        console.error('Error fetching promotional banner:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBanner();
  }, [categorySlug, sellerId, productId]);

  if (loading || !banner) {
    return null;
  }

  // Determine target URL
  const getTargetUrl = () => {
    if (banner.targetCategorySlug) {
      return `/c/${banner.targetCategorySlug}`;
    }
    if (banner.targetProductId) {
      return `/p/${banner.targetProductId}`;
    }
    if (banner.sellerId) {
      return `/s/${banner.sellerId}`;
    }
    return '/'; // Default to homepage
  };

  return (
    <Card className="mb-6 border-orange-200 bg-gradient-to-r from-orange-50 to-red-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-orange-900 mb-2">
              {banner.title}
            </h3>
            <p className="text-sm text-orange-700">
              Ofertă limitată - verifică ofertele noastre speciale!
            </p>
          </div>
          <Link href={getTargetUrl()}>
            <Button 
              size="sm" 
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              Vezi ofertele
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

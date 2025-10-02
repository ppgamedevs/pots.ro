'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Eye, ShoppingCart, Package, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface SellerStatsDaily {
  date: string;
  views: number;
  addToCart: number;
  orders: number;
  revenue: number;
}

interface TopProduct {
  productId: string;
  name: string;
  revenue: number;
}

interface BounceData {
  views: number;
  addToCart: number;
}

interface SellerAnalyticsData {
  range: string;
  series: SellerStatsDaily[];
  topProducts: TopProduct[];
  bounce: BounceData;
}

export function SellerAnalytics() {
  const [data, setData] = useState<SellerAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');
  const [sellerId, setSellerId] = useState<string>('');

  const fetchAnalytics = async () => {
    if (!sellerId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/seller/${sellerId}?range=${range}`);
      if (!response.ok) {
        throw new Error('Eroare la încărcarea statisticilor');
      }
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Get seller ID from session or context
    // For now, we'll use a placeholder - in real implementation, get from auth context
    const mockSellerId = 'seller-id-placeholder';
    setSellerId(mockSellerId);
  }, []);

  useEffect(() => {
    if (sellerId) {
      fetchAnalytics();
    }
  }, [sellerId, range]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
    }).format(cents / 100);
  };

  const calculateTotalStats = () => {
    if (!data) return { totalViews: 0, totalAddToCart: 0, totalOrders: 0, totalRevenue: 0 };
    
    return data.series.reduce(
      (acc, day) => ({
        totalViews: acc.totalViews + day.views,
        totalAddToCart: acc.totalAddToCart + day.addToCart,
        totalOrders: acc.totalOrders + day.orders,
        totalRevenue: acc.totalRevenue + day.revenue,
      }),
      { totalViews: 0, totalAddToCart: 0, totalOrders: 0, totalRevenue: 0 }
    );
  };

  const calculateBounceRate = () => {
    if (!data || data.bounce.views === 0) return 0;
    return ((data.bounce.views - data.bounce.addToCart) / data.bounce.views) * 100;
  };

  const getConversionRate = () => {
    if (!data || data.bounce.views === 0) return 0;
    return (data.bounce.addToCart / data.bounce.views) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Nu s-au găsit date pentru această perioadă.
          </p>
        </CardContent>
      </Card>
    );
  }

  const totals = calculateTotalStats();
  const bounceRate = calculateBounceRate();
  const conversionRate = getConversionRate();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Statistici vânzări</h2>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">7 zile</SelectItem>
            <SelectItem value="30d">30 zile</SelectItem>
            <SelectItem value="90d">90 zile</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="ml-2 text-sm font-medium">Vizualizări</span>
            </div>
            <div className="text-2xl font-bold">{totals.totalViews}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              <span className="ml-2 text-sm font-medium">Adăugate în coș</span>
            </div>
            <div className="text-2xl font-bold">{totals.totalAddToCart}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="ml-2 text-sm font-medium">Comenzi</span>
            </div>
            <div className="text-2xl font-bold">{totals.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="ml-2 text-sm font-medium">Venituri</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totals.totalRevenue)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Conversion Metrics */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rata de conversie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Vizualizări → Coș</span>
                <span>{conversionRate.toFixed(1)}%</span>
              </div>
              <Progress value={conversionRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {data.bounce.addToCart} din {data.bounce.views} vizualizări
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bounce rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Părăsiri</span>
                <span>{bounceRate.toFixed(1)}%</span>
              </div>
              <Progress value={bounceRate} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {data.bounce.views - data.bounce.addToCart} părăsiri
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top produse după venituri</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nu s-au găsit produse cu vânzări în această perioadă.
            </p>
          ) : (
            <div className="space-y-3">
              {data.topProducts.map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {product.productId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(product.revenue)}</p>
                    <p className="text-sm text-muted-foreground">venituri</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Stats Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Statistici zilnice</CardTitle>
        </CardHeader>
        <CardContent>
          {data.series.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nu s-au găsit date pentru această perioadă.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Data</th>
                    <th className="text-right p-2">Vizualizări</th>
                    <th className="text-right p-2">Coș</th>
                    <th className="text-right p-2">Comenzi</th>
                    <th className="text-right p-2">Venituri</th>
                  </tr>
                </thead>
                <tbody>
                  {data.series.map((day) => (
                    <tr key={day.date} className="border-b">
                      <td className="p-2">
                        {format(new Date(day.date), 'dd MMM yyyy', { locale: ro })}
                      </td>
                      <td className="text-right p-2">{day.views}</td>
                      <td className="text-right p-2">{day.addToCart}</td>
                      <td className="text-right p-2">{day.orders}</td>
                      <td className="text-right p-2">{formatCurrency(day.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

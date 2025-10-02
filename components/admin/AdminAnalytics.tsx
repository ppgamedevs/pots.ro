'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Users, Package, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface DailyOrder {
  date: string;
  orders: number;
}

interface TopSeller {
  sellerId: string;
  brandName: string;
  revenue: number;
  orders: number;
}

interface AdminAnalyticsData {
  range: string;
  overview: {
    totalSales: number;
    totalCommissions: number;
    activeSellers: number;
    totalOrders: number;
  };
  dailyOrders: DailyOrder[];
  topSellers: TopSeller[];
}

export function AdminAnalytics() {
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('30d');

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/admin?range=${range}`);
      if (!response.ok) {
        throw new Error('Eroare la încărcarea statisticilor');
      }
      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [range]);

  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: 'RON',
    }).format(cents / 100);
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

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Statistici marketplace</h2>
        <div className="flex items-center gap-4">
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
          <Button variant="outline" size="sm" asChild>
            <a href="/sitemaps" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4 mr-2" />
              Vezi sitemaps
            </a>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="ml-2 text-sm font-medium">Vânzări totale</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(data.overview.totalSales)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.overview.totalOrders} comenzi
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="ml-2 text-sm font-medium">Comisioane</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(data.overview.totalCommissions)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              10% din vânzări
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="ml-2 text-sm font-medium">Vânzători activi</span>
            </div>
            <div className="text-2xl font-bold">{data.overview.activeSellers}</div>
            <p className="text-xs text-muted-foreground mt-1">
              cu vânzări în perioada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="ml-2 text-sm font-medium">Comenzi totale</span>
            </div>
            <div className="text-2xl font-bold">{data.overview.totalOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {formatCurrency(data.overview.totalSales / Math.max(data.overview.totalOrders, 1))} medie/comandă
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Sellers */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Top vânzători după venituri</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topSellers.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nu s-au găsit vânzători cu vânzări în această perioadă.
            </p>
          ) : (
            <div className="space-y-3">
              {data.topSellers.map((seller, index) => (
                <div key={seller.sellerId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium">{seller.brandName}</p>
                      <p className="text-sm text-muted-foreground">
                        ID: {seller.sellerId.slice(0, 8)}...
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(seller.revenue)}</p>
                    <p className="text-sm text-muted-foreground">
                      {seller.orders} comenzi
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Daily Orders Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Comenzi zilnice</CardTitle>
        </CardHeader>
        <CardContent>
          {data.dailyOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              Nu s-au găsit comenzi în această perioadă.
            </p>
          ) : (
            <div className="space-y-2">
              {data.dailyOrders.map((day) => (
                <div key={day.date} className="flex items-center justify-between p-2 border-b last:border-b-0">
                  <span className="text-sm">
                    {format(new Date(day.date), 'dd MMM yyyy', { locale: ro })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{day.orders}</span>
                    <span className="text-xs text-muted-foreground">comenzi</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO Tools Link */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Instrumente SEO</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/finante?tab=seo" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Verifică produse fără SEO complet
              </a>
            </Button>
            <p className="text-xs text-muted-foreground">
              Identifică produsele care necesită îmbunătățiri SEO
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

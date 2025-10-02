/**
 * Mini-raport financiar pentru admin dashboard
 * Afișează sumarul financiar cu trend-uri și link către ledger
 */

'use client';

import { useState, useEffect } from 'react';
import { FinanceSummary } from '@/lib/types.finante';
import { getWeeklyFinanceSummary } from '@/lib/api/ledger';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, Users, RefreshCw } from 'lucide-react';
import { formatCurrency } from '@/lib/money';
import Link from 'next/link';

export function FinanceMiniReport() {
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSummary = async () => {
    try {
      setIsLoading(true);
      const response = await getWeeklyFinanceSummary();
      
      if (response.ok && response.data) {
        setSummary(response.data);
      }
    } catch (error) {
      console.error('Error loading finance summary:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Finanțe (Săptămâna curentă)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse" />
                <div className="h-6 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Finanțe (Săptămâna curentă)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <p className="text-gray-500 mb-4">Nu s-au putut încărca datele financiare</p>
            <Button onClick={loadSummary} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reîncearcă
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculează trend-ul pentru ultimele 7 zile
  const trendData = summary.trend.slice(-7);
  const currentWeekTotal = trendData.reduce((sum, day) => sum + day.v, 0);
  const previousWeekTotal = summary.trend.slice(-14, -7).reduce((sum, day) => sum + day.v, 0);
  const trendPercentage = previousWeekTotal > 0 
    ? ((currentWeekTotal - previousWeekTotal) / previousWeekTotal) * 100 
    : 0;

  const isPositiveTrend = trendPercentage >= 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Finanțe (Săptămâna curentă)
            </CardTitle>
            <CardDescription>
              Sumar financiar pentru ultimele 7 zile
            </CardDescription>
          </div>
          <Button onClick={loadSummary} variant="outline" size="sm" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Statistici principale */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              Încasări
            </div>
            <div className="text-lg font-semibold text-green-600">
              {formatCurrency(summary.incasari, 'RON')}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <CreditCard className="h-3 w-3" />
              Comisioane
            </div>
            <div className="text-lg font-semibold text-blue-600">
              {formatCurrency(summary.comisioane, 'RON')}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <Users className="h-3 w-3" />
              Datorate Selleri
            </div>
            <div className="text-lg font-semibold text-orange-600">
              {formatCurrency(summary.datorateSelleri, 'RON')}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-600 flex items-center gap-1">
              <TrendingDown className="h-3 w-3" />
              Refunds
            </div>
            <div className="text-lg font-semibold text-red-600">
              {formatCurrency(summary.refunds, 'RON')}
            </div>
          </div>
        </div>

        {/* Trend indicator */}
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Trend săptămâna curentă</div>
              <div className={`text-lg font-semibold ${isPositiveTrend ? 'text-green-600' : 'text-red-600'}`}>
                {isPositiveTrend ? '+' : ''}{trendPercentage.toFixed(1)}%
              </div>
            </div>
            <div className="flex items-center">
              {isPositiveTrend ? (
                <TrendingUp className="h-5 w-5 text-green-600" />
              ) : (
                <TrendingDown className="h-5 w-5 text-red-600" />
              )}
            </div>
          </div>
        </div>

        {/* Sparkline simplu */}
        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">Evoluție zilnică</div>
          <div className="h-16 bg-gray-50 rounded p-2">
            <svg width="100%" height="100%" viewBox="0 0 200 60" className="overflow-visible">
              <polyline
                fill="none"
                stroke={isPositiveTrend ? "#10b981" : "#ef4444"}
                strokeWidth="2"
                points={trendData.map((point, index) => {
                  const x = (index / (trendData.length - 1)) * 180 + 10;
                  const y = 50 - (point.v / Math.max(...trendData.map(d => d.v))) * 40;
                  return `${x},${y}`;
                }).join(' ')}
              />
            </svg>
          </div>
        </div>

        {/* Acțiuni */}
        <div className="flex gap-2">
          <Link href="/admin/finante">
            <Button variant="outline" size="sm">
              Vezi în Ledger
            </Button>
          </Link>
          <Button variant="outline" size="sm">
            Export Raport
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

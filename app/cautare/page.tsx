'use client';

import { useState } from 'react';
import { ProductCard } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Star } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

// Mock search results
const mockSearchResults: ProductCard[] = [
  {
    id: "1",
    title: "Ghiveci ceramic alb",
    price: 49.9,
    currency: "RON",
    images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center"],
    seller: { id: "seller1", name: "Atelier Ceramic", slug: "atelier-ceramic" },
    category: { id: "cat1", name: "Ghivece", slug: "ghivece" },
    status: "active",
    createdAt: "2024-01-01T10:00:00Z",
    updatedAt: "2024-01-15T12:00:00Z",
  },
  {
    id: "2",
    title: "Cutie înaltă natur",
    price: 79.0,
    currency: "RON",
    images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center"],
    seller: { id: "seller2", name: "Cardboard Street", slug: "cardboard-street" },
    category: { id: "cat2", name: "Cutii", slug: "cutii" },
    status: "active",
    createdAt: "2024-01-02T11:00:00Z",
    updatedAt: "2024-01-16T13:00:00Z",
  },
  {
    id: "3",
    title: "Panglică satin 25mm",
    price: 14.5,
    currency: "RON",
    images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center"],
    seller: { id: "seller3", name: "Accesorii Florale", slug: "accesorii-florale" },
    category: { id: "cat3", name: "Accesorii", slug: "accesorii" },
    status: "active",
    createdAt: "2024-01-03T12:00:00Z",
    updatedAt: "2024-01-17T14:00:00Z",
  },
  {
    id: "4",
    title: "Vază ceramică natur",
    price: 129.0,
    currency: "RON",
    images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center"],
    seller: { id: "seller1", name: "Atelier Ceramic", slug: "atelier-ceramic" },
    category: { id: "cat4", name: "Vaze", slug: "vaze" },
    status: "active",
    createdAt: "2024-01-04T13:00:00Z",
    updatedAt: "2024-01-18T15:00:00Z",
  },
  {
    id: "5",
    title: "Ghiveci rotund natur",
    price: 89.0,
    currency: "RON",
    images: ["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=400&fit=crop&crop=center"],
    seller: { id: "seller1", name: "Atelier Ceramic", slug: "atelier-ceramic" },
    category: { id: "cat1", name: "Ghivece", slug: "ghivece" },
    status: "active",
    createdAt: "2024-01-05T14:00:00Z",
    updatedAt: "2024-01-19T16:00:00Z",
  },
  {
    id: "6",
    title: "Set 3 vaze ceramică",
    price: 199.0,
    currency: "RON",
    images: ["https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop&crop=center"],
    seller: { id: "seller1", name: "Atelier Ceramic", slug: "atelier-ceramic" },
    category: { id: "cat4", name: "Vaze", slug: "vaze" },
    status: "active",
    createdAt: "2024-01-06T15:00:00Z",
    updatedAt: "2024-01-20T17:00:00Z",
  },
];

export default function SearchPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState(mockSearchResults);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setFilteredResults(mockSearchResults);
    } else {
      const filtered = mockSearchResults.filter(product =>
        product.title.toLowerCase().includes(query.toLowerCase()) ||
        product.seller.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.name.toLowerCase().includes(query.toLowerCase())
      );
      setFilteredResults(filtered);
    }
  };

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('ro-RO', {
      style: 'currency',
      currency: currency,
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Search Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Caută produse
          </h1>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <Input
              type="text"
              placeholder="Caută produse, vânzători sau categorii..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4 py-3 text-lg"
            />
          </div>
          
          <div className="mt-4 flex items-center gap-4">
            <Badge variant="outline" className="px-3 py-1">
              {filteredResults.length} produse găsite
            </Badge>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filtrează
            </Button>
          </div>
        </div>

        {/* Search Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResults.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="p-0">
                <Link href={`/p/${product.id}`}>
                  <div className="relative aspect-square overflow-hidden rounded-t-lg">
                    <Image
                      src={product.images[0] || "/placeholder.png"}
                      alt={product.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  
                  <div className="p-4">
                    <div className="mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        de <span className="font-medium">{product.seller.name}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                          {formatPrice(product.price, product.currency)}
                        </p>
                        <Badge variant="secondary" className="text-xs">
                          {product.category.name}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">4.8</span>
                      </div>
                    </div>
                  </div>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* No Results */}
        {filteredResults.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Nu am găsit produse
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Încearcă să modifici termenii de căutare sau să folosești filtrele.
            </p>
            <Button onClick={() => handleSearch('')}>
              Vezi toate produsele
            </Button>
          </div>
        )}

        {/* Empty State */}
        {filteredResults.length === 0 && !searchQuery && (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Caută produse
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Folosește bara de căutare de mai sus pentru a găsi produsele dorite.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
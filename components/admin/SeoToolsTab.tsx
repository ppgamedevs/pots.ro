'use client';

/**
 * Tab SEO Tools pentru Admin Dashboard
 * Afișează produse fără descriere/imagini și permite notificări
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Image, 
  FileText, 
  Mail, 
  CheckCircle, 
  XCircle,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductSeoIssue {
  id: string;
  title: string;
  seller: {
    id: string;
    brandName: string;
    email: string;
  };
  issues: {
    missingDescription: boolean;
    missingImages: boolean;
    shortDescription: boolean;
    noMetaDescription: boolean;
  };
  severity: 'high' | 'medium' | 'low';
  lastNotified?: string;
}

export function SeoToolsTab() {
  const [products, setProducts] = useState<ProductSeoIssue[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isNotifying, setIsNotifying] = useState(false);

  // Mock data pentru demo
  useEffect(() => {
    const mockProducts: ProductSeoIssue[] = [
      {
        id: '1',
        title: 'Ghiveci ceramic alb',
        seller: {
          id: 'seller1',
          brandName: 'Garden Pro',
          email: 'contact@gardenpro.ro'
        },
        issues: {
          missingDescription: true,
          missingImages: false,
          shortDescription: false,
          noMetaDescription: true
        },
        severity: 'high',
        lastNotified: '2024-01-10T10:00:00Z'
      },
      {
        id: '2',
        title: 'Planta monstera',
        seller: {
          id: 'seller2',
          brandName: 'Green House',
          email: 'info@greenhouse.ro'
        },
        issues: {
          missingDescription: false,
          missingImages: true,
          shortDescription: true,
          noMetaDescription: false
        },
        severity: 'medium'
      },
      {
        id: '3',
        title: 'Fertilizant natural',
        seller: {
          id: 'seller3',
          brandName: 'Eco Garden',
          email: 'hello@ecogarden.ro'
        },
        issues: {
          missingDescription: false,
          missingImages: false,
          shortDescription: true,
          noMetaDescription: false
        },
        severity: 'low'
      }
    ];

    setTimeout(() => {
      setProducts(mockProducts);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'high': return 'Critic';
      case 'medium': return 'Mediu';
      case 'low': return 'Scăzut';
      default: return 'Necunoscut';
    }
  };

  const getIssueIcon = (issue: string) => {
    switch (issue) {
      case 'missingDescription': return <FileText className="h-4 w-4" />;
      case 'missingImages': return <Image className="h-4 w-4" />;
      case 'shortDescription': return <AlertTriangle className="h-4 w-4" />;
      case 'noMetaDescription': return <FileText className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getIssueLabel = (issue: string) => {
    switch (issue) {
      case 'missingDescription': return 'Lipsește descrierea';
      case 'missingImages': return 'Lipsesc imaginile';
      case 'shortDescription': return 'Descriere prea scurtă';
      case 'noMetaDescription': return 'Lipsește meta descrierea';
      default: return 'Problemă necunoscută';
    }
  };

  const handleSelectProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map(p => p.id));
    }
  };

  const handleNotifySellers = async () => {
    if (selectedProducts.length === 0) {
      toast.error('Selectați cel puțin un produs');
      return;
    }

    setIsNotifying(true);
    
    try {
      // Simulare notificare
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Notificări trimise pentru ${selectedProducts.length} produse`);
      
      // Actualizează data notificării
      setProducts(prev => prev.map(product => 
        selectedProducts.includes(product.id)
          ? { ...product, lastNotified: new Date().toISOString() }
          : product
      ));
      
      setSelectedProducts([]);
    } catch (error) {
      toast.error('Eroare la trimiterea notificărilor');
    } finally {
      setIsNotifying(false);
    }
  };

  const highSeverityProducts = products.filter(p => p.severity === 'high');
  const mediumSeverityProducts = products.filter(p => p.severity === 'medium');
  const lowSeverityProducts = products.filter(p => p.severity === 'low');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
        <span className="ml-2 text-gray-600">Se încarcă datele SEO...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total produse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-600">Probleme critice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{highSeverityProducts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-600">Probleme medii</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{mediumSeverityProducts.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-600">Probleme minore</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{lowSeverityProducts.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Alert pentru produse critice */}
      {highSeverityProducts.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {highSeverityProducts.length} produse au probleme critice de SEO care afectează vizibilitatea în motoarele de căutare.
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs pentru severitate */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">Toate ({products.length})</TabsTrigger>
          <TabsTrigger value="high">Critice ({highSeverityProducts.length})</TabsTrigger>
          <TabsTrigger value="medium">Medii ({mediumSeverityProducts.length})</TabsTrigger>
          <TabsTrigger value="low">Minore ({lowSeverityProducts.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <ProductTable 
            products={products}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onSelectAll={handleSelectAll}
            getSeverityColor={getSeverityColor}
            getSeverityLabel={getSeverityLabel}
            getIssueIcon={getIssueIcon}
            getIssueLabel={getIssueLabel}
          />
        </TabsContent>

        <TabsContent value="high" className="space-y-4">
          <ProductTable 
            products={highSeverityProducts}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onSelectAll={handleSelectAll}
            getSeverityColor={getSeverityColor}
            getSeverityLabel={getSeverityLabel}
            getIssueIcon={getIssueIcon}
            getIssueLabel={getIssueLabel}
          />
        </TabsContent>

        <TabsContent value="medium" className="space-y-4">
          <ProductTable 
            products={mediumSeverityProducts}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onSelectAll={handleSelectAll}
            getSeverityColor={getSeverityColor}
            getSeverityLabel={getSeverityLabel}
            getIssueIcon={getIssueIcon}
            getIssueLabel={getIssueLabel}
          />
        </TabsContent>

        <TabsContent value="low" className="space-y-4">
          <ProductTable 
            products={lowSeverityProducts}
            selectedProducts={selectedProducts}
            onSelectProduct={handleSelectProduct}
            onSelectAll={handleSelectAll}
            getSeverityColor={getSeverityColor}
            getSeverityLabel={getSeverityLabel}
            getIssueIcon={getIssueIcon}
            getIssueLabel={getIssueLabel}
          />
        </TabsContent>
      </Tabs>

      {/* Actions */}
      {selectedProducts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Acțiuni pentru produsele selectate</CardTitle>
            <CardDescription>
              {selectedProducts.length} produse selectate pentru notificare
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button 
                onClick={handleNotifySellers}
                disabled={isNotifying}
                className="gap-2"
              >
                <Mail className="h-4 w-4" />
                {isNotifying ? 'Se trimit...' : 'Notifică vânzătorii'}
              </Button>
              <Button 
                variant="outline"
                onClick={() => setSelectedProducts([])}
              >
                Anulează selecția
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ProductTableProps {
  products: ProductSeoIssue[];
  selectedProducts: string[];
  onSelectProduct: (id: string) => void;
  onSelectAll: () => void;
  getSeverityColor: (severity: string) => string;
  getSeverityLabel: (severity: string) => string;
  getIssueIcon: (issue: string) => React.ReactNode;
  getIssueLabel: (issue: string) => string;
}

function ProductTable({ 
  products, 
  selectedProducts, 
  onSelectProduct, 
  onSelectAll,
  getSeverityColor,
  getSeverityLabel,
  getIssueIcon,
  getIssueLabel
}: ProductTableProps) {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nicio problemă găsită</h3>
          <p className="text-gray-600">Toate produsele au datele SEO complete.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Produse cu probleme SEO</CardTitle>
            <CardDescription>
              Selectați produsele pentru a notifica vânzătorii
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onSelectAll}>
            {selectedProducts.length === products.length ? 'Deselectează tot' : 'Selectează tot'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <input
                  type="checkbox"
                  checked={selectedProducts.length === products.length && products.length > 0}
                  onChange={onSelectAll}
                  className="rounded"
                />
              </TableHead>
              <TableHead>Produs</TableHead>
              <TableHead>Vânzător</TableHead>
              <TableHead>Severitate</TableHead>
              <TableHead>Probleme</TableHead>
              <TableHead>Ultima notificare</TableHead>
              <TableHead>Acțiuni</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product.id}>
                <TableCell>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(product.id)}
                    onChange={() => onSelectProduct(product.id)}
                    className="rounded"
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{product.title}</div>
                    <div className="text-sm text-gray-500">ID: {product.id}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <div className="font-medium">{product.seller.brandName}</div>
                    <div className="text-sm text-gray-500">{product.seller.email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={getSeverityColor(product.severity) as any}>
                    {getSeverityLabel(product.severity)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    {Object.entries(product.issues)
                      .filter(([_, hasIssue]) => hasIssue)
                      .map(([issue, _]) => (
                        <div key={issue} className="flex items-center gap-2 text-sm">
                          {getIssueIcon(issue)}
                          {getIssueLabel(issue)}
                        </div>
                      ))}
                  </div>
                </TableCell>
                <TableCell>
                  {product.lastNotified ? (
                    <div className="text-sm text-gray-600">
                      {new Date(product.lastNotified).toLocaleDateString('ro-RO')}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-400">Niciodată</div>
                  )}
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Vezi produs
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

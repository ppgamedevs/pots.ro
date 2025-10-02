'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UITabs } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  RefreshCw,
  Search,
  Image as ImageIcon,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

// Mock data pentru demonstrație
const mockSeoData = {
  sitemaps: {
    lastGenerated: '2024-12-15T10:30:00Z',
    totalUrls: 1247,
    subSitemaps: [
      { name: 'products', urls: 892, lastMod: '2024-12-15T09:15:00Z' },
      { name: 'sellers', urls: 156, lastMod: '2024-12-15T09:20:00Z' },
      { name: 'categories', urls: 23, lastMod: '2024-12-15T09:25:00Z' },
      { name: 'blog', urls: 45, lastMod: '2024-12-15T09:30:00Z' },
    ]
  },
  issues: [
    {
      id: '1',
      type: 'missing_title',
      severity: 'high' as const,
      url: '/p/vaza-ceramic-natur',
      title: 'Lipsește titlul meta',
      description: 'Pagina nu are titlu meta definit',
      count: 12
    },
    {
      id: '2',
      type: 'short_description',
      severity: 'medium' as const,
      url: '/c/ghivece',
      title: 'Descriere prea scurtă',
      description: 'Descrierea meta are mai puțin de 120 caractere',
      count: 8
    },
    {
      id: '3',
      type: 'large_image',
      severity: 'low' as const,
      url: '/p/set-3-ghivece-mici',
      title: 'Imagine prea mare',
      description: 'Imaginea principală depășește 1MB',
      count: 3
    },
    {
      id: '4',
      type: 'missing_alt',
      severity: 'medium' as const,
      url: '/s/atelier-ceramic',
      title: 'Lipsește text alternativ',
      description: 'Imaginile nu au atributul alt',
      count: 15
    }
  ],
  stats: {
    totalPages: 1247,
    indexedPages: 1189,
    issuesCount: 38,
    lastHealthCheck: '2024-12-15T10:00:00Z'
  }
};

interface SeoIssue {
  id: string;
  type: string;
  severity: 'high' | 'medium' | 'low';
  url: string;
  title: string;
  description: string;
  count: number;
}

function SeoIssuesTable({ issues }: { issues: SeoIssue[] }) {
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  
  const filteredIssues = filter === 'all' 
    ? issues 
    : issues.filter(issue => issue.severity === filter);
  
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high':
        return <Badge variant="destructive">Critic</Badge>;
      case 'medium':
        return <Badge variant="secondary">Mediu</Badge>;
      case 'low':
        return <Badge variant="outline">Scăzut</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Toate ({issues.length})
        </Button>
        <Button
          variant={filter === 'high' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('high')}
        >
          Critice ({issues.filter(i => i.severity === 'high').length})
        </Button>
        <Button
          variant={filter === 'medium' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('medium')}
        >
          Medii ({issues.filter(i => i.severity === 'medium').length})
        </Button>
        <Button
          variant={filter === 'low' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('low')}
        >
          Scăzute ({issues.filter(i => i.severity === 'low').length})
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Severitate
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Problemă
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                URL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Instanțe
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {filteredIssues.map((issue) => (
              <tr key={issue.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="px-6 py-4 whitespace-nowrap">
                  {getSeverityBadge(issue.severity)}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {issue.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {issue.description}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <a
                    href={issue.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {issue.url}
                    <ExternalLink className="inline h-3 w-3 ml-1" />
                  </a>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                  {issue.count}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function SeoPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(mockSeoData);
  
  const handleRefresh = async () => {
    setLoading(true);
    try {
      // Simulează refresh-ul datelor
      await new Promise(resolve => setTimeout(resolve, 2000));
      setData({
        ...mockSeoData,
        stats: {
          ...mockSeoData.stats,
          lastHealthCheck: new Date().toISOString()
        }
      });
      toast.success('Datele SEO au fost actualizate');
    } catch (error) {
      toast.error('Eroare la actualizarea datelor SEO');
    } finally {
      setLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('ro-RO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Dashboard SEO
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitorizează și optimizează SEO-ul site-ului Pots.ro
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total pagini</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.stats.totalPages.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {data.stats.indexedPages} indexate
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Probleme SEO</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.stats.issuesCount}</div>
            <p className="text-xs text-muted-foreground">
              Necesită atenție
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sitemaps</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.sitemaps.totalUrls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              URL-uri în sitemap
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ultima verificare</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-sm font-bold">
              {formatDate(data.stats.lastHealthCheck)}
            </div>
            <p className="text-xs text-muted-foreground">
              Health check
            </p>
          </CardContent>
        </Card>
      </div>
      
      <UITabs
        defaultValue="sitemaps"
        tabs={[
          {
            value: 'sitemaps',
            label: 'Sitemaps',
            content: (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Sitemaps
                    </CardTitle>
                    <CardDescription>
                      Sitemaps generate automat pentru indexarea în motoarele de căutare
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Ultima regenerare: {formatDate(data.sitemaps.lastGenerated)}
                        </p>
                      </div>
                      <Button onClick={handleRefresh} disabled={loading}>
                        {loading ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Se actualizează...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Rulează verificarea
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Sitemap principal</h4>
                        <a
                          href="/sitemap.xml"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                        >
                          /sitemap.xml
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                      
                      {data.sitemaps.subSitemaps.map((sitemap) => (
                        <div key={sitemap.name} className="space-y-2">
                          <h4 className="font-medium capitalize">{sitemap.name}</h4>
                          <div className="space-y-1">
                            <a
                              href={`/sitemaps/${sitemap.name}.xml`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                            >
                              /sitemaps/{sitemap.name}.xml
                              <ExternalLink className="h-3 w-3" />
                            </a>
                            <p className="text-xs text-muted-foreground">
                              {sitemap.urls} URL-uri • {formatDate(sitemap.lastMod)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          },
          {
            value: 'issues',
            label: 'Probleme SEO',
            content: (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5" />
                      Probleme SEO
                    </CardTitle>
                    <CardDescription>
                      Probleme identificate care pot afecta SEO-ul site-ului
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SeoIssuesTable issues={data.issues} />
                  </CardContent>
                </Card>
              </div>
            )
          },
          {
            value: 'images',
            label: 'Imagini',
            content: (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ImageIcon className="h-5 w-5" />
                      Optimizare imagini
                    </CardTitle>
                    <CardDescription>
                      Imagini care necesită optimizare pentru performanță
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Scanarea imaginilor se face automat. Imagini mai mari de 1MB sunt identificate și pot fi optimizate.
                      </AlertDescription>
                    </Alert>
                    
                    <div className="mt-4 space-y-2">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <ImageIcon className="h-5 w-5 text-orange-500" />
                          <div>
                            <p className="font-medium">Imagini mari (&gt;1MB)</p>
                            <p className="text-sm text-muted-foreground">3 imagini identificate</p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Optimizează
                        </Button>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">Imagini optimizate</p>
                            <p className="text-sm text-muted-foreground">1,244 imagini procesate</p>
                          </div>
                        </div>
                        <Badge variant="outline" className="bg-green-50 text-green-700">
                          OK
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          }
        ]}
      />
    </div>
  );
}

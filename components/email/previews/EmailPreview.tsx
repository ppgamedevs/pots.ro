'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UITabs } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Download, Mail } from 'lucide-react';
import { toast } from 'sonner';

// Import template-urile de email
import { HtmlContent as OrderPaidHtml, Subject as OrderPaidSubject, TextContent as OrderPaidText } from '@/lib/email/templates/OrderPaid';
import { HtmlContent as OrderShippedHtml, Subject as OrderShippedSubject, TextContent as OrderShippedText } from '@/lib/email/templates/OrderShipped';
import { OrderDeliveredEmail, Subject as OrderDeliveredSubject, TextContent as OrderDeliveredText } from '@/lib/email/templates/OrderDelivered';
import { MessageCreatedEmail, Subject as MessageCreatedSubject, TextContent as MessageCreatedText } from '@/lib/email/templates/MessageCreated';

interface EmailPreviewProps {
  template: 'OrderPaid' | 'OrderShipped' | 'OrderDelivered' | 'MessageCreated';
  data: any;
  darkMode?: boolean;
}

export function EmailPreview({ template, data, darkMode = false }: EmailPreviewProps) {
  const [isDarkMode, setIsDarkMode] = useState(darkMode);
  
  const getTemplateComponent = () => {
    switch (template) {
      case 'OrderPaid':
        return <OrderPaidHtml {...data} />;
      case 'OrderShipped':
        return <OrderShippedHtml {...data} />;
      case 'OrderDelivered':
        return <OrderDeliveredEmail {...data} />;
      case 'MessageCreated':
        return <MessageCreatedEmail {...data} />;
      default:
        return null;
    }
  };
  
  const getSubject = () => {
    switch (template) {
      case 'OrderPaid':
        return OrderPaidSubject(data);
      case 'OrderShipped':
        return OrderShippedSubject(data);
      case 'OrderDelivered':
        return OrderDeliveredSubject(data);
      case 'MessageCreated':
        return MessageCreatedSubject(data);
      default:
        return '';
    }
  };
  
  const getTextContent = () => {
    switch (template) {
      case 'OrderPaid':
        return OrderPaidText(data);
      case 'OrderShipped':
        return OrderShippedText(data);
      case 'OrderDelivered':
        return OrderDeliveredText(data);
      case 'MessageCreated':
        return MessageCreatedText(data);
      default:
        return '';
    }
  };
  
  const handleDownloadHTML = () => {
    const htmlContent = getTemplateComponent();
    const blob = new Blob([htmlContent?.toString() || ''], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.toLowerCase()}-email.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Email HTML descărcat');
  };
  
  const handleDownloadText = () => {
    const textContent = getTextContent();
    const blob = new Blob([textContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${template.toLowerCase()}-email.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Email text descărcat');
  };
  
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Preview Email - {template}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {isDarkMode ? 'Dark Mode' : 'Light Mode'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDarkMode(!isDarkMode)}
            >
              {isDarkMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              {isDarkMode ? 'Light' : 'Dark'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <UITabs
          defaultValue="preview"
          tabs={[
            {
              value: 'preview',
              label: 'Preview',
              content: (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Subiect: {getSubject()}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadHTML}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          HTML
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownloadText}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          Text
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div 
                    className={`p-4 ${isDarkMode ? 'bg-gray-900' : 'bg-white'}`}
                    style={{ minHeight: '400px' }}
                  >
                    <div className="max-w-2xl mx-auto">
                      {getTemplateComponent()}
                    </div>
                  </div>
                </div>
              )
            },
            {
              value: 'html',
              label: 'HTML',
              content: (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">HTML Source</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadHTML}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Descarcă
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-4">
                    <pre className="text-xs overflow-x-auto">
                      <code>{getTemplateComponent()?.toString()}</code>
                    </pre>
                  </div>
                </div>
              )
            },
            {
              value: 'text',
              label: 'Text',
              content: (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 border-b">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Text Version</div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadText}
                      >
                        <Download className="h-4 w-4 mr-1" />
                        Descarcă
                      </Button>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 dark:bg-gray-900 p-4">
                    <pre className="text-sm whitespace-pre-wrap font-mono">
                      {getTextContent()}
                    </pre>
                  </div>
                </div>
              )
            }
          ]}
        />
      </CardContent>
    </Card>
  );
}

// Component pentru preview-ul tuturor template-urilor
export function AllEmailPreviews() {
  const mockData = {
    OrderPaid: {
      orderId: 'ORD-12345678',
      buyerName: 'Maria Popescu',
      total: 12900, // 129.00 RON în cenți
      currency: 'RON',
      invoiceUrl: 'https://floristmarket.ro/api/invoices/inv-123/pdf'
    },
    OrderShipped: {
      orderId: 'ORD-12345678',
      buyerName: 'Maria Popescu',
      awbNumber: 'AWB-987654321',
      carrier: 'Cargus',
      trackingUrl: 'https://cargus.ro/track/AWB-987654321'
    },
    OrderDelivered: {
      orderId: 'ORD-12345678',
      buyerName: 'Maria Popescu',
      reviewUrl: 'https://floristmarket.ro/orders/ORD-12345678/review'
    },
    MessageCreated: {
      orderId: 'ORD-12345678',
      buyerName: 'Maria Popescu',
      sellerName: 'Atelier Ceramic',
      messagePreview: 'Mulțumesc pentru comandă! Produsul va fi pregătit în 2-3 zile.',
      conversationUrl: 'https://floristmarket.ro/orders/ORD-12345678/messages'
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Email Templates Preview</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Previzualizare template-uri email pentru FloristMarket.ro
        </p>
      </div>
      
      {Object.entries(mockData).map(([template, data]) => (
        <EmailPreview
          key={template}
          template={template as any}
          data={data}
        />
      ))}
    </div>
  );
}

'use client';

/**
 * Dialog pentru import produse CSV
 * Drag & drop, preview și confirmare import
 */

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ImportPreviewRow, ImportResult } from '@/app/api/seller/products/import/route';

interface CsvImportDialogProps {
  onImportComplete?: (result: ImportResult) => void;
}

export function CsvImportDialog({ onImportComplete }: CsvImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreviewRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  // Reset state când se deschide dialog-ul
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setCsvFile(null);
      setPreview([]);
      setIsLoading(false);
      setIsImporting(false);
      setImportProgress(0);
    }
  };

  // Handle file drop
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Vă rugăm să selectați un fișier CSV');
      return;
    }

    setCsvFile(file);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('csv', file);
      formData.append('action', 'preview');

      const response = await fetch('/api/seller/products/import', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.ok) {
        setPreview(result.data.preview);
        toast.success(`Preview generat: ${result.data.validRows} rânduri valide din ${result.data.totalRows} total`);
      } else {
        toast.error(result.error || 'Eroare la generarea preview-ului');
        setCsvFile(null);
      }
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Eroare de rețea');
      setCsvFile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv']
    },
    multiple: false
  });

  // Handle import
  const handleImport = async () => {
    if (!csvFile) return;

    setIsImporting(true);
    setImportProgress(0);

    try {
      const formData = new FormData();
      formData.append('csv', csvFile);
      formData.append('action', 'import');

      const response = await fetch('/api/seller/products/import', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.ok) {
        const importResult: ImportResult = result.data;
        setImportProgress(100);
        
        toast.success(
          `Import completat: ${importResult.successCount} produse importate, ${importResult.errorCount} erori`
        );

        if (onImportComplete) {
          onImportComplete(importResult);
        }

        // Închide dialog-ul după 2 secunde
        setTimeout(() => {
          handleOpenChange(false);
        }, 2000);
      } else {
        toast.error(result.error || 'Eroare la importul produselor');
      }
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Eroare de rețea');
    } finally {
      setIsImporting(false);
    }
  };

  const validRows = preview.filter(row => row.valid).length;
  const errorRows = preview.filter(row => !row.valid).length;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import produse din CSV</DialogTitle>
          <DialogDescription>
            Încărcați un fișier CSV cu produsele dvs. Formatul trebuie să conțină: title, description, price, stock, category_slug, image_url
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Upload Zone */}
          {!csvFile && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                {isDragActive ? 'Eliberați fișierul aici' : 'Trageți fișierul CSV aici'}
              </p>
              <p className="text-sm text-gray-500">
                sau faceți clic pentru a selecta
              </p>
            </div>
          )}

          {/* File Info */}
          {csvFile && (
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <FileText className="h-8 w-8 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium">{csvFile.name}</p>
                <p className="text-sm text-gray-500">
                  {(csvFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCsvFile(null);
                  setPreview([]);
                }}
              >
                Elimină
              </Button>
            </div>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-4"></div>
              <p>Se procesează fișierul...</p>
            </div>
          )}

          {/* Preview Table */}
          {preview.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Preview import</h3>
                <div className="flex gap-2">
                  <Badge variant={validRows > 0 ? 'default' : 'destructive'}>
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {validRows} valide
                  </Badge>
                  {errorRows > 0 && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      {errorRows} erori
                    </Badge>
                  )}
                </div>
              </div>

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Linia</TableHead>
                      <TableHead>Titlu</TableHead>
                      <TableHead>Preț</TableHead>
                      <TableHead>Stoc</TableHead>
                      <TableHead>Categorie</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.map((row) => (
                      <TableRow key={row.line}>
                        <TableCell className="font-mono text-sm">
                          {row.line}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {row.data?.title || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {row.data?.price ? `${row.data.price} RON` : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {row.data?.stock ?? 'N/A'}
                        </TableCell>
                        <TableCell className="max-w-xs truncate">
                          {row.data?.category_slug || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {row.valid ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Valid
                            </Badge>
                          ) : (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              {row.errors.length} erori
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Error Details */}
              {preview.some(row => !row.valid) && (
                <div className="space-y-2">
                  <h4 className="font-medium text-red-600">Detalii erori:</h4>
                  {preview
                    .filter(row => !row.valid)
                    .map((row) => (
                      <div key={row.line} className="text-sm text-red-600 bg-red-50 p-2 rounded">
                        <strong>Linia {row.line}:</strong> {row.errors.join(', ')}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Import Progress */}
          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-500"></div>
                <span>Se importă produsele...</span>
              </div>
              <Progress value={importProgress} className="w-full" />
            </div>
          )}

          {/* Actions */}
          {preview.length > 0 && !isImporting && (
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                Anulează
              </Button>
              <Button
                onClick={handleImport}
                disabled={validRows === 0}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Importă {validRows} produse
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

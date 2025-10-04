/**
 * API pentru import produse CSV
 * Acceptă upload CSV, validează și salvează produse ca draft
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import { db } from '@/lib/db';
import { products, categories, sellers } from '@/db/schema/core';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

// Types pentru CSV import
export type ImportPreviewRow = {
  line: number;
  valid: boolean;
  errors: string[];
  data?: {
    title: string;
    description: string;
    price: number;
    stock: number;
    category_slug: string;
    image_url: string;
  };
};

export type ImportResult = {
  successCount: number;
  errorCount: number;
  draftIds: string[];
};

// Supabase client pentru storage
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key'
);

// Helper pentru descărcarea și stocarea imaginilor
async function downloadAndStoreImage(imageUrl: string, productId: string): Promise<string | null> {
  try {
    // Descarcă imaginea
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const extension = contentType.split('/')[1] || 'jpg';
    
    // Generează nume unic pentru fișier
    const fileName = `${productId}/main.${extension}`;
    
    // Upload la Supabase Storage
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(fileName, imageBuffer, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('Supabase upload error:', error);
      return null;
    }

    // Returnează URL public
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(fileName);

    return publicUrl;
  } catch (error) {
    console.error('Image download/store error:', error);
    return null;
  }
}

// Helper pentru validarea unei linii CSV
function validateCsvRow(row: any, line: number): ImportPreviewRow {
  const errors: string[] = [];
  
  // Verifică câmpurile obligatorii
  if (!row.title || typeof row.title !== 'string' || row.title.trim().length === 0) {
    errors.push('Titlul este obligatoriu');
  }
  
  if (!row.description || typeof row.description !== 'string' || row.description.trim().length === 0) {
    errors.push('Descrierea este obligatorie');
  }
  
  if (!row.price || isNaN(parseFloat(row.price)) || parseFloat(row.price) <= 0) {
    errors.push('Prețul trebuie să fie un număr pozitiv');
  }
  
  if (!row.stock || isNaN(parseInt(row.stock)) || parseInt(row.stock) < 0) {
    errors.push('Stocul trebuie să fie un număr întreg pozitiv sau zero');
  }
  
  if (!row.category_slug || typeof row.category_slug !== 'string' || row.category_slug.trim().length === 0) {
    errors.push('Slug-ul categoriei este obligatoriu');
  }
  
  if (!row.image_url || typeof row.image_url !== 'string' || row.image_url.trim().length === 0) {
    errors.push('URL-ul imaginii este obligatoriu');
  } else {
    // Validează URL-ul imaginii
    try {
      new URL(row.image_url);
    } catch {
      errors.push('URL-ul imaginii nu este valid');
    }
  }

  return {
    line,
    valid: errors.length === 0,
    errors,
    data: errors.length === 0 ? {
      title: row.title.trim(),
      description: row.description.trim(),
      price: parseFloat(row.price),
      stock: parseInt(row.stock),
      category_slug: row.category_slug.trim(),
      image_url: row.image_url.trim()
    } : undefined
  };
}

// Helper pentru parsarea CSV
function parseCsv(csvContent: string): any[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Parsează header-ul
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  // Verifică că header-ul conține câmpurile necesare
  const requiredFields = ['title', 'description', 'price', 'stock', 'category_slug', 'image_url'];
  const missingFields = requiredFields.filter(field => !headers.includes(field));
  
  if (missingFields.length > 0) {
    throw new Error(`Header-ul CSV lipsește câmpurile: ${missingFields.join(', ')}`);
  }

  // Parsează rândurile
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};
    
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    
    rows.push(row);
  }

  return rows;
}

// POST - Import CSV
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Neautorizat' }, { status: 401 });
    }

    // Verifică dacă user-ul este seller
    const seller = await db.query.sellers.findFirst({
      where: eq(sellers.userId, session.user.id)
    });

    if (!seller) {
      return NextResponse.json({ error: 'Nu sunteți vânzător' }, { status: 403 });
    }

    const formData = await request.formData();
    const csvFile = formData.get('csv') as File;
    const action = formData.get('action') as string;

    if (!csvFile) {
      return NextResponse.json({ error: 'Fișierul CSV este obligatoriu' }, { status: 400 });
    }

    const csvContent = await csvFile.text();

    if (action === 'preview') {
      // Preview mode - returnează primele 10 rânduri validate
      try {
        const rows = parseCsv(csvContent);
        const previewRows: ImportPreviewRow[] = [];
        
        // Validează primele 10 rânduri
        for (let i = 0; i < Math.min(10, rows.length); i++) {
          const validation = validateCsvRow(rows[i], i + 2); // +2 pentru header și indexare de la 1
          previewRows.push(validation);
        }

        return NextResponse.json({
          ok: true,
          data: {
            preview: previewRows,
            totalRows: rows.length,
            validRows: previewRows.filter(r => r.valid).length,
            errorRows: previewRows.filter(r => !r.valid).length
          }
        });
      } catch (error) {
        return NextResponse.json({
          ok: false,
          error: error instanceof Error ? error.message : 'Eroare la parsarea CSV'
        }, { status: 400 });
      }
    }

    if (action === 'import') {
      // Import mode - salvează produsele
      try {
        const rows = parseCsv(csvContent);
        const results: ImportResult = {
          successCount: 0,
          errorCount: 0,
          draftIds: []
        };

        // Verifică categoriile existente
        const existingCategories = await db.query.categories.findMany();
        const categorySlugs = new Set(existingCategories.map(c => c.slug));

        for (let i = 0; i < rows.length; i++) {
          const validation = validateCsvRow(rows[i], i + 2);
          
          if (!validation.valid) {
            results.errorCount++;
            continue;
          }

          const data = validation.data!;

          // Verifică dacă categoria există
          if (!categorySlugs.has(data.category_slug)) {
            results.errorCount++;
            continue;
          }

          try {
            // Creează produsul
            const [product] = await db.insert(products).values({
              title: data.title,
              description: data.description,
              priceCents: Math.round(data.price * 100), // Convert to cents
              stock: data.stock,
              status: 'draft',
              sellerId: seller.id,
              categoryId: existingCategories.find(c => c.slug === data.category_slug)!.id,
              slug: data.title
                .toLowerCase()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .trim(),
              imageUrl: data.image_url,
              createdAt: new Date(),
              updatedAt: new Date()
            }).returning();

            // Descarcă și stochează imaginea
            const imageUrl = await downloadAndStoreImage(data.image_url, product.id);
            
            if (imageUrl) {
              // Actualizează produsul cu imaginea
              await db.update(products)
                .set({ 
                  imageUrl: imageUrl,
                  updatedAt: new Date()
                })
                .where(eq(products.id, product.id));
            }

            results.successCount++;
            results.draftIds.push(product.id);
          } catch (error) {
            console.error(`Error importing product at line ${i + 2}:`, error);
            results.errorCount++;
          }
        }

        return NextResponse.json({
          ok: true,
          data: results
        });
      } catch (error) {
        return NextResponse.json({
          ok: false,
          error: error instanceof Error ? error.message : 'Eroare la importul CSV'
        }, { status: 400 });
      }
    }

    return NextResponse.json({ error: 'Acțiune invalidă' }, { status: 400 });
  } catch (error) {
    console.error('CSV import error:', error);
    return NextResponse.json({
      ok: false,
      error: 'Eroare internă a serverului'
    }, { status: 500 });
  }
}

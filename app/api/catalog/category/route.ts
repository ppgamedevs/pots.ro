import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productImages, sellers, categories } from "@/db/schema/core";
import { eq, and, desc, asc, ilike, or, sql } from "drizzle-orm";
import type { InferSelectModel } from "drizzle-orm";

export const dynamic = 'force-dynamic';

export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  oldPrice?: number;
  images: {
    src: string;
    alt: string;
  }[];
  seller: {
    name: string;
    href: string;
  };
  stockLabel: string;
  stock?: number; // Stock quantity
  badges?: string[];
  rating?: number;
  reviewCount?: number;
  attributes: {
    label: string;
    value: string;
  }[];
  category: string;
  tags: string[];
}

export interface Facet {
  key: string;
  label: string;
  type: 'checkbox' | 'range' | 'select';
  options: {
    value: string;
    label: string;
    count: number;
  }[];
}

export interface CategoryResponse {
  items: Product[];
  total: number;
  facets: Facet[];
  currentPage: number;
  totalPages: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const sort = searchParams.get('sort') || 'relevance';
    const filters = searchParams.get('filters') || '{}';

    // Try to fetch real products from database first
    try {
      // Find category by slug
      const categoryResult = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);

      const category = categoryResult[0];

      // Build conditions
      const conditions = [eq(products.status, 'active')];
      
      if (category) {
        conditions.push(eq(products.categoryId, category.id));
      }

      // Apply filters (simplified - can be extended)
      const parsedFilters = JSON.parse(filters);
      if (parsedFilters.brand && parsedFilters.brand.length > 0) {
        // Filter by seller brand name would require additional join logic
        // For now, we'll skip this filter when using real data
      }

      // Build order by clause
      let orderByClause;
      if (sort === "price_asc") {
        orderByClause = asc(products.priceCents);
      } else if (sort === "price_desc") {
        orderByClause = desc(products.priceCents);
      } else if (sort === "newest" || sort === "recent") {
        orderByClause = desc(products.createdAt);
      } else {
        orderByClause = desc(products.createdAt);
      }

      // Get total count
      const totalResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(...conditions));
      const total = Number(totalResult[0]?.count || 0);

      // Pagination
      const itemsPerPage = 24;
      const totalPages = Math.ceil(total / itemsPerPage);
      const startIndex = (page - 1) * itemsPerPage;

      // Fetch products
      const result = await db
        .select({
          product: products,
          seller: sellers,
          category: categories,
        })
        .from(products)
        .innerJoin(sellers, eq(products.sellerId, sellers.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .where(and(...conditions))
        .orderBy(orderByClause)
        .limit(itemsPerPage)
        .offset(startIndex);

      // Transform to match expected format
      const dbProducts: Product[] = await Promise.all(
        result.map(async ({ product, seller, category: cat }: {
          product: InferSelectModel<typeof products>;
          seller: InferSelectModel<typeof sellers>;
          category: InferSelectModel<typeof categories> | null;
        }) => {
          // Get primary image
          const images = await db
            .select()
            .from(productImages)
            .where(
              and(
                eq(productImages.productId, product.id),
                eq(productImages.isPrimary, true)
              )
            )
            .limit(1);

          const rawImageUrl = images[0]?.url || product.imageUrl;
          const imageUrl = rawImageUrl && rawImageUrl !== '/placeholder.png' ? rawImageUrl : '/placeholder.svg';
          const imageAlt = images[0]?.alt || product.title;

          // Determine stock label and badges
          const stockLabel = product.stock > 10 ? 'În stoc' : product.stock > 0 ? 'Stoc redus' : 'Stoc epuizat';
          const badges: string[] = [];
          if (product.stock < 5 && product.stock > 0) {
            badges.push('stoc redus');
          }

          return {
            id: product.id,
            slug: product.slug,
            title: product.title,
            description: product.description || '',
            price: product.priceCents / 100,
            images: [
              { src: imageUrl, alt: imageAlt }
            ],
            seller: {
              name: seller.brandName,
              href: `/s/${seller.slug}`
            },
            stockLabel,
            stock: product.stock, // Add stock quantity
            badges: badges.length > 0 ? badges : undefined,
            rating: undefined,
            reviewCount: undefined,
            attributes: Object.entries(product.attributes as Record<string, any> || {}).map(([key, value]) => ({
              label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
              value: String(value),
            })),
            category: cat?.slug || '',
            tags: [],
          };
        })
      );

      // Mock facets (can be replaced with real facets later)
      const mockFacets: Facet[] = [
        {
          key: 'price',
          label: 'Preț',
          type: 'range',
          options: [
            { value: '0-50', label: 'Sub 50 lei', count: 0 },
            { value: '50-100', label: '50-100 lei', count: 0 },
            { value: '100-200', label: '100-200 lei', count: 0 },
            { value: '200+', label: 'Peste 200 lei', count: 0 }
          ]
        },
        {
          key: 'availability',
          label: 'Disponibilitate',
          type: 'checkbox',
          options: [
            { value: 'in-stock', label: 'În stoc', count: 0 },
            { value: 'low-stock', label: 'Stoc redus', count: 0 }
          ]
        }
      ];

      const response: CategoryResponse = {
        items: dbProducts,
        total,
        facets: mockFacets,
        currentPage: page,
        totalPages
      };

      return NextResponse.json(response);
    } catch (dbError) {
      console.error('Database query error, falling back to mock data:', dbError);
      // Fall through to mock data if database query fails
    }

    // Fallback to mock data if database query fails
    const mockProducts: Product[] = [
      {
        id: '1',
        slug: 'ghiveci-ceramic-alb-modern',
        title: 'Ghiveci ceramic alb cu model floral modern',
        description: 'Ghiveci din ceramică de calitate superioară, perfect pentru plante de interior. Design modern cu model floral subtil.',
        price: 45,
        oldPrice: 60,
        images: [
          { src: '/placeholder.svg', alt: 'Ghiveci ceramic alb - vedere frontală' },
          { src: '/placeholder.svg', alt: 'Ghiveci ceramic alb - vedere laterală' },
          { src: '/placeholder.svg', alt: 'Ghiveci ceramic alb - detalii' }
        ],
        seller: {
          name: 'FloralDesign',
          href: '/s/floral-design'
        },
        stockLabel: 'În stoc',
        badges: ['Nou', 'Reducere'],
        rating: 4.5,
        reviewCount: 23,
        attributes: [
          { label: 'Material', value: 'Ceramică' },
          { label: 'Dimensiuni', value: '20x15 cm' },
          { label: 'Culoare', value: 'Alb' },
          { label: 'Drenaj', value: 'Da' }
        ],
        category: 'ghivece',
        tags: ['ceramic', 'alb', 'modern', 'interior']
      },
      {
        id: '2',
        slug: 'cutie-rotunda-lemn-stejar',
        title: 'Cutie rotundă din lemn de stejar natural',
        description: 'Cutie elegantă din lemn de stejar, perfectă pentru aranjamente florale sau ca element decorativ.',
        price: 89,
        images: [
          { src: '/placeholder.svg', alt: 'Cutie lemn stejar - vedere de sus' },
          { src: '/placeholder.svg', alt: 'Cutie lemn stejar - vedere laterală' }
        ],
        seller: {
          name: 'WoodCraft',
          href: '/s/wood-craft'
        },
        stockLabel: 'În stoc',
        badges: ['Nou'],
        rating: 4.8,
        reviewCount: 15,
        attributes: [
          { label: 'Material', value: 'Lemn de stejar' },
          { label: 'Dimensiuni', value: '25x25x15 cm' },
          { label: 'Finisaj', value: 'Natural' },
          { label: 'Tip', value: 'Rotund' }
        ],
        category: 'cutii',
        tags: ['lemn', 'stejar', 'rotund', 'natural']
      },
      {
        id: '3',
        slug: 'set-unelte-gradinarit-profesional',
        title: 'Set unelte pentru grădinărit profesional',
        description: 'Set complet de unelte pentru grădinărit, incluzând greblă, sapă și cultivator.',
        price: 125,
        oldPrice: 150,
        images: [
          { src: '/placeholder.svg', alt: 'Set unelte grădinărit' },
          { src: '/placeholder.svg', alt: 'Detalii unelte' }
        ],
        seller: {
          name: 'GardenPro',
          href: '/s/garden-pro'
        },
        stockLabel: 'Stoc redus',
        badges: ['Reducere'],
        rating: 4.2,
        reviewCount: 8,
        attributes: [
          { label: 'Material', value: 'Oțel inoxidabil' },
          { label: 'Set', value: '3 unelte' },
          { label: 'Maner', value: 'Lemn tratat' },
          { label: 'Garantie', value: '2 ani' }
        ],
        category: 'accesorii',
        tags: ['unelte', 'grădinărit', 'profesional', 'set']
      }
    ];

    // Mock facets pentru filtrare
    const mockFacets: Facet[] = [
      {
        key: 'brand',
        label: 'Brand',
        type: 'checkbox',
        options: [
          { value: 'floral-design', label: 'FloralDesign', count: 12 },
          { value: 'wood-craft', label: 'WoodCraft', count: 8 },
          { value: 'garden-pro', label: 'GardenPro', count: 15 }
        ]
      },
      {
        key: 'price',
        label: 'Preț',
        type: 'range',
        options: [
          { value: '0-50', label: 'Sub 50 lei', count: 8 },
          { value: '50-100', label: '50-100 lei', count: 12 },
          { value: '100-200', label: '100-200 lei', count: 6 },
          { value: '200+', label: 'Peste 200 lei', count: 4 }
        ]
      },
      {
        key: 'availability',
        label: 'Disponibilitate',
        type: 'checkbox',
        options: [
          { value: 'in-stock', label: 'În stoc', count: 25 },
          { value: 'low-stock', label: 'Stoc redus', count: 5 }
        ]
      },
      {
        key: 'material',
        label: 'Material',
        type: 'checkbox',
        options: [
          { value: 'ceramic', label: 'Ceramică', count: 10 },
          { value: 'wood', label: 'Lemn', count: 8 },
          { value: 'metal', label: 'Metal', count: 7 },
          { value: 'plastic', label: 'Plastic', count: 5 }
        ]
      }
    ];

    // Simulare filtrare și sortare
    let filteredProducts = [...mockProducts];
    
    // Aplicare filtre (simplificat)
    const parsedFilters = JSON.parse(filters);
    if (parsedFilters.brand && parsedFilters.brand.length > 0) {
      filteredProducts = filteredProducts.filter(product => 
        parsedFilters.brand.includes(product.seller.name.toLowerCase().replace(' ', '-'))
      );
    }

    // Sortare
    switch (sort) {
      case 'price_asc':
        filteredProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filteredProducts.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filteredProducts.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'rating':
        filteredProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
    }

    // Paginare
    const itemsPerPage = 24;
    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / itemsPerPage);
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    const response: CategoryResponse = {
      items: paginatedProducts,
      total,
      facets: mockFacets,
      currentPage: page,
      totalPages
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching category products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch category products' },
      { status: 500 }
    );
  }
}

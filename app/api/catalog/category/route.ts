import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productImages, sellers, categories } from "@/db/schema/core";
import { eq, and } from "drizzle-orm";
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

    // Fetch products from database if category slug is provided
    let result: Array<{
      product: InferSelectModel<typeof products>;
      seller: InferSelectModel<typeof sellers>;
      category: InferSelectModel<typeof categories> | null;
    }> = [];

    if (slug) {
      // Find category by slug
      const categoryData = await db
        .select()
        .from(categories)
        .where(eq(categories.slug, slug))
        .limit(1);

      if (categoryData.length > 0) {
        const categoryId = categoryData[0].id;
        
        // Fetch products for this category
        result = await db
          .select({
            product: products,
            seller: sellers,
            category: categories,
          })
          .from(products)
          .innerJoin(sellers, eq(products.sellerId, sellers.id))
          .leftJoin(categories, eq(products.categoryId, categories.id))
          .where(
            and(
              eq(products.categoryId, categoryId),
              eq(products.status, 'active')
            )
          );
      }
    }

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

        const imageUrl = images[0]?.url || product.imageUrl || '/placeholder.png';
        const imageAlt = images[0]?.alt || product.title;

        return {
          id: product.id,
          slug: product.slug,
          title: product.title,
          description: product.description || '',
          price: product.priceCents / 100,
          oldPrice: undefined,
          images: [{ src: imageUrl, alt: imageAlt }],
          seller: {
            name: seller.brandName,
            href: `/s/${seller.slug}`,
          },
          stockLabel: product.stock > 10 ? 'În stoc' : product.stock > 0 ? 'Stoc redus' : 'Stoc epuizat',
          badges: product.stock < 5 ? ['Stoc redus'] : [],
          attributes: Object.entries(product.attributes as Record<string, any> || {}).map(([key, value]) => ({
            label: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
            value: String(value),
          })),
          category: cat?.slug || 'uncategorized',
          tags: [],
        };
      })
    );

    // Mock data pentru categorii (fallback if no database results)
    const mockProducts: Product[] = [
      {
        id: '1',
        slug: 'ghiveci-ceramic-alb-modern',
        title: 'Ghiveci ceramic alb cu model floral modern',
        description: 'Ghiveci din ceramică de calitate superioară, perfect pentru plante de interior. Design modern cu model floral subtil.',
        price: 45,
        oldPrice: 60,
        images: [
          { src: '/placeholder.png', alt: 'Ghiveci ceramic alb - vedere frontală' },
          { src: '/placeholder.png', alt: 'Ghiveci ceramic alb - vedere laterală' },
          { src: '/placeholder.png', alt: 'Ghiveci ceramic alb - detalii' }
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
          { src: '/placeholder.png', alt: 'Cutie lemn stejar - vedere de sus' },
          { src: '/placeholder.png', alt: 'Cutie lemn stejar - vedere laterală' }
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
          { src: '/placeholder.png', alt: 'Set unelte grădinărit' },
          { src: '/placeholder.png', alt: 'Detalii unelte' }
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

    // Use database products if available, otherwise use mock data
    let filteredProducts = dbProducts.length > 0 ? [...dbProducts] : [...mockProducts];
    
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

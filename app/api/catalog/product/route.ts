import { NextRequest, NextResponse } from "next/server";

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

export interface ProductResponse {
  product: Product;
  similar: Product[];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug') || '';

    // Mock data pentru produse
    const mockProducts: Product[] = [
      {
        id: '1',
        slug: 'ghiveci-ceramic-alb-modern',
        title: 'Ghiveci ceramic alb cu model floral modern',
        description: 'Ghiveci din ceramică de calitate superioară, perfect pentru plante de interior. Design modern cu model floral subtil care se potrivește cu orice stil de decor. Produsul este realizat manual de artizani experimentați, garantând calitatea și durabilitatea. Include găuri de drenaj pentru sănătatea plantelor și poate fi folosit atât în interior, cât și în exterior.',
        price: 45,
        oldPrice: 60,
        images: [
          { src: '/placeholder.png', alt: 'Ghiveci ceramic alb - vedere frontală' },
          { src: '/placeholder.png', alt: 'Ghiveci ceramic alb - vedere laterală' },
          { src: '/placeholder.png', alt: 'Ghiveci ceramic alb - detalii model' },
          { src: '/placeholder.png', alt: 'Ghiveci ceramic alb - cu plantă' }
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
          { label: 'Material', value: 'Ceramică de calitate superioară' },
          { label: 'Dimensiuni', value: '20x15x12 cm' },
          { label: 'Culoare', value: 'Alb cu model floral' },
          { label: 'Drenaj', value: 'Da, 2 găuri' },
          { label: 'Greutate', value: '850g' },
          { label: 'Origine', value: 'România' },
          { label: 'Garantie', value: '2 ani' },
          { label: 'Îngrijire', value: 'Spălare cu apă caldă' }
        ],
        category: 'ghivece',
        tags: ['ceramic', 'alb', 'modern', 'interior', 'floral']
      },
      {
        id: '2',
        slug: 'cutie-rotunda-lemn-stejar',
        title: 'Cutie rotundă din lemn de stejar natural',
        description: 'Cutie elegantă din lemn de stejar, perfectă pentru aranjamente florale sau ca element decorativ. Finisaj natural care evidențiază frumusețea lemnului.',
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

    // Găsește produsul după slug
    const product = mockProducts.find(p => p.slug === slug);
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Produse similare (din aceeași categorie sau cu tag-uri similare)
    const similar = mockProducts
      .filter(p => p.id !== product.id && (
        p.category === product.category || 
        p.tags.some(tag => product.tags.includes(tag))
      ))
      .slice(0, 4);

    const response: ProductResponse = {
      product,
      similar
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

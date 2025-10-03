import { NextResponse } from "next/server";

export interface FeaturedProduct {
  id: string;
  image: {
    src: string;
    alt: string;
  };
  title: string;
  seller: string;
  price: number;
  oldPrice?: number;
  badge?: 'nou' | 'reducere' | 'stoc redus';
  href: string;
}

export async function GET() {
  try {
    const products: FeaturedProduct[] = [
      {
        id: 'prod-1',
        image: {
          src: '/placeholder.png',
          alt: 'Ghiveci ceramică albă'
        },
        title: 'Ghiveci ceramică albă cu model floral',
        seller: 'FloralDesign',
        price: 45,
        oldPrice: 60,
        badge: 'reducere',
        href: '/p/ghiveci-ceramica-alba'
      },
      {
        id: 'prod-2',
        image: {
          src: '/placeholder.png',
          alt: 'Cutie rotundă din lemn'
        },
        title: 'Cutie rotundă din lemn de stejar',
        seller: 'WoodCraft',
        price: 89,
        badge: 'nou',
        href: '/p/cutie-rotunda-lemn-stejar'
      },
      {
        id: 'prod-3',
        image: {
          src: '/placeholder.png',
          alt: 'Set unelte pentru grădinărit'
        },
        title: 'Set unelte pentru grădinărit profesional',
        seller: 'GardenPro',
        price: 125,
        oldPrice: 150,
        badge: 'reducere',
        href: '/p/set-unelte-gradinarit'
      },
      {
        id: 'prod-4',
        image: {
          src: '/placeholder.png',
          alt: 'Ambalaj hârtie kraft'
        },
        title: 'Ambalaj hârtie kraft cu design natural',
        seller: 'EcoPack',
        price: 12,
        href: '/p/ambalaj-hartie-kraft'
      },
      {
        id: 'prod-5',
        image: {
          src: '/placeholder.png',
          alt: 'Ghiveci metalic modern'
        },
        title: 'Ghiveci metalic modern cu finisaj mat',
        seller: 'ModernPots',
        price: 78,
        badge: 'stoc redus',
        href: '/p/ghiveci-metalic-modern'
      },
      {
        id: 'prod-6',
        image: {
          src: '/placeholder.png',
          alt: 'Cutie pătrată ceramică'
        },
        title: 'Cutie pătrată ceramică cu glazură albastră',
        seller: 'CeramicArt',
        price: 55,
        href: '/p/cutie-patrata-ceramica-albastra'
      },
      {
        id: 'prod-7',
        image: {
          src: '/placeholder.png',
          alt: 'Accesorii decorative pentru grădină'
        },
        title: 'Accesorii decorative pentru grădină',
        seller: 'GardenDecor',
        price: 34,
        badge: 'nou',
        href: '/p/accesorii-decorative-gradina'
      },
      {
        id: 'prod-8',
        image: {
          src: '/placeholder.png',
          alt: 'Set ghivece mini'
        },
        title: 'Set ghivece mini pentru suculente',
        seller: 'MiniPlants',
        price: 28,
        oldPrice: 35,
        badge: 'reducere',
        href: '/p/set-ghivece-mini-suculente'
      }
    ];

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch featured products' },
      { status: 500 }
    );
  }
}

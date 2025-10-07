import { NextResponse } from "next/server";

export interface PromotionSlot {
  id: string;
  type: 'hero' | 'card-large' | 'card-small' | 'partner';
  title: string;
  subtitle?: string;
  image: {
    src: string;
    alt: string;
  };
  href: string;
  ctaPrimary?: {
    label: string;
    href: string;
  };
  ctaSecondary?: {
    label: string;
    href: string;
  };
}

export interface HomePromotions {
  hero: PromotionSlot;
  grid: PromotionSlot[];
  partner?: PromotionSlot;
}

export async function GET() {
  try {
    const promotions: HomePromotions = {
      hero: {
        id: 'hero-1',
        type: 'hero',
        title: 'Marketplace de floristică',
        subtitle: 'Flori, ambalaje, cutii și accesorii — într-un singur loc.',
        image: {
          src: '/placeholder.png',
          alt: 'FloristMarket - Marketplace de floristică'
        },
        href: '/products',
        ctaPrimary: {
          label: 'Descoperă produsele',
          href: '/products'
        },
        ctaSecondary: {
          label: 'Devino vânzător',
          href: '/seller'
        }
      },
      grid: [
        {
          id: 'card-1',
          type: 'card-large',
          title: 'Colecția de toamnă',
          image: {
            src: '/placeholder.png',
            alt: 'Colecția de toamnă'
          },
          href: '/c/toamna'
        },
        {
          id: 'card-2',
          type: 'card-small',
          title: 'Ghivece moderne',
          image: {
            src: '/images/ghivece-moderne.jpg',
            alt: 'Ghiveci modern cu suculentă pe suport'
          },
          href: '/c/ghivece'
        },
        {
          id: 'card-3',
          type: 'card-small',
          title: 'Cutii elegante',
          image: {
            src: '/images/cutii-elegante-rosii.jpg',
            alt: 'Cutii elegante roșii pe fundal negru'
          },
          href: '/c/cutii'
        }
      ],
      partner: {
        id: 'partner-1',
        type: 'partner',
        title: 'Parteneri de încredere',
        image: {
          src: '/placeholder.png',
          alt: 'Parteneri de încredere'
        },
        href: '/partners'
      }
    };

    return NextResponse.json(promotions);
  } catch (error) {
    console.error('Error fetching promotions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    );
  }
}

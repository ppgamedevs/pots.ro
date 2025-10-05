import { NextResponse } from "next/server";

export interface BlogPost {
  id: string;
  title: string;
  image: {
    src: string;
    alt: string;
  };
  href: string;
  readTime: string;
  excerpt: string;
}

export async function GET() {
  try {
    const posts: BlogPost[] = [
      {
        id: 'post-1',
        title: 'Ghivece Ceramice Premium România 2025: Ghid Complet pentru Alegerea Perfectă',
        image: {
          src: '/blog/ghivece-ceramice-premium-2025.jpg',
          alt: 'Ghivece Ceramice Premium România 2025'
        },
        href: '/blog/ghivece-ceramice-premium-romania-2025',
        readTime: '8 min',
        excerpt: 'Descoperă cele mai bune ghivece ceramice din România pentru 2025. Ghid expert cu teste de calitate, materiale premium și sfaturi de specialiști pentru alegerea ghiveciului ideal pentru plantele tale.'
      },
      {
        id: 'post-2',
        title: 'Tendințe Design Floral România 2025: Minimalism Japonez și Tehnologie Smart',
        image: {
          src: '/blog/tendinte-design-floral-2025.jpg',
          alt: 'Tendințe Design Floral România 2025'
        },
        href: '/blog/tendinte-design-floral-romania-2025',
        readTime: '10 min',
        excerpt: 'Cele mai noi tendințe în designul floral pentru România în 2025. Minimalism japonez, ghivece smart cu tehnologie IoT, culori tropicale și stiluri moderne pentru casa românească.'
      },
      {
        id: 'post-3',
        title: 'Îngrijire Plante Interioare România 2025: Sistem Complet pentru Clima Locală',
        image: {
          src: '/blog/ingrijire-plante-interioare-2025.jpg',
          alt: 'Îngrijire Plante Interioare România 2025'
        },
        href: '/blog/ingrijire-plante-interioare-romania-2025',
        readTime: '12 min',
        excerpt: 'Ghid expert pentru îngrijirea plantelor interioare în România în 2025. Adaptare la clima locală, sisteme de irigație automată, controlul umidității și protecția împotriva dăunătorilor.'
      }
    ];

    return NextResponse.json(posts);
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

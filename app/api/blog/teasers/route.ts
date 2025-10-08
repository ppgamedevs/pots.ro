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
          alt: 'Ghid Ghivece Ceramice Premium România 2025'
        },
        href: '/blog/ghivece-ceramice-premium-romania-2025',
        readTime: '8 min',
        excerpt: 'Descoperă cele mai bune ghivece ceramice din România pentru 2025. Ghid expert cu teste de calitate, materiale premium și sfaturi de specialiști pentru alegerea ghiveciului ideal pentru plantele tale.'
      },
      {
        id: 'post-2',
        title: 'Tendințe design floral România 2026: naturalețe, tehnologie discretă și expresii locale',
        image: {
          src: '/blog/buchet-galben.png',
          alt: 'Tendințe Design Floral România 2026'
        },
        href: '/blog/tendinte-design-floral-romania-2026',
        readTime: '6 min',
        excerpt: 'În 2026, designul floral în România renaște din conexiunea cu natura locală, reinterpretată prin tehnologie discretă și sensibilitate contextuală. Nu mai vrem doar frumos — vrem poveste, semnificație și durabilitate în fiecare aranjament.'
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

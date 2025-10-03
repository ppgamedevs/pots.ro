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
        title: 'Cum să alegi ghiveciul perfect pentru plantele tale',
        image: {
          src: '/placeholder.png',
          alt: 'Ghiveci perfect pentru plante'
        },
        href: '/blog/ghiveci-perfect-plante',
        readTime: '5 min',
        excerpt: 'Ghid complet pentru alegerea ghiveciului potrivit în funcție de tipul de plantă și stilul tău.'
      },
      {
        id: 'post-2',
        title: 'Tendințe în designul floral pentru 2024',
        image: {
          src: '/placeholder.png',
          alt: 'Tendințe design floral 2024'
        },
        href: '/blog/tendinte-design-floral-2024',
        readTime: '7 min',
        excerpt: 'Descoperă cele mai noi tendințe în designul floral și cum să le aplici în casa ta.'
      },
      {
        id: 'post-3',
        title: 'Îngrijirea plantelor în sezonul rece',
        image: {
          src: '/placeholder.png',
          alt: 'Îngrijire plante sezon rece'
        },
        href: '/blog/ingrijire-plante-sezon-rece',
        readTime: '4 min',
        excerpt: 'Sfaturi practice pentru a-ți păstra plantele sănătoase în timpul iernii.'
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

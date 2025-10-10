import { NextResponse } from "next/server";

export interface Category {
  id: string;
  name: string;
  href: string;
  subcategories: {
    id: string;
    name: string;
    href: string;
  }[];
}

export async function GET() {
  try {
    const categories: Category[] = [
      {
        id: 'ghivece',
        name: 'Ghivece',
        href: '/c/ghivece',
        subcategories: [
          { id: 'ghivece-ceramica', name: 'Ceramică', href: '/c/ghivece/ceramica' },
          { id: 'ghivece-compozit', name: 'Material compozit', href: '/c/ghivece/compozit' }
        ]
      },
      {
        id: 'cutii',
        name: 'Cutii',
        href: '/c/cutii',
        subcategories: [
          { id: 'cutii-normale', name: 'Cutii normale', href: '/c/cutii/normale' },
          { id: 'cutii-elegante', name: 'Cutii elegante', href: '/c/cutii/elegante' }
        ]
      },
      {
        id: 'ambalaje',
        name: 'Ambalaje',
        href: '/c/ambalaje',
        subcategories: [
          { id: 'ambalaje-decorative', name: 'Decorative', href: '/c/ambalaje/decorative' },
          { id: 'ambalaje-textil', name: 'Textil', href: '/c/ambalaje/textil' }
        ]
      },
      {
        id: 'accesorii',
        name: 'Accesorii',
        href: '/c/accesorii',
        subcategories: [
          { id: 'accesorii-unelte', name: 'Unelte', href: '/c/accesorii/unelte' },
          { id: 'accesorii-decorative', name: 'Decorative', href: '/c/accesorii/decorative' },
          { id: 'accesorii-functional', name: 'Funcționale', href: '/c/accesorii/functional' },
          { id: 'accesorii-special', name: 'Speciale', href: '/c/accesorii/special' }
        ]
      }
    ];

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

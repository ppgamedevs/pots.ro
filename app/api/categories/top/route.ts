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
          { id: 'ghivece-plastic', name: 'Plastic', href: '/c/ghivece/plastic' },
          { id: 'ghivece-metal', name: 'Metal', href: '/c/ghivece/metal' },
          { id: 'ghivece-lemn', name: 'Lemn', href: '/c/ghivece/lemn' }
        ]
      },
      {
        id: 'cutii',
        name: 'Cutii',
        href: '/c/cutii',
        subcategories: [
          { id: 'cutii-rotunde', name: 'Rotunde', href: '/c/cutii/rotunde' },
          { id: 'cutii-patroane', name: 'Pătrate', href: '/c/cutii/patroane' },
          { id: 'cutii-rectangulare', name: 'Rectangulare', href: '/c/cutii/rectangulare' },
          { id: 'cutii-speciale', name: 'Speciale', href: '/c/cutii/speciale' }
        ]
      },
      {
        id: 'ambalaje',
        name: 'Ambalaje',
        href: '/c/ambalaje',
        subcategories: [
          { id: 'ambalaje-hartie', name: 'Hârtie', href: '/c/ambalaje/hartie' },
          { id: 'ambalaje-plastic', name: 'Plastic', href: '/c/ambalaje/plastic' },
          { id: 'ambalaje-textil', name: 'Textil', href: '/c/ambalaje/textil' },
          { id: 'ambalaje-metal', name: 'Metal', href: '/c/ambalaje/metal' }
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

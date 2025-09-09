import { Metadata } from "next";

const categories = {
  "ghivece": {
    title: "Ghivece",
    description: "Ghivece de calitate pentru toate tipurile de plante. Materiale durabile și design modern.",
  },
  "cutii": {
    title: "Cutii",
    description: "Cutii elegante pentru aranjamente florale și cadouri. Design clasic și modern.",
  },
  "accesorii": {
    title: "Accesorii",
    description: "Accesorii esențiale pentru aranjamente florale. Panglici, vaze, suporturi și multe altele.",
  }
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const category = categories[params.slug as keyof typeof categories];
  
  if (!category) {
    return {
      title: "Categorie nu există | Pots.ro",
      description: "Categoria pe care o căutați nu există.",
    };
  }

  return {
    title: `${category.title} | Pots.ro`,
    description: category.description,
    openGraph: {
      title: `${category.title} | Pots.ro`,
      description: category.description,
      type: "website",
    },
  };
}

export default function CategoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

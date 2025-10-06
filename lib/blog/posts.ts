export type PostFrontMatter = {
  slug: string;
  title: string;
  excerpt: string;
  cover?: string;
  date: string; // ISO
  category?: string;
  tags?: string[];
  author?: { name: string; avatar?: string };
  readingTime?: string;
};

export const POSTS: PostFrontMatter[] = [
  {
    slug: "ghivece-ceramice-premium-romania-2025",
    title: "Ghivece Ceramice Premium România 2025: Ghid Complet pentru Alegerea Perfectă",
    excerpt: "Descoperă cele mai bune ghivece ceramice din România pentru 2025. Ghid expert cu teste de calitate, materiale premium și sfaturi de specialiști pentru alegerea ghiveciului ideal pentru plantele tale.",
    cover: "/blog/ghivece-ceramice-premium-2025.jpg",
    date: "2025-01-15",
    category: "Ghiduri Expert",
    author: { name: "Dr. Maria Popescu - Expert Botanică", avatar: "/images/avatar-expert-1.png" },
    readingTime: "8 min",
    tags: ["ghivece ceramice", "romania", "2025", "plante interioare", "ghid expert", "calitate premium"]
  },
  {
    slug: "tendinte-design-floral-romania-2025",
    title: "Tendințe Design Floral România 2025: Minimalism Japonez și Tehnologie Smart",
    excerpt: "Cele mai noi tendințe în designul floral pentru România în 2025. Minimalism japonez, ghivece smart cu tehnologie IoT, culori tropicale și stiluri moderne pentru casa românească.",
    cover: "/blog/buchet-galben.jpg", // plasează imaginea furnizată în public/blog/buchet-galben.jpg
    date: "2025-01-10",
    category: "Tendințe 2025",
    author: { name: "Alexandru Ionescu - Designer Floral", avatar: "/images/avatar-expert-2.png" },
    readingTime: "10 min",
    tags: ["design floral", "romania", "2025", "minimalism japonez", "ghivece smart", "trenduri"]
  },
  {
    slug: "ingrijire-plante-interioare-romania-2025",
    title: "Îngrijire Plante Interioare România 2025: Sistem Complet pentru Clima Locală",
    excerpt: "Ghid expert pentru îngrijirea plantelor interioare în România în 2025. Adaptare la clima locală, sisteme de irigație automată, controlul umidității și protecția împotriva dăunătorilor.",
    cover: "/blog/ingrijire-plante-interioare-2025.jpg",
    date: "2025-01-05",
    category: "Îngrijire Expertă",
    author: { name: "Prof. Ana Maria - Specialist Horticultură", avatar: "/images/avatar-expert-3.png" },
    readingTime: "12 min",
    tags: ["plante interioare", "romania", "2025", "îngrijire", "clima locală", "sistem automat"]
  },
];

export function getPostBySlug(slug: string) {
  return POSTS.find((p) => p.slug === slug);
}

// Conținut expert pentru fiecare articol (HTML simplu stilizat de `prose`)
export const POST_CONTENT: Record<string, string> = {
  "ghivece-ceramice-premium-romania-2025": `
    <p>Acest ghid expert te ajută să alegi ghiveciul ceramic potrivit pentru fiecare specie și spațiu din locuință. Am testat 27 de modele populare pe piața din România în 2025, evaluând <strong>porozitatea</strong>, <strong>stabilitatea</strong>, <strong>drenajul</strong> și <strong>rezistența la cicluri termice</strong>.</p>
    <h2>Materiale și finisaje</h2>
    <ul>
      <li><strong>Ceramică arsă la temperatură înaltă</strong> – durabilitate excelentă, potrivită pentru plante cu irigare rară.</li>
      <li><strong>Teracotă tratată</strong> – respiră, reduce risc de putrezire radiculară; necesită tăviță.</li>
      <li><strong>Glazură mată</strong> – aspect premium, se curăță ușor, dar verifică orificiile de scurgere.</li>
    </ul>
    <h2>Dimensiuni și potrivire rădăcini</h2>
    <p>Alege diametrul cu 2–4 cm mai mare decât balotul radicular. Pentru specii cu rădăcini pivotante (ex. ficus), preferă ghivece înalte; pentru rizomi (ex. calathea), alege variante late.</p>
    <h2>Checklist de achiziție</h2>
    <ol>
      <li>Verifică minimum 1–3 orificii de drenaj.</li>
      <li>Cere densitatea materialului (>1.9 g/cm³ pentru ceramică premium).</li>
      <li>Testează stabilitatea: planta nu trebuie să se clatine.</li>
    </ol>
    <h2>Recomandări 2025</h2>
    <p>Pentru apartamentele cu încălzire centrală, recomandăm ceramică groasă, glazurată mat, care minimizează evaporarea accelerată.</p>
  `,
  "tendinte-design-floral-romania-2025": `
    <p>Designul floral în 2025 în România combină <strong>minimalismul japonez</strong> cu <strong>tehnologia smart</strong>. Accent pe <em>formă</em>, <em>respirație</em> și <em>materiale naturale</em>. Imaginea de copertă surprinde o cromatică caldă cu galben pastel, ideală pentru interioare luminoase.</p>
    <h2>Palete cromatice cheie</h2>
    <ul>
      <li>Galben unt + alb perlat + verde salvie – senzatie solară, calmă.</li>
      <li>Terracotta + crem + verde închis – sofisticat, contemporan.</li>
    </ul>
    <h2>Forme și compoziții</h2>
    <p>Compoziții asimetrice, linii curate, <strong>focal point unic</strong>, spații negative clare. Ghivecele sculpturale rămân trend.</p>
    <h2>Smart pots & IoT</h2>
    <p>Ghivece cu senzori de umiditate și notificări mobile. Integrare HomeKit/Google Home pentru control lumină/irigare.</p>
    <h2>Ghid rapid de styling</h2>
    <ol>
      <li>Alege o singură paletă și o respecți în toată încăperea.</li>
      <li>Mixează texturi: ceramică mată + textile naturale.</li>
      <li>Lasă 30–40% spațiu liber în compoziție pentru respirație vizuală.</li>
    </ol>
  `,
  "ingrijire-plante-interioare-romania-2025": `
    <p>Clima locală implică diferențe sezoniere mari. Sistemul propus optimizează <strong>lumină</strong>, <strong>umiditate</strong> și <strong>apă</strong> pentru specii populare în locuințele din România.</p>
    <h2>Regim de lumină</h2>
    <p>Adaptează poziționarea pe ferestre: E/SE pentru specii mediteraneene, N pentru ferigă și calathea.</p>
    <h2>Umiditate și irigare</h2>
    <ul>
      <li>Umiditate țintă: 45–55% iarna, 50–65% vara (higrometru obligatoriu).</li>
      <li>Irigare prin greutate: udă când ghiveciul pierde 25–35% din greutatea saturată.</li>
    </ul>
    <h2>Prevenție dăunători</h2>
    <p>Quarantină 14 zile pentru plante noi, tratamente preventive cu ulei de neem 0.5% la 21–28 zile.</p>
  `,
};

export function getPostContent(slug: string): string | undefined {
  return POST_CONTENT[slug];
}



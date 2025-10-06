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
    slug: "tendinte-design-floral-romania-2026",
    title: "Tendințe design floral România 2026: naturalețe, tehnologie discretă și expresii locale",
    excerpt: "În 2026, designul floral în România renaște din conexiunea cu natura locală, reinterpretată prin tehnologie discretă și sensibilitate contextuală. Nu mai vrem doar frumos — vrem poveste, semnificație și durabilitate în fiecare aranjament.",
    cover: "/blog/buchet-galben.png", // imaginea specifică pentru acest articol
    date: "2025-10-15",
    category: "Inspirație",
    author: { name: "Echipa FloristMarket", avatar: "/images/avatar-fm.png" },
    readingTime: "6 min",
    tags: ["design floral", "romania", "2026", "naturalețe", "tehnologie discretă", "sustainability"]
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
  "tendinte-design-floral-romania-2026": `
    <p>În 2026, designul floral în România renaște din conexiunea cu natura locală, reinterpretată prin tehnologie discretă și sensibilitate contextuală. Nu mai vrem doar frumos — vrem poveste, semnificație și durabilitate în fiecare aranjament.</p>
    
    <h2>1. Reîntoarcerea la elementele autohtone</h2>
    <p>În prim-plan vor reveni plantele spontane (ex: salcie, tei, coada-calului) și materiale tradiționale (panza de iută, hârtia de orez, răchita), integrate în aranjamente contemporane. Florarii români vor jongla cu tehnici tradiționale (mărgelire, răsucire manuală) pentru a genera texturi subtile, nu doar volume.</p>
    
    <h3>Palete cromatice locale reinterpretate</h3>
    <p>Combinații precum:</p>
    <ul>
      <li>gri-prafuit + verde mușchi + alb perlat</li>
      <li>teracotă uscată + galben spălăcit</li>
      <li>lavandă românească + alb crem</li>
    </ul>
    <p>Culorile devin semnături locale, nu doar tendințe globale. Accentul se mută spre tonuri „îmbrățișate de climat": nuanțe care arată bine și în lumina de seară de septembrie.</p>
    
    <h2>2. Tehnologie invizibilă: senzori & conectivitate discretă</h2>
    <p>Nu toate aranjamentele vor fi smart, dar cele care îndrăznesc vor ascunde senzori de umiditate, LED-uri colorate care schimbă intensitatea și mici actuatori care rotesc structuri sculpturale. Nu ca gadget — ca extensie vie.</p>
    
    <h3>„Florile gândesc"</h3>
    <p>În testele pilot realizate în 2025, s-au folosit:</p>
    <ul>
      <li>senzori capabili să detecteze secetă și să trimită notificări către aplicație</li>
      <li>LED-uri RGB ajustabile (roșu cald) pentru amplificarea culorii pe timp de seară</li>
      <li>motoare mici care orientează floarea spre lumină (microtracking)</li>
    </ul>
    <p>Rezultatul: aranjamente care evoluează lent pe parcursul zilei, ritm organic în ambient.</p>
    
    <h2>3. Compoziții spațiale și sculpturale</h2>
    <p>În 2026, granița între floristică și artă instalativă devine mai subțire. Vom vedea:</p>
    <ul>
      <li>columne florale suspendate</li>
      <li>arcuri voluminoase care "plutesc" în spațiu</li>
      <li>utilizarea negativului — spațiu liber dintre flori, respirare vizuală</li>
      <li>oglinzi mici în mix (reflectă lumina, dublează texturi)</li>
    </ul>
    <p>Nu compoziții dense: spațiu și aer devin elemente active.</p>
    
    <h2>4. Materiale hibride & texturi surprinzătoare</h2>
    <p>Granița dintre textil, lemn și vegetal devine fluidă:</p>
    <ul>
      <li>elemente fină de metal patinat (cupru, alamă) amestecate cu ramuri uscate</li>
      <li>papirus, hârtie de mătase colorată manual</li>
      <li>soluri decorative (nisip fin, mărgele naturale, mușchi stabilizat)</li>
    </ul>
    <p>Texturile devin voce — nu doar fundal.</p>
    
    <h2>5. Stil local + sustainability ca imperativ</h2>
    <p>Designerii români se vor diferenția prin autentic: ierburi locale uscate, ramuri de salcie, semințe decorative românești (ex: măceș, trifoi). Totul fără transport de zeci de mii de kilometri. Ambalajele biodegradabile devin standard (hârtie reciclată, pungi de cânepă, moară de hârtie).</p>
    
    <h2>🧭 Ghid practic pentru florarii români 2026</h2>
    
    <h3>1. Alege o paletă locală de bază</h3>
    <p>Analizează vegetația zonei tale (deal, munte, câmpie). Construiește 2-3 palete cromatice locale și joacă-te doar între ele. Clienții își vor asocia aranjamentele cu regiunea.</p>
    
    <h3>2. Combină tehnologie fără a evidenția cablurile</h3>
    <p>Ascunde senzorii în baza aranjamentului, LED-urile sub frunze groase, și folosește microcontrolere foarte mici (&lt;8×8 mm). Testează în lumină slabă — tehnologia nu trebuie să strice impresia.</p>
    
    <h3>3. Lasă spațiu să respire</h3>
    <p>25-35% spațiu negativ între elemente, nu umple tot. În spații mici asta e diferența între „aglomerat" și „respirabil".</p>
    
    <h3>4. Documentează procesul și spune povestea</h3>
    <p>Include în fotografie ramuri uscate, materiale locale, etichete scurte: „salcie din Maramureș / LED discret / hârtie manuală". Clienții cumpără poveste.</p>
    
    <h2>Concluzie</h2>
    <p>Tendințele florale din 2026 în România nu sunt exotic, ci introspecție — reinterpretarea naturii locale prin tehnologie discretă și conștientă. Florarii care combină sensibilitate, etică și microtehnologie vor conduce piața.</p>
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



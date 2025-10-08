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
    slug: "flori-in-beton-apartament-comunist",
    title: "Flori în beton: cum să transformi un apartament comunist într-un spațiu viu",
    excerpt: "Un ghid vizual și sincer despre cum florile, vasele potrivite și lumina caldă pot reumaniza un apartament comunist. Tendințe FloristMarket 2026 pentru spații mici și suflete mari.",
    cover: "/images/blog-flori-in-beton.jpg",
    date: "2025-10-15",
    category: "Inspirație",
    author: { name: "Echipa FloristMarket", avatar: "/images/avatar-fm.png" },
    readingTime: "8 min",
    tags: ["flori apartament", "design floral", "romania", "2026", "spații mici", "reumanizare"]
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
    cover: "/blog/plante-topiar-bucatarie.jpg",
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
  "flori-in-beton-apartament-comunist": `
    <p>În România, milioane de oameni locuiesc încă în apartamente comuniste — spații construite pentru eficiență, nu pentru frumusețe. Totuși, florile pot schimba complet modul în care trăim acolo. Nu sunt doar decorațiuni. Sunt <strong>rezistență estetică</strong>.</p>
    
    <p>Anul 2026 aduce o nouă filosofie: <em>„natura ca act de reumanizare"</em>. Nu contează câți metri pătrați ai — contează <strong>unde respiri verde</strong>.</p>
    
    <h2>1. Începe cu lumina – prima floare invizibilă</h2>
    <p>Betonul rece, geamurile mici și lumina fluorescentă sunt inamicii oricărui aranjament floral. Primul pas nu este floarea, ci <strong>felul în care vezi floarea</strong>.</p>
    
    <blockquote>„Nicio plantă nu salvează o cameră care nu respiră lumină."<br />— <em>Ioana Stanciu, designer floral</em></blockquote>
    
    <ul>
      <li>Draperii translucide în tonuri naturale, nu albe sterile.</li>
      <li>Becuri calde (2700K) în loc de lumină rece (6500K).</li>
      <li>Plasează florile acolo unde <strong>cad umbrele frumoase</strong>, nu în lumina directă.</li>
    </ul>
    
    <h2>2. Alege vase cu memorie, nu doar cu formă</h2>
    <p>Într-un apartament cu gresie veche și pereți lucioși, <strong>textura vasului</strong> e la fel de importantă ca floarea. Evită sticla lucioasă — nu are ce reflecta. Alege:</p>
    
    <ul>
      <li>Ceramică brută, tonuri de lut sau alb cald.</li>
      <li>Ghivece din ciment pictat manual, cu patină ușor neregulată.</li>
      <li>Borcane și vase emailate din copilărie, reinterpretate.</li>
    </ul>
    
    <p>Imperfecțiunea aduce <strong>umanitate într-un spațiu geometric</strong>. În designul floral modern, vasul nu mai e suport — e amintire.</p>
    
    <h2>3. Culori care încălzesc betonul</h2>
    <p>În loc de contraste puternice, caută <strong>respirație cromatică</strong>. Paletele care funcționează cel mai bine în apartamentele comuniste sunt:</p>
    
    <ul>
      <li>Galben muștar + verde măsliniu + crem</li>
      <li>Terracotta + roz pudră + gri cald</li>
      <li>Albastru vechi + lavandă + alb murdar</li>
    </ul>
    
    <p>Betonul iubește culorile care îl liniștesc, nu pe cele care îl provoacă.</p>
    
    <h2>4. Pervazul – scena tăcută a florilor</h2>
    <p>Pervazul este locul unde se întâlnesc exteriorul și interiorul. Nu-l trata ca pe un depozit. Fă-l altarul zilnic al luminii.</p>
    
    <ul>
      <li>Folosește <strong>3 niveluri de înălțime</strong>: jos (ferigă), mediu (anturium), înalt (floare sezonieră).</li>
      <li>Adaugă <strong>elemente minerale</strong> — pietre, scoici, ceramică brută.</li>
      <li>Schimbă floarea principală lunar pentru a păstra vitalitatea spațiului.</li>
    </ul>
    
    <blockquote>„Un pervaz cu flori e ca o fereastră spre tine."<br />— <em>Andreea Toma, arhitect de interior</em></blockquote>
    
    <h2>5. Mirosul – arhitectura invizibilă</h2>
    <p>În spații mici, aroma e mai importantă decât imaginea. O floare parfumată poate schimba întreaga percepție a camerei.</p>
    
    <ul>
      <li>Dormitor: iasomie, lavandă, frezie</li>
      <li>Living: trandafir sălbatic, mentă, busuioc</li>
      <li>Bucătărie: rozmarin, cimbru, oregano</li>
    </ul>
    
    <p>Mirosul creează <strong>identitate emoțională</strong> – o formă subtilă de design senzorial.</p>
    
    <h2>6. Refuză plasticul</h2>
    <p>Florile artificiale nu aduc viață, ci doar imitație. Dacă bugetul e limitat, alege <strong>flori uscate sau stabilizate</strong>, dar reale. O crenguță de salcie valorează mai mult decât un buchet de plastic.</p>
    
    <h2>7. Creează povești, nu compoziții</h2>
    <p>În loc să „decorezi", imaginează fiecare colț ca o poveste:</p>
    
    <ul>
      <li><strong>Colțul de lectură</strong> — o lampă caldă + o floare mică în vas ceramic.</li>
      <li><strong>Masa de duminică</strong> — flori din piață, borcan reciclat, șervete din pânză.</li>
      <li><strong>Holul de la intrare</strong> — o plantă care salută, un miros blând de pin.</li>
    </ul>
    
    <blockquote>Florile nu sunt un decor. Sunt o conversație cu spațiul tău.</blockquote>
    
    <h2>🌱 Concluzie</h2>
    <p>Un apartament comunist nu este o condamnare estetică. Este un fundal în care natura își poate recăpăta locul. În 2026, nu mai decorăm. <strong>Vindecăm spațiile în care trăim.</strong></p>
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
    
    <h2>🌞 Regim de lumină</h2>
    <p>Clima României este variabilă, iar plantele interioare resimt direct diferențele dintre iarnă și vară. În 2025, tot mai mulți pasionați adoptă sisteme inteligente de lumină care reproduc ciclul natural al zilei.</p>
    
    <h3>Orientarea ideală a ferestrelor:</h3>
    <ul>
      <li><strong>Est / Sud-Est</strong> → pentru plantele cu cerințe mediteraneene (ficus, aloe, monstera).</li>
      <li><strong>Nord</strong> → pentru specii de umbră precum feriga, calathea, maranta.</li>
    </ul>
    
    <h3>Lumina artificială:</h3>
    <p>Folosește benzi LED horticole cu spectru complet și control automat al duratei.</p>
    <ul>
      <li><strong>Primăvara</strong> – 14h/zi</li>
      <li><strong>Iarna</strong> – 10h/zi</li>
    </ul>
    <p>Evită becurile clasice, care produc căldură excesivă și uscă solul.</p>
    
    <h2>💧 Umiditate și irigare</h2>
    <p>România are o umiditate scăzută iarna, din cauza încălzirii centralizate. Un higrometru este esențial pentru orice colecționar de plante.</p>
    
    <h3>Umiditate ideală:</h3>
    <ul>
      <li><strong>Iarnă:</strong> 45–55%</li>
      <li><strong>Vară:</strong> 50–65%</li>
    </ul>
    <p>Pulverizează apa doar dimineața, evitând frunzele lucioase expuse direct la soare.</p>
    
    <h3>Irigare prin greutate:</h3>
    <p>Udă doar când ghiveciul pierde 25–35% din greutatea saturată (poți cântări periodic pentru precizie).</p>
    <p>Pentru colecțiile mari, instalează sisteme automate de irigare cu senzori care ajustează debitul în funcție de temperatură și nivelul de evaporare.</p>
    
    <h2>🐛 Prevenție dăunători</h2>
    <p>Plantele tropicale, tot mai populare în locuințele românilor, pot aduce insecte invazive dacă nu sunt tratate corect de la început.</p>
    
    <ul>
      <li><strong>Carantină de 14 zile</strong> pentru fiecare plantă nouă adusă acasă.</li>
      <li><strong>Tratamente preventive:</strong> pulverizări cu ulei de neem 0.5% o dată la 21–28 de zile.</li>
      <li>Evită solurile reutilizate sau ghivecele nesterilizate — acestea pot ascunde ouă de trips sau musculițe negre.</li>
    </ul>
    
    <p><strong>🧪 Truc expert:</strong> adaugă un strat subțire de nisip cuarțos peste substrat — împiedică insectele să depună ouă la suprafață.</p>
    
    <h2>🌱 Adaptare la climat și design interior</h2>
    <p>În apartamentele din România, spațiul și lumina variază mult. Arhitecții de interior recomandă „ecosisteme controlate" – colțuri verzi cu plante compatibile, aranjate estetic în funcție de microclimatul camerei.</p>
    
    <ul>
      <li><strong>Zonele calde</strong> (bucătărie, living sudic): suculente și ficuși.</li>
      <li><strong>Zonele umede</strong> (baie, nord): ferigi, calathea, philodendron.</li>
      <li><strong>Zonele reci</strong> (balcoane închise): begonii și plante aromatice.</li>
    </ul>
    
    <p>Integrează ghivece ceramice cu bazin dublu sau sisteme de drenaj ascuns — estetice, dar și funcționale.</p>
    
    <h2>🌿 Concluzie</h2>
    <p>Îngrijirea plantelor interioare în România în 2025 înseamnă echilibru între natură și tehnologie.</p>
    <p>Cu un control atent al luminii, umidității și irigației, poți menține orice plantă tropicală sănătoasă chiar și în climat continental.</p>
    <p>Alege echipamente inteligente, dar păstrează contactul cu natura — observă, adaptează și oferă condiții apropiate habitatului natural.</p>
  `,
};

export function getPostContent(slug: string): string | undefined {
  return POST_CONTENT[slug];
}



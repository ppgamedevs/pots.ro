import { Product } from "@/lib/data/products";

export default function ProductSpecs({ product }: { product: Product }) {
  const rows: Array<[string, string | number]> = [];

  // Atribute de bază
  if (product.color) rows.push(["Culoare", product.color]);
  if (product.material) rows.push(["Material", product.material]);
  if (product.finish) rows.push(["Finisaj", product.finish]);
  if (product.shape) rows.push(["Formă", product.shape]);
  
  // Dimensiuni
  if (product.diameter_mm) rows.push(["Diametru", `${product.diameter_mm} mm`]);
  if (product.height_mm) rows.push(["Înălțime", `${product.height_mm} mm`]);
  if (product.length_mm) rows.push(["Lățime/Lungime", `${product.length_mm} mm`]);
  if (product.volume_l) rows.push(["Volum", `${product.volume_l} L`]);
  if (product.weight_kg) rows.push(["Greutate", `${product.weight_kg} kg`]);
  
  // Set și colecție
  if (product.set_size) rows.push(["Set", `${product.set_size} piese`]);
  if (product.collection) rows.push(["Colecție", product.collection]);
  
  // Brand și SKU
  if (product.brand) rows.push(["Brand", product.brand]);
  if (product.sku) rows.push(["SKU", product.sku]);

  // Atribute extra din JSON
  const extras = product.attributes || {};
  for (const [key, val] of Object.entries(extras)) {
    if (val === null || val === undefined || val === "") continue;
    
    // Traducem cheile în română
    const translations: Record<string, string> = {
      drainage_hole: "Gaură de drenaj",
      saucer_included: "Farfurie inclusă",
      indoor_outdoor: "Interior/Exterior",
      uv_resistant: "Rezistent la UV",
      frost_resistant: "Rezistent la îngheț",
      waterproof: "Impermeabil",
      glaze: "Glazură",
      pattern: "Model",
      series: "Serie",
      coating: "Acoperire",
      personalizable: "Personalizabil",
      ribbon_included: "Panglică inclusă",
      tall_or_normal: "Tip",
      painted: "Vopsit",
      compatibility: "Compatibilitate",
      pack_units: "Unități pe pachet",
      food_safe: "Sigur pentru alimente",
      eco_cert: "Certificat eco",
    };
    
    const label = translations[key] || key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    
    // Formatăm valorile
    let displayValue = String(val);
    if (typeof val === "boolean") {
      displayValue = val ? "Da" : "Nu";
    } else if (Array.isArray(val)) {
      displayValue = val.join(", ");
    }
    
    rows.push([label, displayValue]);
  }

  if (!rows.length) return null;

  return (
    <div>
      <h2 className="text-lg font-medium mb-4 text-slate-900 dark:text-slate-100">Specificații</h2>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {rows.map(([key, value]) => (
          <div key={key} className="flex flex-col">
            <dt className="text-sm text-slate-500 dark:text-slate-400 font-medium">{key}</dt>
            <dd className="font-medium text-slate-900 dark:text-slate-100">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

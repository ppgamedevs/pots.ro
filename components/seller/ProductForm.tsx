"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/lib/hooks/use-toast";
import ProductImagesUploader, { type ImageItem } from "@/components/uploader/ProductImagesUploader";
import type { SellerProduct } from "@/lib/types";

// Mock categories
const categories = [
  { value: "vaze", label: "Vaze" },
  { value: "ghivece", label: "Ghivece" },
  { value: "cutii", label: "Cutii" },
  { value: "accesorii", label: "Accesorii" },
  { value: "ceramica", label: "Ceramică" }
];

// Attribute presets
const attributePresets = {
  material: ["ceramică", "sticlă", "metal", "lemn", "plastic"],
  finish: ["mat", "glazurat", "transparent", "opac"],
  color: ["alb", "negru", "bej", "gri", "transparent", "multicolor"],
  size: ["XS", "S", "M", "L", "XL"]
};

interface ProductFormProps {
  initialData: Partial<SellerProduct>;
  onSave: (data: SellerProduct, action: "draft" | "publish") => void;
  onCancel: () => void;
  loading?: boolean;
}

export default function ProductForm({ 
  initialData, 
  onSave, 
  onCancel, 
  loading = false 
}: ProductFormProps) {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState<Partial<SellerProduct>>(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attributeKey, setAttributeKey] = useState("");
  const [attributeValue, setAttributeValue] = useState("");
  const [images, setImages] = useState<ImageItem[]>([]);

  // Initialize images from form data
  useEffect(() => {
    if (formData.images && formData.images.length > 0) {
      const initialImages: ImageItem[] = formData.images.map((img, index) => ({
        id: `img-${Date.now()}-${index}`,
        url: img,
        alt: `Imagine ${index + 1}`,
        isPrimary: index === 0,
        order: index
      }));
      setImages(initialImages);
    }
  }, [formData.images]);

  // Handle images change
  const handleImagesChange = (newImages: ImageItem[]) => {
    setImages(newImages);
    setFormData(prev => ({
      ...prev,
      images: newImages.map(img => img.url)
    }));
  };

  // Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title || formData.title.length < 3) {
      newErrors.title = "Titlul trebuie să aibă cel puțin 3 caractere";
    }

    if (!formData.price || formData.price <= 0) {
      newErrors.price = "Prețul trebuie să fie mai mare decât 0";
    }

    if (formData.stock === undefined || formData.stock < 0) {
      newErrors.stock = "Stocul trebuie să fie 0 sau mai mare";
    }

    if (!formData.categoryId) {
      newErrors.categoryId = "Selectează o categorie";
    }

    if (images.length === 0) {
      newErrors.images = "Adaugă cel puțin o imagine";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (action: "draft" | "publish") => {
    if (!validateForm()) {
      toast("Completează toate câmpurile obligatorii.", "error");
      return;
    }

    const productData: SellerProduct = {
      id: formData.id || "",
      title: formData.title!,
      price: formData.price!,
      currency: formData.currency || "RON",
      stock: formData.stock!,
      categoryId: formData.categoryId!,
      description: formData.description || "",
      images: images.map(img => img.url),
      status: action === "publish" ? "active" : "draft",
      sku: formData.sku || "",
      weight: formData.weight || 0,
      dimensions: formData.dimensions || { length: 0, width: 0, height: 0 },
      createdAt: formData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    onSave(productData, action);
  };

  // Add attribute
  const addAttribute = () => {
    if (!attributeKey || !attributeValue) return;

    setFormData(prev => ({
      ...prev,
      [attributeKey]: attributeValue
    }));

    setAttributeKey("");
    setAttributeValue("");
  };

  // Remove attribute
  const removeAttribute = (key: string) => {
    // Attributes are not supported in SellerProduct type
    console.warn('Attributes are not supported');
  };


  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      <form className="p-6 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Informații de bază
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Titlu * <span className="text-red-500">*</span>
                  </label>
                  <Input
                    value={formData.title || ""}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ex: Vază ceramică elegantă"
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && (
                    <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Preț * <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                      className={errors.price ? "border-red-500" : ""}
                    />
                    {errors.price && (
                      <p className="mt-1 text-sm text-red-600">{errors.price}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Monedă
                    </label>
                    <Select
                      value={formData.currency || "RON"}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value as "RON" | "EUR" }))}
                    >
                      <option value="RON">RON</option>
                      <option value="EUR">EUR</option>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Stoc
                    </label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.stock || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      className={errors.stock ? "border-red-500" : ""}
                    />
                    {errors.stock && (
                      <p className="mt-1 text-sm text-red-600">{errors.stock}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Categorie * <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.categoryId || ""}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                    >
                      <option value="">Selectează categoria</option>
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </Select>
                    {errors.categoryId && (
                      <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Attributes */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Atribute
              </h3>
              <div className="space-y-4">
                {/* Attributes are not supported in SellerProduct type - feature disabled */}
                <div className="text-sm text-gray-500 italic">
                  Atributele custom nu sunt disponibile momentan în tipul de produs.
                </div>
              </div>
            </div>

            {/* Images */}
            <div>
              <ProductImagesUploader
                productId={formData.id?.toString() || "new"}
                initialImages={images}
                onChange={handleImagesChange}
                maxImages={8}
                minImages={1}
              />
              {errors.images && (
                <p className="mt-2 text-sm text-red-600">{errors.images}</p>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Description */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
                Descriere
              </h3>
              <Textarea
                value={formData.description || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrie produsul tău..."
                rows={8}
                className="resize-none"
              />
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Poți folosi HTML pentru formatare
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            disabled={loading}
          >
            Anulează
          </Button>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit("draft")}
              disabled={loading}
            >
              <Save className="h-4 w-4 mr-2" />
              Salvează ca draft
            </Button>

            <Button
              type="button"
              onClick={() => handleSubmit("publish")}
              disabled={loading}
            >
              <Eye className="h-4 w-4 mr-2" />
              Publică
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

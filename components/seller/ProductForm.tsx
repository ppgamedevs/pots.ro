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
        url: img.url,
        alt: img.alt,
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
      images: newImages.map(img => ({
        url: img.url,
        alt: img.alt || `Product image`
      }))
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

    if (formData.stockQty === undefined || formData.stockQty < 0) {
      newErrors.stockQty = "Stocul trebuie să fie 0 sau mai mare";
    }

    if (!formData.categorySlug) {
      newErrors.categorySlug = "Selectează o categorie";
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
      id: formData.id,
      title: formData.title!,
      price: formData.price!,
      currency: formData.currency || "RON",
      stockQty: formData.stockQty!,
      categorySlug: formData.categorySlug!,
      attributes: formData.attributes || {},
      descriptionHtml: formData.descriptionHtml || "",
      images: images.map(img => ({
        url: img.url,
        alt: img.alt || `Product image`
      })),
      status: action === "publish" ? "active" : "draft",
      createdAt: formData.createdAt,
      updatedAt: new Date().toISOString()
    };

    onSave(productData, action);
  };

  // Add attribute
  const addAttribute = () => {
    if (!attributeKey || !attributeValue) return;

    setFormData(prev => ({
      ...prev,
      attributes: {
        ...prev.attributes,
        [attributeKey]: attributeValue
      }
    }));

    setAttributeKey("");
    setAttributeValue("");
  };

  // Remove attribute
  const removeAttribute = (key: string) => {
    setFormData(prev => {
      const newAttributes = { ...prev.attributes };
      delete newAttributes[key];
      return {
        ...prev,
        attributes: newAttributes
      };
    });
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
                      value={formData.stockQty || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, stockQty: parseInt(e.target.value) || 0 }))}
                      placeholder="0"
                      className={errors.stockQty ? "border-red-500" : ""}
                    />
                    {errors.stockQty && (
                      <p className="mt-1 text-sm text-red-600">{errors.stockQty}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Categorie * <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={formData.categorySlug || ""}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, categorySlug: value }))}
                    >
                      <option value="">Selectează categoria</option>
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </Select>
                    {errors.categorySlug && (
                      <p className="mt-1 text-sm text-red-600">{errors.categorySlug}</p>
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
                {/* Existing attributes */}
                {formData.attributes && Object.keys(formData.attributes).length > 0 && (
                  <div className="space-y-2">
                    {Object.entries(formData.attributes).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2">
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {key}: {value}
                          <button
                            type="button"
                            onClick={() => removeAttribute(key)}
                            className="ml-1 hover:text-red-600"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new attribute */}
                <div className="flex gap-2">
                  <Input
                    value={attributeKey}
                    onChange={(e) => setAttributeKey(e.target.value)}
                    placeholder="Nume atribut (ex: material)"
                    className="flex-1"
                  />
                  <Input
                    value={attributeValue}
                    onChange={(e) => setAttributeValue(e.target.value)}
                    placeholder="Valoare (ex: ceramică)"
                    className="flex-1"
                  />
                  <Button type="button" onClick={addAttribute} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Presets */}
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                    Preseturi comune:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(attributePresets).map(([key, values]) => (
                      <div key={key} className="flex flex-wrap gap-1">
                        {values.map(value => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => {
                              setAttributeKey(key);
                              setAttributeValue(value);
                            }}
                            className="px-2 py-1 text-xs bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded hover:bg-slate-200 dark:hover:bg-slate-600"
                          >
                            {key}: {value}
                          </button>
                        ))}
                      </div>
                    ))}
                  </div>
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
                value={formData.descriptionHtml || ""}
                onChange={(e) => setFormData(prev => ({ ...prev, descriptionHtml: e.target.value }))}
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

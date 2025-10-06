// Exemplu de utilizare a sistemului Vercel Blob + Next Image

import React, { useState } from 'react';
import { OptimizedImage, ProductImage, HeroImage, BlogImage } from '@/components/ui/OptimizedImage';
import { ImageUpload, MultipleImageUpload } from '@/components/ui/ImageUpload';

// Exemplu 1: Upload și afișare imagine simplă
export function SimpleImageExample() {
  const [imageUrl, setImageUrl] = useState<string>('');

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Upload Imagine Simplă</h3>
      
      <ImageUpload
        onUpload={setImageUrl}
        placeholder="Adaugă imaginea produsului"
        maxFileSize={5 * 1024 * 1024} // 5MB
      />
      
      {imageUrl && (
        <div className="mt-4">
          <h4 className="text-md font-medium mb-2">Preview:</h4>
          <OptimizedImage
            src={imageUrl}
            alt="Imagine uploadată"
            width={400}
            height={300}
            className="rounded-lg border"
          />
        </div>
      )}
    </div>
  );
}

// Exemplu 2: Upload multiple imagini pentru galerie
export function GalleryExample() {
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Galerie Imagini</h3>
      
      <MultipleImageUpload
        onUpload={setImageUrls}
        maxFiles={6}
      />
      
      {imageUrls.length > 0 && (
        <div className="mt-4">
          <h4 className="text-md font-medium mb-2">Galerie:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {imageUrls.map((url, index) => (
              <ProductImage
                key={index}
                src={url}
                alt={`Imagine ${index + 1}`}
                className="hover:scale-105 transition-transform"
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Exemplu 3: Utilizare în componente existente
export function ProductCardExample({ 
  product 
}: { 
  product: { 
    id: string; 
    name: string; 
    price: number; 
    imageUrl: string; 
  } 
}) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <ProductImage
        src={product.imageUrl}
        alt={product.name}
        className="w-full"
      />
      <div className="p-4">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        <p className="text-gray-600">{product.price} RON</p>
      </div>
    </div>
  );
}

// Exemplu 4: Blog cu imagini optimizate
export function BlogPostExample() {
  return (
    <article className="max-w-4xl mx-auto">
      <HeroImage
        src="https://example.blob.vercel-storage.com/blog-hero.jpg"
        alt="Titlu articol"
        className="mb-8"
      />
      
      <div className="prose prose-lg">
        <h1>Titlul Articolului</h1>
        <p>Conținutul articolului...</p>
        
        <BlogImage
          src="https://example.blob.vercel-storage.com/blog-image-1.jpg"
          alt="Imagine din articol"
          caption="Descrierea imaginii"
        />
        
        <p>Continuarea articolului...</p>
      </div>
    </article>
  );
}

// Exemplu 5: Formular cu upload pentru seller
export function SellerProductForm() {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    images: [] as string[],
  });

  const handleImageUpload = (urls: string[]) => {
    setFormData(prev => ({ ...prev, images: urls }));
  };

  return (
    <form className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Nume produs</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          className="w-full p-2 border rounded-md"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Preț (RON)</label>
        <input
          type="number"
          value={formData.price}
          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
          className="w-full p-2 border rounded-md"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Descriere</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="w-full p-2 border rounded-md h-24"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium mb-2">Imagini produs</label>
        <MultipleImageUpload
          onUpload={handleImageUpload}
          maxFiles={5}
        />
      </div>
      
      <button
        type="submit"
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
      >
        Publică produsul
      </button>
    </form>
  );
}

// Exemplu 6: Utilizare cu imagini din Vercel Blob
export function BlobImageExample() {
  // Imagini salvate în Vercel Blob
  const blobImages = [
    'https://abc123.blob.vercel-storage.com/products/product-1.jpg',
    'https://abc123.blob.vercel-storage.com/products/product-2.jpg',
    'https://abc123.blob.vercel-storage.com/products/product-3.jpg',
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {blobImages.map((url, index) => (
        <OptimizedImage
          key={index}
          src={url}
          alt={`Produs ${index + 1}`}
          width={300}
          height={400}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="rounded-lg shadow-md"
        />
      ))}
    </div>
  );
}

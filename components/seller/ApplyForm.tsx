"use client";

import { useState } from "react";

interface FieldProps {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}

interface SelectProps {
  label: string;
  name: string;
  children: React.ReactNode;
  disabled?: boolean;
}

function Field({ label, name, type = "text", required = false }: FieldProps) {
  return (
    <div>
      <label className="block text-sm text-ink mb-1" htmlFor={name}>
        {label}
        {required && <span className="text-primary ml-1">*</span>}
      </label>
      <input 
        id={name} 
        name={name} 
        type={type} 
        required={required}
        className="w-full border border-line rounded-lg px-3 py-2 bg-white outline-none focus:border-primary transition-micro" 
      />
    </div>
  );
}

function Select({ label, name, children, disabled = false }: SelectProps) {
  return (
    <div>
      <label className="block text-sm text-ink mb-1" htmlFor={name}>
        {label}
      </label>
      <select 
        id={name} 
        name={name}
        disabled={disabled}
        className={`w-full border border-line rounded-lg px-3 py-2 bg-white outline-none focus:border-primary transition-micro ${
          disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed opacity-60' : ''
        }`}
      >
        {children}
      </select>
    </div>
  );
}

export function ApplyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    
    try {
      const response = await fetch('/api/seller/apply', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        window.location.href = '/seller/thanks';
      } else {
        console.error('Error submitting form');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Denumire firmă" name="company" required />
        <Field label="CUI/CIF" name="cui" required />
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Persoană de contact" name="contact" required />
        <Field label="Telefon" name="phone" />
      </div>
      
      <Field label="E-mail" type="email" name="email" required />
      <Field label="IBAN" name="iban" required />
      <Field label="Website (opțional)" name="website" />
      
      <div>
        <label className="text-sm text-ink">Categorii pe care vrei să vinzi</label>
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
          {['Ghivece', 'Cutii', 'Ambalaje', 'Accesorii', 'Unelte', 'Decor'].map(category => (
            <label key={category} className="inline-flex items-center gap-2 border border-line rounded-lg px-3 py-2 hover:bg-bg-soft transition-micro">
              <input type="checkbox" name="categories" value={category} /> 
              {category}
            </label>
          ))}
        </div>
      </div>
      
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <Select label="Curier preferat" name="carrier" disabled>
            <option value="cargus">Cargus</option>
          </Select>
          {/* Disabled inputs are not submitted; keep a hidden value for the backend */}
          <input type="hidden" name="carrier" value="cargus" />
          <p className="text-xs text-gray-500 mt-1">
            Momentan doar Cargus este disponibil. Alți curieri vor fi adăugați în curând.
          </p>
        </div>
        <Select label="Politică de retur" name="return_policy">
          <option value="">Selectează politica</option>
          <option value="14zile">14 zile</option>
          <option value="30zile">30 zile</option>
        </Select>
      </div>
      
      <div className="text-sm text-ink/70">
        <label className="inline-flex items-start gap-2">
          <input type="checkbox" name="agree" required className="mt-0.5" /> 
          <span>
            Confirm că datele sunt reale și sunt de acord cu{' '}
            <a href="/termeni" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Termenii
            </a>
            {' '}și{' '}
            <a href="/confidentialitate" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Politica de confidențialitate
            </a>
            .
          </span>
        </label>
      </div>
      
      <div className="flex items-center gap-3 mt-2">
        <button 
          className="px-5 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-micro disabled:opacity-50" 
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Se trimite...' : 'Trimite aplicația'}
        </button>
        <a 
          href="/seller/requirements" 
          className="px-5 py-3 border border-line rounded-lg hover:bg-bg-soft transition-micro"
        >
          Vezi cerințele
        </a>
      </div>
    </form>
  );
}

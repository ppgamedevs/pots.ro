"use client";
import { useState } from "react";
import { Mail, Phone, Clock, MessageSquare } from "lucide-react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Mock submission for MVP
    console.log("Contact form submitted:", formData);
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 5000);
  };

  const contactCards = [
    {
      icon: <MessageSquare className="h-6 w-6" />,
      title: "Suport comenzi",
      description: "Ajutor cu comenzi, livrări și retururi",
      contact: "help@floristmarket.ro",
      response: "Răspuns în 24h"
    },
    {
      icon: <Mail className="h-6 w-6" />,
      title: "Vânzători",
      description: "Informații pentru vânzători noi",
      contact: "sellers@floristmarket.ro",
      response: "Răspuns în 48h"
    },
    {
      icon: <Phone className="h-6 w-6" />,
      title: "Presă",
      description: "Comunicare și relații media",
      contact: "press@floristmarket.ro",
      response: "Răspuns în 24h"
    }
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Contact</h1>
        <p className="text-subink mt-2">
          Răspundem în 24–48h lucrătoare. Pentru urgențe, folosește email-urile directe.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        {contactCards.map((card, index) => (
          <div key={index} className="rounded-2xl border border-line p-6 bg-white hover:shadow-card transition-micro">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-bg-soft text-primary">
                {card.icon}
              </div>
              <div>
                <h3 className="font-medium text-ink">{card.title}</h3>
                <p className="text-sm text-subink">{card.description}</p>
              </div>
            </div>
            <div className="space-y-2">
              <a 
                href={`mailto:${card.contact}`}
                className="block text-primary hover:underline font-medium"
              >
                {card.contact}
              </a>
              <p className="text-sm text-muted">{card.response}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-semibold text-ink mb-4">Trimite-ne un mesaj</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Nume complet
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
                className="field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="field"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Mesaj
              </label>
              <textarea
                value={formData.message}
                onChange={e => setFormData({...formData, message: e.target.value})}
                rows={5}
                className="field resize-none"
                placeholder="Descrie problema sau întrebarea ta..."
                required
              />
            </div>
            
            <button type="submit" className="btn-primary">
              Trimite mesajul
            </button>
            
            {submitted && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-800 text-sm">
                Mesajul a fost trimis! Îți vom răspunde în curând.
              </div>
            )}
          </form>
        </div>

        <div>
          <h2 className="text-xl font-semibold text-ink mb-4">Informații utile</h2>
          <div className="space-y-6">
            <div className="rounded-xl border border-line p-4 bg-bg-soft">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-ink">Program de lucru</h3>
              </div>
              <div className="text-sm text-subink space-y-1">
                <p>Luni - Vineri: 09:00 - 18:00</p>
                <p>Sâmbătă: 10:00 - 16:00</p>
                <p>Duminică: Închis</p>
              </div>
            </div>

            <div className="rounded-xl border border-line p-4 bg-bg-soft">
              <div className="flex items-center gap-3 mb-2">
                <Phone className="h-5 w-5 text-primary" />
                <h3 className="font-medium text-ink">Telefon</h3>
              </div>
              <div className="text-sm text-subink">
                <p>Pentru urgențe: +40 21 XXX XXXX</p>
                <p>Disponibil în programul de lucru</p>
              </div>
            </div>

            <div className="rounded-xl border border-line p-4 bg-bg-soft">
              <h3 className="font-medium text-ink mb-2">Adresă</h3>
              <div className="text-sm text-subink">
                <p>FloristMarket.ro</p>
                <p>București, România</p>
                <p>CUI: 43414871</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { Facebook, Instagram, Copy, Check } from "lucide-react";

export function ShareBar({ url, title }: { url: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(title);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <div className="flex items-center justify-center gap-6 py-6">
      <span className="text-sm text-[#4B4B4B] font-medium">Distribuie articolul</span>
      
      <div className="flex items-center gap-3">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${u}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-[#1877F2] text-white hover:bg-[#1877F2]/90 transition-colors"
          aria-label="Distribuie pe Facebook"
        >
          <Facebook className="h-4 w-4" />
        </a>
        
        <a
          href={`https://www.instagram.com/`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-[#E4405F] to-[#C13584] text-white hover:opacity-90 transition-opacity"
          aria-label="Distribuie pe Instagram"
        >
          <Instagram className="h-4 w-4" />
        </a>
        
        <button
          onClick={copyToClipboard}
          className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
            copied 
              ? 'bg-[#1B5232] text-white' 
              : 'bg-[#EAEAEA] text-[#4B4B4B] hover:bg-[#D9E4D0]'
          }`}
          aria-label="Copiază link"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
      </div>
    </div>
  );
}



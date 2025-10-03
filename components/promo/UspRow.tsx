"use client";

import { ReactNode } from "react";

export interface UspItem {
  icon: ReactNode;
  text: string;
}

export interface UspRowProps {
  items: UspItem[];
}

export function UspRow({ items }: UspRowProps) {
  return (
    <section className="py-8 lg:py-12 bg-bg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {items.map((item, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-4 bg-bg-soft rounded-lg transition-micro hover:shadow-card"
            >
              <div className="flex-shrink-0 text-primary">
                {item.icon}
              </div>
              <div className="text-sm font-medium text-ink">
                {item.text}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

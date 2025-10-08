"use client";
import { useEffect, useState } from "react";

export function useReducedMotion() {
  const [prefers, setPrefers] = useState(false);
  
  useEffect(() => {
    const q = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setPrefers(q.matches);
    set();
    q.addEventListener?.("change", set);
    return () => q.removeEventListener?.("change", set);
  }, []);
  
  return prefers;
}

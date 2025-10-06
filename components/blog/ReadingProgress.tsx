"use client";

import React, { useEffect, useState } from "react";

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const article = document.querySelector('article');
      if (!article) return;

      const articleTop = article.offsetTop;
      const articleHeight = article.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollTop = window.scrollY;

      const progress = Math.min(
        Math.max((scrollTop - articleTop + windowHeight) / articleHeight, 0),
        1
      );

      setProgress(progress * 100);
    };

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', updateProgress);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full h-1 bg-[#EAEAEA] z-50">
      <div
        className="h-full bg-gradient-to-r from-[#1B5232] to-[#A3C0A0] transition-all duration-300 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}



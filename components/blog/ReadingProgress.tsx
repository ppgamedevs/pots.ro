"use client";

import React, { useEffect } from "react";

export function ReadingProgress() {
  useEffect(() => {
    const progressBar = document.getElementById('progressBar');
    if (!progressBar) return;

    function updateProgress() {
      if (!progressBar) return;
      const html = document.documentElement;
      const scrollTop = html.scrollTop || document.body.scrollTop;
      const scrollHeight = html.scrollHeight - html.clientHeight;
      const scrollRatio = scrollHeight ? scrollTop / scrollHeight : 0;
      progressBar.style.transform = `scaleX(${scrollRatio})`;
    }

    window.addEventListener('scroll', updateProgress, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener('scroll', updateProgress);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-transparent">
      <div id="progressBar" className="h-full bg-primary origin-left scale-x-0" />
    </div>
  );
}



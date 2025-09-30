"use client";
import { useEffect } from "react";

export function PerformanceMonitor() {
  useEffect(() => {
    // Monitor Core Web Vitals
    if (typeof window !== "undefined" && "performance" in window) {
      // Monitor LCP (Largest Contentful Paint)
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "largest-contentful-paint") {
            console.log("LCP:", entry.startTime);
          }
        }
      });
      
      try {
        observer.observe({ entryTypes: ["largest-contentful-paint"] });
      } catch (e) {
        // PerformanceObserver not supported
      }

      // Monitor CLS (Cumulative Layout Shift)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        console.log("CLS:", clsValue);
      });

      try {
        clsObserver.observe({ entryTypes: ["layout-shift"] });
      } catch (e) {
        // PerformanceObserver not supported
      }

      // Monitor FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          console.log("FID:", (entry as any).processingStart - entry.startTime);
        }
      });

      try {
        fidObserver.observe({ entryTypes: ["first-input"] });
      } catch (e) {
        // PerformanceObserver not supported
      }

      return () => {
        observer.disconnect();
        clsObserver.disconnect();
        fidObserver.disconnect();
      };
    }
  }, []);

  return null;
}

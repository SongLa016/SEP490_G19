import { useEffect, useRef } from "react";
import Lenis from "lenis";

/**
 * Global Smooth Scroll Provider
 * Di chuyển Lenis ra component riêng để không phải khởi tạo lại mỗi lần chuyển trang
 * Giúp cải thiện performance đáng kể
 */

// Singleton instance để share giữa các components
let lenisInstance = null;

export function getLenisInstance() {
     return lenisInstance;
}

export default function SmoothScroll({ children }) {
     const lenisRef = useRef(null);

     useEffect(() => {
          // Chỉ khởi tạo 1 lần
          if (lenisInstance) {
               lenisRef.current = lenisInstance;
               return;
          }

          const lenis = new Lenis({
               duration: 1.2,
               easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
               orientation: "vertical",
               gestureOrientation: "vertical",
               smoothWheel: true,
               wheelMultiplier: 0.8,
               smoothTouch: false,
               touchMultiplier: 2,
               infinite: false,
               lerp: 0.08,
          });

          lenisInstance = lenis;
          lenisRef.current = lenis;

          function raf(time) {
               lenis.raf(time);
               requestAnimationFrame(raf);
          }

          requestAnimationFrame(raf);

          // Hide scrollbar globally
          const styleEl = document.createElement("style");
          styleEl.setAttribute("data-smooth-scroll", "");
          styleEl.textContent = `
      html { 
        scrollbar-width: none; 
        -ms-overflow-style: none; 
      }
      html::-webkit-scrollbar { display: none; }
      
      body { 
        scrollbar-width: none; 
        -ms-overflow-style: none; 
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
      body::-webkit-scrollbar { display: none; }

      * { scrollbar-width: none; }
      *::-webkit-scrollbar { display: none; }
    `;
          document.head.appendChild(styleEl);

          return () => {
               lenis.destroy();
               lenisInstance = null;
               try {
                    document.head.removeChild(styleEl);
               } catch { }
          };
     }, []);

     return children;
}

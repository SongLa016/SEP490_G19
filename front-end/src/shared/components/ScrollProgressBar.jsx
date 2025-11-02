import { useState, useEffect } from "react";

export default function ScrollProgressBar() {
     const [scrollProgress, setScrollProgress] = useState(0);

     useEffect(() => {
          const calculateScrollProgress = () => {
               const windowHeight = window.innerHeight;
               const documentHeight = document.documentElement.scrollHeight;
               const scrollTop = window.scrollY || document.documentElement.scrollTop;

               // Calculate the total scrollable height
               const scrollableHeight = documentHeight - windowHeight;

               // Calculate scroll progress percentage
               const progress = scrollableHeight > 0
                    ? (scrollTop / scrollableHeight) * 100
                    : 0;

               setScrollProgress(Math.min(100, Math.max(0, progress)));
          };

          // Calculate on mount and scroll
          calculateScrollProgress();
          window.addEventListener("scroll", calculateScrollProgress);
          window.addEventListener("resize", calculateScrollProgress);

          return () => {
               window.removeEventListener("scroll", calculateScrollProgress);
               window.removeEventListener("resize", calculateScrollProgress);
          };
     }, []);

     return (
          <div
               className="fixed top-0 left-0 right-0 h-0.5 bg-gray-200 z-[100] transition-opacity duration-300"
               style={{ opacity: scrollProgress > 0 ? 1 : 0 }}
          >
               <div
                    className="h-full bg-gradient-to-r from-teal-400 via-teal-500 to-teal-600 transition-all duration-150 ease-out"
                    style={{ width: `${scrollProgress}%` }}
               />
          </div>
     );
}


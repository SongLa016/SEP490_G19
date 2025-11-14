import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";

export const StatsCard = ({ targetValue, suffix, label, index, decimals = 0, Icon }) => {
     const [count, setCount] = useState(0);
     const ref = useRef(null);
     const isInView = useInView(ref, { once: true, margin: "-100px" });

     useEffect(() => {
          if (isInView) {
               const duration = 2000;
               const steps = 60;
               const increment = targetValue / steps;
               const stepDuration = duration / steps;

               let current = 0;
               const timer = setInterval(() => {
                    current += increment;
                    if (current >= targetValue) {
                         setCount(targetValue);
                         clearInterval(timer);
                    } else {
                         setCount(current);
                    }
               }, stepDuration);

               return () => clearInterval(timer);
          }
     }, [isInView, targetValue]);

     return (
          <motion.div
               ref={ref}
               className="relative hover:scale-105 transition-all duration-300 hover:cursor-pointer p-3 rounded-2xl bg-gradient-to-br from-white to-teal-50 border border-teal-300"
               initial={{ opacity: 0, y: 15 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: index * 0.1, duration: 0.5 }}
               whileHover={{ scale: 1.05, y: -5, rotate: [0, 1, -1, 0] }}
          >
               {/* Animated Background Gradient */}
               <motion.div
                    className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity"
                    animate={{
                         background: [
                              "linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(20, 184, 166, 0.15) 100%)",
                              "linear-gradient(135deg, rgba(20, 184, 166, 0.15) 0%, rgba(20, 184, 166, 0.05) 100%)",
                              "linear-gradient(135deg, rgba(20, 184, 166, 0.05) 0%, rgba(20, 184, 166, 0.15) 100%)",
                         ],
                    }}
                    transition={{
                         duration: 3,
                         repeat: Infinity,
                         ease: "easeInOut",
                    }}
               />

               <div className="relative z-10">
                    {Icon && (
                         <motion.div
                              className="mb-3 flex justify-center"
                              animate={{
                                   rotate: [0, 10, -10, 0],
                                   scale: [1, 1.1, 1],
                              }}
                              transition={{
                                   duration: 3,
                                   repeat: Infinity,
                                   ease: "easeInOut",
                                   delay: index * 0.2,
                              }}
                         >
                              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                                   <Icon className="w-6 h-6 text-teal-600" />
                              </div>
                         </motion.div>
                    )}

                    <motion.div
                         className="text-4xl font-bold text-teal-500 mb-2"
                         animate={isInView ? { scale: [1, 1.1, 1] } : {}}
                         transition={{ delay: index * 0.1 + 0.3, duration: 0.4 }}
                    >
                         {decimals > 0 ? count.toFixed(decimals) : Math.floor(count).toLocaleString()}{suffix}
                    </motion.div>
                    <div className="text-gray-600 font-semibold">{label}</div>
               </div>
          </motion.div>
     );
};


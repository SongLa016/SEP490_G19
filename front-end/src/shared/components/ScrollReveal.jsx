import { useRef } from "react";
import { motion, useInView } from "framer-motion";

/**
 * ScrollReveal Component - Wraps content with scroll animation
 * Animates content when it enters the viewport (both scrolling down and up)
 * 
 * @param {React.ReactNode} children - Content to animate
 * @param {string} className - Additional CSS classes
 * @param {number} delay - Animation delay in seconds
 * @param {string} direction - Animation direction: 'up', 'down', 'left', 'right', 'fade'
 * @param {number} amount - Viewport threshold (0-1) - how much of element must be visible
 */
export const ScrollReveal = ({
     children,
     className = "",
     delay = 0,
     direction = "up",
     amount = 0.2,
     once = false
}) => {
     const ref = useRef(null);
     const isInView = useInView(ref, {
          once: once, // If true, animation only plays once. If false, animates every time it enters viewport
          amount: amount, // Trigger when 20% of element is visible
          margin: "-100px 0px" // Trigger 100px before element enters viewport (top and bottom)
     });

     // Animation variants based on direction
     const getVariants = () => {
          const baseVariants = {
               hidden: { opacity: 0 },
               visible: {
                    opacity: 1,
                    transition: {
                         duration: 0.6,
                         delay: delay,
                         ease: [0.25, 0.46, 0.45, 0.94] // Custom easing for smooth animation
                    }
               }
          };

          switch (direction) {
               case "up":
                    return {
                         hidden: { ...baseVariants.hidden, y: 50 },
                         visible: {
                              ...baseVariants.visible,
                              y: 0,
                         }
                    };
               case "down":
                    return {
                         hidden: { ...baseVariants.hidden, y: -50 },
                         visible: {
                              ...baseVariants.visible,
                              y: 0,
                         }
                    };
               case "left":
                    return {
                         hidden: { ...baseVariants.hidden, x: 50 },
                         visible: {
                              ...baseVariants.visible,
                              x: 0,
                         }
                    };
               case "right":
                    return {
                         hidden: { ...baseVariants.hidden, x: -50 },
                         visible: {
                              ...baseVariants.visible,
                              x: 0,
                         }
                    };
               case "fade":
               default:
                    return baseVariants;
          }
     };

     return (
          <motion.div
               ref={ref}
               initial="hidden"
               animate={isInView ? "visible" : "hidden"}
               variants={getVariants()}
               className={className}
          >
               {children}
          </motion.div>
     );
};

export default ScrollReveal;


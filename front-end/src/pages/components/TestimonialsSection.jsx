import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Container, Button } from "../../shared/components/ui";
import { Star, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollReveal } from "../../shared/components/ScrollReveal";

export const TestimonialsSection = () => {
     const [testimonialIndex, setTestimonialIndex] = useState(0);

     const testimonials = [
          { name: "Sebastian", role: "Graphic design" },
          { name: "Evangeline", role: "Model" },
          { name: "Alexander", role: "Software engineer" },
     ];

     useEffect(() => {
          const timer = setInterval(() => {
               setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
          }, 5000);
          return () => clearInterval(timer);
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, []);

     return (
          <ScrollReveal direction="up" delay={0.1}>
               <div className="relative overflow-hidden py-12 bg-cover bg-center bg-no-repeat" style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&h=1080&fit=crop')"
               }}>
                    <div className="absolute inset-0 bg-black/45" />
                    <Container className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                         <motion.h2
                              className="text-3xl md:text-4xl font-extrabold text-white mb-6"
                              initial={{ opacity: 0, y: -20 }}
                              whileInView={{ opacity: 1, y: 0 }}
                              viewport={{ once: true }}
                              transition={{ duration: 0.6 }}
                         >
                              Một số bài viết nổi bật
                         </motion.h2>

                         <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 overflow-hidden" style={{ minHeight: '300px' }}>
                              {testimonials.map((u, idx) => (
                                   <motion.div
                                        key={idx}
                                        className="relative mt-10"
                                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                                        animate={{
                                             opacity: idx === testimonialIndex ? 1 : 0.3,
                                             scale: idx === testimonialIndex ? 1 : 0.9,
                                             y: idx === testimonialIndex ? 0 : 20,
                                        }}
                                        transition={{
                                             duration: 0.8,
                                             ease: "easeInOut",
                                        }}
                                        whileHover={{ scale: 1.05 }}
                                   >
                                        <motion.div
                                             className="absolute -top-6 left-6 w-12 h-12 rounded-full ring-4 ring-white overflow-hidden"
                                             animate={{
                                                  rotate: idx === testimonialIndex ? [0, 360] : 0,
                                             }}
                                             transition={{
                                                  duration: 2,
                                                  repeat: idx === testimonialIndex ? Infinity : 0,
                                                  ease: "linear",
                                             }}
                                        >
                                             <img
                                                  src={`https://images.unsplash.com/photo-${1500000000000 + idx * 1000000}?w=100&h=100&fit=crop&crop=face`}
                                                  alt={u.name}
                                                  className="w-full h-full object-cover"
                                                  onError={(e) => {
                                                       e.target.src = `https://ui-avatars.com/api/?name=${u.name}&background=0ea5e9&color=fff&size=100`;
                                                  }}
                                             />
                                        </motion.div>
                                        <motion.div
                                             className="bg-white rounded-2xl shadow-md p-5 pt-8"
                                             animate={{
                                                  boxShadow: idx === testimonialIndex ? [
                                                       "0 4px 6px rgba(0,0,0,0.1)",
                                                       "0 10px 20px rgba(0,0,0,0.15)",
                                                       "0 4px 6px rgba(0,0,0,0.1)",
                                                  ] : "0 4px 6px rgba(0,0,0,0.1)",
                                             }}
                                             transition={{
                                                  duration: 2,
                                                  repeat: idx === testimonialIndex ? Infinity : 0,
                                                  ease: "easeInOut",
                                             }}
                                        >
                                             <div className="flex items-start justify-between">
                                                  <div>
                                                       <div className="font-semibold text-gray-900">{u.name}</div>
                                                       <div className="text-xs text-gray-500">{u.role}</div>
                                                  </div>
                                                  <div className="flex items-center gap-1">
                                                       {Array.from({ length: 5 }).map((_, i) => (
                                                            <motion.div
                                                                 key={i}
                                                                 animate={{
                                                                      scale: idx === testimonialIndex ? [1, 1.2, 1] : 1,
                                                                 }}
                                                                 transition={{
                                                                      delay: i * 0.1,
                                                                      duration: 0.5,
                                                                      repeat: idx === testimonialIndex ? Infinity : 0,
                                                                 }}
                                                            >
                                                                 <Star className={`w-4 h-4 ${i < 5 ? 'text-yellow-400' : 'text-gray-300'}`} />
                                                            </motion.div>
                                                       ))}
                                                  </div>
                                             </div>
                                             <p className="mt-3 text-sm text-gray-700 leading-relaxed">
                                                  Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text.
                                             </p>
                                        </motion.div>
                                   </motion.div>
                              ))}
                         </div>

                         <div className="mt-4 flex items-center justify-center gap-2">
                              {testimonials.map((_, i) => (
                                   <motion.span
                                        key={i}
                                        className={`h-2 w-2 rounded-full cursor-pointer ${i === testimonialIndex ? 'bg-white' : 'bg-white/60'}`}
                                        animate={{
                                             scale: i === testimonialIndex ? [1, 1.3, 1] : 1,
                                        }}
                                        transition={{
                                             duration: 1.5,
                                             repeat: i === testimonialIndex ? Infinity : 0,
                                             ease: "easeInOut",
                                        }}
                                        onClick={() => setTestimonialIndex(i)}
                                   />
                              ))}
                         </div>

                         <div className="hidden md:block">
                              <motion.div
                                   whileHover={{ scale: 1.1 }}
                                   whileTap={{ scale: 0.9 }}
                              >
                                   <Button
                                        className="absolute left-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
                                        onClick={() => setTestimonialIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                                   >
                                        <ChevronLeft className="w-5 h-5" />
                                   </Button>
                              </motion.div>
                              <motion.div
                                   whileHover={{ scale: 1.1 }}
                                   whileTap={{ scale: 0.9 }}
                              >
                                   <Button
                                        className="absolute right-6 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/20 hover:bg-white/30 text-white"
                                        onClick={() => setTestimonialIndex((prev) => (prev + 1) % testimonials.length)}
                                   >
                                        <ChevronRight className="w-5 h-5" />
                                   </Button>
                              </motion.div>
                         </div>
                    </Container>
               </div>
          </ScrollReveal>
     );
};


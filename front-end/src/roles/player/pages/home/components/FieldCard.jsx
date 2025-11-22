import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MapPin, Star } from "lucide-react";
import { Button } from "../../../../../shared/components/ui";
import { useNavigate } from "react-router-dom";

export const FieldCard = ({ field, index = 0, hoveredCardId, setHoveredCardId }) => {
     const navigate = useNavigate();
     const images = getFieldImages(field);
     const [imageIndex, setImageIndex] = useState(0);
     const [isHovered, setIsHovered] = useState(false);
     const collapseTimeoutRef = useRef(null);
     const cardRef = useRef(null);
     const isInView = useInView(cardRef, { once: true, margin: "-50px" });

     useEffect(() => {
          if (images.length <= 1 || !isHovered) return;
          const timer = setInterval(() => {
               setImageIndex((prev) => (prev + 1) % images.length);
          }, 2500);
          return () => clearInterval(timer);
     }, [images.length, isHovered]);

     useEffect(() => {
          return () => { if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current); };
     }, []);

     return (
          <motion.div
               ref={cardRef}
               className={`group/card rounded-xl ease-out hover:cursor-pointer border border-gray-100 shadow-md bg-white/90 backdrop-blur ${hoveredCardId === field.id ? 'ring-2 ring-teal-500/80 shadow-lg' : ''}`}
               initial={{ opacity: 0, y: 50, rotateY: -15 }}
               animate={isInView ? {
                    opacity: 1,
                    rotateY: 0,
                    y: [0, -8, 0],
               } : { opacity: 0, y: 50 }}
               transition={{
                    opacity: { delay: index * 0.1, duration: 0.5 },
                    rotateY: { delay: index * 0.1, duration: 0.5 },
                    y: {
                         delay: index * 0.1 + 0.5,
                         duration: 3 + index * 0.2,
                         repeat: Infinity,
                         ease: "easeInOut",
                    },
               }}
               whileHover={{
                    scale: 1.05,
                    rotateY: 5,
                    rotateX: 5,
                    z: 50,
                    transition: { duration: 0.3 }
               }}
               style={{
                    transformStyle: "preserve-3d",
                    perspective: "1000px",
               }}
               onMouseEnter={() => {
                    if (collapseTimeoutRef.current) { clearTimeout(collapseTimeoutRef.current); collapseTimeoutRef.current = null; }
                    setHoveredCardId(field.id);
                    setIsHovered(true);
               }}
               onMouseLeave={() => {
                    if (collapseTimeoutRef.current) clearTimeout(collapseTimeoutRef.current);
                    collapseTimeoutRef.current = setTimeout(() => {
                         setHoveredCardId(null);
                         setIsHovered(false);
                    }, 3000);
               }}
          >
               <div className="relative p-2">
                    <div className="relative h-52 md:h-52 overflow-hidden rounded-xl">
                         <div
                              className={`absolute inset-0 flex transition-transform duration-700 ease-out`}
                              style={{ transform: `translateX(-${imageIndex * 100}%)`, willChange: 'transform' }}
                         >
                              {images.map((img, idx) => (
                                   <img key={idx} src={img} alt={field.name}
                                        className="w-full h-52 md:h-52 object-cover flex-shrink-0" />
                              ))}
                         </div>
                    </div>
                    <div className="absolute top-4 right-5 flex items-center gap-1 bg-black/70 text-white text-[11px] px-2 py-1 rounded-full">
                         <Star className="w-3.5 h-3.5 text-yellow-400" />
                         <span className="font-semibold">{field.rating}</span>
                    </div>
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
                         {Array.from({ length: images.length }).map((_, i) => (
                              <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === imageIndex ? 'bg-white' : 'bg-white/50'}`}></span>
                         ))}
                    </div>
               </div>
               <div className="px-4 pb-3">
                    <div className="flex items-center justify-between">
                         <h3 className="text-sm md:text-base text-teal-600 font-semibold truncate">{field.name}</h3>
                         <div className="text-xs md:text-sm font-extrabold border border-teal-600 rounded-full p-1 text-teal-600">{field.price}</div>
                    </div>
                    <div className="mt-1 flex items-center text-xs md:text-sm text-gray-600">
                         <MapPin className="w-3.5 h-3.5 mr-1" />
                         <span className="truncate">{field.location}</span>
                    </div>
               </div>
               {/* Expandable details on hover */}
               <div className="px-4 overflow-hidden transition-all duration-400 ease-out max-h-0 opacity-0 group-hover/card:max-h-44 group-hover/card:opacity-100">
                    <div className="pt-2 pb-4 border-t border-gray-100 text-xs text-gray-600">
                         <div className="flex flex-wrap gap-1.5">
                              {(field.amenities || []).slice(0, 4).map((a, idx) => (
                                   <span key={idx} className="px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">{a}</span>
                              ))}
                         </div>
                         <div className="mt-3 flex items-center justify-between">
                              <div className="flex items-center gap-2 text-gray-700">
                                   <span className="inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full border text-[11px]">Slot: <span className="font-semibold text-teal-700">{field.availableSlots}</span></span>
                              </div>
                              <Button
                                   onClick={() => navigate('/search')}
                                   className="rounded-full h-8 px-3 text-xs bg-teal-500 hover:bg-teal-600 text-white"
                              >
                                   Đặt nhanh
                              </Button>
                         </div>
                    </div>
               </div>
          </motion.div>
     );
};

// Helper function to get field images
const getFieldImages = (field) => {
     const common = [
          'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&h=800&fit=crop',
          'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=1200&h=800&fit=crop',
          'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=1200&h=800&fit=crop'
     ];
     const offset = (field.id || 0) % common.length;
     const rotated = [...common.slice(offset), ...common.slice(0, offset)];
     // Only use mainImageUrl from Cloudinary
     const mainImage = field.mainImageUrl;
     return [mainImage, ...rotated].filter(Boolean);
};


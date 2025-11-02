import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { gsap } from "gsap";
import { Search, MapPin, Star, ArrowRight, ChevronLeft, ChevronRight, DollarSign, ShieldCheck, Sparkles, CheckCircle, Users, Calendar, BarChart3, Zap, Globe, Clock, TrendingUp } from "lucide-react";
import { Container, Section, Card, CardContent, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Row } from "../shared/components/ui";
import { useNavigate } from "react-router-dom";


// Count-up Stats Card Component với animated background và icons
const StatsCard = ({ targetValue, suffix, label, index, decimals = 0, Icon }) => {
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
               className="relative hover:scale-110 transition-all duration-300 hover:cursor-pointer p-6 rounded-2xl bg-gradient-to-br from-white to-teal-50/30 border border-teal-100"
               initial={{ opacity: 0, y: 20 }}
               animate={isInView ? { opacity: 1, y: 0 } : {}}
               transition={{ delay: index * 0.1, duration: 0.5 }}
               whileHover={{ scale: 1.1, y: -8, rotate: [0, 1, -1, 0] }}
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
                              className="mb-4 flex justify-center"
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
                              <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
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

export default function HomePage({ user }) {
     const navigate = useNavigate();
     const [searchQuery, setSearchQuery] = useState("");
     const [selectedLocation, setSelectedLocation] = useState("all");
     const [selectedPrice, setSelectedPrice] = useState("all");
     const [hoveredCardId, setHoveredCardId] = useState(null);
     const [searchFocused, setSearchFocused] = useState(false);
     const [testimonialIndex, setTestimonialIndex] = useState(0);

     // Ref for hero parallax only
     const heroRef = useRef(null);
     const suggestRef = useRef(null);
     const particlesRef = useRef(null);

     // Helper functions to convert between "all" and empty string
     const handleLocationChange = (value) => {
          setSelectedLocation(value === "all" ? "" : value);
     };

     const handlePriceChange = (value) => {
          setSelectedPrice(value === "all" ? "" : value);
     };

     const getLocationValue = () => {
          return selectedLocation === "" ? "all" : selectedLocation;
     };

     const getPriceValue = () => {
          return selectedPrice === "" ? "all" : selectedPrice;
     };

     // Mock data for featured fields
     const featuredFields = [
          {
               id: 1,
               name: "Sân bóng đá ABC",
               location: "Quận Hoàn Kiếm, Hà Nội",
               price: "200,000 VNĐ",
               rating: 4.8,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               amenities: ["Có nước uống", "Có WC", "Có chỗ đậu xe"],
               availableSlots: 3
          },
          {
               id: 2,
               name: "Sân bóng đá XYZ",
               location: "Quận Ba Đình, Hà Nội",
               price: "180,000 VNĐ",
               rating: 4.6,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               amenities: ["Có nước uống", "Có WC"],
               availableSlots: 5
          },
          {
               id: 3,
               name: "Sân bóng đá DEF",
               location: "Quận Đống Đa, Hà Nội",
               price: "220,000 VNĐ",
               rating: 4.9,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               amenities: ["Có nước uống", "Có WC", "Có chỗ đậu xe", "Có thay đồ"],
               availableSlots: 2
          },
          {
               id: 4,
               name: "Sân bóng đá GHI",
               location: "Quận Đống Đa, Hà Nội",
               price: "220,000 VNĐ",
               rating: 4.9,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               amenities: ["Có nước uống", "Có WC", "Có chỗ đậu xe", "Có thay đồ"],
               availableSlots: 2
          },
          {
               id: 5,
               name: "Sân bóng đá DEF",
               location: "Quận Đống Đa, Hà Nội",
               price: "220,000 VNĐ",
               rating: 4.9,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               amenities: ["Có nước uống", "Có WC", "Có chỗ đậu xe", "Có thay đồ"],
               availableSlots: 2
          },
          {
               id: 6,
               name: "Sân bóng đá DEF",
               location: "Quận Đống Đa, Hà Nội",
               price: "220,000 VNĐ",
               rating: 4.9,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               amenities: ["Có nước uống", "Có WC", "Có chỗ đậu xe", "Có thay đồ"],
               availableSlots: 2
          },
          {
               id: 7,
               name: "Sân bóng đá DEF",
               location: "Quận Đống Đa, Hà Nội",
               price: "220,000 VNĐ",
               rating: 4.9,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               amenities: ["Có nước uống", "Có WC", "Có chỗ đậu xe", "Có thay đồ"],
               availableSlots: 2
          },

          {
               id: 8,
               name: "Sân bóng đá DEF",
               location: "Quận Đống Đa, Hà Nội",
               price: "220,000 VNĐ",
               rating: 4.9,
               image: "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               amenities: ["Có nước uống", "Có WC", "Có chỗ đậu xe", "Có thay đồ"],
               availableSlots: 2
          }
     ];

     // Provide 2-3 rotating images per field for slideshow
     const getFieldImages = (field) => {
          const common = [
               'https://images.unsplash.com/photo-1502877338535-766e1452684a?w=1200&h=800&fit=crop',
               'https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?w=1200&h=800&fit=crop',
               'https://images.unsplash.com/photo-1471295253337-3ceaaedca402?w=1200&h=800&fit=crop'
          ];
          // Simple variation by id to avoid all cards syncing the same frame
          const offset = (field.id || 0) % common.length;
          const rotated = [...common.slice(offset), ...common.slice(0, offset)];
          return [field.image, ...rotated];
     };

     // A presentational card with hover expand and auto image slideshow + animations
     const FieldCard = ({ field, index = 0 }) => {
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

          // Clear any pending collapse timeout on unmount
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
                         y: [0, -8, 0], // Floating animation
                    } : { opacity: 0, y: 50 }}
                    transition={{
                         opacity: { delay: index * 0.1, duration: 0.5 },
                         rotateY: { delay: index * 0.1, duration: 0.5 },
                         y: {
                              delay: index * 0.1 + 0.5,
                              duration: 3 + index * 0.2,
                              repeat: Infinity,
                              ease: "easeInOut",
                              // Don't use spring for keyframe animations with more than 2 values
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

     const handleSearch = () => {
          try {
               const locationMap = {
                    quan1: "Quận Hoàn Kiếm",
                    quan3: "Quận Ba Đình",
                    quan7: "Quận Đống Đa",
                    quan10: "Quận Hoàn Kiếm0",
               };
               const preset = {
                    searchQuery: searchQuery || "",
                    selectedLocation: selectedLocation ? (locationMap[selectedLocation] || "") : "",
                    selectedPrice: selectedPrice || "",
                    sortBy: "relevance",
               };
               window.localStorage.setItem("searchPreset", JSON.stringify(preset));
          } catch { }
          navigate("/search");
     };

     // Floating particles for hero background
     useEffect(() => {
          if (!particlesRef.current) return;

          const particles = [];
          for (let i = 0; i < 30; i++) {
               const particle = document.createElement('div');
               particle.className = 'absolute w-1 h-1 bg-teal-400/40 rounded-full pointer-events-none';
               particle.style.left = Math.random() * 100 + '%';
               particle.style.top = Math.random() * 100 + '%';
               particle.style.width = Math.random() * 3 + 2 + 'px';
               particle.style.height = particle.style.width;
               particlesRef.current.appendChild(particle);
               particles.push(particle);
          }

          particles.forEach((particle, i) => {
               gsap.to(particle, {
                    x: Math.random() * 300 - 150,
                    y: Math.random() * 300 - 150,
                    opacity: Math.random() * 0.5 + 0.2,
                    duration: Math.random() * 4 + 3,
                    repeat: -1,
                    yoyo: true,
                    ease: "sine.inOut",
                    delay: i * 0.2,
               });
          });

          return () => {
               particles.forEach(particle => {
                    if (particle.parentNode) {
                         particle.parentNode.removeChild(particle);
                    }
               });
          };
     }, []);

     // Parallax scroll effect for Hero Section only
     useEffect(() => {
          const handleScroll = () => {
               const scrollY = window.pageYOffset;

               // Apply parallax effect only to Hero Section
               if (heroRef.current) {
                    const heroBg = heroRef.current.querySelector('.hero-parallax-bg');
                    if (heroBg) {
                         heroBg.style.transform = `translateY(${scrollY * 0.5}px)`;
                    }
               }

               // Subtle parallax for suggestion section background
               if (suggestRef.current) {
                    const sugBg = suggestRef.current.querySelector('.suggest-parallax-bg');
                    if (sugBg) {
                         sugBg.style.transform = `translateY(${scrollY * 0.2}px)`;
                    }
               }
          };

          window.addEventListener('scroll', handleScroll);
          return () => window.removeEventListener('scroll', handleScroll);
     }, []);

     // Auto-scroll testimonials
     const testimonials = [
          { name: "Sebastian", role: "Graphic design" },
          { name: "Evangeline", role: "Model" },
          { name: "Alexander", role: "Software engineer" },
     ];

     useEffect(() => {
          const timer = setInterval(() => {
               setTestimonialIndex((prev) => (prev + 1) % testimonials.length);
          }, 5000); // Change every 5 seconds
          return () => clearInterval(timer);
          // eslint-disable-next-line react-hooks/exhaustive-deps
     }, []);

     return (
          <Section className="min-h-screen">
               {/* Hero Section */}
               <Section ref={heroRef} className="relative h-screen text-white overflow-hidden">
                    <div className="hero-parallax-bg" style={{ backgroundImage: "url('https://c1.staticflickr.com/4/3764/33659811165_3a90d35fdb_b.jpg')" }}></div>
                    <div className="absolute inset-0 bg-black/50"></div>
                    {/* Floating Particles */}
                    <div ref={particlesRef} className="absolute inset-0 z-10"></div>

                    <Container className="relative h-full py-52 mx-auto flex z-10">
                         <motion.div
                              className="text-start ml-24"
                              initial={{ opacity: 0, y: 50 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ duration: 0.8, ease: "easeOut" }}
                         >
                              {/* Animated Gradient Heading */}
                              <motion.h1
                                   className="text-5xl md:text-7xl w-8/12 font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-teal-400 to-teal-500"
                                   animate={{
                                        backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                                   }}
                                   transition={{
                                        duration: 5,
                                        repeat: Infinity,
                                        ease: "linear",
                                   }}
                                   style={{
                                        backgroundSize: "200% 100%",
                                   }}
                              >
                                   Khám phá và đặt sân dễ dàng
                              </motion.h1>

                              <motion.p
                                   className="text-lg md:text-xl mb-2 text-teal-50"
                                   initial={{ opacity: 0, x: -20 }}
                                   animate={{ opacity: 1, x: 0 }}
                                   transition={{ delay: 0.3, duration: 0.6 }}
                              >
                                   Tìm sân phù hợp, đặt lịch nhanh chóng
                              </motion.p>

                              <motion.div
                                   className="max-w-2xl w-full"
                                   initial={{ opacity: 0, y: 20 }}
                                   animate={{ opacity: 1, y: 0 }}
                                   transition={{ delay: 0.5, duration: 0.6 }}
                              >
                                   <motion.div
                                        animate={searchFocused ? {
                                             boxShadow: [
                                                  "0 0 0px rgba(20, 184, 166, 0)",
                                                  "0 0 20px rgba(20, 184, 166, 0.6)",
                                                  "0 0 0px rgba(20, 184, 166, 0)",
                                             ],
                                        } : {}}
                                        transition={{
                                             duration: 2,
                                             repeat: Infinity,
                                             ease: "easeInOut",
                                        }}
                                   >
                                        <Card className="rounded-2xl bg-white/50 border-none backdrop-blur-sm">
                                             <CardContent className="p-4">
                                                  <div className="flex flex-col text-black md:flex-row gap-3">
                                                       <motion.div
                                                            className="flex-1 relative"
                                                            whileFocus={{ scale: 1.02 }}
                                                       >
                                                            <motion.div
                                                                 animate={{
                                                                      scale: searchFocused ? [1, 1.1, 1] : 1,
                                                                      rotate: searchFocused ? [0, 5, -5, 0] : 0,
                                                                 }}
                                                                 transition={{
                                                                      duration: 2,
                                                                      repeat: searchFocused ? Infinity : 0,
                                                                      ease: "easeInOut",
                                                                 }}
                                                            >
                                                                 <Search className="absolute left-1 top-1/2 -translate-y-1/2 text-teal-600 w-5 h-5" />
                                                            </motion.div>
                                                            <Input
                                                                 placeholder="Tìm kiếm sân bóng..."
                                                                 value={searchQuery}
                                                                 onChange={(e) => setSearchQuery(e.target.value)}
                                                                 onFocus={() => setSearchFocused(true)}
                                                                 onBlur={() => setSearchFocused(false)}
                                                                 className="pl-8 text-gray-800 bg-transparent border-0 rounded-none focus-visible:border-b-2 focus-visible:border-teal-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0"
                                                            />
                                                       </motion.div>
                                                       <hr className="w-[1px] h-10 bg-white" />
                                                       <Select value={getLocationValue()} onValueChange={handleLocationChange}>
                                                            <SelectTrigger className="md:w-20 w-10 px-1 bg-transparent border-0 rounded-xl text-white focus:border-b-2 focus:border-teal-500 focus:outline-none focus:ring-0 focus-visible:border-b-2 focus-visible:border-teal-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
                                                                 <SelectValue placeholder="All Locations" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                 <SelectItem value="all">All Locations</SelectItem>
                                                                 <SelectItem value="quan1">Quận Hoàn Kiếm</SelectItem>
                                                                 <SelectItem value="quan3">Quận Ba Đình</SelectItem>
                                                                 <SelectItem value="quan7">Quận Đống Đa</SelectItem>
                                                                 <SelectItem value="quan10">Quận Hoàn Kiếm0</SelectItem>
                                                            </SelectContent>
                                                       </Select>
                                                       <hr className="w-[1px] h-10 bg-white" />
                                                       <Select value={getPriceValue()} onValueChange={handlePriceChange}>
                                                            <SelectTrigger className="md:w-28 px-1 bg-transparent border-0 rounded-xl text-white focus:border-b-2 focus:border-teal-500 focus:outline-none focus:ring-0 focus-visible:border-b-2 focus-visible:border-teal-500 focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
                                                                 <SelectValue placeholder="Mọi mức giá" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                 <SelectItem value="all">Mọi mức giá</SelectItem>
                                                                 <SelectItem value="under100">Dưới 100k</SelectItem>
                                                                 <SelectItem value="100-200">100k - 200k</SelectItem>
                                                                 <SelectItem value="200-300">200k - 300k</SelectItem>
                                                                 <SelectItem value="over300">Trên 300k</SelectItem>
                                                            </SelectContent>
                                                       </Select>
                                                       <motion.div
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                       >
                                                            <Button
                                                                 onClick={handleSearch}
                                                                 className="px-4 rounded-xl bg-teal-500 text-white hover:bg-teal-600 transition-all duration-300 hover:cursor-pointer"
                                                                 animate={{
                                                                      boxShadow: [
                                                                           "0 0 0px rgba(20, 184, 166, 0)",
                                                                           "0 0 15px rgba(20, 184, 166, 0.5)",
                                                                           "0 0 0px rgba(20, 184, 166, 0)",
                                                                      ],
                                                                 }}
                                                                 transition={{
                                                                      duration: 2,
                                                                      repeat: Infinity,
                                                                      ease: "easeInOut",
                                                                 }}
                                                            >
                                                                 <motion.span
                                                                      animate={{ x: [0, 3, 0] }}
                                                                      transition={{
                                                                           duration: 1.5,
                                                                           repeat: Infinity,
                                                                           ease: "easeInOut",
                                                                      }}
                                                                      className="inline-flex items-center"
                                                                 >
                                                                      <Search className="w-5 h-5 mr-2" /> Tìm kiếm
                                                                 </motion.span>
                                                            </Button>
                                                       </motion.div>
                                                  </div>
                                             </CardContent>
                                        </Card>
                                   </motion.div>
                              </motion.div>
                         </motion.div>
                    </Container>
               </Section>

               {/* Stats Section with Count-up Animation */}
               <motion.section
                    className="py-8 bg-gradient-to-br from-gray-100 via-teal-50/30 to-gray-100 relative overflow-hidden"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.8 }}
               >
                    <motion.div
                         className="absolute inset-0 opacity-20"
                         animate={{
                              backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
                         }}
                         transition={{
                              duration: 20,
                              repeat: Infinity,
                              ease: "linear",
                         }}
                         style={{
                              backgroundImage: "linear-gradient(45deg, transparent 30%, rgba(20, 184, 166, 0.3) 50%, transparent 70%)",
                              backgroundSize: "200% 200%",
                         }}
                    />
                    <Container className="relative z-10">
                         <Row className="md:grid-cols-4 text-center">
                              <StatsCard targetValue={500} suffix="+" label="Sân bóng" index={0} Icon={Calendar} />
                              <StatsCard targetValue={10000} suffix="+" label="Người dùng" index={1} Icon={Users} />
                              <StatsCard targetValue={50000} suffix="+" label="Lượt đặt sân" index={2} Icon={TrendingUp} />
                              <StatsCard targetValue={4.8} suffix="" label="Đánh giá trung bình" index={3} decimals={1} Icon={Star} />
                         </Row>
                    </Container>
               </motion.section>

               {/* Quick Categories */}
               <Section className="py-5">
                    <Container className="relative py-10 rounded-2xl p-6 overflow-hidden bg-cover bg-center bg-no-repeat" style={{
                         backgroundImage: "url('https://images.pexels.com/photos/47354/the-ball-stadion-football-the-pitch-47354.jpeg')"
                    }}>
                         <div className="absolute inset-0 bg-black/40" />
                         <div className="relative z-10">
                              <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-wide text-white">Danh mục nhanh</h2>
                              <div className="mt-4 h-[2px] w-[43%] bg-white/40" />
                         </div>
                         <div className="relative z-10 flex items-center py-3 gap-6">
                              <div className="relative mb-6 w-1/3">
                                   <p className="mt-4 text-white/90 max-w-xl text-sm md:text-base">
                                        Bạn có thể tìm kiếm nhanh chóng loại sân phù hợp với bạn tại đây.
                                   </p>
                                   <Button onClick={() => navigate("/search")} className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full hover:border-teal-500 hover:border hover:text-teal-500 hover:bg-transparent bg-white text-black transition-colors hover:cursor-pointer">
                                        Xem tất cả
                                        <ArrowRight className="w-4 h-4" />
                                   </Button>
                              </div>
                              <div className="relative -mx-1 overflow-x-auto  scrollbar-none w-2/3">
                                   <div className="px-1 grid grid-cols-3 gap-6 max-w-3xl">
                                        {[
                                             { id: "san5", label: "Sân 5 người", image: featuredFields[0]?.image, preset: { searchQuery: "Sân 5" } },
                                             { id: "san7", label: "Sân 7 người", image: featuredFields[1]?.image, preset: { searchQuery: "Sân 7" } },
                                             { id: "san11", label: "Sân 11 người", image: featuredFields[2]?.image, preset: { searchQuery: "Sân 11" } },
                                        ].map((c) => (
                                             <Button
                                                  key={c.id}
                                                  onClick={() => {
                                                       try { window.localStorage.setItem("searchPreset", JSON.stringify(c.preset || {})); } catch { }
                                                       navigate("/search");
                                                  }}
                                                  aria-label={c.label}
                                                  className="group text-left w-full hover:scale-105 transition-all duration-300 hover:cursor-pointer m-1 p-0 h-auto bg-transparent border-0 hover:bg-transparent"
                                             >
                                                  <div className="relative rounded-xl overflow-hidden ring-1 ring-white/25 shadow-md">
                                                       <img src={c.image} alt={c.label} className="h-28 w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                                                  </div>
                                                  <div className="mt-2 text-white font-semibold drop-shadow">{c.label}</div>
                                             </Button>
                                        ))}
                                   </div>
                              </div>
                         </div>
                    </Container>
               </Section>

               {/* Top booking now */}
               <div className="relative ">
                    <div
                         className="absolute inset-0 bg-cover bg-center"
                         style={{ backgroundImage: "url('https://c1.staticflickr.com/4/3764/33659811165_3a90d35fdb_b.jpg')" }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-white" />
                    <div className="relative z-10 py-10">
                         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                              <div className="text-center mb-10">
                                   <h2 className="text-3xl md:text-4xl font-extrabold tracking-wide text-white uppercase">Top book now</h2>
                              </div>

                              <div className={`grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 relative transition-colors`}>
                                   {/* Dim overlay like modal when a card is hovered */}
                                   {hoveredCardId !== null && (
                                        <div className="pointer-events-none absolute inset-0 rounded-xl backdrop-blur-[1px] transition-opacity" />
                                   )}
                                   {featuredFields.map((field, index) => (
                                        <FieldCard key={field.id} field={field} index={index} />
                                   ))}
                              </div>

                              <div className="text-center mt-10">
                                   <Button
                                        onClick={() => navigate("/search")}
                                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border hover:border-teal-500 bg-teal-500 border-gray-300 hover:text-white hover:bg-teal-600 transition-colors hover:cursor-pointer"
                                   >
                                        See all
                                        <ArrowRight className="w-4 h-4" />
                                   </Button>
                              </div>
                         </div>
                    </div>
               </div>

               {/* Gợi ý/giới thiệu các sân để khuyến khích đặt */}
               <Container ref={suggestRef} className="relative border border-gray-400 py-10 my-10 rounded-2xl overflow-hidden">
                    <div
                         className="suggest-parallax-bg absolute inset-0 bg-cover bg-center"
                         style={{ backgroundImage: "url('https://i.pinimg.com/originals/a3/c7/79/a3c779e5d5b622eeb598ac1d50c05cb8.png')", willChange: 'transform' }}
                    />
                    <div className="absolute inset-0 bg-white/30" />
                    <Container className="relative z-10">
                         <div className="max-w-3xl mx-auto text-center mb-10">
                              <h2 className="text-3xl md:text-4xl font-extrabold tracking-wide text-teal-800">Gợi ý dành cho bạn</h2>
                              <p className="mt-3 text-gray-600">Những lựa chọn được yêu thích, phù hợp cho nhiều nhóm người chơi và thời điểm khác nhau.</p>
                         </div>

                         {[
                              {
                                   id: 'time',
                                   title: 'Theo thời điểm',
                                   items: [
                                        { id: 'morning', title: 'Sân buổi sáng', desc: 'Mát mẻ, giá tốt, dễ có slot.', img: 'https://images.unsplash.com/photo-1521417531039-95f0b7fdd0e5?w=800&h=600&fit=crop', preset: { timeOfDay: 'morning' } },
                                        { id: 'afternoon', title: 'Sân buổi chiều', desc: 'Ánh sáng đẹp, năng lượng nhất ngày.', img: 'https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&h=600&fit=crop', preset: { timeOfDay: 'afternoon' } },
                                        { id: 'evening', title: 'Sân buổi tối', desc: 'Không nắng gắt, hợp sau giờ làm.', img: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&h=600&fit=crop', preset: { timeOfDay: 'evening' } },
                                        { id: 'lowpeak', title: 'Giờ thấp điểm', desc: 'Dễ đặt, có thể rẻ hơn.', img: 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800&h=600&fit=crop', preset: { filter: 'offpeak' } },
                                   ]
                              },
                              {
                                   id: 'price',
                                   title: 'Theo mức giá',
                                   items: [
                                        { id: 'under100', title: 'Giá tiết kiệm', desc: 'Dưới 100k/giờ, hợp team sinh viên.', img: 'https://images.unsplash.com/photo-1599050751795-5fa78f5c9c23?w=800&h=600&fit=crop', preset: { price: 'under100' } },
                                        { id: '100-200', title: 'Giá tầm trung', desc: '100k - 200k/giờ, nhiều lựa chọn.', img: 'https://images.unsplash.com/photo-1483721310020-03333e577078?w=800&h=600&fit=crop', preset: { price: '100-200' } },
                                        { id: '200-300', title: '200k - 300k', desc: 'Chất lượng tốt, sân đẹp.', img: 'https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&h=600&fit=crop', preset: { price: '200-300' } },
                                        { id: 'over300', title: 'Giá cao cấp', desc: 'Trên 300k/giờ, dịch vụ tốt.', img: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=800&h=600&fit=crop', preset: { price: 'over300' } },
                                   ]
                              },
                              {
                                   id: 'type',
                                   title: 'Theo loại sân',
                                   items: [
                                        { id: 'type5', title: 'Sân 5 người', desc: 'Đội nhỏ, trận đấu nhanh.', img: 'https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg?w=800&h=600&fit=crop', preset: { searchQuery: 'Sân 5' } },
                                        { id: 'type7', title: 'Sân 7 người', desc: 'Cân bằng vận động-chiến thuật.', img: 'https://images.unsplash.com/photo-1542362567-b07e54358753?w=800&h=600&fit=crop', preset: { searchQuery: 'Sân 7' } },
                                        { id: 'type11', title: 'Sân 11 người', desc: 'Chuẩn thi đấu, không gian rộng.', img: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&h=600&fit=crop', preset: { searchQuery: 'Sân 11' } },
                                        { id: 'indoor', title: 'Sân phủ mái', desc: 'Không lo mưa nắng, ổn định.', img: 'https://images.unsplash.com/photo-1517245302115-5b4f3f0b4769?w=800&h=600&fit=crop', preset: { features: 'indoor' } },
                                   ]
                              }
                         ].map((group) => (
                              <div key={group.id} className="mb-12">
                                   <div className="flex items-end justify-between mb-5">
                                        <h3 className="text-2xl font-bold text-teal-800 drop-shadow-sm">{group.title}</h3>
                                   </div>
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {group.items.map((s) => (
                                             <div key={s.id} className="[perspective:1000px]">
                                                  <div className="relative h-56 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all [transform-style:preserve-3d] duration-700 ease-out group/card hover:[transform:rotateY(180deg)]">
                                                       {/* Front */}
                                                       <div className="absolute inset-0 overflow-hidden rounded-2xl [backface-visibility:hidden] will-change-transform">
                                                            <img src={s.img} alt={s.title} className="w-full h-full object-cover" />
                                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
                                                            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                                                 <h4 className="text-white font-semibold text-base truncate drop-shadow">{s.title}</h4>
                                                                 <span className="ml-3 inline-flex items-center text-[10px] px-2 py-1 rounded-full bg-white/90 text-teal-700 border border-teal-200">Gợi ý</span>
                                                            </div>
                                                       </div>
                                                       {/* Back */}
                                                       <div className="absolute inset-0 rounded-2xl bg-white p-4 grid content-between [backface-visibility:hidden] [transform:rotateY(180deg)] will-change-transform">
                                                            <div>
                                                                 <div className="flex items-start justify-between">
                                                                      <h4 className="text-teal-700 font-semibold text-base truncate">{s.title}</h4>
                                                                      <span className="text-[10px] px-2 py-1 rounded-full bg-teal-50 text-teal-600 border border-teal-100">Nhóm</span>
                                                                 </div>
                                                                 <div className="mt-2 flex items-center text-xs text-gray-600">
                                                                      <MapPin className="w-3.5 h-3.5 mr-1" />
                                                                      <span className="truncate">Đa khu vực</span>
                                                                 </div>
                                                                 <div className="mt-2 text-xs text-gray-700">{s.desc}</div>
                                                                 <div className="mt-3 flex flex-wrap gap-1.5">
                                                                      {['Sạch đẹp', 'Dễ đặt', 'Phù hợp nhóm'].map((tag, i) => (
                                                                           <span key={i} className="px-2 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100 text-[11px]">{tag}</span>
                                                                      ))}
                                                                 </div>
                                                            </div>
                                                            <div className="flex items-center justify-between">
                                                                 <span className="text-[11px] inline-flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-full border">Số lượng: <span className="font-semibold text-teal-700">Nhiều</span></span>
                                                                 <Button
                                                                      onClick={() => { try { window.localStorage.setItem('searchPreset', JSON.stringify(s.preset || {})); } catch { } navigate('/search'); }}
                                                                      className="rounded-full h-8 px-3 text-xs bg-teal-500 hover:bg-teal-600 text-white"
                                                                 >
                                                                      Đặt ngay
                                                                 </Button>
                                                            </div>
                                                       </div>
                                                  </div>
                                             </div>
                                        ))}
                                   </div>
                              </div>
                         ))}
                    </Container>
               </Container>

               {/* Testimonials - Auto-scrolling Carousel */}
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

               {/* Why choose us */}
               <div className="py-16">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                         <h2 className="text-3xl md:text-4xl font-extrabold text-center text-teal-800 mb-10">Vì sao chọn chúng tôi?</h2>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
                              <div>
                                   <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
                                        <DollarSign className="w-7 h-7 text-teal-600" />
                                   </div>
                                   <div className="font-semibold text-teal-900">Giá cạnh tranh</div>
                                   <p className="mt-2 text-teal-600 leading-relaxed text-sm">Giá minh bạch, ưu đãi thường xuyên cho người dùng mới và thân thiết</p>
                              </div>
                              <div>
                                   <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
                                        <ShieldCheck className="w-7 h-7 text-teal-600" />
                                   </div>
                                   <div className="font-semibold text-teal-900">Đặt chỗ an toàn</div>
                                   <p className="mt-2 text-teal-600 leading-relaxed text-sm">Xác nhận nhanh, bảo vệ thông tin và hỗ trợ khi có sự cố</p>
                              </div>
                              <div>
                                   <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
                                        <Sparkles className="w-7 h-7 text-teal-600" />
                                   </div>
                                   <div className="font-semibold text-teal-900">Trải nghiệm liền mạch</div>
                                   <p className="mt-2 text-teal-600 leading-relaxed text-sm">Tìm kiếm – chọn giờ – đặt sân nhanh chóng chỉ trong vài bước</p>
                              </div>
                         </div>
                    </div>
               </div>

               {/* Newsletter */}
               <div className="py-20 relative bg-cover bg-center bg-no-repeat" style={{
                    backgroundImage: "url('https://thanhnien.mediacdn.vn/Uploaded/lanphuong/2022_04_06/san-my-dinh-dep-hoang-chup-3-8596.jpg')"
               }}>
                    <div className="absolute inset-0 bg-black/45" />
                    <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                         <h2 className="text-3xl font-bold mb-3">Nhận khuyến mãi sớm nhất</h2>
                         <p className="text-teal-300 mb-6">Đăng ký email để không bỏ lỡ mã giảm giá và tin mới</p>
                         <div className="flex flex-col sm:flex-row gap-3 justify-center">
                              <Input type="email" placeholder="Email của bạn" className="w-full sm:w-80 px-4 py-3 rounded-lg text-gray-900" />
                              <Button className="px-6 py-3 rounded-lg bg-white text-teal-600 font-semibold hover:bg-gray-100">Đăng ký</Button>
                         </div>
                    </div>
               </div>

               {/* FAQ */}
               <div className="py-16" >
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                         <div className="text-center mb-10">
                              <h2 className="text-3xl font-bold text-teal-900 mb-3">Câu hỏi thường gặp</h2>
                              <p className="text-teal-600">Một số thắc mắc phổ biến khi đặt sân</p>
                         </div>
                         <div className="space-y-4 ">
                              {[
                                   { q: "Làm sao để đặt sân?", a: "Bạn chọn sân, khung giờ trống và đăng nhập để xác nhận đặt." },
                                   { q: "Có thể hủy/đổi giờ không?", a: "Phụ thuộc chính sách từng sân. Bạn xem chi tiết trong mục đặt sân của mình." },
                                   { q: "Thanh toán thế nào?", a: "Hỗ trợ nhiều phương thức: Momo, VNPay, ZaloPay, v.v." },
                              ].map((item, idx) => (
                                   <div key={idx} className="border border-teal-200 p-4 rounded-xl">
                                        <div className="font-semibold text-teal-900">{item.q}</div>
                                        <div className="text-teal-600 mt-1">{item.a}</div>
                                   </div>
                              ))}
                         </div>
                    </div>
               </div>

               {/* CTA Section */}
               {
                    !user && (
                         <div className="relative py-16 bg-cover bg-center bg-no-repeat" style={{
                              backgroundImage: "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&h=1080&fit=crop')"
                         }}>
                              <div className="absolute inset-0 bg-black/45" />
                              <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                                   <h2 className="text-3xl font-bold text-white mb-4">
                                        Sẵn sàng bắt đầu?
                                   </h2>
                                   <p className="text-xl text-teal-300 mb-8">
                                        Đăng ký ngay để trải nghiệm đầy đủ các tính năng
                                   </p>
                                   <Button
                                        onClick={() => navigate("/auth")}
                                        className="bg-white text-teal-500 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
                                   >
                                        Đăng ký miễn phí
                                   </Button>
                              </div>
                         </div>
                    )
               }
          </Section >
     );
}

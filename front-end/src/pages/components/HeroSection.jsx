import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { Search } from "lucide-react";
import { Container, Section, Card, CardContent, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../shared/components/ui";


export const HeroSection = ({ searchQuery, setSearchQuery, selectedLocation, setSelectedLocation, selectedPrice, setSelectedPrice, onSearch }) => {

     const [searchFocused, setSearchFocused] = useState(false);
     const heroRef = useRef(null);
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

               if (heroRef.current) {
                    const heroBg = heroRef.current.querySelector('.hero-parallax-bg');
                    if (heroBg) {
                         heroBg.style.transform = `translateY(${scrollY * 0.5}px)`;
                    }
               }
          };

          window.addEventListener('scroll', handleScroll);
          return () => window.removeEventListener('scroll', handleScroll);
     }, []);

     return (
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
                                   <Card className="rounded-3xl bg-white/50 border-none backdrop-blur-sm">
                                        <CardContent className="p-3">
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
                                                            onClick={onSearch}
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
     );
};


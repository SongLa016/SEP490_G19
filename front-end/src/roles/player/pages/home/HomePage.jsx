import { useState, useEffect, useRef } from "react";
import { Section } from "../../../../shared/components/ui";
import { useNavigate } from "react-router-dom";
import Lenis from "lenis";
import { HeroSection, StatsSection, QuickCategoriesSection, TopBookingNowSection, QuickBookingSection, CommunityMatchmakingSection, UserReviewsSection, EventsSection, MobileAppSection, WhyChooseUsSection, NewsletterSection, CTASection } from "./components";
import { LoginPromotionModal } from "../../../../shared/components/LoginPromotionModal";

export default function HomePage({ user }) {
     const navigate = useNavigate();
     const [searchQuery, setSearchQuery] = useState("");
     const [selectedLocation, setSelectedLocation] = useState("all");
     const [selectedPrice, setSelectedPrice] = useState("all");
     const [hoveredCardId, setHoveredCardId] = useState(null);

     // Horizontal scroll with zoom states (use existing canvas area)
     const canvasPhaseDuration = 0.22; // intro phase portion (0..1 of section)
     const canvasMinZoom = 0.45; // start zoom for intro phase
     const [zoom, setZoom] = useState(canvasMinZoom);
     const [pan, setPan] = useState({ x: 0, y: 0 });
     const [isCanvasPhase, setIsCanvasPhase] = useState(true);
     const [focusIndex, setFocusIndex] = useState(-1); // which detail item is focused
     const canvasRef = useRef(null);
     const scrollSectionRef = useRef(null);
     const lenisRef = useRef(null);

     const detailComponents = [
          { key: "overview-quick", element: <QuickBookingSection user={user} /> },
          { key: "overview-community", element: <CommunityMatchmakingSection /> },
          { key: "overview-reviews", element: <UserReviewsSection /> },
          { key: "overview-events", element: <EventsSection /> }
     ];

     const componentCount = detailComponents.length;
     const componentWidth = 1280;
     const componentGap = 32;
     const overviewZoom = 0.8;
     const overviewFocusZoom = 1.1;
     const detailZoom = 1;
     const overviewHoldThreshold = 0.12;
     const overviewFocusThreshold = 0.28;

     const overviewPreviewScale = 0.55;

     const overviewBadges = [
          "Live booking",
          "Multi-venue",
          "Finance dashboard",
          "AI gợi ý lịch",
          "Thống kê realtime",
          "Ứng dụng di động",
          "API tích hợp",
          "Hỗ trợ 24/7"
     ];

     // Initialize Lenis smooth scroll
     useEffect(() => {
          const lenis = new Lenis({
               duration: 1.2,
               easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
               orientation: 'vertical',
               gestureOrientation: 'vertical',
               smoothWheel: true,
               wheelMultiplier: 0.8,
               smoothTouch: false,
               touchMultiplier: 2,
               infinite: false,
               lerp: 0.08,
          });

          lenisRef.current = lenis;

          function raf(time) {
               lenis.raf(time);
               requestAnimationFrame(raf);
          }

          requestAnimationFrame(raf);

          // Hide scrollbar
          const styleEl = document.createElement("style");
          styleEl.setAttribute("data-homepage-scrollbar-hide", "");
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

               /* Hide scrollbars on scrollable elements */
               * { scrollbar-width: none; }
               *::-webkit-scrollbar { display: none; }
          `;
          document.head.appendChild(styleEl);

          return () => {
               lenis.destroy();
               try {
                    document.head.removeChild(styleEl);
               } catch { }
          };
     }, []);

     // Handle scroll-based zoom and pan with intro + sequential reveal
     useEffect(() => {
          if (!scrollSectionRef.current || !lenisRef.current) return;

          let rafId = null;
          let ticking = false;
          let lastUpdateTime = 0;
          const throttleMs = 16; // ~60fps

          const handleScroll = (e) => {
               const now = performance.now();
               if (now - lastUpdateTime < throttleMs && ticking) {
                    return; // Skip if too soon
               }
               lastUpdateTime = now;

               if (!ticking) {
                    ticking = true;
                    rafId = requestAnimationFrame(() => {
                         const scrollSection = scrollSectionRef.current;
                         if (!scrollSection) {
                              ticking = false;
                              return;
                         }

                         const windowHeight = window.innerHeight;
                         const sectionHeight = scrollSection.offsetHeight;
                         const sectionTop = scrollSection.offsetTop;
                         // Use Lenis scroll position from event or fallback to window.scrollY
                         const currentScroll = e?.scroll ?? lenisRef.current?.scroll ?? window.scrollY ?? window.pageYOffset;
                         const scrollStart = sectionTop - windowHeight;

                         const centerX = window.innerWidth / 2;
                         const overviewPan = centerX - (componentWidth / 2);

                         // When at last element, allow natural scroll earlier to avoid jump
                         const lastElementTransitionEnd = 0.80; // End scroll section at 80% when at last element

                         // Calculate if we're at last element past transition to determine effective section end
                         let effectiveSectionEnd = scrollStart + sectionHeight;
                         let shouldTreatAsPastSection = false;

                         if (currentScroll >= scrollStart && currentScroll <= scrollStart + sectionHeight) {
                              const tempProgress = (currentScroll - scrollStart) / sectionHeight;
                              if (tempProgress > canvasPhaseDuration) {
                                   const tempHProgress = (tempProgress - canvasPhaseDuration) / (1 - canvasPhaseDuration);
                                   if (tempHProgress > overviewFocusThreshold) {
                                        const tempNormalized = Math.max(0, Math.min(1, (tempHProgress - overviewFocusThreshold) / (1 - overviewFocusThreshold)));
                                        const tempComponentIndex = Math.min(Math.floor(tempNormalized * componentCount + 1e-6), componentCount - 1);
                                        if (tempComponentIndex === componentCount - 1 && tempProgress >= lastElementTransitionEnd) {
                                             // When at last element past transition, treat as past section immediately
                                             effectiveSectionEnd = scrollStart + sectionHeight * lastElementTransitionEnd;
                                             shouldTreatAsPastSection = true;
                                        }
                                   }
                              }
                         }

                         // If we should treat as past section, handle it immediately to avoid jump
                         if (shouldTreatAsPastSection || currentScroll > effectiveSectionEnd) {
                              // Past scroll section (or at last element past transition) - keep last element state fixed
                              setZoom(detailZoom);
                              const lastCenter = (componentWidth / 2) + componentCount * (componentWidth + componentGap);
                              const panX = centerX - lastCenter;
                              setPan({ x: panX, y: 0 });
                              setIsCanvasPhase(false);
                              setFocusIndex(componentCount - 1);
                              ticking = false;
                              return;
                         }

                         if (currentScroll >= scrollStart && currentScroll <= effectiveSectionEnd) {
                              let progress = (currentScroll - scrollStart) / sectionHeight;
                              progress = Math.max(0, Math.min(1, progress));

                              // Phase 1: intro (only show canvas with overview centered)
                              if (progress <= canvasPhaseDuration) {
                                   const p = progress / canvasPhaseDuration;
                                   const eased = 1 - Math.pow(1 - p, 3);
                                   setIsCanvasPhase(true);
                                   const canvasZoom = canvasMinZoom + (overviewZoom - canvasMinZoom) * eased;
                                   setZoom(canvasZoom);
                                   setPan({ x: overviewPan, y: 0 });
                                   setFocusIndex(-1);
                                   ticking = false;
                                   return;
                              }

                              // Phase 2+: overview hold then per-component focus and reveal
                              setIsCanvasPhase(false);

                              // map remaining progress to horizontal logic
                              const hProgress = (progress - canvasPhaseDuration) / (1 - canvasPhaseDuration);

                              if (hProgress <= overviewHoldThreshold) {
                                   setZoom(overviewZoom);
                                   setPan({ x: overviewPan, y: 0 });
                                   setFocusIndex(-1);
                                   ticking = false;
                                   return;
                              }

                              if (hProgress <= overviewFocusThreshold) {
                                   const focusStageProgress = (hProgress - overviewHoldThreshold) / Math.max(overviewFocusThreshold - overviewHoldThreshold, 0.00001);
                                   const easedFocus = 1 - Math.pow(1 - focusStageProgress, 3);
                                   const zoomLevel = overviewZoom + (overviewFocusZoom - overviewZoom) * easedFocus;
                                   setZoom(zoomLevel);
                                   setPan({ x: overviewPan, y: 0 });
                                   setFocusIndex(-1);
                                   ticking = false;
                                   return;
                              }

                              const normalizedProgress = Math.max(0, Math.min(1, (hProgress - overviewFocusThreshold) / (1 - overviewFocusThreshold)));
                              const componentIndex = Math.min(Math.floor(normalizedProgress * componentCount + 1e-6), componentCount - 1);

                              setZoom(detailZoom);

                              const itemCenter = (componentWidth / 2) + (componentIndex + 1) * (componentWidth + componentGap);
                              const panX = centerX - itemCenter;
                              setPan({ x: panX, y: 0 });
                              setFocusIndex(componentIndex);

                         } else if (currentScroll < scrollStart) {
                              setZoom(overviewZoom);
                              setPan({ x: overviewPan, y: 0 });
                              setIsCanvasPhase(true);
                              setFocusIndex(-1);
                         }

                         ticking = false;
                    });
                    ticking = true;
               }
          };

          // Listen to Lenis scroll events
          const scrollHandler = (e) => {
               handleScroll(e);
          };
          lenisRef.current.on('scroll', scrollHandler);
          // Initial call to set initial state
          setTimeout(() => {
               const initialScroll = window.scrollY || window.pageYOffset || 0;
               handleScroll({ scroll: initialScroll });
          }, 100);

          return () => {
               if (lenisRef.current) {
                    lenisRef.current.off('scroll', scrollHandler);
               }
               if (rafId) {
                    cancelAnimationFrame(rafId);
               }
          };
     }, [componentCount, componentGap, componentWidth, detailZoom, overviewHoldThreshold, overviewFocusThreshold, overviewZoom, overviewFocusZoom, canvasPhaseDuration]);

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

     return (
          <Section className="min-h-screen bg-[url('https://images.unsplash.com/photo-1550895030-823330fc2551?ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTU5fHxiYWNrZ3JvdW5kfGVufDB8fDB8fHww&auto=format&fit=crop&q=60&w=600')] bg-current bg-center bg-cover">
               <HeroSection
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedLocation={selectedLocation}
                    setSelectedLocation={setSelectedLocation}
                    selectedPrice={selectedPrice}
                    setSelectedPrice={setSelectedPrice}
                    onSearch={handleSearch}
               />

               <StatsSection />
               <QuickCategoriesSection featuredFields={featuredFields} />
               <TopBookingNowSection
                    featuredFields={featuredFields}
                    hoveredCardId={hoveredCardId}
                    setHoveredCardId={setHoveredCardId}
               />
               {/* Horizontal Scroll Section with Zoom Effect */}
               <div ref={scrollSectionRef} data-scroll-section className="relative w-full bg-transparent" style={{ height: '400vh' }}>
                    {/* Canvas Area - Sticky */}
                    <div
                         className="sticky top-0 h-screen w-full overflow-hidden"
                         style={{
                              willChange: 'transform',
                              backfaceVisibility: 'hidden',
                              WebkitBackfaceVisibility: 'hidden',
                              transform: 'translateZ(0)',
                              WebkitTransform: 'translateZ(0)'
                         }}
                    >
                         <div
                              ref={canvasRef}
                              className="relative w-full h-full flex items-center justify-center"
                              style={{
                                   willChange: 'transform',
                                   backfaceVisibility: 'hidden',
                                   WebkitBackfaceVisibility: 'hidden'
                              }}
                         >
                              {/* Horizontal Components Container */}
                              <div
                                   className="flex items-center gap-8"
                                   style={{
                                        opacity: isCanvasPhase ? 1 : 1,
                                        transform: `translate3d(${pan.x}px, 0, 0) scale(${zoom})`,
                                        transformOrigin: 'center center',
                                        willChange: 'transform',
                                        backfaceVisibility: 'hidden',
                                        WebkitBackfaceVisibility: 'hidden'
                                   }}
                              >
                                   {/* Overview artboard */}
                                   <div className="flex-shrink-0 w-full max-w-7xl">
                                        <div className="relative overflow-hidden rounded-[48px] bg-slate-950/90 text-white shadow-[0_70px_140px_rgba(15,23,42,0.4)] border border-white/10">
                                             <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5" aria-hidden="true"></div>
                                             <div className="absolute inset-y-0 left-1/2 w-px bg-white/10"></div>
                                             <div className="relative px-12 py-6 space-y-6">
                                                  <div className="flex items-center justify-between">
                                                       <div className="text-xs uppercase tracking-[0.32em] text-slate-400">Artboard 1 • Showreel</div>
                                                       <div className="text-sm font-semibold text-slate-300">Functional Overview</div>
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-6">
                                                       {detailComponents.map(({ key, element }, index) => (
                                                            <div
                                                                 key={`overview-${key}`}
                                                                 className="rounded-3xl bg-white/90 text-slate-900 pt-5  shadow-[0_30px_70px_rgba(15,23,42,0.25)] backdrop-blur border border-white/30"
                                                            >
                                                                 <div className="flex items-center justify-between text-xs px-4 uppercase tracking-[0.28em] text-slate-400">
                                                                      <span>Component {index + 1}</span>
                                                                      <span>Preview</span>
                                                                 </div>
                                                                 <div className="mt-2 h-64 rounded-2xl overflow-hidden border border-white/50 bg-white shadow-[0_25px_60px_rgba(15,23,42,0.2)]">
                                                                      <div
                                                                           className="pointer-events-none origin-top-left"
                                                                           style={{
                                                                                transform: `scale(${overviewPreviewScale})`,
                                                                                transformOrigin: "top left",
                                                                                width: `${100 / overviewPreviewScale}%`,
                                                                                height: `${100 / overviewPreviewScale}%`
                                                                           }}
                                                                      >
                                                                           {element}
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       ))}
                                                  </div>
                                                  <div className="flex flex-wrap gap-3">
                                                       {overviewBadges.map((badge) => (
                                                            <span
                                                                 key={badge}
                                                                 className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white/80 backdrop-blur"
                                                            >
                                                                 {badge}
                                                            </span>
                                                       ))}
                                                  </div>
                                             </div>
                                        </div>
                                   </div>

                                   {detailComponents.map(({ key, element }, index) => {
                                        const current = focusIndex === index;
                                        // Opacity và blur theo vị trí
                                        const opacity = current ? 1 : 0;
                                        const blur = current ? 0 : 8;

                                        // Scale để tạo cảm giác phóng vào
                                        const scale = current ? 1 : 0.92;

                                        // Hiệu ứng trượt nhẹ
                                        const translateY = current ? 0 : 80;

                                        return (
                                             <div
                                                  key={key}
                                                  className="flex-shrink-0 w-full max-w-7xl"
                                                  style={{
                                                       opacity,
                                                       transform: `translate3d(0, ${translateY}px, 0) scale(${scale})`,
                                                       filter: `blur(${blur}px)`,
                                                       transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), filter 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                                       pointerEvents: current ? "auto" : "none",
                                                       willChange: "transform, opacity, filter",
                                                       backfaceVisibility: 'hidden',
                                                       WebkitBackfaceVisibility: 'hidden'
                                                  }}
                                             >
                                                  <div className="rounded-[48px] bg-white shadow-[0_60px_120px_rgba(15,23,42,0.25)] overflow-hidden">
                                                       {element}
                                                  </div>
                                             </div>
                                        );
                                   })}

                              </div>
                         </div>
                    </div>
               </div>
               <MobileAppSection />
               <NewsletterSection />
               <WhyChooseUsSection />
               {/* <FAQSection /> */}
               <CTASection user={user} />
               <LoginPromotionModal user={user} />
          </Section>
     );
}

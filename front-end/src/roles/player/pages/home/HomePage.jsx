import { useState, useEffect, useRef } from "react";
import { Section } from "../../../../shared/components/ui";
import { useNavigate } from "react-router-dom";
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
     const [focusProgress, setFocusProgress] = useState(0); // 0..1 inside a focused window
     const canvasRef = useRef(null);
     const scrollSectionRef = useRef(null);

     const detailComponents = [
          { key: "overview-quick", element: <QuickBookingSection user={user} /> },
          { key: "overview-community", element: <CommunityMatchmakingSection /> },
          { key: "overview-reviews", element: <UserReviewsSection /> },
          { key: "overview-events", element: <EventsSection /> }
     ];

     const componentCount = detailComponents.length;
     const componentWidth = 1280;
     const componentGap = 32;
     const overviewZoom = 0.62;
     const detailZoom = 1.0;
     const overviewThreshold = 0.14;

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

     // Hide scrollbar but keep page scrollable while on this page
     useEffect(() => {
          const styleEl = document.createElement("style");
          styleEl.setAttribute("data-homepage-scrollbar-hide", "");
          styleEl.textContent = `
               html, body { scrollbar-width: none; -ms-overflow-style: none; }
               html::-webkit-scrollbar, body::-webkit-scrollbar { display: none; }

               /* Fallback: hide scrollbars on all scrollable elements */
               * { scrollbar-width: none; }
               *::-webkit-scrollbar { display: none; }
          `;
          document.head.appendChild(styleEl);
          return () => {
               try {
                    document.head.removeChild(styleEl);
               } catch { }
          };
     }, []);

     // Handle scroll-based zoom and pan with intro + sequential reveal
     useEffect(() => {
          if (!scrollSectionRef.current) return;


          const handleScroll = () => {
               const scrollSection = scrollSectionRef.current;
               if (!scrollSection) return;

               const windowHeight = window.innerHeight;
               const sectionHeight = scrollSection.offsetHeight;
               const sectionTop = scrollSection.offsetTop;
               const currentScroll = window.scrollY;
               const scrollStart = sectionTop - windowHeight;

               const centerX = window.innerWidth / 2;
               const overviewPan = centerX - (componentWidth / 2);

               if (currentScroll >= scrollStart && currentScroll <= scrollStart + sectionHeight) {
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
                         setFocusProgress(0);
                         return;
                    }

                    // Phase 2+: overview hold then per-component focus and reveal
                    setIsCanvasPhase(false);

                    // map remaining progress to horizontal logic
                    const hProgress = (progress - canvasPhaseDuration) / (1 - canvasPhaseDuration);

                    if (hProgress <= overviewThreshold) {
                         setZoom(overviewZoom);
                         setPan({ x: overviewPan, y: 0 });
                         setFocusIndex(-1);
                         setFocusProgress(0);
                         return;
                    }

                    const normalizedProgress = Math.max(0, Math.min(1, (hProgress - overviewThreshold) / (1 - overviewThreshold)));
                    const scaledProgress = normalizedProgress * componentCount;
                    const componentIndex = Math.min(Math.floor(scaledProgress), componentCount - 1);
                    const componentProgress = scaledProgress - componentIndex; // 0..1

                    let componentZoom;
                    if (componentProgress < 0.25) {
                         componentZoom = overviewZoom + (componentProgress / 0.25) * (detailZoom - overviewZoom);
                    } else if (componentProgress < 0.75) {
                         componentZoom = detailZoom;
                    } else {
                         componentZoom = detailZoom - ((componentProgress - 0.75) / 0.25) * (detailZoom - overviewZoom);
                    }

                    setZoom(componentZoom);

                    const itemCenter = (componentWidth / 2) + (componentIndex + 1) * (componentWidth + componentGap);
                    const panX = centerX - itemCenter;
                    setPan({ x: panX, y: 0 });
                    setFocusIndex(componentIndex);
                    setFocusProgress(componentProgress);
               } else if (currentScroll < scrollStart) {
                    setZoom(overviewZoom);
                    setPan({ x: overviewPan, y: 0 });
                    setIsCanvasPhase(true);
                    setFocusIndex(-1);
                    setFocusProgress(0);
               } else {
                    setZoom(overviewZoom);
                    const lastCenter = (componentWidth / 2) + componentCount * (componentWidth + componentGap);
                    const panX = centerX - lastCenter;
                    setPan({ x: panX, y: 0 });
                    setIsCanvasPhase(false);
                    setFocusIndex(componentCount - 1);
                    setFocusProgress(1);
               }
          };

          window.addEventListener('scroll', handleScroll, { passive: true });
          handleScroll();

          return () => {
               window.removeEventListener('scroll', handleScroll);
          };
     }, [componentCount, componentGap, componentWidth, detailZoom, overviewThreshold, overviewZoom]);

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
               <div ref={scrollSectionRef} className="relative w-full bg-transparent" style={{ height: '400vh' }}>
                    {/* Canvas Area - Sticky */}
                    <div className="sticky top-0 h-screen w-full overflow-hidden">
                         <div
                              ref={canvasRef}
                              className="relative w-full h-full flex items-center justify-center"
                         >
                              {/* Horizontal Components Container */}
                              <div
                                   className="flex items-center gap-8"
                                   style={{
                                        opacity: isCanvasPhase ? 1 : 1,
                                        transform: `translateX(${pan.x}px) scale(${zoom})`,
                                        transformOrigin: 'center center',
                                        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
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
                                        const past = focusIndex !== -1 && index < focusIndex;
                                        const current = focusIndex === index;
                                        const opacity = focusIndex === -1
                                             ? 0 // during overview hold, hide details
                                             : past
                                                  ? 1
                                                  : current
                                                       ? 0.35 + 0.65 * focusProgress
                                                       : 0.1;
                                        const scale = current ? (0.98 + 0.02 * focusProgress) : 1;
                                        return (
                                             <div key={key} className="flex-shrink-0 w-full max-w-7xl" style={{ opacity, transition: 'opacity 0.35s ease' }}>
                                                  <div className="rounded-[48px] bg-white shadow-[0_60px_120px_rgba(15,23,42,0.25)] overflow-hidden" style={{ transform: `scale(${scale})`, transition: 'transform 0.35s ease' }}>
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

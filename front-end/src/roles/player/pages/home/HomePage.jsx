import { useState, useEffect, useRef } from "react";
import { Section } from "../../../../shared/components/ui";
import { useNavigate } from "react-router-dom";
import Lenis from "lenis";
import { HeroSection, StatsSection, QuickCategoriesSection, TopBookingNowSection, QuickBookingSection, CommunityMatchmakingSection, UserReviewsSection, CancellationPoliciesSection, MobileAppSection, WhyChooseUsSection, NewsletterSection, CTASection } from "./components";
import { LoginPromotionModal } from "../../../../shared/components/LoginPromotionModal";

export default function HomePage({ user }) {
     const navigate = useNavigate();
     const [searchQuery, setSearchQuery] = useState("");
     const [selectedLocation, setSelectedLocation] = useState("all");
     const [selectedPrice, setSelectedPrice] = useState("all");
     const [hoveredCardId, setHoveredCardId] = useState(null);

     // ============================================
     // KHAI BÁO CÁC THAM SỐ VÀ STATE CHO HORIZONTAL SCROLL
     // ============================================

     // ============================================
     // THAM SỐ PHASE VÀ TIMING
     // ============================================

     // canvasPhaseDuration: Thời lượng phase intro (0 -> 1 của section)
     // Giá trị: 0.22 = 22% đầu tiên của section dành cho phase intro
     // Trong phase này: zoom in từ xa vào overview artboard
     // Thay đổi: Tăng giá trị = phase intro dài hơn, giảm = ngắn hơn
     const canvasPhaseDuration = 0.23;

     // canvasMinZoom: Zoom level bắt đầu của phase intro
     // Giá trị: 0.45 = zoom ra xa 45% (nhìn từ xa)
     // Trong phase intro: zoom từ 0.45 -> overviewZoom (0.9)
     // Thay đổi: Giảm = bắt đầu xa hơn, tăng = gần hơn
     const canvasMinZoom = 0.3;

     // focusIndex: Index của component đang được focus
     // -1: Chưa focus component nào (đang ở overview)
     // 0 -> componentCount-1: Index của component đang focus
     // Thay đổi: setFocusIndex(componentIndex) trong logic scroll
     // Component có focusIndex === index sẽ hiển thị (opacity = 1)
     const [focusIndex, setFocusIndex] = useState(-1);

     // ============================================
     // REFS ĐỂ TRUY CẬP DOM ELEMENTS
     // ============================================

     // canvasRef: Reference đến container chứa tất cả components
     // Dùng để: Apply transform (translate3d, scale) cho container
     const canvasRef = useRef(null);

     // scrollSectionRef: Reference đến section chứa horizontal scroll
     // Dùng để: Tính toán vị trí scroll, chiều cao section
     // Section này có height = 400vh để tạo không gian scroll
     const scrollSectionRef = useRef(null);

     // lenisRef: Reference đến instance của Lenis (smooth scroll library)
     // Dùng để: Lắng nghe scroll events, lấy scroll position
     const lenisRef = useRef(null);

     // Ref cho container ngang – nơi apply transform
     const horizontalTrackRef = useRef(null);

     // Không cần re-render vì zoom/pan, nên dùng ref để lưu giá trị hiện tại
     const transformStateRef = useRef({
          zoom: canvasMinZoom,
          panX: 0,
     });

     // ============================================
     // MẢNG COMPONENTS ĐƯỢC HIỂN THỊ
     // ============================================

     // detailComponents: Mảng chứa các components sẽ được scroll ngang qua
     // Mỗi component có:
     //   - key: Unique identifier
     //   - element: JSX element của component
     // Thay đổi: Thêm/bớt components vào mảng này
     // Các components này sẽ được hiển thị tuần tự khi scroll
     const detailComponents = [
          { key: "overview-quick", element: <QuickBookingSection user={user} /> },
          { key: "overview-community", element: <CommunityMatchmakingSection /> },
          { key: "overview-reviews", element: <UserReviewsSection /> },
          { key: "overview-cancellation", element: <CancellationPoliciesSection /> }
     ];

     // ============================================
     // THAM SỐ KÍCH THƯỚC VÀ KHOẢNG CÁCH
     // ============================================

     // componentCount: Số lượng components
     // Tự động tính từ detailComponents.length
     // Dùng để: Tính toán componentIndex, vị trí ngang
     const componentCount = detailComponents.length;

     // componentWidth: Chiều rộng của mỗi component (px)
     // Giá trị: 1280px
     // Dùng để: Tính toán vị trí ngang (pan.x) để căn giữa component
     // Thay đổi: Tăng = component rộng hơn, giảm = hẹp hơn
     const componentWidth = 1280;

     // componentGap: Khoảng cách giữa các components (px)
     // Giá trị: 32px
     // Dùng để: Tính toán vị trí ngang giữa các components
     // Thay đổi: Tăng = khoảng cách lớn hơn, giảm = gần nhau hơn
     const componentGap = 32;

     // ============================================
     // THAM SỐ ZOOM LEVEL
     // ============================================

     // overviewZoom: Zoom level khi hiển thị overview artboard
     // Giá trị: 0.9 = zoom 90% (nhỏ hơn một chút)
     // Dùng trong: Phase overview hold (giữ nguyên overview)
     // Thay đổi: Tăng = overview lớn hơn, giảm = nhỏ hơn
     const overviewZoom = 0.95;

     // overviewFocusZoom: Zoom level khi focus vào overview (chuẩn bị chuyển sang components)
     // Giá trị: 1.5 = zoom 150% (phóng to)
     // Dùng trong: Phase overview focus (zoom vào overview)
     // Thay đổi: Tăng = zoom vào nhiều hơn, giảm = ít hơn
     const overviewFocusZoom = 1.5;

     // detailZoom: Zoom level khi hiển thị components chi tiết
     // Giá trị: 1.0 = zoom 100% (kích thước bình thường)
     // Dùng trong: Phase component reveal (hiển thị từng component)
     // Thay đổi: Tăng = components lớn hơn, giảm = nhỏ hơn
     const detailZoom = 1;

     // ============================================
     // THAM SỐ THRESHOLD (NGƯỠNG CHUYỂN PHASE)
     // ============================================

     // overviewHoldThreshold: Ngưỡng bắt đầu phase overview hold
     // Giá trị: 0.12 = 12% của hProgress (sau phase intro)
     // Trong phase này: Giữ nguyên overview để user nhìn rõ
     // Thay đổi: Tăng = giữ overview lâu hơn, giảm = ngắn hơn
     const overviewHoldThreshold = 0.12;

     // overviewFocusThreshold: Ngưỡng bắt đầu phase overview focus
     // Giá trị: 0.28 = 28% của hProgress (sau phase intro)
     // Trong phase này: Zoom vào overview để chuẩn bị chuyển sang components
     // Thay đổi: Tăng = zoom vào muộn hơn, giảm = sớm hơn
     const overviewFocusThreshold = 0.28;

     // ============================================
     // THAM SỐ HIỂN THỊ OVERVIEW
     // ============================================

     // overviewPreviewScale: Scale của preview components trong overview artboard
     // Giá trị: 0.55 = 55% (thu nhỏ để hiển thị nhiều components trong overview)
     // Dùng để: Scale down các components trong overview để fit vào grid 2x2
     // Thay đổi: Tăng = preview lớn hơn, giảm = nhỏ hơn
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

     // ============================================
     // LOGIC CUỘN HORIZONTAL SCROLL
     // ============================================
     // Mục đích: Chuyển đổi scroll dọc thành scroll ngang qua các components
     // Cách hoạt động:
     // 1. Khi scroll dọc, tính toán progress (0 -> 1) trong section
     // 2. Dựa vào progress, chia thành các phase:
     //    - Phase 1: Intro (zoom in overview)
     //    - Phase 2: Overview hold (giữ nguyên overview)
     //    - Phase 3: Overview focus (zoom vào overview)
     //    - Phase 4: Component reveal (hiển thị từng component theo hàng ngang)
     // 3. Mỗi phase điều khiển: zoom level, pan position (vị trí ngang), focusIndex (component nào đang active)
     // 4. Khi scroll, container di chuyển ngang (pan.x) để căn giữa component đang focus
     useEffect(() => {
          if (!scrollSectionRef.current || !lenisRef.current || !horizontalTrackRef.current) return;

          let rafId = null;
          let ticking = false;
          let lastUpdateTime = 0;
          const throttleMs = 16; // ~60fps

          const applyTransform = () => {
               const track = horizontalTrackRef.current;
               if (!track) return;
               const { zoom, panX } = transformStateRef.current;
               track.style.transform = `translate3d(${panX}px, 0, 0) scale(${zoom})`;
          };

          const updateFocusIndex = (nextIndex) => {
               setFocusIndex((prev) => (prev === nextIndex ? prev : nextIndex));
          };

          const handleScroll = (e) => {
               const now = performance.now();
               if (now - lastUpdateTime < throttleMs && ticking) {
                    return;
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

                         const currentScroll = e?.scroll ?? lenisRef.current?.scroll ?? window.scrollY ?? window.pageYOffset;
                         const scrollStart = sectionTop - windowHeight;

                         const centerX = window.innerWidth / 2;
                         const overviewPan = centerX - (componentWidth / 2);

                         const lastElementTransitionEnd = 0.8;
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
                                             effectiveSectionEnd = scrollStart + sectionHeight * lastElementTransitionEnd;
                                             shouldTreatAsPastSection = true;
                                        }
                                   }
                              }
                         }

                         if (shouldTreatAsPastSection || currentScroll > effectiveSectionEnd) {
                              const lastCenter = (componentWidth / 2) + componentCount * (componentWidth + componentGap);
                              const panX = centerX - lastCenter;

                              transformStateRef.current.zoom = detailZoom;
                              transformStateRef.current.panX = panX;
                              applyTransform();

                              updateFocusIndex(componentCount - 1);
                              ticking = false;
                              return;
                         }

                         if (currentScroll >= scrollStart && currentScroll <= effectiveSectionEnd) {
                              let progress = (currentScroll - scrollStart) / sectionHeight;
                              progress = Math.max(0, Math.min(1, progress));

                              if (progress <= canvasPhaseDuration) {
                                   const p = progress / canvasPhaseDuration;
                                   const eased = 1 - Math.pow(1 - p, 3);

                                   const canvasZoom = canvasMinZoom + (overviewZoom - canvasMinZoom) * eased;
                                   transformStateRef.current.zoom = canvasZoom;
                                   transformStateRef.current.panX = overviewPan;
                                   applyTransform();

                                   updateFocusIndex(-1);
                                   ticking = false;
                                   return;
                              }

                              const hProgress = (progress - canvasPhaseDuration) / (1 - canvasPhaseDuration);

                              if (hProgress <= overviewHoldThreshold) {
                                   transformStateRef.current.zoom = overviewZoom;
                                   transformStateRef.current.panX = overviewPan;
                                   applyTransform();
                                   updateFocusIndex(-1);
                                   ticking = false;
                                   return;
                              }

                              if (hProgress <= overviewFocusThreshold) {
                                   const focusStageProgress = (hProgress - overviewHoldThreshold) / Math.max(overviewFocusThreshold - overviewHoldThreshold, 0.00001);
                                   const easedFocus = 1 - Math.pow(1 - focusStageProgress, 3);
                                   const zoomLevel = overviewZoom + (overviewFocusZoom - overviewZoom) * easedFocus;

                                   transformStateRef.current.zoom = zoomLevel;
                                   transformStateRef.current.panX = overviewPan;
                                   applyTransform();
                                   updateFocusIndex(-1);
                                   ticking = false;
                                   return;
                              }

                              const normalizedProgress = Math.max(0, Math.min(1, (hProgress - overviewFocusThreshold) / (1 - overviewFocusThreshold)));
                              const componentIndex = Math.min(Math.floor(normalizedProgress * componentCount + 1e-6), componentCount - 1);
                              const itemCenter = (componentWidth / 2) + (componentIndex + 1) * (componentWidth + componentGap);
                              const panX = centerX - itemCenter;

                              transformStateRef.current.zoom = detailZoom;
                              transformStateRef.current.panX = panX;
                              applyTransform();
                              updateFocusIndex(componentIndex);
                         } else if (currentScroll < scrollStart) {
                              transformStateRef.current.zoom = overviewZoom;
                              transformStateRef.current.panX = overviewPan;
                              applyTransform();
                              updateFocusIndex(-1);
                         }

                         ticking = false;
                    });
                    ticking = true;
               }
          };

          const scrollHandler = (e) => {
               handleScroll(e);
          };
          lenisRef.current.on('scroll', scrollHandler);

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
     }, [canvasMinZoom, componentCount, componentGap, componentWidth, detailZoom, overviewHoldThreshold, overviewFocusThreshold, overviewZoom, overviewFocusZoom, canvasPhaseDuration]);

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
                                   ref={horizontalTrackRef}
                                   className="flex items-center gap-8"
                                   style={{
                                        opacity: 1,
                                        transform: 'translate3d(0, 0, 0) scale(1)',
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
                                        // Opacity và blur theo vị trí (bỏ hiệu ứng trượt từ dưới lên, chỉ giữ fade/scale)
                                        const opacity = current ? 1 : 0;
                                        const blur = current ? 0 : 8;
                                        const scale = current ? 1 : 0.95;

                                        return (
                                             <div
                                                  key={key}
                                                  className="flex-shrink-0 w-full max-w-7xl"
                                                  style={{
                                                       opacity,
                                                       transform: `scale(${scale})`,
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

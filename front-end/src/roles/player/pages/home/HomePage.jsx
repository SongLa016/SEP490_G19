import { useState, useEffect, useRef } from "react";
import { Section } from "../../../../shared/components/ui";
import { useNavigate } from "react-router-dom";
import Lenis from "lenis";
import { HeroSection, StatsSection, QuickCategoriesSection, TopBookingNowSection, QuickBookingSection, CommunityMatchmakingSection, UserReviewsSection, CancellationPoliciesSection, MobileAppSection, WhyChooseUsSection, NewsletterSection, CTASection } from "./components";
import { LoginPromotionModal } from "../../../../shared/components/LoginPromotionModal";
import { fetchTopBookingFields, fetchFieldComplex, fetchField } from "../../../../shared/services/fields";
import { useComplexes } from "../../../../shared/hooks/usePageData";

// Helpers giống FieldSearch để chuẩn hóa quận/huyện
const normalizeText = (text) => {
     if (typeof text !== "string") return "";
     return text
          .normalize("NFD")
          .replace(/\p{Diacritic}/gu, "")
          .toLowerCase()
          .trim();
};
const normalizeDistrictKey = (text) => {
     const normalized = normalizeText(text);
     return normalized.replace(/^(quan|huyen|thi xa)\s+/i, "");
};

// Fallback danh sách khu vực nếu không tải được từ backend
const HOMEPAGE_LOCATION_OPTIONS = [
     { value: "all", label: "Tất cả khu vực", query: "" },
];

export default function HomePage({ user }) {
     const navigate = useNavigate();
     const [searchQuery, setSearchQuery] = useState("");
     const [selectedLocation, setSelectedLocation] = useState("");
     const [selectedPrice, setSelectedPrice] = useState("");
     const [locationOptions, setLocationOptions] = useState(HOMEPAGE_LOCATION_OPTIONS);
     const [hoveredCardId, setHoveredCardId] = useState(null);
     const [topBookingFields, setTopBookingFields] = useState([]);
     const [loadingTopFields, setLoadingTopFields] = useState(true);

     // Sử dụng React Query để cache data - giúp chuyển trang nhanh hơn
     const { data: complexesData } = useComplexes({ page: 1, size: 200 });

     // Load danh sách khu vực từ cached complexes data
     useEffect(() => {
          if (!complexesData) return;

          const list = Array.isArray(complexesData?.data?.data)
               ? complexesData.data.data
               : Array.isArray(complexesData?.data)
                    ? complexesData.data
                    : Array.isArray(complexesData)
                         ? complexesData
                         : [];

          const map = new Map();
          list.forEach((c) => {
               const raw = typeof c?.district === "string" ? c.district.trim() : "";
               if (!raw) return;
               const baseKey = normalizeDistrictKey(raw);
               const hasPrefix = /^(Quận|Huyện|Thị xã)/i.test(raw);
               if (!map.has(baseKey)) {
                    map.set(baseKey, raw);
                    return;
               }
               const current = map.get(baseKey);
               const currentHasPrefix = /^(Quận|Huyện|Thị xã)/i.test(current);
               if (hasPrefix && !currentHasPrefix) {
                    map.set(baseKey, raw);
               }
          });

          const districts = Array.from(map.values())
               .sort((a, b) => a.localeCompare(b, "vi"))
               .map((v) => ({ value: v, label: v, query: v }));

          if (districts.length > 0) {
               setLocationOptions([{ value: "all", label: "Tất cả khu vực", query: "" }, ...districts]);
          }
     }, [complexesData]);

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
     const canvasPhaseDuration = 0.19;

     // canvasMinZoom: Zoom level bắt đầu của phase intro
     // Giá trị: 0.45 = zoom ra xa 45% (nhìn từ xa)
     // Trong phase intro: zoom từ 0.45 -> overviewZoom (0.9)
     // Thay đổi: Giảm = bắt đầu xa hơn, tăng = gần hơn
     const canvasMinZoom = 0.45;

     // ============================================
     // STATE ĐIỀU KHIỂN ZOOM VÀ PAN
     // ============================================

     // zoom: Zoom level hiện tại của container
     // Giá trị: 0.45 -> 1.5 (tùy phase)
     // - Phase intro: 0.45 -> 0.9
     // - Overview hold: 0.9
     // - Overview focus: 0.9 -> 1.5
     // - Component reveal: 1.0
     // Thay đổi: setZoom() trong logic scroll
     const [zoom, setZoom] = useState(canvasMinZoom);

     // pan: Vị trí ngang (x) và dọc (y) của container
     // pan.x: Offset ngang để căn giữa component đang focus
     // - Overview: centerX - (componentWidth/2)
     // - Component: centerX - itemCenter (tính toán dựa trên componentIndex)
     // pan.y: Luôn = 0 (không di chuyển dọc)
     // Thay đổi: setPan({ x: panX, y: 0 }) trong logic scroll
     const [pan, setPan] = useState({ x: 0, y: 0 });

     // isCanvasPhase: Có đang ở phase overview không?
     // true: Đang ở phase intro/overview (hiển thị overview artboard)
     // false: Đã qua phase overview (hiển thị components)
     // Thay đổi: setIsCanvasPhase(true/false) trong logic scroll
     const [isCanvasPhase, setIsCanvasPhase] = useState(true);

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

     // ============================================
     // MẢNG COMPONENTS ĐƯỢC HIỂN THỊ
     // ============================================

     // detailComponents: Mảng chứa các components sẽ được scroll ngang qua
     // Các components này sẽ được hiển thị tuần tự khi scroll
     const detailComponents = [
          { key: "overview-quick", element: <QuickBookingSection user={user} /> },
          { key: "overview-community", element: <CommunityMatchmakingSection /> },
          { key: "overview-reviews", element: <UserReviewsSection /> },
          { key: "overview-cancellation", element: <CancellationPoliciesSection /> }
     ];

     // Tiêu đề tiếng Việt cho từng component (theo cùng thứ tự detailComponents)
     const componentTitles = [
          "Đặt sân nhanh chóng",
          "Cộng đồng & Matchmaking",
          "Đánh giá & Cộng đồng người dùng",
          "Chính sách hủy đặt sân"
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
     const overviewZoom = 0.9;

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
          if (!scrollSectionRef.current || !lenisRef.current) return;

          // ============================================
          // THROTTLING: Tối ưu performance
          // ============================================
          // Giới hạn số lần update để đạt ~60fps mượt mà
          // Thay vì update mỗi lần scroll, chỉ update mỗi 16ms (60fps)
          let rafId = null;
          let ticking = false;
          let lastUpdateTime = 0;
          const throttleMs = 16; // ~60fps

          const handleScroll = (e) => {
               const now = performance.now();
               // Bỏ qua nếu chưa đủ thời gian (throttling)
               if (now - lastUpdateTime < throttleMs && ticking) {
                    return; // Skip if too soon
               }
               lastUpdateTime = now;

               // Sử dụng requestAnimationFrame để đồng bộ với repaint của browser
               if (!ticking) {
                    ticking = true;
                    rafId = requestAnimationFrame(() => {
                         const scrollSection = scrollSectionRef.current;
                         if (!scrollSection) {
                              ticking = false;
                              return;
                         }

                         // ============================================
                         // TÍNH TOÁN VỊ TRÍ SCROLL
                         // ============================================
                         // Lấy các thông số về viewport và section
                         const windowHeight = window.innerHeight;
                         const sectionHeight = scrollSection.offsetHeight; // Chiều cao section (400vh)
                         const sectionTop = scrollSection.offsetTop; // Vị trí top của section

                         // Lấy vị trí scroll hiện tại (từ Lenis hoặc window)
                         const currentScroll = e?.scroll ?? lenisRef.current?.scroll ?? window.scrollY ?? window.pageYOffset;

                         // scrollStart: Vị trí bắt đầu section (khi section vừa vào viewport)
                         // Section bắt đầu khi top của nó bằng bottom của viewport
                         const scrollStart = sectionTop - windowHeight;

                         // ============================================
                         // TÍNH TOÁN VỊ TRÍ NGANG (PAN)
                         // ============================================
                         // centerX: Tâm màn hình theo trục X (để căn giữa components)
                         const centerX = window.innerWidth / 2;

                         // overviewPan: Vị trí ngang để căn giữa overview artboard
                         // Căn giữa overview = center màn hình - nửa chiều rộng component
                         const overviewPan = centerX - (componentWidth / 2);

                         // ============================================
                         // XỬ LÝ EDGE CASE: Khi ở component cuối cùng
                         // ============================================
                         // Khi đã scroll đến component cuối, cho phép scroll tự nhiên sớm hơn
                         // để tránh "nhảy" khi ra khỏi section
                         const lastElementTransitionEnd = 0.80; // Kết thúc section ở 80% khi ở component cuối

                         // Tính toán effectiveSectionEnd: Vị trí kết thúc thực tế của section
                         // (có thể sớm hơn nếu đang ở component cuối)
                         let effectiveSectionEnd = scrollStart + sectionHeight;
                         let shouldTreatAsPastSection = false;

                         // ============================================
                         // KIỂM TRA: Có đang ở component cuối không?
                         // ============================================
                         // Nếu đang ở component cuối và đã scroll qua 80% section,
                         // coi như đã qua section để tránh "nhảy" khi scroll tiếp
                         if (currentScroll >= scrollStart && currentScroll <= scrollStart + sectionHeight) {
                              const tempProgress = (currentScroll - scrollStart) / sectionHeight;
                              if (tempProgress > canvasPhaseDuration) {
                                   const tempHProgress = (tempProgress - canvasPhaseDuration) / (1 - canvasPhaseDuration);
                                   if (tempHProgress > overviewFocusThreshold) {
                                        const tempNormalized = Math.max(0, Math.min(1, (tempHProgress - overviewFocusThreshold) / (1 - overviewFocusThreshold)));
                                        const tempComponentIndex = Math.min(Math.floor(tempNormalized * componentCount + 1e-6), componentCount - 1);
                                        if (tempComponentIndex === componentCount - 1 && tempProgress >= lastElementTransitionEnd) {
                                             // Đang ở component cuối và đã scroll qua 80% -> coi như đã qua section
                                             effectiveSectionEnd = scrollStart + sectionHeight * lastElementTransitionEnd;
                                             shouldTreatAsPastSection = true;
                                        }
                                   }
                              }
                         }

                         // ============================================
                         // TRƯỜNG HỢP 1: ĐÃ QUA SECTION (scroll xuống quá xa)
                         // ============================================
                         // Khi scroll xuống quá section, giữ nguyên trạng thái component cuối cùng
                         // Để tránh "nhảy" khi scroll tiếp
                         if (shouldTreatAsPastSection || currentScroll > effectiveSectionEnd) {
                              // Giữ nguyên component cuối cùng
                              setZoom(detailZoom);

                              // Tính vị trí ngang để căn giữa component cuối cùng
                              // lastCenter = vị trí center của component cuối cùng
                              const lastCenter = (componentWidth / 2) + componentCount * (componentWidth + componentGap);
                              const panX = centerX - lastCenter;

                              setPan({ x: panX, y: 0 });
                              setIsCanvasPhase(false);
                              setFocusIndex(componentCount - 1); // Focus vào component cuối
                              ticking = false;
                              return;
                         }

                         // ============================================
                         // TRƯỜNG HỢP 2: ĐANG TRONG SECTION
                         // ============================================
                         // Tính progress: 0 (đầu section) -> 1 (cuối section)
                         if (currentScroll >= scrollStart && currentScroll <= effectiveSectionEnd) {
                              let progress = (currentScroll - scrollStart) / sectionHeight;
                              progress = Math.max(0, Math.min(1, progress)); // Clamp 0-1

                              // ============================================
                              // PHASE 1: INTRO (0% -> 22% của section)
                              // ============================================
                              // Mục đích: Zoom in từ xa vào overview artboard
                              // Hiệu ứng: Từ zoom nhỏ (0.45) -> zoom overview (0.9)
                              // Chỉ hiển thị overview, chưa hiển thị components
                              if (progress <= canvasPhaseDuration) {
                                   // Tính progress trong phase này (0 -> 1)
                                   const p = progress / canvasPhaseDuration;

                                   // Easing function: cubic ease-out (tạo chuyển động mượt)
                                   // 1 - (1-p)^3: bắt đầu nhanh, kết thúc chậm
                                   const eased = 1 - Math.pow(1 - p, 3);

                                   setIsCanvasPhase(true); // Đang ở phase overview

                                   // Zoom từ canvasMinZoom (0.45) -> overviewZoom (0.9)
                                   const canvasZoom = canvasMinZoom + (overviewZoom - canvasMinZoom) * eased;

                                   setZoom(canvasZoom);
                                   setPan({ x: overviewPan, y: 0 }); // Căn giữa overview
                                   setFocusIndex(-1); // Chưa focus component nào
                                   ticking = false;
                                   return;
                              }

                              // ============================================
                              // PHASE 2+: TỪ OVERVIEW SANG COMPONENTS
                              // ============================================
                              setIsCanvasPhase(false); // Đã qua phase overview

                              // hProgress: Progress trong phần còn lại (sau phase intro)
                              // 0 = bắt đầu phase 2, 1 = kết thúc section
                              const hProgress = (progress - canvasPhaseDuration) / (1 - canvasPhaseDuration);

                              // ============================================
                              // PHASE 2A: OVERVIEW HOLD (0% -> 12% của hProgress)
                              // ============================================
                              // Mục đích: Giữ nguyên overview một chút để user nhìn rõ
                              // Hiệu ứng: Giữ nguyên zoom overview, chưa zoom vào
                              if (hProgress <= overviewHoldThreshold) {
                                   setZoom(overviewZoom); // Giữ nguyên zoom overview
                                   setPan({ x: overviewPan, y: 0 }); // Căn giữa overview
                                   setFocusIndex(-1); // Chưa focus component
                                   ticking = false;
                                   return;
                              }

                              // ============================================
                              // PHASE 2B: OVERVIEW FOCUS (12% -> 28% của hProgress)
                              // ============================================
                              // Mục đích: Zoom vào overview để chuẩn bị chuyển sang components
                              // Hiệu ứng: Zoom từ overviewZoom (0.9) -> overviewFocusZoom (1.5)
                              if (hProgress <= overviewFocusThreshold) {
                                   // Tính progress trong phase này
                                   const focusStageProgress = (hProgress - overviewHoldThreshold) / Math.max(overviewFocusThreshold - overviewHoldThreshold, 0.00001);

                                   // Easing: cubic ease-out
                                   const easedFocus = 1 - Math.pow(1 - focusStageProgress, 3);

                                   // Zoom từ overviewZoom -> overviewFocusZoom
                                   const zoomLevel = overviewZoom + (overviewFocusZoom - overviewZoom) * easedFocus;

                                   setZoom(zoomLevel);
                                   setPan({ x: overviewPan, y: 0 }); // Vẫn căn giữa overview
                                   setFocusIndex(-1); // Chưa focus component
                                   ticking = false;
                                   return;
                              }

                              // ============================================
                              // PHASE 3: COMPONENT REVEAL (28% -> 100% của hProgress)
                              // ============================================
                              // Mục đích: Hiển thị từng component theo hàng ngang
                              // Hiệu ứng: Scroll ngang qua các components, mỗi component được focus khi scroll

                              // normalizedProgress: Progress trong phase component reveal (0 -> 1)
                              // 0 = bắt đầu reveal component đầu tiên
                              // 1 = đã reveal component cuối cùng
                              const normalizedProgress = Math.max(0, Math.min(1, (hProgress - overviewFocusThreshold) / (1 - overviewFocusThreshold)));

                              // componentIndex: Index của component đang được focus (0 -> componentCount-1)
                              // Ví dụ: 4 components, normalizedProgress = 0.5 -> componentIndex = 2
                              const componentIndex = Math.min(Math.floor(normalizedProgress * componentCount + 1e-6), componentCount - 1);

                              // Zoom về detailZoom (1.0) để hiển thị component rõ nét
                              setZoom(detailZoom);

                              // ============================================
                              // TÍNH TOÁN VỊ TRÍ NGANG ĐỂ CĂN GIỮA COMPONENT
                              // ============================================
                              // itemCenter: Vị trí center của component đang focus
                              // Công thức: 
                              //   - componentWidth/2: nửa chiều rộng component đầu tiên
                              //   - (componentIndex + 1): +1 vì có overview ở đầu
                              //   - (componentWidth + componentGap): khoảng cách giữa các components
                              // Ví dụ: componentIndex = 1
                              //   itemCenter = 640 + 2 * (1280 + 32) = 640 + 2624 = 3264
                              const itemCenter = (componentWidth / 2) + (componentIndex + 1) * (componentWidth + componentGap);

                              // panX: Offset để căn giữa component trong viewport
                              // Nếu itemCenter = 3264, centerX = 960 (màn hình 1920px)
                              // panX = 960 - 3264 = -2304 (di chuyển container sang trái 2304px)
                              const panX = centerX - itemCenter;

                              setPan({ x: panX, y: 0 });
                              setFocusIndex(componentIndex); // Focus vào component này

                              // ============================================
                              // TRƯỜNG HỢP 3: CHƯA VÀO SECTION (scroll lên trên)
                              // ============================================
                              // Khi scroll lên trên section, hiển thị lại overview
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

          // ============================================
          // ĐĂNG KÝ EVENT LISTENER
          // ============================================
          // Lắng nghe sự kiện scroll từ Lenis (smooth scroll library)
          const scrollHandler = (e) => {
               handleScroll(e);
          };
          lenisRef.current.on('scroll', scrollHandler);

          // Gọi lần đầu để set trạng thái ban đầu khi component mount
          setTimeout(() => {
               const initialScroll = window.scrollY || window.pageYOffset || 0;
               handleScroll({ scroll: initialScroll });
          }, 100);

          // ============================================
          // CLEANUP: Dọn dẹp khi component unmount
          // ============================================
          return () => {
               if (lenisRef.current) {
                    lenisRef.current.off('scroll', scrollHandler); // Gỡ event listener
               }
               if (rafId) {
                    cancelAnimationFrame(rafId); // Hủy animation frame
               }
          };
     }, [componentCount, componentGap, componentWidth, detailZoom, overviewHoldThreshold, overviewFocusThreshold, overviewZoom, overviewFocusZoom, canvasPhaseDuration]);

     // Fetch top booking fields from API
     useEffect(() => {
          const loadTopBookingFields = async () => {
               try {
                    setLoadingTopFields(true);
                    const data = await fetchTopBookingFields();

                    // Fetch chi tiết từng field để lấy imageUrls và complexId
                    const fieldDetailsPromises = data.map(async (item) => {
                         try {
                              const fieldDetail = await fetchField(item.fieldId);
                              return { ...item, fieldDetail };
                         } catch {
                              return { ...item, fieldDetail: null };
                         }
                    });
                    const fieldsWithDetails = await Promise.all(fieldDetailsPromises);

                    // Lấy danh sách complexId duy nhất từ fieldDetails
                    const uniqueComplexIds = [...new Set(
                         fieldsWithDetails
                              .map(item => item.fieldDetail?.complexId || item.complexId)
                              .filter(id => id != null && id !== undefined && id !== '')
                    )];

                    // Fetch tất cả complexes một lần duy nhất
                    const complexMap = new Map();
                    if (uniqueComplexIds.length > 0) {
                         const complexPromises = uniqueComplexIds.map(async (complexId) => {
                              try {
                                   const complex = await fetchFieldComplex(complexId);
                                   if (complex) {
                                        complexMap.set(complexId, complex);
                                   }
                              } catch {
                                   // Bỏ qua lỗi
                              }
                         });
                         await Promise.all(complexPromises);
                    }

                    // Map fields với thông tin đầy đủ
                    const mappedFields = fieldsWithDetails.map((item) => {
                         const fieldDetail = item.fieldDetail;
                         const complexId = fieldDetail?.complexId || item.complexId;
                         let location = "Đang cập nhật";

                         // Lấy địa chỉ từ complex
                         if (complexId && complexMap.has(complexId)) {
                              const complex = complexMap.get(complexId);
                              if (complex?.address) {
                                   location = complex.address;
                              }
                         }

                         // Lấy ảnh từ fieldDetail (ưu tiên) hoặc từ item gốc
                         const mainImageUrl = fieldDetail?.mainImageUrl || fieldDetail?.MainImageUrl || item.imageUrl || item.mainImageUrl || null;
                         const imageUrls = fieldDetail?.imageUrls || fieldDetail?.ImageUrls || item.imageUrls || [];

                         return {
                              id: item.fieldId,
                              name: item.fieldName || fieldDetail?.name || "Sân bóng",
                              location: location,
                              price: "Liên hệ",
                              rating: 4.5,
                              image: mainImageUrl,
                              mainImageUrl: mainImageUrl,
                              imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
                              amenities: [],
                              availableSlots: item.totalBookings || 0
                         };
                    });

                    setTopBookingFields(mappedFields);
               } catch (error) {
                    console.error("Error loading top booking fields:", error);
                    setTopBookingFields([]);
               } finally {
                    setLoadingTopFields(false);
               }
          };
          loadTopBookingFields();
     }, []);

     // Mock data for featured fields (used in QuickCategoriesSection)
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

     // Xử lý tìm kiếm
     const handleSearch = () => {
          try {
               const params = new URLSearchParams();
               const q = (searchQuery || "").trim();
               if (q) params.set("searchQuery", q);
               // Tìm kiếm theo location 
               const locationFilter = selectedLocation
                    ? (locationOptions.find((opt) => opt.value === selectedLocation)?.query || selectedLocation)
                    : "";
               if (locationFilter) params.set("selectedLocation", locationFilter);
               const normalizedPrice = selectedPrice && selectedPrice !== "all" ? selectedPrice : "";
               if (normalizedPrice) params.set("selectedPrice", normalizedPrice);
               params.set("sortBy", "relevance");
               const qs = params.toString();
               navigate(qs ? `/search?${qs}` : "/search");
          } catch {
               navigate("/search");
          }
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
                    locationOptions={locationOptions}
                    onSearch={handleSearch}
               />

               {/* <StatsSection /> */}
               <QuickCategoriesSection featuredFields={featuredFields} />
               {!loadingTopFields && topBookingFields.length > 0 && (
                    <TopBookingNowSection
                         featuredFields={topBookingFields}
                         hoveredCardId={hoveredCardId}
                         setHoveredCardId={setHoveredCardId}
                    />
               )}
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
                                                       <div className="text-sm font-semibold text-slate-300">Tổng quan chức năng</div>
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-6">
                                                       {detailComponents.map(({ key, element }, index) => (
                                                            <div
                                                                 key={`overview-${key}`}
                                                                 className="rounded-3xl bg-white/90 text-slate-900 pt-5  shadow-[0_30px_70px_rgba(15,23,42,0.25)] backdrop-blur border border-white/30"
                                                            >
                                                                 <div className="flex items-center justify-between text-xs px-4 uppercase tracking-[0.28em] text-slate-400">
                                                                      <span>{componentTitles[index] || `Component ${index + 1}`}</span>
                                                                      <span>Xem trước</span>
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
               {/* <MobileAppSection /> */}
               {!user && <NewsletterSection />}
               <WhyChooseUsSection />
               {/* <FAQSection /> */}
               <CTASection user={user} />
               <LoginPromotionModal user={user} />
          </Section>
     );
}

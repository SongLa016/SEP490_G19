import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
     HeroSection,
     QuickCategoriesSection,
     TopBookingNowSection,
     QuickBookingSection,
     CommunityMatchmakingSection,
     UserReviewsSection,
     CancellationPoliciesSection,
     WhyChooseUsSection,
     NewsletterSection,
     CTASection
} from "./components";
import { fetchTopBookingFields, fetchFieldComplex, fetchField } from "../../../../shared/services/fields";
import { useComplexes } from "../../../../shared/hooks/usePageData";

// Helpers để chuẩn hóa quận/huyện
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

     // Sử dụng React Query để cache data
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

     // Fetch top booking fields from API
     useEffect(() => {
          const loadTopBookingFields = async () => {
               try {
                    setLoadingTopFields(true);
                    const data = await fetchTopBookingFields();

                    // Fetch chi tiết từng field
                    const fieldDetailsPromises = data.map(async (item) => {
                         try {
                              const fieldDetail = await fetchField(item.fieldId);
                              return { ...item, fieldDetail };
                         } catch {
                              return { ...item, fieldDetail: null };
                         }
                    });
                    const fieldsWithDetails = await Promise.all(fieldDetailsPromises);

                    // Lấy danh sách complexId duy nhất
                    const uniqueComplexIds = [...new Set(
                         fieldsWithDetails
                              .map(item => item.fieldDetail?.complexId || item.complexId)
                              .filter(id => id != null && id !== undefined && id !== '')
                    )];

                    // Fetch complexes
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

                         if (complexId && complexMap.has(complexId)) {
                              const complex = complexMap.get(complexId);
                              if (complex?.address) {
                                   location = complex.address;
                              }
                         }

                         const mainImageUrl = fieldDetail?.mainImageUrl || fieldDetail?.MainImageUrl || item.imageUrl || item.mainImageUrl || null;
                         const imageUrls = fieldDetail?.imageUrls || fieldDetail?.ImageUrls || item.imageUrls || [];

                         return {
                              fieldId: item.fieldId,
                              fieldName: item.fieldName || fieldDetail?.name || "Sân bóng",
                              location: location,
                              bookingCount: item.bookingCount || 0,
                              imageUrl: mainImageUrl,
                              imageUrls: Array.isArray(imageUrls) ? imageUrls : [],
                              pricePerHour: fieldDetail?.pricePerHour || item.pricePerHour || 0,
                              complexId: complexId
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

     // Scroll to top on mount
     useEffect(() => {
          window.scrollTo(0, 0);
     }, []);

     return (
          <div className="min-h-screen space-y-4 bg-gray-50">
               {/* Hero Section */}
               <HeroSection
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    selectedLocation={selectedLocation}
                    setSelectedLocation={setSelectedLocation}
                    selectedPrice={selectedPrice}
                    setSelectedPrice={setSelectedPrice}
                    locationOptions={locationOptions}
                    onSearch={() => {
                         const params = new URLSearchParams();
                         if (searchQuery) params.set("searchQuery", searchQuery);
                         if (selectedLocation) params.set("selectedLocation", selectedLocation);
                         if (selectedPrice) params.set("selectedPrice", selectedPrice);
                         navigate(`/search?${params.toString()}`);
                    }}
               />

               {/* Quick Categories */}
               <QuickCategoriesSection featuredFields={topBookingFields} />

               {/* Top Booking Now */}
               <TopBookingNowSection
                    featuredFields={topBookingFields}
                    loadingTopFields={loadingTopFields}
                    hoveredCardId={hoveredCardId}
                    setHoveredCardId={setHoveredCardId}
               />

               {/* Quick Booking */}
               <QuickBookingSection user={user} />

               {/* Community Matchmaking */}
               <CommunityMatchmakingSection />

               {/* User Reviews */}
               <UserReviewsSection />

               {/* Cancellation Policies */}
               <CancellationPoliciesSection />

               {/* Why Choose Us */}
               <WhyChooseUsSection />

               {/* Newsletter - Only show when not logged in */}
               {!user && <NewsletterSection />}

               {/* CTA Section - Only show when not logged in */}
               {!user && <CTASection />}
          </div>
     );
}

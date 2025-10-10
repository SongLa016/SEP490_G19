import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MapPin, Star, Clock, Repeat, Info, Images } from "lucide-react";
import { Container, Card, CardContent, Button, Section, DatePicker } from "../../components/ui";
import { fetchComplexDetail, fetchTimeSlots } from "../../services/fields";

export default function ComplexDetail({ user }) {
     const navigate = useNavigate();
     const { id } = useParams();
     const [searchParams, setSearchParams] = useSearchParams();

     const [selectedDate, setSelectedDate] = useState(() => searchParams.get("date") || new Date().toISOString().split("T")[0]);
     const [selectedSlotId, setSelectedSlotId] = useState(() => searchParams.get("slotId") || "");
     const [timeSlots, setTimeSlots] = useState([]);
     const [complexData, setComplexData] = useState({ complex: null, fields: [] });
     const [activeTab, setActiveTab] = useState(() => {
          const q = new URLSearchParams(window.location.search);
          const t = q.get("tab");
          return t === "subfields" || t === "gallery" || t === "info" ? t : "info";
     }); // info | subfields | gallery
     const [isLoading, setIsLoading] = useState(true); // kept for future loading states
     const [error, setError] = useState(null);

     // Recurring booking UI state
     const [isRecurring, setIsRecurring] = useState(false);
     const [repeatDays, setRepeatDays] = useState([]); // [1..7] Mon..Sun
     const [rangeStart, setRangeStart] = useState(() => selectedDate);
     const [rangeEnd, setRangeEnd] = useState(() => selectedDate);

     // Lightbox state for gallery preview
     const [isLightboxOpen, setIsLightboxOpen] = useState(false);
     const [lightboxIndex, setLightboxIndex] = useState(0);

     useEffect(() => {
          setIsLoading(true);
          setError(null);
          Promise.all([
               fetchTimeSlots(),
               fetchComplexDetail(id, { date: selectedDate, slotId: selectedSlotId })
          ])
               .then(([slots, data]) => {
                    setTimeSlots(slots);
                    setComplexData(data);
                    setIsLoading(false);
               })
               .catch((e) => {
                    console.error(e);
                    setError("Không thể tải dữ liệu khu sân.");
                    setIsLoading(false);
               });
     }, [id, selectedDate, selectedSlotId]);

     useEffect(() => {
          const next = new URLSearchParams(searchParams);
          next.set("date", selectedDate);
          if (selectedSlotId) next.set("slotId", String(selectedSlotId)); else next.delete("slotId");
          setSearchParams(next, { replace: true });
     }, [selectedDate, selectedSlotId, searchParams, setSearchParams]);

     // Sync activeTab into query to preserve state on refresh/navigation
     useEffect(() => {
          const next = new URLSearchParams(searchParams);
          next.set("tab", activeTab);
          setSearchParams(next, { replace: true });
     }, [activeTab, searchParams, setSearchParams]);

     const daysOfWeek = [
          { id: 1, label: "T2" },
          { id: 2, label: "T3" },
          { id: 3, label: "T4" },
          { id: 4, label: "T5" },
          { id: 5, label: "T6" },
          { id: 6, label: "T7" },
          { id: 7, label: "CN" },
     ];

     const toggleDay = (d) => {
          setRepeatDays((prev) => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
     };

     const handleBookComplex = () => {
          if (!selectedDate || !selectedSlotId) {
               alert("Vui lòng chọn ngày và giờ.");
               return;
          }
          if (isRecurring) {
               if (!rangeStart || !rangeEnd || repeatDays.length === 0) {
                    alert("Vui lòng chọn khoảng ngày và các ngày trong tuần.");
                    return;
               }
               alert("Xem trước lịch định kỳ (mock). Sẽ liệt kê các buổi và xung đột nếu có.");
               return;
          }
          alert("Đặt Sân lớn (mock). Chuyển tới trang thanh toán...");
     };

     const handleQuickBookField = (fieldId) => {
          if (!selectedDate || !selectedSlotId) {
               alert("Vui lòng chọn ngày và giờ.");
               return;
          }
          alert(`Đặt nhanh sân nhỏ #${fieldId} (mock).`);
     };

     const complex = complexData.complex;
     const fields = complexData.fields || [];
     const galleryImages = fields.map(f => f.image).filter(Boolean);

     const openLightbox = (index) => {
          if (!galleryImages.length) return;
          setLightboxIndex(Math.max(0, Math.min(index, galleryImages.length - 1)));
          setIsLightboxOpen(true);
     };

     const closeLightbox = () => setIsLightboxOpen(false);

     useEffect(() => {
          if (!isLightboxOpen) return;
          const onKeyDown = (e) => {
               if (e.key === "Escape") closeLightbox();
               if (e.key === "ArrowRight") setLightboxIndex(i => (i + 1) % galleryImages.length);
               if (e.key === "ArrowLeft") setLightboxIndex(i => (i - 1 + galleryImages.length) % galleryImages.length);
          };
          window.addEventListener("keydown", onKeyDown);
          return () => window.removeEventListener("keydown", onKeyDown);
     }, [isLightboxOpen, galleryImages.length]);

     const availableCount = fields.filter(f => f.isAvailableForSelectedSlot).length;
     const minPrice = fields.reduce((acc, f) => {
          const p = Number(f.priceForSelectedSlot || 0);
          return acc === 0 ? p : (p > 0 ? Math.min(acc, p) : acc);
     }, 0);

     return (
          <Section className="min-h-screen bg-[url('https://mixivivu.com/section-background.png')] bg-cover bg-center">
               <div className="py-28 mx-5 md:py-36 bg-[url('https://i.pinimg.com/originals/a3/c7/79/a3c779e5d5b622eeb598ac1d50c05cb8.png')] bg-cover bg-center rounded-b-3xl overflow-hidden">
                    <Container className="py-5">
                         <div className="text-center text-white">
                              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{complex?.name || "Khu sân"}</h1>
                              <div className="mt-2 flex items-center justify-center gap-4 opacity-90">
                                   <span className="inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> {complex?.address || ""}</span>
                                   {complex?.rating && (
                                        <span className="inline-flex items-center gap-1"><Star className="w-4 h-4 text-yellow-300" /> {complex.rating}</span>
                                   )}
                              </div>
                         </div>
                    </Container>
               </div>

               {/* Tabs header matching FieldDetail */}
               <Container className="-mt-32 md:-mt-20 px-5 py-2 relative z-10">
                    <Card className="border p-1 mx-20 bg-white/80 backdrop-blur rounded-2xl shadow-xl">
                         <CardContent className="p-1">
                              <div className="relative">
                                   <div className="grid grid-cols-3 gap-1">
                                        {[
                                             { key: "info", label: "Thông tin", icon: Info },
                                             { key: "subfields", label: "Sân nhỏ", icon: Clock },
                                             { key: "gallery", label: "Thư viện ảnh", icon: Images },
                                        ].map(t => (
                                             <Button
                                                  key={t.key}
                                                  type="button"
                                                  onClick={() => setActiveTab(t.key)}
                                                  className={`group relative flex items-center justify-center gap-2 h-14 sm:h-16 rounded-xl border transition-all ${activeTab === t.key ? "bg-gradient-to-b from-teal-50 to-white border-teal-300 shadow-sm" : "bg-white/70 hover:bg-teal-50 border-teal-200/60"}`}
                                             >
                                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-teal-700 ${activeTab === t.key ? "border-teal-400 bg-white" : "border-teal-200 bg-teal-50 group-hover:border-teal-300"}`}>
                                                       <t.icon className={`w-5 h-5 ${activeTab === t.key ? "text-teal-700" : "text-teal-600"}`} />
                                                  </span>
                                                  <span className={`font-semibold text-xl ${activeTab === t.key ? "text-teal-800" : "text-gray-600 group-hover:text-teal-700"}`}>{t.label}</span>
                                                  {activeTab === t.key && (
                                                       <span className="absolute -bottom-1 left-6 right-6 h-1 rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-teal-500" />
                                                  )}
                                             </Button>
                                        ))}
                                   </div>
                              </div>
                         </CardContent>
                    </Card>

                    {isLoading && (
                         <Container className="py-10">
                              <div className="flex items-center justify-center p-8 bg-white/80 backdrop-blur rounded-2xl border border-teal-100">
                                   <div className="animate-spin rounded-full h-10 w-10 border-4 border-teal-200 border-t-teal-600"></div>
                                   <span className="ml-3 text-teal-700">Đang tải dữ liệu...</span>
                              </div>
                         </Container>
                    )}

                    {/* Error Display */}
                    {error && (
                         <Container className="py-4">
                              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                                   <div className="flex items-center">
                                        <div className="text-red-600 mr-3">
                                             <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                             </svg>
                                        </div>
                                        <div>
                                             <h3 className="text-sm font-medium text-red-800">Lỗi tải dữ liệu</h3>
                                             <p className="text-sm text-red-700 mt-1">{error}</p>
                                        </div>
                                   </div>
                              </div>
                         </Container>
                    )}

                    {/* Two-column layout: Left content, Right sticky booking */}
                    <Container className="py-10">
                         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                              {/* Left - Content */}
                              <div className="lg:col-span-2 p-5 bg-white/80 backdrop-blur rounded-2xl shadow-xl border border-teal-100 space-y-6">

                                   {activeTab === "subfields" && (
                                        <div className="space-y-6">
                                             <div className="text-center">
                                                  <h3 className="text-2xl font-extrabold text-teal-800">Danh sách Sân nhỏ</h3>
                                                  <div className="mt-2 h-1 w-24 bg-teal-500/80 rounded-full mx-auto" />
                                             </div>
                                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                  {fields.map((f) => (
                                                       <Card key={f.fieldId} className="border border-teal-100 rounded-2xl overflow-hidden shadow-sm bg-white">
                                                            <CardContent className="p-0">
                                                                 <img src={f.image} alt={f.name} className="w-full h-40 object-cover" loading="lazy" />
                                                                 <div className="p-4">
                                                                      <div className="font-semibold text-teal-800">{f.name}</div>
                                                                      <div className="text-sm text-gray-600">{f.typeName}</div>
                                                                      <div className="mt-1 text-sm text-gray-600 inline-flex items-center gap-2"><MapPin className="w-4 h-4" /> {f.address}</div>
                                                                      <div className="mt-2 flex items-center justify-between">
                                                                           <div className="text-orange-600 font-bold">{f.priceForSelectedSlot?.toLocaleString("vi-VN")}₫</div>
                                                                           <div className={`text-xs px-2 py-1 rounded-md ${f.isAvailableForSelectedSlot ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>{f.isAvailableForSelectedSlot ? "Còn chỗ" : "Hết chỗ"}</div>
                                                                      </div>
                                                                      <div className="mt-3 flex items-center gap-2">
                                                                           <Button type="button" variant="outline" className="rounded-lg border-teal-300 text-teal-700" onClick={() => navigate(`/field/${f.fieldId}?date=${selectedDate}&slotId=${selectedSlotId}`)}>Xem chi tiết</Button>
                                                                           <Button type="button" className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white" onClick={() => handleQuickBookField(f.fieldId)}>Đặt nhanh</Button>
                                                                      </div>
                                                                 </div>
                                                            </CardContent>
                                                       </Card>
                                                  ))}
                                             </div>
                                        </div>
                                   )}

                                   {activeTab === "info" && (
                                        <div className="space-y-6">
                                             <div className="text-center">
                                                  <h3 className="text-2xl font-extrabold text-teal-800">Thông tin khu sân</h3>
                                                  <div className="mt-2 h-1 w-24 bg-teal-500/80 rounded-full mx-auto" />
                                             </div>
                                             <div className="grid grid-cols-1 gap-5">
                                                  <img src={complex?.image} alt={complex?.name} className="w-full h-64 object-cover rounded-2xl" />
                                                  <div className="bg-gray-50 border border-teal-100 rounded-2xl p-4">
                                                       <div className="text-teal-700 text-lg font-semibold">Mô tả</div>
                                                       <div className="text-gray-700 mt-1">{complex?.description}</div>
                                                  </div>
                                             </div>
                                        </div>
                                   )}

                                   {activeTab === "gallery" && (
                                        <div className="space-y-6">
                                             <div className="text-center">
                                                  <h3 className="text-2xl font-extrabold text-teal-800">Thư viện ảnh</h3>
                                                  <div className="mt-2 h-1 w-24 bg-teal-500/80 rounded-full mx-auto" />
                                             </div>
                                             <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                  {galleryImages.map((img, i) => (
                                                       <img key={i} src={img} alt={`gallery-${i}`} onClick={() => openLightbox(i)} className="w-full h-40 object-cover rounded-lg hover:scale-105 transition-transform cursor-pointer" />
                                                  ))}
                                             </div>
                                        </div>
                                   )}
                              </div>

                              {/* Right - Sticky booking widget */}
                              <div className="lg:col-span-1">
                                   <Card className="bg-white border border-teal-100 shadow-lg rounded-2xl lg:sticky lg:top-24">
                                        <CardContent className="p-6">
                                             <h3 className="text-2xl font-bold text-center text-teal-800 mb-2">Đặt Sân lớn</h3>
                                             <p className="text-teal-700/80 text-sm mb-4 text-center">Chọn ngày/giờ hoặc bật đặt cố định</p>
                                             <div className="grid grid-cols-1 gap-3">
                                                  <div>
                                                       <div className="text-sm font-medium text-gray-700 mb-1">Ngày</div>
                                                       <DatePicker value={selectedDate} onChange={setSelectedDate} min={new Date().toISOString().split('T')[0]} />
                                                  </div>
                                                  <div>
                                                       <div className="text-sm font-medium text-gray-700 mb-1">Giờ</div>
                                                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg border-teal-200 p-2 bg-white">
                                                            {timeSlots.map((s) => {
                                                                 const isSelected = String(selectedSlotId) === String(s.slotId);
                                                                 return (
                                                                      <button
                                                                           key={s.slotId}
                                                                           type="button"
                                                                           onClick={() => setSelectedSlotId(isSelected ? "" : s.slotId)}
                                                                           className={`p-2 text-xs rounded-lg border transition-colors ${isSelected ? "bg-teal-600 text-white border-teal-600" : "bg-white text-teal-800 border-teal-200 hover:bg-teal-50 hover:border-teal-300"}`}
                                                                      >
                                                                           {s.name}
                                                                      </button>
                                                                 );
                                                            })}
                                                       </div>
                                                  </div>
                                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                                       <div className="bg-gray-50 border border-teal-100 rounded-xl p-3">
                                                            <div className="text-gray-600">Giá từ</div>
                                                            <div className="text-orange-600 font-bold">{minPrice ? minPrice.toLocaleString("vi-VN") + "₫" : "—"}</div>
                                                       </div>
                                                       <div className="bg-gray-50 border border-teal-100 rounded-xl p-3">
                                                            <div className="text-gray-600">Sân còn trống</div>
                                                            <div className="text-teal-700 font-semibold">{availableCount}/{fields.length}</div>
                                                       </div>
                                                  </div>
                                                  <div className="p-3 border rounded-xl bg-teal-50/50">
                                                       <div className="flex items-center justify-between mb-2">
                                                            <div className="flex items-center gap-2">
                                                                 <Repeat className="w-5 h-5 text-teal-700" />
                                                                 <div className="font-semibold text-teal-800">Đặt cố định</div>
                                                            </div>
                                                            <button type="button" onClick={() => setIsRecurring(v => !v)} className={`px-3 py-1.5 rounded-lg border ${isRecurring ? "bg-teal-600 text-white border-teal-600" : "bg-white text-teal-800 border-teal-200"}`}>{isRecurring ? "Bật" : "Tắt"}</button>
                                                       </div>
                                                       {isRecurring && (
                                                            <div className="space-y-3">
                                                                 <div>
                                                                      <div className="text-sm text-gray-600 mb-1">Từ ngày</div>
                                                                      <DatePicker value={rangeStart} onChange={setRangeStart} min={selectedDate} />
                                                                 </div>
                                                                 <div>
                                                                      <div className="text-sm text-gray-600 mb-1">Đến ngày</div>
                                                                      <DatePicker value={rangeEnd} onChange={setRangeEnd} min={rangeStart || selectedDate} />
                                                                 </div>
                                                                 <div>
                                                                      <div className="text-sm text-gray-600 mb-1">Ngày trong tuần</div>
                                                                      <div className="flex flex-wrap gap-2">
                                                                           {daysOfWeek.map(d => (
                                                                                <button key={d.id} type="button" onClick={() => toggleDay(d.id)} className={`px-3 py-1.5 rounded-lg border text-sm ${repeatDays.includes(d.id) ? "bg-teal-600 text-white border-teal-600" : "bg-white text-teal-800 border-teal-200"}`}>{d.label}</button>
                                                                           ))}
                                                                      </div>
                                                                 </div>
                                                            </div>
                                                       )}
                                                  </div>
                                                  <Button type="button" onClick={handleBookComplex} className="rounded-lg bg-teal-600 hover:bg-teal-700 text-white">{isRecurring ? "Xem trước lịch định kỳ" : "Đặt Sân lớn"}</Button>
                                                  <div className="text-xs text-gray-500 text-center">Mock UI – chưa gọi backend</div>
                                             </div>
                                        </CardContent>
                                   </Card>
                              </div>
                         </div>
                    </Container>

                    {/* Lightbox Modal */}
                    {isLightboxOpen && (
                         <div role="dialog" aria-modal="true" className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80" onClick={closeLightbox}>
                              <div className="relative max-w-5xl w-full px-4" onClick={(e) => e.stopPropagation()}>
                                   <img src={galleryImages[lightboxIndex]} alt={`preview-${lightboxIndex}`} className="max-h-[80vh] w-full object-contain rounded-lg shadow-2xl" />
                                   <button type="button" aria-label="Close" onClick={closeLightbox} className="absolute top-2 right-2 text-white/90 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-2">✕</button>
                                   {galleryImages.length > 1 && (
                                        <>
                                             <button type="button" aria-label="Previous" onClick={() => setLightboxIndex(i => (i - 1 + galleryImages.length) % galleryImages.length)} className="absolute left-2 top-1/2 -translate-y-1/2 text-white/90 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-3">‹</button>
                                             <button type="button" aria-label="Next" onClick={() => setLightboxIndex(i => (i + 1) % galleryImages.length)} className="absolute right-2 top-1/2 -translate-y-1/2 text-white/90 hover:text-white bg-black/40 hover:bg-black/60 rounded-full p-3">›</button>
                                        </>
                                   )}
                                   <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-white/90 text-sm bg-black/40 px-3 py-1 rounded-full">{lightboxIndex + 1} / {galleryImages.length}</div>
                              </div>
                         </div>
                    )}
               </Container>
          </Section>
     );
}

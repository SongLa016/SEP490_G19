import { useEffect, useMemo, useState } from "react";
import { MapPin, Star, Heart, Share2, Calendar, Phone, Mail } from "lucide-react";
import { Section, Container, Card, CardContent, Button } from "../../components/ui";
import { useNavigate } from "react-router-dom";
import { fetchFieldAvailability, fetchTimeSlots, fetchFieldMeta } from "../../services/fields";

export default function FieldDetail({ user }) {
     const navigate = useNavigate();
     const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
     const [selectedSlotId, setSelectedSlotId] = useState("");
     const [isFavorite, setIsFavorite] = useState(false);
     const [timeSlots, setTimeSlots] = useState([]);
     const [availability, setAvailability] = useState([]);

     // Mock data for field details
     const field = {
          id: 1,
          name: "Sân bóng đá ABC",
          location: "Quận 1, TP.HCM",
          address: "",
          price: 200000,
          rating: 4.8,
          reviewCount: 156,
          images: [
               "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg",
               "https://images.pexels.com/photos/46792/the-ball-stadion-football-the-pitch-46792.jpeg"
          ],
          amenities: [
               "Có nước uống miễn phí",
               "Có WC sạch sẽ",
               "Có chỗ đậu xe",
               "Có phòng thay đồ",
               "Có máy lạnh",
               "Có wifi miễn phí"
          ],
          description: "Sân bóng đá ABC là một trong những sân bóng chất lượng cao nhất tại Quận 1. Với mặt sân cỏ nhân tạo mới, hệ thống chiếu sáng hiện đại và các tiện ích đầy đủ, đây là lựa chọn lý tưởng cho các trận đấu bóng đá.",
          owner: {
               name: "Nguyễn Văn A",
               phone: "0901234567",
               email: "owner@example.com"
          },
          availableSlots: [],
          reviews: [
               {
                    id: 1,
                    user: "Nguyễn Văn B",
                    rating: 5,
                    comment: "Sân rất đẹp, mặt cỏ mềm, chủ sân thân thiện. Sẽ quay lại!",
                    date: "2024-12-10"
               },
               {
                    id: 2,
                    user: "Trần Thị C",
                    rating: 4,
                    comment: "Sân tốt, giá hợp lý. Chỉ có điều WC hơi xa một chút.",
                    date: "2024-12-08"
               }
          ]
     };

     const formatPrice = (price) => {
          return new Intl.NumberFormat('vi-VN', {
               style: 'currency',
               currency: 'VND'
          }).format(price);
     };

     // Load time slots once
     useEffect(() => {
          let mounted = true;
          fetchTimeSlots().then((slots) => { if (mounted) setTimeSlots(slots); });
          return () => { mounted = false; };
     }, []);

     // Load availability when date changes
     useEffect(() => {
          let ignore = false;
          async function load() {
               const data = await fetchFieldAvailability(field.id, selectedDate);
               if (!ignore) setAvailability(data);
          }
          load();
          return () => { ignore = true; };
     }, [field.id, selectedDate]);

     const [complexMeta, setComplexMeta] = useState(null);

     const availabilityWithSlotMeta = useMemo(() => {
          const byId = Object.fromEntries(timeSlots.map(s => [String(s.slotId), s]));
          return availability.map(a => ({ ...a, slotMeta: byId[String(a.slotId)] }));
     }, [availability, timeSlots]);

     // Load parent complex meta (address/name) for the field
     useEffect(() => {
          let ignore = false;
          async function load() {
               const meta = await fetchFieldMeta(field.id);
               if (!ignore) setComplexMeta(meta);
          }
          load();
          return () => { ignore = true; };
     }, [field.id]);

     const handleBooking = () => {
          if (!selectedDate || !selectedSlotId) {
               alert("Vui lòng chọn ngày và giờ");
               return;
          }
          if (!user) {
               alert("Bạn cần đăng nhập để đặt sân.");
               navigate("/auth");
               return;
          }
          navigate("/booking", { state: { fieldId: field.id, date: selectedDate, slotId: selectedSlotId, fieldName: field.name, fieldAddress: complexMeta?.complex?.address || "" } });
     };

     return (
          <Section className="min-h-screen bg-gray-50">
               <Container className="py-8">
                    {/* Header */}
                    <Card className="mb-6"><CardContent>
                         <div className="flex justify-between items-start">
                              <div>
                                   <h1 className="text-3xl font-bold text-gray-900 mb-2">{field.name}</h1>
                                   <div className="flex items-center text-gray-600 mb-2">
                                        <MapPin className="w-5 h-5 mr-2" />
                                        <span>{complexMeta?.complex?.address || ""}</span>
                                   </div>
                                   <div className="flex items-center">
                                        <Star className="w-5 h-5 text-teal-400 mr-1" />
                                        <span className="font-semibold">{field.rating}</span>
                                        <span className="text-gray-500 ml-2">({field.reviewCount} đánh giá)</span>
                                   </div>
                              </div>
                              <div className="flex space-x-2">
                                   <Button
                                        onClick={() => {
                                             if (!user) {
                                                  alert("Vui lòng đăng nhập để dùng danh sách yêu thích.");
                                                  navigate("/auth");
                                                  return;
                                             }
                                             setIsFavorite(!isFavorite);
                                        }}
                                        className={`p-2 rounded-full ${isFavorite ? "bg-red-500 text-white" : "bg-gray-100 text-gray-600"}`}
                                   >
                                        <Heart className="w-5 h-5" />
                                   </Button>
                                   <Button className="p-2 rounded-full bg-gray-100 text-gray-600">
                                        <Share2 className="w-5 h-5" />
                                   </Button>
                              </div>
                         </div>
                    </CardContent></Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                         {/* Main Content */}
                         <div className="lg:col-span-2 space-y-6">
                              {/* Images */}
                              <Card className="overflow-hidden"><CardContent className="p-4">
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-4">
                                        {field.images.map((image, index) => (
                                             <img
                                                  key={index}
                                                  src={image}
                                                  alt={`${field.name} ${index + 1}`}
                                                  className="w-full h-48 object-cover rounded-lg"
                                             />
                                        ))}
                                   </div>
                              </CardContent></Card>

                              {/* Description */}
                              <Card><CardContent>
                                   <h2 className="text-xl font-semibold text-gray-900 mb-4">Mô tả</h2>
                                   <p className="text-gray-600 leading-relaxed">{field.description}</p>
                              </CardContent></Card>

                              {/* Amenities */}
                              <Card><CardContent>
                                   <h2 className="text-xl font-semibold text-gray-900 mb-4">Tiện ích</h2>
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {field.amenities.map((amenity, index) => (
                                             <div key={index} className="flex items-center">
                                                  <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                                                  <span className="text-gray-700">{amenity}</span>
                                             </div>
                                        ))}
                                   </div>
                              </CardContent></Card>

                              {/* Reviews */}
                              <Card><CardContent>
                                   <h2 className="text-xl font-semibold text-gray-900 mb-4">Đánh giá</h2>
                                   <div className="space-y-4">
                                        {field.reviews.map((review) => (
                                             <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                                                  <div className="flex justify-between items-start mb-2">
                                                       <div>
                                                            <h4 className="font-semibold text-gray-900">{review.user}</h4>
                                                            <div className="flex items-center">
                                                                 {[...Array(5)].map((_, i) => (
                                                                      <Star
                                                                           key={i}
                                                                           className={`w-4 h-4 ${i < review.rating ? "text-teal-400" : "text-gray-300"}`}
                                                                      />
                                                                 ))}
                                                            </div>
                                                       </div>
                                                       <span className="text-sm text-gray-500">{review.date}</span>
                                                  </div>
                                                  <p className="text-gray-600">{review.comment}</p>
                                             </div>
                                        ))}
                                   </div>
                              </CardContent></Card>
                         </div>

                         {/* Booking Sidebar */}
                         <div className="space-y-6">
                              {/* Price & Booking */}
                              <Card className="sticky top-6"><CardContent>
                                   <div className="text-center mb-6">
                                        <div className="text-3xl font-bold text-teal-500 mb-2">
                                             {formatPrice(field.price)}
                                        </div>
                                        <div className="text-gray-600">/ giờ</div>
                                   </div>

                                   {/* Date Selection */}
                                   <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Chọn ngày
                                        </label>
                                        <input
                                             type="date"
                                             value={selectedDate}
                                             onChange={(e) => setSelectedDate(e.target.value)}
                                             min={new Date().toISOString().split('T')[0]}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                        />
                                   </div>

                                   {/* Time Selection */}
                                   <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Chọn giờ
                                        </label>
                                        <div className="grid grid-cols-2 gap-2">
                                             {availabilityWithSlotMeta.map((slot, index) => (
                                                  <button
                                                       key={index}
                                                       onClick={() => { setSelectedSlotId(slot.slotId); }}
                                                       disabled={slot.status !== "Available"}
                                                       className={`p-2 text-sm rounded-lg border transition-colors ${selectedSlotId === slot.slotId
                                                            ? "border-teal-500 bg-teal-50 text-teal-700"
                                                            : slot.status === "Available"
                                                                 ? "border-gray-300 hover:border-teal-500 hover:bg-teal-50"
                                                                 : "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                                                            }`}
                                                  >
                                                       <div className="font-medium">{slot.slotMeta?.name || ""}</div>
                                                       <div className="text-xs">{formatPrice(slot.price)} • {slot.status === "Available" ? "Còn chỗ" : "Hết chỗ"}</div>
                                                  </button>
                                             ))}
                                        </div>
                                   </div>

                                   {/* Booking Button */}
                                   <Button
                                        onClick={handleBooking}
                                        className="w-full flex items-center justify-center"
                                   >
                                        <Calendar className="w-5 h-5 mr-2" />
                                        Đặt sân ngay
                                   </Button>

                                   {/* Contact Info */}
                                   <div className="mt-6 pt-6 border-t border-gray-200">
                                        <h3 className="font-semibold text-gray-900 mb-3">Liên hệ chủ sân</h3>
                                        <div className="space-y-2">
                                             <div className="flex items-center text-sm text-gray-600">
                                                  <Phone className="w-4 h-4 mr-2" />
                                                  <span>{field.owner.phone}</span>
                                             </div>
                                             <div className="flex items-center text-sm text-gray-600">
                                                  <Mail className="w-4 h-4 mr-2" />
                                                  <span>{field.owner.email}</span>
                                             </div>
                                        </div>
                                   </div>
                              </CardContent></Card>

                              {/* Quick Stats */}
                              <Card><CardContent>
                                   <h3 className="font-semibold text-gray-900 mb-4">Thống kê nhanh</h3>
                                   <div className="space-y-3">
                                        <div className="flex justify-between">
                                             <span className="text-gray-600">Đánh giá trung bình</span>
                                             <span className="font-semibold">{field.rating}/5</span>
                                        </div>
                                        <div className="flex justify-between">
                                             <span className="text-gray-600">Số đánh giá</span>
                                             <span className="font-semibold">{field.reviewCount}</span>
                                        </div>
                                        <div className="flex justify-between">
                                             <span className="text-gray-600">Slot trống hôm nay</span>
                                             <span className="font-semibold text-green-600">
                                                  {field.availableSlots.filter(slot => slot.available).length}
                                             </span>
                                        </div>
                                   </div>
                              </CardContent></Card>
                         </div>
                    </div>
               </Container>
          </Section>
     );
}

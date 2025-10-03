import { useEffect, useMemo, useState } from "react";
import { Calendar, MapPin, ArrowLeft, CheckCircle } from "lucide-react";
import { createBooking } from "../../utils/bookingStore";
import { getCurrentUser } from "../../utils/authStore";
import { useLocation, useNavigate } from "react-router-dom";
import { createPendingBooking, confirmPayment } from "../../services/bookings";

export default function Booking({ user }) {
     const navigate = useNavigate();
     const location = useLocation();
     const [step, setStep] = useState("details"); // details | pending | payment | confirmation
     const [bookingData, setBookingData] = useState({
          fieldId: location.state?.fieldId || null,
          fieldName: location.state?.fieldName || "Sân bóng đá ABC",
          fieldAddress: location.state?.fieldAddress || "123 Đường ABC, Phường Bến Nghé, Quận 1, TP.HCM",
          date: location.state?.date || "2024-12-15",
          slotId: location.state?.slotId || null,
          time: "",
          duration: 2,
          price: 200000,
          totalPrice: 400000,
          customerName: user?.name || "",
          customerPhone: user?.phone || "",
          customerEmail: user?.email || "",
          notes: ""
     });
     const [paymentMethod, setPaymentMethod] = useState("");
     const [isProcessing, setIsProcessing] = useState(false);
     const [pendingInfo, setPendingInfo] = useState(null); // { bookingId, qrCodeUrl, qrExpiresAt }

     const formatPrice = (price) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);

     const handleInputChange = (field, value) => {
          setBookingData((prev) => ({ ...prev, [field]: value }));
     };

     const handlePayment = () => {
          if (!paymentMethod) {
               alert("Vui lòng chọn phương thức thanh toán");
               return;
          }
          setIsProcessing(true);
          confirmPayment({ bookingId: pendingInfo?.bookingId, method: paymentMethod }).then(() => {
               setIsProcessing(false);
               const current = getCurrentUser();
               createBooking({
                    userId: current?.id,
                    data: {
                         fieldName: bookingData.fieldName,
                         address: bookingData.fieldAddress,
                         date: bookingData.date,
                         time: bookingData.time,
                         duration: bookingData.duration,
                         price: bookingData.totalPrice,
                         paymentMethod,
                    },
               });
               setStep("confirmation");
          });
     };

     const createPending = async () => {
          setIsProcessing(true);
          try {
               const created = await createPendingBooking({ fieldId: bookingData.fieldId, date: bookingData.date, slotId: bookingData.slotId, customer: { name: bookingData.customerName, phone: bookingData.customerPhone, email: bookingData.customerEmail } });
               setPendingInfo(created);
               setStep("payment");
          } finally {
               setIsProcessing(false);
          }
     };

     const renderDetailsStep = () => (
          <div className="max-w-4xl mx-auto p-6">
               <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-orange-500 px-6 py-8 text-white">
                         <div className="flex items-center mb-4">
                              <button onClick={() => navigate(-1)} className="mr-4 p-2 hover:bg-white/20 rounded-lg transition-colors">
                                   <ArrowLeft className="w-5 h-5" />
                              </button>
                              <h1 className="text-2xl font-bold">Đặt sân bóng</h1>
                         </div>
                         <p className="text-teal-100">Xác nhận thông tin đặt sân của bạn</p>
                    </div>
                    <div className="p-6">
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div>
                                   <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin sân</h2>
                                   <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                        <h3 className="font-semibold text-gray-900 mb-2">{bookingData.fieldName}</h3>
                                        <div className="flex items-center text-gray-600 mb-2">
                                             <MapPin className="w-4 h-4 mr-2" />
                                             <span className="text-sm">{bookingData.fieldAddress}</span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                             <Calendar className="w-4 h-4 mr-2" />
                                             <span className="text-sm">{bookingData.date} {bookingData.time && `- ${bookingData.time}`}</span>
                                        </div>
                                   </div>
                                   <h2 className="text-xl font-semibold text-gray-900 mb-4">Thông tin liên hệ</h2>
                                   <div className="space-y-4">
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-2">Họ và tên *</label>
                                             <input type="text" value={bookingData.customerName} onChange={(e) => handleInputChange("customerName", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Nhập họ và tên" required />
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-2">Số điện thoại *</label>
                                             <input type="tel" value={bookingData.customerPhone} onChange={(e) => handleInputChange("customerPhone", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Nhập số điện thoại" required />
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                                             <input type="email" value={bookingData.customerEmail} onChange={(e) => handleInputChange("customerEmail", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Nhập email" required />
                                        </div>
                                        <div>
                                             <label className="block text-sm font-medium text-gray-700 mb-2">Ghi chú</label>
                                             <textarea value={bookingData.notes} onChange={(e) => handleInputChange("notes", e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent" placeholder="Ghi chú thêm (nếu có)" rows={3} />
                                        </div>
                                   </div>
                              </div>
                              <div>
                                   <h2 className="text-xl font-semibold text-gray-900 mb-4">Tóm tắt đặt sân</h2>
                                   <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="space-y-3">
                                             <div className="flex justify-between"><span className="text-gray-600">Ngày</span><span className="font-medium">{bookingData.date}</span></div>
                                             {bookingData.time && (<div className="flex justify-between"><span className="text-gray-600">Giờ</span><span className="font-medium">{bookingData.time}</span></div>)}
                                             <div className="flex justify-between"><span className="text-gray-600">Thời gian</span><span className="font-medium">{bookingData.duration} giờ</span></div>
                                             <div className="flex justify-between"><span className="text-gray-600">Giá/giờ</span><span className="font-medium">{formatPrice(bookingData.price)}</span></div>
                                             <div className="border-t border-gray-300 pt-3">
                                                  <div className="flex justify-between text-lg font-semibold">
                                                       <span>Tổng cộng</span>
                                                       <span className="text-teal-600">{formatPrice(bookingData.totalPrice)}</span>
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                                   <div className="mt-6">
                                        <button onClick={createPending} className="w-full bg-teal-500 hover:bg-teal-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors" disabled={isProcessing}>{isProcessing ? "Đang tạo giữ chỗ..." : "Giữ chỗ & tiếp tục thanh toán"}</button>
                                   </div>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );

     const renderPaymentStep = () => (
          <div className="max-w-4xl mx-auto p-6">
               <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-orange-500 px-6 py-8 text-white">
                         <div className="flex items-center mb-4">
                              <button onClick={() => setStep("details")} className="mr-4 p-2 hover:bg-white/20 rounded-lg transition-colors">
                                   <ArrowLeft className="w-5 h-5" />
                              </button>
                              <h1 className="text-2xl font-bold">Thanh toán</h1>
                         </div>
                         <p className="text-teal-100">Chọn phương thức thanh toán</p>
                    </div>
                    <div className="p-6">
                         {pendingInfo && (
                              <div className="mb-6 p-4 border border-teal-200 rounded-lg bg-teal-50">
                                   <div className="flex items-center justify-between">
                                        <div>
                                             <div className="text-sm text-teal-700">Mã đặt chỗ tạm thời</div>
                                             <div className="text-lg font-semibold text-teal-800">#{pendingInfo.bookingId}</div>
                                             <div className="text-xs text-teal-600">Hết hạn: {new Date(pendingInfo.qrExpiresAt).toLocaleTimeString()}</div>
                                        </div>
                                        <img src={pendingInfo.qrCodeUrl} alt="QR" className="w-24 h-24" />
                                   </div>
                              </div>
                         )}
                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                              <div>
                                   <h2 className="text-xl font-semibold text-gray-900 mb-4">Phương thức thanh toán</h2>
                                   <div className="space-y-3">
                                        <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                             <input type="radio" name="payment" value="momo" checked={paymentMethod === "momo"} onChange={(e) => setPaymentMethod(e.target.value)} className="mr-3" />
                                             <div className="flex items-center">
                                                  <div className="w-8 h-8 bg-pink-500 rounded mr-3 flex items-center justify-center"><span className="text-white font-bold text-sm">M</span></div>
                                                  <span className="font-medium">Ví MoMo</span>
                                             </div>
                                        </label>
                                        <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                             <input type="radio" name="payment" value="vnpay" checked={paymentMethod === "vnpay"} onChange={(e) => setPaymentMethod(e.target.value)} className="mr-3" />
                                             <div className="flex items-center">
                                                  <div className="w-8 h-8 bg-blue-500 rounded mr-3 flex items-center justify-center"><span className="text-white font-bold text-sm">V</span></div>
                                                  <span className="font-medium">VNPay</span>
                                             </div>
                                        </label>
                                        <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                             <input type="radio" name="payment" value="zalopay" checked={paymentMethod === "zalopay"} onChange={(e) => setPaymentMethod(e.target.value)} className="mr-3" />
                                             <div className="flex items-center">
                                                  <div className="w-8 h-8 bg-cyan-500 rounded mr-3 flex items-center justify-center"><span className="text-white font-bold text-sm">Z</span></div>
                                                  <span className="font-medium">ZaloPay</span>
                                             </div>
                                        </label>
                                        <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                                             <input type="radio" name="payment" value="paypal" checked={paymentMethod === "paypal"} onChange={(e) => setPaymentMethod(e.target.value)} className="mr-3" />
                                             <div className="flex items-center">
                                                  <div className="w-8 h-8 bg-indigo-600 rounded mr-3 flex items-center justify-center"><span className="text-white font-bold text-sm">P</span></div>
                                                  <span className="font-medium">PayPal</span>
                                             </div>
                                        </label>
                                   </div>
                              </div>
                              <div>
                                   <h2 className="text-xl font-semibold text-gray-900 mb-4">Tóm tắt</h2>
                                   <div className="bg-gray-50 rounded-lg p-4">
                                        <div className="space-y-3 text-sm">
                                             <div className="flex justify-between"><span className="text-gray-600">Sân</span><span className="font-medium">{bookingData.fieldName}</span></div>
                                             <div className="flex justify-between"><span className="text-gray-600">Ngày</span><span className="font-medium">{bookingData.date}</span></div>
                                             {bookingData.time && (<div className="flex justify-between"><span className="text-gray-600">Giờ</span><span className="font-medium">{bookingData.time}</span></div>)}
                                             <div className="flex justify-between"><span className="text-gray-600">Tổng cộng</span><span className="font-semibold text-teal-600">{formatPrice(bookingData.totalPrice)}</span></div>
                                        </div>
                                   </div>
                                   <button onClick={handlePayment} disabled={isProcessing} className={`mt-4 w-full py-3 rounded-lg text-white font-semibold ${isProcessing ? "bg-gray-400" : "bg-teal-500 hover:bg-teal-600"}`}>{isProcessing ? "Đang xử lý..." : "Xác nhận thanh toán"}</button>
                              </div>
                         </div>
                    </div>
               </div>
          </div>
     );

     const renderConfirmationStep = () => (
          <div className="max-w-3xl mx-auto p-6">
               <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <div className="bg-green-500 px-6 py-8 text-white text-center">
                         <CheckCircle className="w-10 h-10 mx-auto mb-2" />
                         <h1 className="text-2xl font-bold">Đặt sân thành công!</h1>
                         <p className="text-green-100">Bạn có thể xem chi tiết trong mục Lịch sử đặt sân.</p>
                    </div>
                    <div className="p-6 text-center">
                         <button onClick={() => navigate("/bookings")} className="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-lg font-semibold">Về lịch sử đặt sân</button>
                    </div>
               </div>
          </div>
     );

     return (
          <div className="min-h-screen bg-gray-50">
               {step === "details" && renderDetailsStep()}
               {step === "payment" && renderPaymentStep()}
               {step === "confirmation" && renderConfirmationStep()}
          </div>
     );
}

import { useState, useEffect } from "react";
import { Users, Star, MessageSquare, Calendar, MapPin, Clock, AlertCircle, UserPlus, Info } from "lucide-react";
import { Button, Modal, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea, Input } from "./ui/index";
import { createMatchRequestAPI } from "../services/matchRequest";
import { fetchFieldScheduleById } from "../services/fieldSchedules";
import { Link } from "react-router-dom";

export default function FindOpponentModal({
     isOpen,
     onClose,
     booking,
     user,
     onSuccess
}) {
     const [level, setLevel] = useState("Intermediate");
     const [note, setNote] = useState("");
     const [playerCount, setPlayerCount] = useState(booking?.playerCount || booking?.expectedPlayers || 7);
     const [expiresInHours, setExpiresInHours] = useState(24);
     const [termsAccepted, setTermsAccepted] = useState(false);
     const [isProcessing, setIsProcessing] = useState(false);
     const [errors, setErrors] = useState({});
     const [scheduleData, setScheduleData] = useState(null);
     const [isLoadingSchedule, setIsLoadingSchedule] = useState(false);

     // tính toán thời gian hết hạn dựa trên dữ liệu lịch sân
     const calculateExpiresInHours = (schedule) => {
          if (!schedule || !schedule.date || !schedule.startTime) {
               return 24;
          }

          try {
               const [year, month, day] = schedule.date.split('-').map(Number);
               if (!year || !month || !day) {
                    return 24;
               }

               const [hours, minutes] = schedule.startTime.split(':').map(Number);
               if (isNaN(hours) || isNaN(minutes)) {
                    return 24;
               }

               // tạo thời gian bắt đầu trận đấu
               const matchStartTime = new Date(year, month - 1, day, hours, minutes, 0, 0);

               if (isNaN(matchStartTime.getTime())) {
                    return 24;
               }

               // tính toán số giờ từ bây giờ đến lúc trận đấu bắt đầu
               const now = new Date();
               const hoursUntilMatch = (matchStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);

               // thời gian hết hạn là 12 giờ trước trận đấu
               const calculatedHours = Math.max(1, Math.floor(hoursUntilMatch - 12));

               // kiểm tra xem thời gian hết hạn có phải là quá ngắn (ít hơn 1 giờ) hoặc quá dài (hơn 168 giờ = 7 ngày)
               if (calculatedHours < 1) {
                    return 24;
               }
               if (calculatedHours > 168) {
                    return 168;
               }

               return calculatedHours;
          } catch (e) {
               console.error("Error calculating expiresInHours from schedule:", e);
               return 24;
          }
     };

     // lấy dữ liệu lịch sân khi modal mở
     useEffect(() => {
          if (!isOpen || !booking) return;

          if (booking.scheduleId) {
               setIsLoadingSchedule(true);
               fetchFieldScheduleById(booking.scheduleId)
                    .then(result => {
                         if (result.success && result.data) {
                              setScheduleData(result.data);
                              const calculatedHours = calculateExpiresInHours(result.data);
                              setExpiresInHours(calculatedHours);
                         } else {
                              console.warn("Could not fetch schedule data:", result.error);
                              setExpiresInHours(24);
                         }
                    })
                    .catch(error => {
                         console.error("Error fetching schedule:", error);
                         setExpiresInHours(24);
                    })
                    .finally(() => {
                         setIsLoadingSchedule(false);
                    });
          } else {
               const calculatedHours = calculateExpiresInHours({
                    date: booking.date,
                    startTime: booking.time?.split(' - ')[0] || booking.slotName?.split(' - ')[0] || "00:00"
               });
               setExpiresInHours(calculatedHours);
          }
     }, [isOpen, booking]);

     useEffect(() => {
          if (isOpen && booking) {
               setLevel("Intermediate");
               setNote("");
               setPlayerCount(booking?.playerCount || booking?.expectedPlayers || 7);
               setTermsAccepted(false);
               setErrors({});
               setScheduleData(null);
          }
     }, [isOpen, booking]);

     const handleSubmit = async () => {
          const newErrors = {};
          const trimmedNote = note?.trim() || "";
          if (!trimmedNote) {
               newErrors.note = "Vui lòng nhập ghi chú";
          } else if (trimmedNote.length < 10) {
               newErrors.note = "Ghi chú phải có ít nhất 10 ký tự";
          } else if (trimmedNote.length > 500) {
               newErrors.note = "Ghi chú không được quá 500 ký tự";
          }
          const numPlayerCount = Number(playerCount);
          if (!playerCount || isNaN(numPlayerCount)) {
               newErrors.playerCount = "Vui lòng nhập số người chơi";
          } else if (numPlayerCount < 1 || numPlayerCount > 22) {
               newErrors.playerCount = "Số người phải từ 1 đến 22";
          }
          if (!expiresInHours || expiresInHours < 1) {
               newErrors.expiresInHours = "Thời gian hết hạn không hợp lệ. Vui lòng kiểm tra lại lịch sân.";
          } else if (expiresInHours > 168) {
               newErrors.expiresInHours = "Thời gian hết hạn không được vượt quá 168 giờ (7 ngày)";
          }
          if (!termsAccepted) {
               newErrors.terms = "Bạn cần đồng ý quy tắc cộng đồng";
          }
          if (Object.keys(newErrors).length > 0) {
               setErrors(newErrors);
               return;
          }

          setIsProcessing(true);
          try {
               // tạo yêu cầu tìm đối
               const payload = {
                    bookingId: booking.bookingId || booking.id || 0,
                    description: note.trim(),
                    playerCount: Number(playerCount) || 7,
                    expiresInHours: Number(expiresInHours) || 24
               };

               const response = await createMatchRequestAPI(payload);

               if (!response.success) {
                    throw new Error(response.error || "Không thể tạo yêu cầu tìm đối");
               }

               onSuccess?.({
                    type: "single",
                    matchRequest: response.data,
                    booking
               });
          } catch (error) {
               console.error("Error creating match request:", error);
               setErrors({ general: error.message || "Không thể tạo yêu cầu tìm đối" });
          } finally {
               setIsProcessing(false);
          }
     };

     if (!isOpen || !booking) return null;

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title="Tìm đối thủ"
               className="max-w-2xl rounded-2xl max-h-[90vh] overflow-y-auto scrollbar-hide"
          >
               <div className="px-3">
                    {/* Header Info */}
                    <div className="mb-2 flex items-center gap-3">
                         <div className="p-2 bg-teal-100 rounded-xl">
                              <Users className="w-6 h-6 text-teal-600" />
                         </div>
                         <div>
                              <p className="text-base text-gray-700 font-semibold">
                                   Cho buổi đặt sân
                              </p>
                         </div>
                    </div>

                    {/* Booking Info */}
                    <div className="mb-6 mx-7 p-4 bg-teal-50 rounded-2xl border border-teal-200">
                         <div className="flex items-start gap-3">
                              <MapPin className="w-5 h-5 text-teal-600 mt-0.5" />
                              <div className="flex-1">
                                   <h4 className="font-medium text-teal-900 mb-1">
                                        {booking.fieldName}
                                   </h4>
                                   <div className="space-y-1 text-sm text-teal-600">
                                        <div className="flex items-center gap-2">
                                             <Calendar className="w-4 h-4" />
                                             <span>
                                                  {scheduleData && scheduleData.date ? (() => {
                                                       try {
                                                            const [year, month, day] = scheduleData.date.split('-').map(Number);
                                                            if (year && month && day) {
                                                                 const dateObj = new Date(year, month - 1, day);
                                                                 return dateObj.toLocaleDateString("vi-VN");
                                                            }
                                                       } catch (e) {
                                                            return scheduleData.date;
                                                       }
                                                       return scheduleData.date;
                                                  })() : booking.date}
                                             </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                             <Clock className="w-4 h-4" />
                                             <span>
                                                  {scheduleData && scheduleData.startTime && scheduleData.endTime ? (
                                                       `${scheduleData.startTime.split(':').slice(0, 2).join(':')} - ${scheduleData.endTime.split(':').slice(0, 2).join(':')}`
                                                  ) : (booking.slotName || booking.time)}
                                             </span>
                                        </div>
                                        {booking.fieldAddress && (
                                             <div className="flex items-center gap-2">
                                                  <MapPin className="w-4 h-4" />
                                                  <span>{booking.fieldAddress}</span>
                                             </div>
                                        )}
                                   </div>
                              </div>
                         </div>
                    </div>

                    {/* Error Message */}
                    {errors.general && (
                         <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
                              <AlertCircle className="w-5 h-5 text-red-500" />
                              <span className="text-red-700">{errors.general}</span>
                         </div>
                    )}

                    {/* Form */}
                    <div className="space-y-3">
                         {/* Skill Level */}
                         <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                   <Star className="w-4 h-4 text-yellow-500" />
                                   Mức độ đội <span className="text-red-500">*</span>
                              </label>
                              <Select value={level} onValueChange={setLevel}>
                                   <SelectTrigger className="w-full rounded-xl border border-gray-300 bg-white focus:ring-0 focus:border-teal-500">
                                        <SelectValue placeholder="Chọn mức độ" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="Beginner">
                                             <div className="flex items-center gap-2">
                                                  <Star className="w-4 h-4 text-green-500" />
                                                  <span>Beginner - Mới chơi</span>
                                             </div>
                                        </SelectItem>
                                        <SelectItem value="Intermediate">
                                             <div className="flex items-center gap-2">
                                                  <Star className="w-4 h-4 text-yellow-500" />
                                                  <span>Intermediate - Trung bình</span>
                                             </div>
                                        </SelectItem>
                                        <SelectItem value="Advanced">
                                             <div className="flex items-center gap-2">
                                                  <Star className="w-4 h-4 text-red-500" />
                                                  <span>Advanced - Nâng cao</span>
                                             </div>
                                        </SelectItem>
                                   </SelectContent>
                              </Select>
                         </div>

                         {/* Player Count */}
                         <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                   <Users className="w-4 h-4 text-blue-600" />
                                   Số người cần tìm <span className="text-red-500">*</span>
                              </label>
                              <div className="relative">
                                   <Input
                                        type="number"
                                        min="1"
                                        max="22"
                                        value={playerCount}
                                        onChange={(e) => {
                                             const value = parseInt(e.target.value) || 0;
                                             setPlayerCount(value);
                                             if (errors.playerCount) {
                                                  setErrors(prev => ({ ...prev, playerCount: "" }));
                                             }
                                        }}
                                        placeholder="Ví dụ: 5"
                                        className="w-full rounded-xl pl-10 pr-4 py-2.5 text-sm border-gray-300 focus:border-teal-500 focus:ring-2 focus:ring-teal-200"
                                   />
                                   <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                              </div>
                              {errors.playerCount && (
                                   <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.playerCount}
                                   </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">Số người bạn cần tìm để đủ đội hình (1-22 người)</p>
                         </div>

                         {/* Expires In Hours */}
                         <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                   <Clock className="w-4 h-4 text-orange-600" />
                                   Thời gian hết hạn <span className="text-red-500">*</span>
                              </label>
                              <Select
                                   value={(() => {
                                        // Check if current value matches auto-calculated value
                                        const autoValue = scheduleData
                                             ? calculateExpiresInHours(scheduleData)
                                             : (booking?.date ? calculateExpiresInHours({
                                                  date: booking.date,
                                                  startTime: booking.time?.split(' - ')[0] || booking.slotName?.split(' - ')[0] || "00:00"
                                             }) : 24);
                                        return expiresInHours === autoValue ? "auto" : String(expiresInHours);
                                   })()}
                                   onValueChange={(value) => {
                                        if (value === "auto") {
                                             // Tự động: tính từ schedule (12h trước trận đấu)
                                             if (scheduleData) {
                                                  const calculated = calculateExpiresInHours(scheduleData);
                                                  setExpiresInHours(calculated);
                                             } else if (booking?.date) {
                                                  const calculated = calculateExpiresInHours({
                                                       date: booking.date,
                                                       startTime: booking.time?.split(' - ')[0] || booking.slotName?.split(' - ')[0] || "00:00"
                                                  });
                                                  setExpiresInHours(calculated);
                                             } else {
                                                  setExpiresInHours(24); // Fallback
                                             }
                                        } else {
                                             setExpiresInHours(parseInt(value));
                                        }
                                        if (errors.expiresInHours) {
                                             setErrors(prev => ({ ...prev, expiresInHours: "" }));
                                        }
                                   }}
                              >
                                   <SelectTrigger className="w-full rounded-xl border border-gray-300 bg-white focus:ring-0 focus:border-teal-500">
                                        <SelectValue placeholder="Chọn thời gian hết hạn" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="auto">
                                             <div className="flex items-center gap-2">
                                                  <Clock className="w-4 h-4 text-teal-600" />
                                                  <span>Tự động </span>
                                                  {(() => {
                                                       const autoValue = scheduleData
                                                            ? calculateExpiresInHours(scheduleData)
                                                            : (booking?.date ? calculateExpiresInHours({
                                                                 date: booking.date,
                                                                 startTime: booking.time?.split(' - ')[0] || booking.slotName?.split(' - ')[0] || "00:00"
                                                            }) : 24);
                                                       return (
                                                            <span className="text-xs text-gray-500 ml-2">
                                                                 ({autoValue}h)
                                                            </span>
                                                       );
                                                  })()}
                                             </div>
                                        </SelectItem>
                                        <SelectItem value="12">
                                             <div className="flex items-center gap-2">
                                                  <Clock className="w-4 h-4 text-blue-600" />
                                                  <span>12 giờ</span>
                                             </div>
                                        </SelectItem>
                                        <SelectItem value="24">
                                             <div className="flex items-center gap-2">
                                                  <Clock className="w-4 h-4 text-green-600" />
                                                  <span>24 giờ (1 ngày)</span>
                                             </div>
                                        </SelectItem>
                                        <SelectItem value="48">
                                             <div className="flex items-center gap-2">
                                                  <Clock className="w-4 h-4 text-yellow-600" />
                                                  <span>48 giờ (2 ngày)</span>
                                             </div>
                                        </SelectItem>
                                        <SelectItem value="72">
                                             <div className="flex items-center gap-2">
                                                  <Clock className="w-4 h-4 text-orange-600" />
                                                  <span>72 giờ (3 ngày)</span>
                                             </div>
                                        </SelectItem>
                                        <SelectItem value="96">
                                             <div className="flex items-center gap-2">
                                                  <Clock className="w-4 h-4 text-red-600" />
                                                  <span>96 giờ (4 ngày)</span>
                                             </div>
                                        </SelectItem>
                                        <SelectItem value="120">
                                             <div className="flex items-center gap-2">
                                                  <Clock className="w-4 h-4 text-purple-600" />
                                                  <span>120 giờ (5 ngày)</span>
                                             </div>
                                        </SelectItem>
                                        <SelectItem value="144">
                                             <div className="flex items-center gap-2">
                                                  <Clock className="w-4 h-4 text-indigo-600" />
                                                  <span>144 giờ (6 ngày)</span>
                                             </div>
                                        </SelectItem>
                                        <SelectItem value="168">
                                             <div className="flex items-center gap-2">
                                                  <Clock className="w-4 h-4 text-pink-600" />
                                                  <span>168 giờ (7 ngày)</span>
                                             </div>
                                        </SelectItem>
                                   </SelectContent>
                              </Select>
                              {errors.expiresInHours && (
                                   <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.expiresInHours}
                                   </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                   {isLoadingSchedule ? (
                                        "Đang tải thông tin lịch sân..."
                                   ) : scheduleData ? (
                                        <>
                                             {(() => {
                                                  // Format date từ schedule (giống BookingHistory)
                                                  let formattedDate = scheduleData.date;
                                                  try {
                                                       const [year, month, day] = scheduleData.date.split('-').map(Number);
                                                       if (year && month && day) {
                                                            const dateObj = new Date(year, month - 1, day);
                                                            formattedDate = dateObj.toLocaleDateString("vi-VN");
                                                       }
                                                  } catch (e) {
                                                       // Keep original
                                                  }

                                                  // Format time từ schedule
                                                  const formattedTime = scheduleData.startTime && scheduleData.endTime
                                                       ? `${scheduleData.startTime.split(':').slice(0, 2).join(':')} - ${scheduleData.endTime.split(':').slice(0, 2).join(':')}`
                                                       : "";

                                                  const autoValue = calculateExpiresInHours(scheduleData);

                                                  return expiresInHours === autoValue ? (
                                                       `Tự động: Yêu cầu sẽ hết hạn trước 12 giờ so với thời gian bắt đầu trận đấu (${formattedDate} ${formattedTime})`
                                                  ) : (
                                                       `Yêu cầu sẽ hết hạn sau ${expiresInHours} giờ (${Math.floor(expiresInHours / 24)} ngày ${expiresInHours % 24} giờ)`
                                                  );
                                             })()}
                                        </>
                                   ) : (
                                        `Yêu cầu sẽ hết hạn sau ${expiresInHours} giờ (${Math.floor(expiresInHours / 24)} ngày ${expiresInHours % 24} giờ)`
                                   )}
                              </p>
                         </div>

                         {/* Note */}
                         <div>
                              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                   <MessageSquare className="w-4 h-4 text-green-600" />
                                   Ghi chú <span className="text-red-500">*</span>
                              </label>
                              <Textarea
                                   value={note}
                                   onChange={(e) => {
                                        setNote(e.target.value);
                                        if (errors.note) {
                                             setErrors(prev => ({ ...prev, note: "" }));
                                        }
                                   }}
                                   placeholder="Ví dụ: Ưu tiên fair-play, mang áo đậm màu, có thể đá 7 người..."
                                   className="min-h-[100px] max-h-[150px] overflow-y-auto rounded-xl p-2 focus:ring-0 focus:border-teal-500"
                              />
                              {errors.note && (
                                   <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.note}
                                   </p>
                              )}
                         </div>

                         {/* Terms */}
                         <div>
                              <label className="flex items-center gap-2 cursor-pointer">
                                   <input
                                        type="checkbox"
                                        checked={termsAccepted}
                                        onChange={(e) => {
                                             setTermsAccepted(e.target.checked);
                                             if (errors.terms) {
                                                  setErrors(prev => ({ ...prev, terms: "" }));
                                             }
                                        }}
                                        className=" w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-0 focus:border-teal-500"
                                   />
                                   <div className="text-sm text-gray-700">
                                        <span className="text-red-500">*</span> Tôi đồng ý với{" "}
                                        <Link to="/terms" className="text-teal-600 hover:underline">
                                             quy tắc cộng đồng
                                        </Link>{" "}
                                        và cam kết tuân thủ fair-play
                                   </div>
                              </label>
                              {errors.terms && (
                                   <p className="text-red-500 mt-1 mx-7 text-sm flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {errors.terms}
                                   </p>
                              )}
                         </div>

                         {/* Removed: Recurring Notice - recurring opponent feature */}
                    </div>

                    {/* Info Box */}
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2">
                         <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                         <div className="text-sm text-blue-800">
                              <p className="font-medium mb-1">Thông tin yêu cầu</p>
                              <ul className="list-disc list-inside space-y-1 text-xs">
                                   <li>Yêu cầu sẽ được hiển thị trong mục "Tìm đối thủ"</li>
                                   <li>Người chơi khác có thể xem và tham gia yêu cầu của bạn</li>
                                   {expiresInHours === calculateExpiresInHours(scheduleData || { date: booking?.date, startTime: booking?.time?.split(' - ')[0] || "00:00" }) ? (
                                        <li>Yêu cầu sẽ tự động hết hạn trước 12 giờ so với thời gian bắt đầu trận đấu</li>
                                   ) : (
                                        <li>Yêu cầu sẽ hết hạn sau {expiresInHours} giờ ({Math.floor(expiresInHours / 24)} ngày {expiresInHours % 24} giờ)</li>
                                   )}
                                   {expiresInHours === calculateExpiresInHours(scheduleData || { date: booking?.date, startTime: booking?.time?.split(' - ')[0] || "00:00" }) && (
                                        <li>Thời gian hết hạn tự động: {expiresInHours} giờ ({Math.floor(expiresInHours / 24)} ngày {expiresInHours % 24} giờ)</li>
                                   )}
                              </ul>
                         </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 mt-5">
                         <Button
                              variant="outline"
                              onClick={onClose}
                              disabled={isProcessing}
                              className="rounded-2xl px-6 py-2.5 text-sm font-medium border-gray-300 hover:bg-gray-50 transition-colors"
                         >
                              Hủy
                         </Button>
                         <Button
                              onClick={handleSubmit}
                              disabled={isProcessing}
                              className="bg-gradient-to-r from-teal-600 to-teal-700 hover:from-teal-700 hover:to-teal-800 text-white rounded-2xl px-6 py-2.5 text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                         >
                              {isProcessing ? (
                                   <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Đang xử lý...</span>
                                   </div>
                              ) : (
                                   <div className="flex items-center gap-2">
                                        <UserPlus className="w-4 h-4" />
                                        <span>Gửi yêu cầu tìm đối</span>
                                   </div>
                              )}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
}

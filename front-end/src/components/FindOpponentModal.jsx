import { useState, useEffect } from "react";
import { Users, Star, MessageSquare, Calendar, MapPin, Clock, CheckCircle, AlertCircle, X } from "lucide-react";
import { Button, Modal, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Textarea } from "./ui/index";
import { createMatchRequest, createCommunityPost } from "../utils/communityStore";

export default function FindOpponentModal({
     isOpen,
     onClose,
     booking,
     user,
     onSuccess
}) {
     const [level, setLevel] = useState("Intermediate");
     const [note, setNote] = useState("");
     const [termsAccepted, setTermsAccepted] = useState(false);
     const [isProcessing, setIsProcessing] = useState(false);
     const [errors, setErrors] = useState({});

     // Reset form when modal opens
     useEffect(() => {
          if (isOpen) {
               setLevel("Intermediate");
               setNote("");
               setTermsAccepted(false);
               setErrors({});
          }
     }, [isOpen]);

     const handleSubmit = async () => {
          // Validation
          const newErrors = {};
          if (!note.trim()) {
               newErrors.note = "Vui lòng nhập ghi chú";
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
               // Check if this is a recurring booking
               const isRecurring = booking.isRecurring && booking.recurringGroupId;

               if (isRecurring) {
                    // For recurring bookings, show the RecurringOpponentSelection modal
                    // This will be handled by the parent component
                    onSuccess({
                         type: "recurring",
                         booking,
                         level,
                         note,
                         termsAccepted
                    });
               } else {
                    // Create match request for single booking
                    const matchRequest = createMatchRequest({
                         bookingId: booking.id,
                         ownerId: user?.id,
                         level,
                         note: note.trim(),
                         fieldName: booking.fieldName,
                         address: booking.fieldAddress || booking.address || "",
                         date: booking.date,
                         slotName: booking.slotName || booking.time || "",
                         price: booking.price || 0,
                         createdByName: user?.name || "Người dùng"
                    });

                    // Create community post
                    createCommunityPost({
                         userId: user?.id,
                         content: `Tìm đối – ${booking.fieldName}`,
                         location: booking.fieldAddress || booking.address || "",
                         time: `${booking.date} ${booking.slotName || booking.time || ""}`.trim(),
                         authorName: user?.name || "Người dùng",
                         bookingId: booking.id,
                         fieldName: booking.fieldName,
                         date: booking.date,
                         slotName: booking.slotName || booking.time || ""
                    });

                    onSuccess({
                         type: "single",
                         matchRequest,
                         booking
                    });
               }
          } catch (error) {
               console.error("Error creating match request:", error);
               setErrors({ general: error.message || "Không thể tạo yêu cầu tìm đối" });
          } finally {
               setIsProcessing(false);
          }
     };

     if (!isOpen || !booking) return null;

     const isRecurring = booking.isRecurring && booking.recurringGroupId;

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title="Tìm đối thủ"
               className="max-w-2xl rounded-2xl"
          >
               <div className="px-3">
                    {/* Header Info */}
                    <div className="mb-2 flex items-center gap-3">
                         <div className="p-2 bg-teal-100 rounded-xl">
                              <Users className="w-6 h-6 text-teal-600" />
                         </div>
                         <div>
                              <p className="text-base text-gray-700 font-semibold">
                                   {isRecurring ? "Cho lịch cố định" : "Cho buổi đặt sân"}
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
                                             <span>{booking.date}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                             <Clock className="w-4 h-4" />
                                             <span>{booking.slotName || booking.time}</span>
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
                                        <a href="/terms" className="text-teal-600 hover:underline">
                                             quy tắc cộng đồng
                                        </a>{" "}
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

                         {/* Recurring Notice */}
                         {isRecurring && (
                              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                   <div className="flex items-start gap-2">
                                        <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                                        <div className="text-sm text-blue-800">
                                             <p className="font-medium mb-1">Lịch cố định</p>
                                             <p>
                                                  Bạn sẽ được chọn cách tìm đối thủ cho toàn bộ lịch cố định sau khi xác nhận.
                                             </p>
                                        </div>
                                   </div>
                              </div>
                         )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end mt-5">
                         <Button
                              onClick={handleSubmit}
                              disabled={isProcessing}
                              className="bg-teal-600 hover:bg-teal-700 rounded-2xl flex items-center gap-2"
                         >
                              {isProcessing ? (
                                   <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Đang xử lý...</span>
                                   </div>
                              ) : (
                                   <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Gửi yêu cầu</span>
                                   </div>
                              )}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
}

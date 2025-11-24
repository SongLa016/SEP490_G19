import { useState, useEffect } from "react";
import { Star, MessageSquare, CheckCircle, AlertCircle, MapPin, Calendar, Clock } from "lucide-react";
import { Button, Textarea, Modal } from "./ui/index";
import { updateBooking } from "../utils/bookingStore";

export default function RatingModal({
     isOpen,
     onClose,
     booking,
     onSuccess
}) {
     const [rating, setRating] = useState(0);
     const [hoveredRating, setHoveredRating] = useState(0);
     const [comment, setComment] = useState("");
     const [isProcessing, setIsProcessing] = useState(false);
     const [errors, setErrors] = useState({});

     // Reset form when modal opens
     useEffect(() => {
          if (isOpen) {
               setRating(0);
               setHoveredRating(0);
               setComment("");
               setErrors({});
          }
     }, [isOpen]);

     const handleSubmit = async () => {
          // Validation
          const newErrors = {};
          if (rating === 0) {
               newErrors.rating = "Vui lòng chọn số sao đánh giá";
          }
          if (!comment.trim()) {
               newErrors.comment = "Vui lòng nhập nhận xét";
          }

          if (Object.keys(newErrors).length > 0) {
               setErrors(newErrors);
               return;
          }

          setIsProcessing(true);
          try {
               await updateBooking(booking.id, {
                    rating,
                    comment: comment.trim(),
                    ratedAt: new Date().toISOString()
               });

               onSuccess({
                    rating,
                    comment: comment.trim()
               });
          } catch (error) {
               console.error("Error updating rating:", error);
               setErrors({ general: error.message || "Không thể gửi đánh giá" });
          } finally {
               setIsProcessing(false);
          }
     };

     const renderStars = () => {
          return [1, 2, 3, 4, 5].map((star) => (
               <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className={`w-10 h-10 rounded-full transition-all duration-200 ${star <= (hoveredRating || rating)
                         ? "bg-yellow-100 text-yellow-500"
                         : "bg-white text-gray-400 hover:bg-yellow-100"
                         }`}
               >
                    <Star className={`w-5 h-5 mx-auto ${star <= (hoveredRating || rating) ? "fill-current" : ""
                         }`} />
               </button>
          ));
     };

     const getRatingText = (rating) => {
          switch (rating) {
               case 1: return "Rất tệ";
               case 2: return "Tệ";
               case 3: return "Bình thường";
               case 4: return "Tốt";
               case 5: return "Rất tốt";
               default: return "";
          }
     };

     if (!isOpen || !booking) return null;

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title="Đánh giá sân"
               className="max-w-2xl rounded-2xl"
          >
               <div className="px-3">
                    {/* Booking Info */}
                    <div className="mb-3 p-4 bg-yellow-50 rounded-2xl border border-yellow-200">
                         <div className="flex items-start gap-3">
                              <div className="p-2 bg-yellow-100 rounded-xl">
                                   <Star className="w-5 h-5 text-yellow-600" />
                              </div>
                              <div className="flex-1">
                                   <h4 className="font-medium text-gray-900 mb-2">
                                        {booking.fieldName}
                                   </h4>
                                   <div className="space-y-1 text-sm text-gray-600">
                                        {booking.fieldAddress && (
                                             <div className="flex items-center gap-2">
                                                  <MapPin className="w-4 h-4 text-yellow-600" />
                                                  <span className="text-yellow-600 underline cursor-pointer" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${booking.fieldAddress}`, '_blank')}>{booking.fieldAddress}</span>
                                             </div>
                                        )}
                                        <div className="flex items-center gap-2">
                                             <Calendar className="w-4 h-4 text-blue-600" />
                                             <span>{booking.date}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                             <Clock className="w-4 h-4 text-purple-600" />
                                             <span>{booking.slotName || booking.time}</span>
                                        </div>
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

                    {/* Rating Section */}
                    <div className="mb-3">
                         <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                              <Star className="w-4 h-4 text-yellow-500" />
                              Đánh giá sao <span className="text-red-500">*</span>
                         </label>
                         <div className="flex items-center gap-3">
                              <div className="flex gap-2">
                                   {renderStars()}
                              </div>
                              {rating > 0 && (
                                   <div className="text-sm text-gray-600">
                                        <span className="font-medium">{getRatingText(rating)}</span>
                                   </div>
                              )}
                         </div>
                         {errors.rating && (
                              <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
                                   <AlertCircle className="w-3 h-3" />
                                   {errors.rating}
                              </p>
                         )}
                    </div>

                    {/* Comment Section */}
                    <div className="mb-3">
                         <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                              <MessageSquare className="w-4 h-4 text-green-600" />
                              Nhận xét <span className="text-red-500">*</span>
                         </label>
                         <Textarea
                              value={comment}
                              onChange={(e) => {
                                   setComment(e.target.value);
                                   if (errors.comment) {
                                        setErrors(prev => ({ ...prev, comment: "" }));
                                   }
                              }}
                              placeholder="Chia sẻ trải nghiệm của bạn về sân bóng này..."
                              className="min-h-[70px] max-h-[120px] overflow-y-auto rounded-xl p-2 focus:ring-0 focus:border-teal-500"
                         />
                         {errors.comment && (
                              <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                   <AlertCircle className="w-3 h-3" />
                                   {errors.comment}
                              </p>
                         )}
                    </div>

                    {/* Tips */}
                    <div className="mb-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                         <div className="flex items-start gap-2">
                              <MessageSquare className="w-5 h-5 text-blue-600 mt-0.5" />
                              <div className="text-sm text-blue-800">
                                   <p className="font-medium mb-1">Gợi ý đánh giá:</p>
                                   <ul className="space-y-1 text-xs">
                                        <li>• Chất lượng mặt sân và thiết bị</li>
                                        <li>• Dịch vụ và thái độ nhân viên</li>
                                        <li>• Giá cả và giá trị nhận được</li>
                                        <li>• Môi trường và không gian</li>
                                   </ul>
                              </div>
                         </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end">
                         <Button
                              onClick={handleSubmit}
                              disabled={isProcessing || rating === 0}
                              className="bg-yellow-600 hover:bg-yellow-700 flex items-center gap-2"
                         >
                              {isProcessing ? (
                                   <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Đang gửi...</span>
                                   </div>
                              ) : (
                                   <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Gửi đánh giá</span>
                                   </div>
                              )}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
}

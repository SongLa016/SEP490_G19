import { useState, useEffect } from "react";
import { Calendar, Clock, AlertCircle, CheckCircle, MapPin, DollarSign, CalendarDays } from "lucide-react";
import { Button, Modal, DatePicker } from "./ui/index";
import { updateBooking } from "../utils/bookingStore";

export default function RescheduleModal({
     isOpen,
     onClose,
     booking,
     onSuccess
}) {
     const [selectedDate, setSelectedDate] = useState("");
     const [selectedSlot, setSelectedSlot] = useState("");
     const [availableSlots, setAvailableSlots] = useState([]);
     const [isProcessing, setIsProcessing] = useState(false);
     const [errors, setErrors] = useState({});
     const [isLoadingSlots, setIsLoadingSlots] = useState(false);

     // Reset form when modal opens
     useEffect(() => {
          if (isOpen) {
               setSelectedDate("");
               setSelectedSlot("");
               setAvailableSlots([]);
               setErrors({});
          }
     }, [isOpen]);

     // Mock function to get available slots - replace with actual API call
     const fetchAvailableSlots = async (date) => {
          setIsLoadingSlots(true);
          try {
               // Simulate API call delay
               await new Promise(resolve => setTimeout(resolve, 1000));

               // Mock data - replace with actual API call
               const mockSlots = [
                    { id: "slot1", name: "06:00 - 07:00", price: 200000, available: true },
                    { id: "slot2", name: "07:00 - 08:00", price: 250000, available: true },
                    { id: "slot3", name: "08:00 - 09:00", price: 300000, available: false },
                    { id: "slot4", name: "17:00 - 18:00", price: 350000, available: true },
                    { id: "slot5", name: "18:00 - 19:00", price: 400000, available: true },
                    { id: "slot6", name: "19:00 - 20:00", price: 450000, available: true },
               ];

               setAvailableSlots(mockSlots.filter(slot => slot.available));
          } catch (error) {
               console.error("Error fetching slots:", error);
               setErrors({ slots: "Không thể tải danh sách khung giờ" });
          } finally {
               setIsLoadingSlots(false);
          }
     };

     // Handle date change
     const handleDateChange = (date) => {
          setSelectedDate(date);
          setSelectedSlot("");
          if (date) {
               fetchAvailableSlots(date);
          }
     };

     const handleSubmit = async () => {
          // Validation
          const newErrors = {};
          if (!selectedDate) {
               newErrors.date = "Vui lòng chọn ngày mới";
          }
          if (!selectedSlot) {
               newErrors.slot = "Vui lòng chọn khung giờ mới";
          }

          if (Object.keys(newErrors).length > 0) {
               setErrors(newErrors);
               return;
          }

          setIsProcessing(true);
          try {
               const selectedSlotData = availableSlots.find(slot => slot.id === selectedSlot);

               await updateBooking(booking.id, {
                    date: selectedDate,
                    slotId: selectedSlot,
                    slotName: selectedSlotData?.name || "",
                    price: selectedSlotData?.price || booking.price,
                    rescheduledAt: new Date().toISOString(),
                    rescheduledFrom: {
                         date: booking.date,
                         slotId: booking.slotId,
                         slotName: booking.slotName || booking.time
                    }
               });

               onSuccess({
                    newDate: selectedDate,
                    newSlot: selectedSlotData,
                    oldDate: booking.date,
                    oldSlot: booking.slotName || booking.time
               });
          } catch (error) {
               console.error("Error rescheduling booking:", error);
               setErrors({ general: error.message || "Không thể đổi giờ" });
          } finally {
               setIsProcessing(false);
          }
     };

     const formatPrice = (price) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

     if (!isOpen || !booking) return null;

     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title="Đổi giờ đặt sân"
               className="max-w-2xl rounded-2xl"
          >
               <div className="p-1">
                    {/* Current Booking Info */}
                    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                         <div className="flex items-start gap-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                   <CalendarDays className="w-5 h-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                   <h4 className="font-medium text-gray-900 mb-2">
                                        Lịch hiện tại
                                   </h4>
                                   <div className="space-y-2 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                             <MapPin className="w-4 h-4 text-teal-600" />
                                             <span>Sân: {booking.fieldName} - <span className="text-gray-500 underline cursor-pointer" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${booking.fieldAddress}`, '_blank')}>{booking.fieldAddress}</span></span>
                                        </div>
                                        <div className="flex items-center w-1/2 justify-between gap-2">
                                             <div className="flex items-center gap-2">
                                                  <Calendar className="w-4 h-4 text-blue-600" />
                                                  <span>{booking.date}</span>
                                             </div>
                                             <div className="flex items-center gap-2">
                                                  <Clock className="w-4 h-4 text-purple-600" />
                                                  <span>{booking.slotName || booking.time}</span>
                                             </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                             <DollarSign className="w-4 h-4 text-orange-600" />
                                             <span className="text-orange-600 font-medium"> Giá: {formatPrice(booking.price)}/ trận</span>
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

                    {/* Two Column Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                         {/* Left Column - Date Selection */}
                         <div className="space-y-4">
                              <div className="">
                                   <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        Chọn ngày mới <span className="text-red-500">*</span>
                                   </label>
                                   <DatePicker
                                        value={selectedDate}
                                        onChange={handleDateChange}
                                        placeholder="Chọn ngày đặt sân"
                                        minDate={new Date().toISOString().split('T')[0]}
                                        className="w-full"
                                   />
                                   {errors.date && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                             <AlertCircle className="w-3 h-3" />
                                             {errors.date}
                                        </p>
                                   )}
                              </div>

                              {/* Price Difference Notice */}
                              {selectedSlot && (
                                   <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-start gap-2 text-blue-800">
                                             <DollarSign className="w-5 h-5 text-blue-600 mt-0.5" />
                                             <div className="text-sm">
                                                  <p className="font-medium mb-2">Thông tin giá:</p>
                                                  <div className="space-y-1">
                                                       <div className="flex items-center gap-2">
                                                            <span className="text-gray-600">Giá cũ:</span>
                                                            <span className="line-through text-gray-500">{formatPrice(booking.price)}</span>
                                                       </div>
                                                       <div className="flex items-center gap-2">
                                                            <span className="text-gray-600">Giá mới:</span>
                                                            <span className="font-medium text-blue-700">{formatPrice(availableSlots.find(s => s.id === selectedSlot)?.price || 0)}</span>
                                                       </div>
                                                  </div>
                                             </div>
                                        </div>
                                   </div>
                              )}
                         </div>

                         {/* Right Column - Slot Selection */}
                         <div className="space-y-4">
                              <div>
                                   <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                                        <Clock className="w-4 h-4 text-purple-600" />
                                        Chọn khung giờ mới <span className="text-red-500">*</span>
                                   </label>

                                   {isLoadingSlots ? (
                                        <div className="p-4 border border-gray-200 rounded-lg text-center">
                                             <div className="flex items-center justify-center gap-2 text-gray-600">
                                                  <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                                  <span>Đang tải khung giờ...</span>
                                             </div>
                                        </div>
                                   ) : availableSlots.length > 0 ? (
                                        <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
                                             {availableSlots.map((slot) => (
                                                  <Button
                                                       variant="outline"
                                                       key={slot.id}
                                                       onClick={() => setSelectedSlot(slot.id)}
                                                       className={`p-3 text-left rounded-lg transition-all ${selectedSlot === slot.id
                                                            ? "bg-teal-50 text-teal-700"
                                                            : "hover:text-teal-600 hover:bg-teal-100"
                                                            }`}
                                                  >
                                                       <div className="flex items-center justify-between w-full">
                                                            <div className="flex items-center gap-2">
                                                                 <Clock className="w-4 h-4" />
                                                                 <span className="font-medium">{slot.name}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                 <DollarSign className="w-3 h-3 text-red-600" />
                                                                 <span className="text-sm font-medium text-red-600">
                                                                      {formatPrice(slot.price)}
                                                                 </span>
                                                            </div>
                                                       </div>
                                                  </Button>
                                             ))}
                                        </div>
                                   ) : selectedDate ? (
                                        <div className="p-4 border border-gray-200 rounded-lg text-center text-gray-500 flex items-center justify-center gap-2">
                                             <AlertCircle className="w-4 h-4" />
                                             <span>Không có khung giờ trống cho ngày này</span>
                                        </div>
                                   ) : (
                                        <div className="p-4 border border-gray-200 rounded-lg text-center text-red-600 flex items-center justify-center gap-2">
                                             <Calendar className="w-4 h-4" />
                                             <span>Vui lòng chọn ngày trước</span>
                                        </div>
                                   )}

                                   {errors.slot && (
                                        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                                             <AlertCircle className="w-3 h-3" />
                                             {errors.slot}
                                        </p>
                                   )}
                              </div>
                         </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end mt-6">
                         <Button
                              onClick={handleSubmit}
                              disabled={isProcessing || !selectedDate || !selectedSlot}
                              className="bg-blue-600 hover:bg-blue-700 flex rounded-xl items-center gap-2"
                         >
                              {isProcessing ? (
                                   <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                        <span>Đang xử lý...</span>
                                   </div>
                              ) : (
                                   <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Xác nhận đổi giờ</span>
                                   </div>
                              )}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
}

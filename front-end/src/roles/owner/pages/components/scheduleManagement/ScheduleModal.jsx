import { Modal, DatePicker, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Button, Alert, AlertDescription } from "../../../../../shared/components/ui";
import { Info, Save, Loader2 } from "lucide-react";

export default function ScheduleModal({
     isOpen,
     onClose,
     scheduleFormData,
     onFormDataChange,
     scheduleFormErrors,
     fields,
     timeSlots,
     formatTime,
     isSubmitting,
     onSubmit
}) {
     const isFieldLocked = (field) => (field.status || field.Status || '').toLowerCase() === 'maintenance';
     const selectableFields = fields.filter(field => !isFieldLocked(field));
     const creationLocked = selectableFields.length === 0;
     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title="Thêm lịch trình mới"
               size="lg"
          >
               <form onSubmit={onSubmit} className="space-y-4">
                    {creationLocked && (
                         <Alert className="border-orange-200 bg-orange-50">
                              <AlertDescription className="text-orange-900 text-sm">
                                   Tất cả các sân đang ở trạng thái <strong>Bảo trì</strong>. Không thể tạo lịch trình mới cho đến khi có ít nhất một sân Active.
                              </AlertDescription>
                         </Alert>
                    )}
                    {/* Field Selection */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              Chọn sân <span className="text-red-500">*</span>
                         </label>
                         <Select
                              value={scheduleFormData.fieldId}
                              onValueChange={(value) => {
                                   onFormDataChange({ ...scheduleFormData, fieldId: value });
                              }}
                         >
                              <SelectTrigger className={`w-full ${scheduleFormErrors.fieldId ? 'border-red-500' : ''}`}>
                                   <SelectValue placeholder="-- Chọn sân --" />
                              </SelectTrigger>
                              <SelectContent>
                                   {fields.map((field) => {
                                        const locked = isFieldLocked(field);
                                        return (
                                             <SelectItem
                                                  key={field.fieldId}
                                                  value={field.fieldId.toString()}
                                                  disabled={locked}
                                             >
                                                  {field.name} ({field.complexName}) {locked ? '— Bảo trì' : ''}
                                             </SelectItem>
                                        );
                                   })}
                              </SelectContent>
                         </Select>
                         {scheduleFormErrors.fieldId && (
                              <p className="text-xs text-red-600 mt-1">{scheduleFormErrors.fieldId}</p>
                         )}
                         {!creationLocked && (
                              <p className="text-xs text-gray-500 mt-1">
                                   Các sân đang ở trạng thái <strong>Bảo trì</strong> sẽ bị vô hiệu hóa.
                              </p>
                         )}
                    </div>

                    {/* Slot Selection */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              Chọn slot <span className="text-red-500">*</span>
                         </label>
                         <Select
                              value={scheduleFormData.slotId}
                              onValueChange={(value) => {
                                   onFormDataChange({ ...scheduleFormData, slotId: value });
                              }}
                              disabled={!scheduleFormData.fieldId}
                         >
                              <SelectTrigger className={`w-full ${scheduleFormErrors.slotId ? 'border-red-500' : ''}`}>
                                   <SelectValue placeholder={scheduleFormData.fieldId ? "-- Chọn slot --" : "Vui lòng chọn sân trước"} />
                              </SelectTrigger>
                              <SelectContent>
                                   {timeSlots
                                        .filter(slot => {
                                             // Filter slots by field if field is selected
                                             if (scheduleFormData.fieldId) {
                                                  const slotFieldId = slot.fieldId || slot.FieldId;
                                                  return !slotFieldId || slotFieldId.toString() === scheduleFormData.fieldId;
                                             }
                                             return true;
                                        })
                                        .map((slot) => {
                                             const slotId = slot.slotId || slot.SlotID;
                                             const slotName = slot.slotName || slot.SlotName || slot.name || 'N/A';
                                             const startTime = formatTime(slot.startTime || slot.StartTime || '00:00');
                                             const endTime = formatTime(slot.endTime || slot.EndTime || '00:00');

                                             return (
                                                  <SelectItem key={slotId} value={slotId.toString()}>
                                                       {slotName} ({startTime} - {endTime})
                                                  </SelectItem>
                                             );
                                        })}
                              </SelectContent>
                         </Select>
                         {scheduleFormErrors.slotId && (
                              <p className="text-xs text-red-600 mt-1">{scheduleFormErrors.slotId}</p>
                         )}
                         {!scheduleFormData.fieldId && (
                              <p className="text-xs text-gray-500 mt-1">Vui lòng chọn sân trước để xem danh sách slot</p>
                         )}
                    </div>

                    {/* Date Selection */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              Chọn ngày <span className="text-red-500">*</span>
                         </label>
                         <DatePicker
                              value={scheduleFormData.date}
                              onChange={(date) => {
                                   onFormDataChange({ ...scheduleFormData, date });
                              }}
                              className={scheduleFormErrors.date ? 'border-red-500' : ''}
                              minDate={new Date()} // Không cho chọn ngày quá khứ
                              placeholder="Chọn ngày"
                              fromYear={new Date().getFullYear()}
                              toYear={new Date().getFullYear() + 2}
                         />
                         {scheduleFormErrors.date && (
                              <p className="text-xs text-red-600 mt-1">{scheduleFormErrors.date}</p>
                         )}
                    </div>

                    {/* Status Selection */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              Trạng thái
                         </label>
                         <Select
                              value={scheduleFormData.status}
                              onValueChange={(value) => {
                                   onFormDataChange({ ...scheduleFormData, status: value });
                              }}
                         >
                              <SelectTrigger className="w-full">
                                   <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="Available">Available</SelectItem>
                                   <SelectItem value="Booked">Booked</SelectItem>
                                   <SelectItem value="Maintenance">Maintenance</SelectItem>
                              </SelectContent>
                         </Select>
                    </div>

                    {/* Info Alert */}
                    {scheduleFormData.fieldId && scheduleFormData.slotId && scheduleFormData.date && (
                         <Alert className="border-blue-200 bg-blue-50">
                              <Info className="h-4 w-4 text-blue-600" />
                              <AlertDescription className="text-blue-800 text-sm">
                                   Bạn đang tạo lịch trình cho ngày <strong>{new Date(scheduleFormData.date).toLocaleDateString('vi-VN')}</strong>
                              </AlertDescription>
                         </Alert>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                         <Button
                              type="button"
                              variant="outline"
                              onClick={onClose}
                              disabled={isSubmitting}
                         >
                              Hủy
                         </Button>
                         <Button
                              type="submit"
                              className="bg-teal-600 hover:bg-teal-700 text-white"
                              disabled={isSubmitting || creationLocked}
                         >
                              {isSubmitting ? (
                                   <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang tạo...
                                   </>
                              ) : (
                                   <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Tạo lịch trình
                                   </>
                              )}
                         </Button>
                    </div>
               </form>
          </Modal>
     );
}


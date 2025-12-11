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

     const scheduleType = scheduleFormData.scheduleType || 'single';
     const currentYear = new Date().getFullYear();
     const years = Array.from({ length: 3 }, (_, i) => currentYear + i);
     const months = [
          { value: 1, label: 'Tháng 1' },
          { value: 2, label: 'Tháng 2' },
          { value: 3, label: 'Tháng 3' },
          { value: 4, label: 'Tháng 4' },
          { value: 5, label: 'Tháng 5' },
          { value: 6, label: 'Tháng 6' },
          { value: 7, label: 'Tháng 7' },
          { value: 8, label: 'Tháng 8' },
          { value: 9, label: 'Tháng 9' },
          { value: 10, label: 'Tháng 10' },
          { value: 11, label: 'Tháng 11' },
          { value: 12, label: 'Tháng 12' }
     ];
     const quarters = [
          { value: 1, label: 'Quý 1 (Tháng 1-3)' },
          { value: 2, label: 'Quý 2 (Tháng 4-6)' },
          { value: 3, label: 'Quý 3 (Tháng 7-9)' },
          { value: 4, label: 'Quý 4 (Tháng 10-12)' }
     ];

     // Get days count for month/quarter
     const getDaysInMonth = (year, month) => {
          return new Date(year, month, 0).getDate();
     };

     const getDaysInQuarter = (year, quarter) => {
          const startMonth = (quarter - 1) * 3 + 1;
          let totalDays = 0;
          for (let m = startMonth; m < startMonth + 3; m++) {
               totalDays += getDaysInMonth(year, m);
          }
          return totalDays;
     };

     const getScheduleCount = () => {
          if (scheduleType === 'single') return 1;
          if (scheduleType === 'month' && scheduleFormData.month && scheduleFormData.year) {
               return getDaysInMonth(Number(scheduleFormData.year), Number(scheduleFormData.month));
          }
          if (scheduleType === 'quarter' && scheduleFormData.quarter && scheduleFormData.year) {
               return getDaysInQuarter(Number(scheduleFormData.year), Number(scheduleFormData.quarter));
          }
          return 0;
     };

     const scheduleCount = getScheduleCount();
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

                    {/* Schedule Type Selection */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              Loại lịch trình <span className="text-red-500">*</span>
                         </label>
                         <Select
                              value={scheduleType}
                              onValueChange={(value) => {
                                   onFormDataChange({
                                        ...scheduleFormData,
                                        scheduleType: value,
                                        date: value === 'single' ? scheduleFormData.date : '',
                                        month: value === 'month' ? scheduleFormData.month : '',
                                        quarter: value === 'quarter' ? scheduleFormData.quarter : '',
                                        year: value !== 'single' ? scheduleFormData.year : ''
                                   });
                              }}
                         >
                              <SelectTrigger className="w-full">
                                   <SelectValue placeholder="-- Chọn loại lịch trình --" />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="single">Theo ngày</SelectItem>
                                   <SelectItem value="month">Theo tháng</SelectItem>
                                   <SelectItem value="quarter">Theo quý</SelectItem>
                              </SelectContent>
                         </Select>
                    </div>

                    {/* Date Selection - Single Date */}
                    {scheduleType === 'single' && (
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
                    )}

                    {/* Month Selection */}
                    {scheduleType === 'month' && (
                         <>
                              <div className="grid grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Chọn tháng <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                             value={scheduleFormData.month || ''}
                                             onValueChange={(value) => {
                                                  onFormDataChange({ ...scheduleFormData, month: value });
                                             }}
                                        >
                                             <SelectTrigger className={scheduleFormErrors.month ? 'border-red-500' : ''}>
                                                  <SelectValue placeholder="-- Chọn tháng --" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  {months.map((month) => (
                                                       <SelectItem key={month.value} value={month.value.toString()}>
                                                            {month.label}
                                                       </SelectItem>
                                                  ))}
                                             </SelectContent>
                                        </Select>
                                        {scheduleFormErrors.month && (
                                             <p className="text-xs text-red-600 mt-1">{scheduleFormErrors.month}</p>
                                        )}
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Chọn năm <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                             value={scheduleFormData.year || ''}
                                             onValueChange={(value) => {
                                                  onFormDataChange({ ...scheduleFormData, year: value });
                                             }}
                                        >
                                             <SelectTrigger className={scheduleFormErrors.year ? 'border-red-500' : ''}>
                                                  <SelectValue placeholder="-- Chọn năm --" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  {years.map((year) => (
                                                       <SelectItem key={year} value={year.toString()}>
                                                            {year}
                                                       </SelectItem>
                                                  ))}
                                             </SelectContent>
                                        </Select>
                                        {scheduleFormErrors.year && (
                                             <p className="text-xs text-red-600 mt-1">{scheduleFormErrors.year}</p>
                                        )}
                                   </div>
                              </div>
                              {scheduleFormData.month && scheduleFormData.year && (
                                   <p className="text-xs text-gray-500 mt-1">
                                        Sẽ tạo lịch trình cho {scheduleCount} ngày trong tháng {scheduleFormData.month}/{scheduleFormData.year}
                                   </p>
                              )}
                         </>
                    )}

                    {/* Quarter Selection */}
                    {scheduleType === 'quarter' && (
                         <>
                              <div className="grid grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Chọn quý <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                             value={scheduleFormData.quarter || ''}
                                             onValueChange={(value) => {
                                                  onFormDataChange({ ...scheduleFormData, quarter: value });
                                             }}
                                        >
                                             <SelectTrigger className={scheduleFormErrors.quarter ? 'border-red-500' : ''}>
                                                  <SelectValue placeholder="-- Chọn quý --" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  {quarters.map((quarter) => (
                                                       <SelectItem key={quarter.value} value={quarter.value.toString()}>
                                                            {quarter.label}
                                                       </SelectItem>
                                                  ))}
                                             </SelectContent>
                                        </Select>
                                        {scheduleFormErrors.quarter && (
                                             <p className="text-xs text-red-600 mt-1">{scheduleFormErrors.quarter}</p>
                                        )}
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Chọn năm <span className="text-red-500">*</span>
                                        </label>
                                        <Select
                                             value={scheduleFormData.year || ''}
                                             onValueChange={(value) => {
                                                  onFormDataChange({ ...scheduleFormData, year: value });
                                             }}
                                        >
                                             <SelectTrigger className={scheduleFormErrors.year ? 'border-red-500' : ''}>
                                                  <SelectValue placeholder="-- Chọn năm --" />
                                             </SelectTrigger>
                                             <SelectContent>
                                                  {years.map((year) => (
                                                       <SelectItem key={year} value={year.toString()}>
                                                            {year}
                                                       </SelectItem>
                                                  ))}
                                             </SelectContent>
                                        </Select>
                                        {scheduleFormErrors.year && (
                                             <p className="text-xs text-red-600 mt-1">{scheduleFormErrors.year}</p>
                                        )}
                                   </div>
                              </div>
                              {scheduleFormData.quarter && scheduleFormData.year && (
                                   <p className="text-xs text-gray-500 mt-1">
                                        Sẽ tạo lịch trình cho {scheduleCount} ngày trong quý {scheduleFormData.quarter}/{scheduleFormData.year}
                                   </p>
                              )}
                         </>
                    )}

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
                                   <SelectItem value="Available">Có sẵn</SelectItem>
                                   <SelectItem value="Booked">Đã đặt</SelectItem>
                                   <SelectItem value="Maintenance">Bảo trì</SelectItem>
                              </SelectContent>
                         </Select>
                    </div>

                    {/* Info Alert */}
                    {scheduleFormData.fieldId && scheduleFormData.slotId && (
                         <>
                              {scheduleType === 'single' && scheduleFormData.date && (
                                   <Alert className="border-blue-200 bg-blue-50">
                                        <Info className="h-4 w-4 text-blue-600" />
                                        <AlertDescription className="text-blue-800 text-sm">
                                             Bạn đang tạo lịch trình cho ngày <strong>{new Date(scheduleFormData.date).toLocaleDateString('vi-VN')}</strong>
                                        </AlertDescription>
                                   </Alert>
                              )}
                              {scheduleType === 'month' && scheduleFormData.month && scheduleFormData.year && (
                                   <Alert className="border-blue-200 bg-blue-50">
                                        <Info className="h-4 w-4 text-blue-600" />
                                        <AlertDescription className="text-blue-800 text-sm">
                                             Bạn đang tạo lịch trình cho <strong>{scheduleCount} ngày</strong> trong tháng <strong>{scheduleFormData.month}/{scheduleFormData.year}</strong>
                                        </AlertDescription>
                                   </Alert>
                              )}
                              {scheduleType === 'quarter' && scheduleFormData.quarter && scheduleFormData.year && (
                                   <Alert className="border-blue-200 bg-blue-50">
                                        <Info className="h-4 w-4 text-blue-600" />
                                        <AlertDescription className="text-blue-800 text-sm">
                                             Bạn đang tạo lịch trình cho <strong>{scheduleCount} ngày</strong> trong quý <strong>{scheduleFormData.quarter}/{scheduleFormData.year}</strong>
                                        </AlertDescription>
                                   </Alert>
                              )}
                         </>
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
                                        {scheduleType === 'single'
                                             ? 'Tạo lịch trình'
                                             : `Tạo ${scheduleCount} lịch trình`}
                                   </>
                              )}
                         </Button>
                    </div>
               </form>
          </Modal>
     );
}

import React from "react";
import { Card, Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Alert, AlertDescription } from "../../../../../shared/components/ui";
import { Timer, Clock, Plus, Edit, Trash2, Info, Wrench } from "lucide-react";

export default function TimeSlotsTab({
     fields,
     selectedFieldFilter,
     onFieldFilterChange,
     timeSlots,
     formatTime,
     onAddSlot,
     onEditSlot,
     onDeleteSlot
}) {
     const hasAvailableFields = fields.some(field => (field.status || field.Status || '').toLowerCase() !== 'maintenance');
     return (
          <>
               <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                         <h3 className="text-lg font-semibold text-gray-900">Quản lý Time Slots</h3>
                         <p className="text-gray-600">Xem thời gian hoạt động của từng sân</p>
                    </div>
                    <Button
                         onClick={onAddSlot}
                         disabled={!hasAvailableFields}
                         title={!hasAvailableFields ? 'Tất cả các sân đang ở trạng thái bảo trì' : undefined}
                         className="bg-teal-600 hover:bg-teal-700 text-white rounded-2xl"
                    >
                         <Plus className="w-4 h-4 mr-1" />
                         Thêm Time Slot
                    </Button>
               </div>

               {/* Field Filter */}
               <Card className="p-2">
                    <div className="flex items-center gap-4 flex-wrap">
                         <span className="font-medium text-gray-700">Lọc theo sân:</span>
                         <Select value={selectedFieldFilter} onValueChange={onFieldFilterChange}>
                              <SelectTrigger className="w-[280px] rounded-2xl">
                                   <SelectValue placeholder="Chọn sân" />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="all">Tất cả các sân ({fields.length})</SelectItem>
                                   {fields.map((field) => (
                                        <SelectItem key={field.fieldId} value={field.fieldId.toString()}>
                                             {field.name} - {field.complexName}
                                        </SelectItem>
                                   ))}
                              </SelectContent>
                         </Select>
                    </div>
               </Card>

               <Alert className="border-yellow-200 bg-yellow-50 rounded-2xl">
                    <Info className="h-4 w-4 " />
                    <AlertDescription className="text-yellow-600 text-sm">
                         Mỗi sân có thể có các khung giờ hoạt động riêng. Giá sẽ được thiết lập ngay khi tạo slot.
                    </AlertDescription>
               </Alert>
               {fields.length > 0 && !hasAvailableFields && (
                    <Alert className="border-orange-200 bg-orange-50 rounded-2xl">
                         <Wrench className="h-4 w-4 text-orange-600" />
                         <AlertDescription className="text-orange-800 text-sm">
                              Tất cả các sân đang ở trạng thái <strong>Bảo trì</strong>. Bạn sẽ không thể thêm Time Slot mới cho đến khi đổi trạng thái sân.
                         </AlertDescription>
                    </Alert>
               )}

               {/* Display fields with their time slots */}
               {fields.length === 0 ? (
                    <Card className="p-12">
                         <div className="text-center">
                              <Timer className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có sân nào</h3>
                              <p className="text-gray-500">Vui lòng thêm sân trước khi quản lý time slots</p>
                         </div>
                    </Card>
               ) : (
                    <div className="space-y-3">
                         {fields
                              .filter(field => selectedFieldFilter === 'all' || field.fieldId.toString() === selectedFieldFilter)
                              .map((field) => {
                                   // Get slots for this field
                                   const fieldSlots = timeSlots
                                        .filter(slot => {
                                             const slotFieldId = slot.fieldId ?? slot.FieldId;
                                             // Only show slots that belong to this field
                                             return slotFieldId && Number(slotFieldId) === Number(field.fieldId);
                                        })
                                        .map(slot => ({
                                             ...slot,
                                             fieldId: slot.fieldId || slot.FieldId || field.fieldId
                                        }));
                                   const fieldStatus = (field.status || field.Status || 'Available').toString();
                                   const isMaintenance = fieldStatus.toLowerCase() === 'maintenance';

                                   return (
                                        <Card key={field.fieldId} className="p-4 rounded-3xl border-2 border-teal-400">
                                             {/* Field Header */}
                                             <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                                                  <div className="flex items-center ">
                                                       <div className="w-10 h-10  rounded-xl flex items-center justify-center">
                                                            <Timer className="w-7 h-7 text-teal-600 mr-1" />
                                                       </div>
                                                       <div>
                                                            <h4 className="text-lg font-semibold text-gray-900">{field.name}</h4>
                                                            <p className="text-sm text-gray-500">{field.complexName}</p>
                                                       </div>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                       <Badge className="bg-gray-100 text-gray-800">
                                                            {fieldSlots.length} slots
                                                       </Badge>
                                                       <Badge className={isMaintenance ? 'bg-orange-100 text-orange-700' : 'bg-teal-100 text-teal-800'}>
                                                            {isMaintenance ? 'Bảo trì' : 'Hoạt động'}
                                                       </Badge>
                                                       <Button
                                                            onClick={() => onAddSlot(field.fieldId)}
                                                            disabled={isMaintenance}
                                                            title={isMaintenance ? 'Sân đang bảo trì, không thể thêm Time Slot' : undefined}
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-teal-600 hover:text-teal-700 rounded-2xl hover:bg-teal-50 border-teal-200"
                                                       >
                                                            <Plus className="w-4 h-4 mr-1" />
                                                            Thêm slot
                                                       </Button>
                                                  </div>
                                             </div>
                                             {isMaintenance && (
                                                  <div className="mb-4 flex items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700">
                                                       <Wrench className="w-4 h-4" />
                                                       <span>Sân đang bảo trì. Toàn bộ Time Slots sẽ bị khóa cho tới khi bạn đổi trạng thái.</span>
                                                  </div>
                                             )}

                                             {/* Time Slots List */}
                                             {fieldSlots.length === 0 ? (
                                                  <div className="text-center py-5 text-gray-500">
                                                       <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                       <p className="text-sm">Sân này chưa có time slot nào</p>
                                                       <Button
                                                            onClick={() => onAddSlot(field.fieldId)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="mt-3 rounded-2xl"
                                                       >
                                                            <Plus className="w-4 h-4 mr-1" />
                                                            Thêm slot đầu tiên
                                                       </Button>
                                                  </div>
                                             ) : (
                                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                                                       {fieldSlots.map((slot) => {
                                                            const start = new Date(`2000-01-01T${slot.StartTime || slot.startTime || '00:00:00'}`);
                                                            const end = new Date(`2000-01-01T${slot.EndTime || slot.endTime || '00:00:00'}`);
                                                            const duration = (end - start) / (1000 * 60 * 60);
                                                            const price = slot.price || slot.Price || 0;

                                                            return (
                                                                 <div
                                                                      key={slot.SlotID}
                                                                           className={`bg-gradient-to-br from-teal-50 to-blue-50 p-4 rounded-lg border border-teal-200 hover:shadow-md transition-shadow ${isMaintenance ? 'opacity-60 pointer-events-none' : ''}`}
                                                                 >
                                                                      <div className="flex items-start justify-between mb-2">
                                                                           <div className="flex-1">
                                                                                <h5 className="font-semibold text-gray-900">{slot.SlotName || slot.slotName || slot.name || 'N/A'}</h5>
                                                                                <p className="text-sm text-gray-600 mt-1">
                                                                                     {formatTime(slot.StartTime || slot.startTime || '00:00:00')} - {formatTime(slot.EndTime || slot.endTime || '00:00:00')}
                                                                                </p>
                                                                                <p className="text-base font-bold text-teal-700 mt-2">
                                                                                     {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)}
                                                                                </p>
                                                                           </div>
                                                                           <Badge className="bg-blue-100 text-blue-800 text-xs">
                                                                                {duration}h
                                                                           </Badge>
                                                                      </div>
                                                                      <div className="flex items-center gap-2 mt-3">
                                                                           <Button
                                                                                onClick={() => onEditSlot(slot)}
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                                                                           >
                                                                                <Edit className="w-3 h-3 mr-1" />
                                                                                Sửa
                                                                           </Button>
                                                                           <Button
                                                                                onClick={() => onDeleteSlot(slot.SlotID)}
                                                                                variant="outline"
                                                                                size="sm"
                                                                                className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                                                                           >
                                                                                <Trash2 className="w-3 h-3 mr-1" />
                                                                                Xóa
                                                                           </Button>
                                                                      </div>
                                                                 </div>
                                                            );
                                                       })}
                                                  </div>
                                             )}
                                        </Card>
                                   );
                              })}
                    </div>
               )}
          </>
     );
}


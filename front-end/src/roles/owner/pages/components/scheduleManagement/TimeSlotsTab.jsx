import React from "react";
import { Card, Button, Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Alert, AlertDescription } from "../../../../../shared/components/ui";
import { Timer, Clock, Plus, Edit, Trash2, Info } from "lucide-react";

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
     return (
          <>
               <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                         <h3 className="text-lg font-semibold text-gray-900">Quản lý Time Slots</h3>
                         <p className="text-gray-600">Xem thời gian hoạt động của từng sân</p>
                    </div>
                    <Button
                         onClick={onAddSlot}
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
                         Mỗi sân có thể có các khung giờ hoạt động riêng. Sau khi tạo, bạn có thể gán giá cho từng slot ở trang "Giá theo slot".
                    </AlertDescription>
               </Alert>

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
                                   // Get slots for this field and add fieldId to each slot
                                   const fieldSlots = timeSlots
                                        .filter(slot => {
                                             // Filter by slot.fieldId if available, otherwise show all
                                             return !slot.fieldId || slot.fieldId === field.fieldId || slot.FieldId === field.fieldId;
                                        })
                                        .map(slot => ({
                                             ...slot,
                                             fieldId: slot.fieldId || slot.FieldId || field.fieldId
                                        }));

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
                                                       <Badge className="bg-teal-100 text-teal-800">
                                                            {fieldSlots.length} slots
                                                       </Badge>
                                                       <Button
                                                            onClick={() => onAddSlot(field.fieldId)}
                                                            variant="outline"
                                                            size="sm"
                                                            className="text-teal-600 hover:text-teal-700 rounded-2xl hover:bg-teal-50 border-teal-200"
                                                       >
                                                            <Plus className="w-4 h-4 mr-1" />
                                                            Thêm slot
                                                       </Button>
                                                  </div>
                                             </div>

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

                                                            return (
                                                                 <div
                                                                      key={slot.SlotID}
                                                                      className="bg-gradient-to-br from-teal-50 to-blue-50 p-4 rounded-lg border border-teal-200 hover:shadow-md transition-shadow"
                                                                 >
                                                                      <div className="flex items-start justify-between mb-2">
                                                                           <div>
                                                                                <h5 className="font-semibold text-gray-900">{slot.SlotName || slot.slotName || slot.name || 'N/A'}</h5>
                                                                                <p className="text-sm text-gray-600 mt-1">
                                                                                     {formatTime(slot.StartTime || slot.startTime || '00:00:00')} - {formatTime(slot.EndTime || slot.endTime || '00:00:00')}
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


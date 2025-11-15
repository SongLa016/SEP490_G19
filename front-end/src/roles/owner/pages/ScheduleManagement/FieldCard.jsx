import React from "react";
import { Card, Button, Badge } from "../../../../shared/components/ui";
import { Timer, Plus, Clock, Edit, Trash2 } from "lucide-react";

export default function FieldCard({ field, fieldSlots, onAddSlot, onEditSlot, onDeleteSlot }) {
     const formatTime = (timeString) => {
          const [hours, minutes] = timeString.split(':');
          return `${hours}:${minutes}`;
     };

     return (
          <Card className="p-6">
               {/* Field Header */}
               <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                    <div className="flex items-center gap-4">
                         <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-blue-600 rounded-xl flex items-center justify-center">
                              <Timer className="w-6 h-6 text-white" />
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
                              className="text-teal-600 hover:text-teal-700 hover:bg-teal-50 border-teal-200"
                         >
                              <Plus className="w-4 h-4 mr-1" />
                              Thêm slot
                         </Button>
                    </div>
               </div>

               {/* Time Slots List */}
               {fieldSlots.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                         <Clock className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                         <p className="text-sm">Sân này chưa có time slot nào</p>
                         <Button
                              onClick={() => onAddSlot(field.fieldId)}
                              variant="outline"
                              size="sm"
                              className="mt-3"
                         >
                              <Plus className="w-4 h-4 mr-1" />
                              Thêm slot đầu tiên
                         </Button>
                    </div>
               ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                         {fieldSlots.map((slot) => {
                              const start = new Date(`2000-01-01T${slot.StartTime}`);
                              const end = new Date(`2000-01-01T${slot.EndTime}`);
                              const duration = (end - start) / (1000 * 60 * 60);

                              return (
                                   <div
                                        key={slot.SlotID}
                                        className="bg-gradient-to-br from-teal-50 to-blue-50 p-4 rounded-lg border border-teal-200 hover:shadow-md transition-shadow"
                                   >
                                        <div className="flex items-start justify-between mb-2">
                                             <div>
                                                  <h5 className="font-semibold text-gray-900">{slot.SlotName}</h5>
                                                  <p className="text-sm text-gray-600 mt-1">
                                                       {formatTime(slot.StartTime)} - {formatTime(slot.EndTime)}
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
}

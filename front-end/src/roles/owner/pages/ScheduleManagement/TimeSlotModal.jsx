import React from "react";
import {
     Modal,
     Input,
     Button,
     Badge,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue
} from "../../../../shared/components/ui";
import { Loader2, Save, X } from "lucide-react";

export default function TimeSlotModal({
     isOpen,
     onClose,
     editingSlot,
     slotFormData,
     setSlotFormData,
     slotFormErrors,
     fields,
     selectedQuickSlots,
     quickSlotTemplates,
     isSlotExistsForField,
     handleQuickSlotSelect,
     isSubmittingSlot,
     onSubmit
}) {
     return (
          <Modal
               isOpen={isOpen}
               onClose={onClose}
               title={editingSlot ? 'Chỉnh sửa Time Slot' : 'Thêm Time Slot mới'}
               size="lg"
          >
               <form onSubmit={onSubmit} className="space-y-4">
                    {/* Field Selection */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              Chọn sân <span className="text-red-500">*</span>
                         </label>
                         {slotFormData.fieldId && !editingSlot ? (
                              <div className="w-full px-3 py-2 border border-teal-300 rounded-lg bg-teal-50">
                                   <div className="flex items-center justify-between">
                                        <span className="text-gray-900 font-medium">
                                             {fields.find(f => f.fieldId.toString() === slotFormData.fieldId)?.name || 'Sân đã chọn'}
                                             <span className="text-gray-600 text-sm ml-1">
                                                  ({fields.find(f => f.fieldId.toString() === slotFormData.fieldId)?.complexName})
                                             </span>
                                        </span>
                                        <button
                                             type="button"
                                             onClick={() => setSlotFormData({ ...slotFormData, fieldId: '' })}
                                             className="text-teal-600 hover:text-teal-700 text-sm underline"
                                        >
                                             Đổi sân
                                        </button>
                                   </div>
                              </div>
                         ) : (
                              <Select
                                   value={slotFormData.fieldId}
                                   onValueChange={(value) => {
                                        setSlotFormData({ ...slotFormData, fieldId: value });
                                   }}
                                   disabled={editingSlot}
                              >
                                   <SelectTrigger className={`w-full ${slotFormErrors.fieldId ? 'border-red-500' : ''}`}>
                                        <SelectValue placeholder="-- Chọn sân --" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        {fields.map((field) => (
                                             <SelectItem key={field.fieldId} value={field.fieldId.toString()}>
                                                  {field.name} ({field.complexName})
                                             </SelectItem>
                                        ))}
                                   </SelectContent>
                              </Select>
                         )}
                         {slotFormErrors.fieldId && (
                              <p className="text-xs text-red-600 mt-1">{slotFormErrors.fieldId}</p>
                         )}
                    </div>

                    {/* Quick Slots - Only show when creating new and field is selected */}
                    {!editingSlot && slotFormData.fieldId && (
                         <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-lg border border-teal-200">
                              <div className="flex items-center justify-between mb-3">
                                   <div>
                                        <h4 className="text-sm font-semibold text-gray-900">Chọn nhanh khung giờ</h4>
                                        <p className="text-xs text-gray-600">Click để chọn nhiều khung giờ cùng lúc</p>
                                   </div>
                                   {selectedQuickSlots.length > 0 && (
                                        <Badge className="bg-teal-100 text-teal-800">
                                             {selectedQuickSlots.length} đã chọn
                                        </Badge>
                                   )}
                              </div>
                              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                                   {quickSlotTemplates.map((template, index) => {
                                        const isSelected = selectedQuickSlots.some(s => s.key === `${template.start}-${template.end}`);
                                        const isExists = isSlotExistsForField(slotFormData.fieldId, template.start, template.end);

                                        return (
                                             <button
                                                  key={index}
                                                  type="button"
                                                  onClick={() => handleQuickSlotSelect(template)}
                                                  disabled={isExists}
                                                  className={`px-3 py-2.5 text-xs rounded-lg transition-all text-left ${isExists
                                                       ? 'bg-gray-200 text-gray-500 cursor-not-allowed border-2 border-gray-300'
                                                       : isSelected
                                                            ? 'bg-teal-100 border-2 border-teal-500 hover:bg-teal-200 text-teal-900'
                                                            : 'bg-white border-2 border-teal-200 hover:bg-teal-50 hover:border-teal-400'
                                                       }`}
                                             >
                                                  <div className="font-semibold">{template.name}</div>
                                                  <div className="text-xs mt-0.5">{template.start} - {template.end}</div>
                                                  {isExists && (
                                                       <div className="text-xs text-gray-500 mt-1">Đã thêm</div>
                                                  )}
                                             </button>
                                        );
                                   })}
                              </div>
                         </div>
                    )}

                    {/* Manual Input - Only show when not using quick slots */}
                    {selectedQuickSlots.length === 0 && (
                         <>
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên Slot <span className="text-red-500">*</span>
                                   </label>
                                   <Input
                                        value={slotFormData.slotName}
                                        onChange={(e) => setSlotFormData({ ...slotFormData, slotName: e.target.value })}
                                        placeholder="Ví dụ: Slot 1, Sáng sớm, ..."
                                        className={slotFormErrors.slotName ? 'border-red-500' : ''}
                                   />
                                   {slotFormErrors.slotName && (
                                        <p className="text-xs text-red-600 mt-1">{slotFormErrors.slotName}</p>
                                   )}
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Giờ bắt đầu <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                             type="time"
                                             value={slotFormData.startTime}
                                             onChange={(e) => setSlotFormData({ ...slotFormData, startTime: e.target.value })}
                                             className={slotFormErrors.startTime ? 'border-red-500' : ''}
                                        />
                                        {slotFormErrors.startTime && (
                                             <p className="text-xs text-red-600 mt-1">{slotFormErrors.startTime}</p>
                                        )}
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Giờ kết thúc <span className="text-red-500">*</span>
                                        </label>
                                        <Input
                                             type="time"
                                             value={slotFormData.endTime}
                                             onChange={(e) => setSlotFormData({ ...slotFormData, endTime: e.target.value })}
                                             className={slotFormErrors.endTime ? 'border-red-500' : ''}
                                        />
                                        {slotFormErrors.endTime && (
                                             <p className="text-xs text-red-600 mt-1">{slotFormErrors.endTime}</p>
                                        )}
                                   </div>
                              </div>
                         </>
                    )}

                    <div className="flex justify-end gap-2 pt-4">
                         <Button
                              type="button"
                              onClick={onClose}
                              variant="outline"
                         >
                              <X className="w-4 h-4 mr-2" />
                              Hủy
                         </Button>
                         <Button
                              type="submit"
                              disabled={isSubmittingSlot}
                              className="bg-teal-600 hover:bg-teal-700"
                         >
                              {isSubmittingSlot ? (
                                   <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang lưu...
                                   </>
                              ) : (
                                   <>
                                        <Save className="w-4 h-4 mr-2" />
                                        {editingSlot ? 'Cập nhật' : selectedQuickSlots.length > 0 ? `Thêm ${selectedQuickSlots.length} slots` : 'Tạo mới'}
                                   </>
                              )}
                         </Button>
                    </div>
               </form>
          </Modal>
     );
}

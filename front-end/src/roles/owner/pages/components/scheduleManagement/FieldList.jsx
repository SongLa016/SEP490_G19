import React from "react";
import { Card } from "../../../../../shared/components/ui";
import { Plus } from "lucide-react";

export default function FieldList({
     fields,
     selectedFieldForSchedule,
     selectedFields,
     onFieldToggle,
     onFieldSelect,
     getFieldColor
}) {
     return (
          <Card className="p-4 shadow-lg bg-white rounded-2xl">
               <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 text-base">Danh sách sân</h3>

               </div>
               <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {fields.length === 0 ? (
                         <p className="text-sm text-gray-500 text-center py-4">Chưa có sân nào</p>
                    ) : (
                         fields
                              .filter(field => selectedFieldForSchedule === 'all' || field.fieldId.toString() === selectedFieldForSchedule)
                              .map((field) => {
                                   const fieldIdStr = field.fieldId.toString();
                                   const isChecked = selectedFields.has(fieldIdStr) || selectedFieldForSchedule === 'all' || selectedFieldForSchedule === fieldIdStr;

                                   return (
                                        <label
                                             key={field.fieldId}
                                             className="flex items-center gap-3 p-2.5 rounded-2xl shadow-md border border-gray-200 hover:border-teal-400 hover:bg-teal-50/50 transition-all cursor-pointer group"
                                             onClick={(e) => {
                                                  e.preventDefault();
                                                  if (selectedFieldForSchedule === 'all') {
                                                       onFieldToggle(fieldIdStr);
                                                  } else {
                                                       onFieldSelect(fieldIdStr);
                                                  }
                                             }}
                                        >
                                             <div className="relative flex items-center justify-center">
                                                  <input
                                                       type="checkbox"
                                                       checked={isChecked}
                                                       onChange={() => { }}
                                                       className="sr-only"
                                                  />
                                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${isChecked
                                                       ? `${getFieldColor(field.fieldId)} border-transparent`
                                                       : 'border-gray-300 bg-white group-hover:border-teal-400'
                                                       }`}>
                                                       {isChecked && (
                                                            <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                                 <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                            </svg>
                                                       )}
                                                  </div>
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                  <div className="font-semibold text-sm text-gray-900 truncate">{field.name}</div>
                                                  {field.pricePerHour > 0 && (
                                                       <div className="text-xs text-gray-600 mt-0.5">{field.pricePerHour.toLocaleString('vi-VN')}đ/giờ</div>
                                                  )}
                                             </div>
                                        </label>
                                   );
                              })
                    )}
               </div>
          </Card>
     );
}


import React from "react";
import { Card, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../shared/components/ui";
import { Filter } from "lucide-react";

export default function ComplexAndFieldSelector({
     complexes,
     selectedComplex,
     onComplexChange,
     fields,
     selectedFieldForSchedule,
     onFieldChange,
     filterStatus,
     onFilterStatusChange
}) {
     return (
          <Card className="p-2">
               <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4 flex-wrap">
                         <span className="font-medium text-gray-700">Khu sân:</span>
                         <Select
                              value={selectedComplex?.complexId?.toString()}
                              onValueChange={(value) => {
                                   const complex = complexes.find(c => c.complexId.toString() === value);
                                   if (complex) {
                                        onComplexChange(complex);
                                   }
                              }}
                         >
                              <SelectTrigger className="w-[250px] rounded-2xl">
                                   <SelectValue placeholder="Chọn khu sân" />
                              </SelectTrigger>
                              <SelectContent>
                                   {complexes.map((complex) => (
                                        <SelectItem key={complex.complexId} value={complex.complexId.toString()}>
                                             {complex.name}
                                        </SelectItem>
                                   ))}
                              </SelectContent>
                         </Select>

                         <span className="font-medium text-gray-700">Sân:</span>
                         <Select value={selectedFieldForSchedule} onValueChange={onFieldChange}>
                              <SelectTrigger className="w-[200px] rounded-2xl">
                                   <SelectValue placeholder="Chọn sân" />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="all">
                                        Tất cả ({fields.length} sân)
                                   </SelectItem>
                                   {fields.map((field) => (
                                        <SelectItem key={field.fieldId} value={field.fieldId.toString()}>
                                             {field.name}
                                        </SelectItem>
                                   ))}
                              </SelectContent>
                         </Select>
                    </div>

                    <div className="flex items-center gap-2">
                         <Filter className="w-4 h-4 text-gray-600" />
                         <span className="text-sm font-medium text-gray-700">Trạng thái:</span>
                         <Select value={filterStatus} onValueChange={onFilterStatusChange}>
                              <SelectTrigger className="w-[150px] rounded-2xl">
                                   <SelectValue placeholder="Chọn trạng thái" />
                              </SelectTrigger>
                              <SelectContent>
                                   <SelectItem value="all">Tất cả</SelectItem>
                                   <SelectItem value="booked">Đã đặt</SelectItem>
                                   <SelectItem value="available">Còn trống</SelectItem>
                              </SelectContent>
                         </Select>
                    </div>
               </div>
          </Card>
     );
}

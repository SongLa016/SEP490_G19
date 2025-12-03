import React from "react";
import { Card, Button } from "../../../../../shared/components/ui";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

export default function DateSelector({ selectedDate, onDateChange, weekDates }) {
     const isToday = (date) => {
          const today = new Date();
          return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
     };

     const getDayName = (date) => {
          const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
          return days[date.getDay()];
     };

     const formatDate = (date) => {
          return `${date.getDate()}/${date.getMonth() + 1}`;
     };

     return (
          <Card className="p-4 bg-gradient-to-r from-teal-50 to-blue-50 border-teal-200">
               <div className="flex items-center justify-between flex-wrap gap-4">
                    <Button
                         onClick={() => {
                              const newDate = new Date(selectedDate);
                              newDate.setDate(newDate.getDate() - 1);
                              onDateChange(newDate);
                         }}
                         variant="outline"
                         size="sm"
                         className="border-teal-300 rounded-2xl hover:bg-teal-100 hover:text-teal-600"
                    >
                         <ChevronLeft className="w-4 h-4 mr-1" />
                         Hôm qua
                    </Button>

                    <div className="flex items-center gap-4 flex-wrap">
                         <Calendar className="w-5 h-5 text-teal-600" />
                         <div className="flex items-center gap-2 relative">
                              <span className="font-bold text-lg text-gray-900">
                                   {selectedDate.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                              </span>
                              {isToday(selectedDate) && (
                                   <p className="bg-teal-600 absolute bottom-[22px] right-[-25px] text-white text-[10px] font-semibold py-0.5 px-2 rounded-full">
                                        Hôm nay
                                   </p>
                              )}
                         </div>
                         <Button
                              onClick={() => onDateChange(new Date())}
                              variant="outline"
                              size="xs"
                              className="border-teal-300 text-xs rounded-2xl px-2 hover:bg-teal-100 hover:text-teal-600"
                         >
                              Hôm nay
                         </Button>
                    </div>

                    <Button
                         onClick={() => {
                              const newDate = new Date(selectedDate);
                              newDate.setDate(newDate.getDate() + 1);
                              onDateChange(newDate);
                         }}
                         variant="outline"
                         size="sm"
                         className="border-teal-300 items-center rounded-2xl hover:bg-teal-100 hover:text-teal-600"
                    >
                         Ngày mai
                         <ChevronRight className="w-4 h-4" />
                    </Button>
               </div>

               {/* Week Days Selector */}
               <div className="mt-4 pt-4 border-t border-teal-200">
                    <div className="flex items-center justify-center gap-2 flex-wrap">
                         <span className="text-sm font-medium text-gray-700 mr-2">Chọn ngày:</span>
                         {weekDates.map((date, index) => {
                              const today = isToday(date);
                              const isSelected = selectedDate.toDateString() === date.toDateString();
                              const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                              return (
                                   <button
                                        key={index}
                                        onClick={() => onDateChange(new Date(date))}
                                        className={`px-4 py-1 rounded-2xl font-semibold transition-all duration-200 ${isSelected
                                             ? 'bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-lg scale-105'
                                             : today
                                                  ? 'bg-teal-100 text-teal-700 border-2 border-teal-300 hover:bg-teal-200'
                                                  : isWeekend
                                                       ? 'bg-orange-50 text-orange-700 border-2 border-orange-200 hover:bg-orange-100'
                                                       : 'bg-white text-gray-700 border-2 border-gray-200 hover:bg-gray-50 hover:border-teal-300'
                                             }`}
                                   >
                                        <div className="flex flex-col items-center gap-0.5">
                                             <span className="text-xs opacity-75">{formatDate(date)}</span>
                                             <span className="font-bold text-xs"> {getDayName(date)}</span>
                                        </div>
                                   </button>
                              );
                         })}
                    </div>
               </div>
          </Card>
     );
}

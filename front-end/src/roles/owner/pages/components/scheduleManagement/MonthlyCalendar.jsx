import React from "react";
import { Card } from "../../../../../shared/components/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function MonthlyCalendar({ calendarMonth, onMonthChange, selectedDate, onDateSelect, weekDates }) {
     const isToday = (date) => {
          const today = new Date();
          return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
     };

     const getCalendarDates = (month) => {
          const year = month.getFullYear();
          const monthIndex = month.getMonth();
          const firstDay = new Date(year, monthIndex, 1);
          const startDate = new Date(firstDay);
          startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday

          const dates = [];
          const currentDate = new Date(startDate);
          for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
               dates.push(new Date(currentDate));
               currentDate.setDate(currentDate.getDate() + 1);
          }
          return dates;
     };

     const isInCurrentMonth = (date, month) => {
          return date.getMonth() === month.getMonth() && date.getFullYear() === month.getFullYear();
     };

     return (
          <Card className="p-4 shadow-lg bg-white rounded-xl">
               <div className="flex items-center justify-between mb-4">
                    <button
                         onClick={() => {
                              const newMonth = new Date(calendarMonth);
                              newMonth.setMonth(newMonth.getMonth() - 1);
                              onMonthChange(newMonth);
                         }}
                         className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                         <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <h3 className="font-bold text-gray-900 text-base">
                         {calendarMonth.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })}
                    </h3>
                    <button
                         onClick={() => {
                              const newMonth = new Date(calendarMonth);
                              newMonth.setMonth(newMonth.getMonth() + 1);
                              onMonthChange(newMonth);
                         }}
                         className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                         <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
               </div>

               {/* Days of week header */}
               <div className="grid grid-cols-7 gap-1 mb-2">
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day, idx) => (
                         <div key={idx} className="text-center text-xs font-semibold text-gray-600 py-1">
                              {day}
                         </div>
                    ))}
               </div>

               {/* Calendar grid */}
               <div className="grid grid-cols-7 gap-1">
                    {getCalendarDates(calendarMonth).map((date, idx) => {
                         const isCurrentMonth = isInCurrentMonth(date, calendarMonth);
                         const isSelected = selectedDate.toDateString() === date.toDateString();
                         const isDateToday = isToday(date);
                         const isInWeek = weekDates.some(wd => wd.toDateString() === date.toDateString());

                         return (
                              <button
                                   key={idx}
                                   onClick={() => {
                                        onDateSelect(new Date(date));
                                        onMonthChange(new Date(date));
                                   }}
                                   className={`aspect-square text-xs font-medium rounded-lg transition-all ${isSelected
                                        ? 'bg-teal-600 text-white shadow-md scale-105'
                                        : isDateToday
                                             ? 'bg-teal-100 text-teal-700 font-bold'
                                             : isInWeek
                                                  ? 'bg-blue-50 text-blue-700'
                                                  : isCurrentMonth
                                                       ? 'text-gray-700 hover:bg-gray-100'
                                                       : 'text-gray-400 hover:bg-gray-50'
                                        }`}
                              >
                                   {date.getDate()}
                              </button>
                         );
                    })}
               </div>
          </Card>
     );
}

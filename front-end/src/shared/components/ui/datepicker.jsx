import React, { useEffect, useRef, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Button } from "./button";

function format(date) {
     if (!date) return "";
     const y = date.getFullYear();
     const m = String(date.getMonth() + 1).padStart(2, "0");
     const d = String(date.getDate()).padStart(2, "0");
     return `${y}-${m}-${d}`;
}

export function DatePicker({
     value,
     onChange,
     minDate,
     className = "",
     fromYear = 2020,
     toYear = 2030,
     placeholder = "Chọn ngày"
}) {
     const [open, setOpen] = useState(false);
     const containerRef = useRef(null);
     const selectedDate = value ? new Date(value) : undefined;
     const minDateObj = typeof minDate === "string" ? new Date(minDate) : minDate;

     useEffect(() => {
          function onDocClick(e) {
               if (!containerRef.current) return;
               if (!containerRef.current.contains(e.target)) setOpen(false);
          }
          document.addEventListener("mousedown", onDocClick);
          return () => document.removeEventListener("mousedown", onDocClick);
     }, []);

     return (
          <div className={`relative ${className}`} ref={containerRef}>
               <Button
                    type="button"
                    onClick={() => setOpen((o) => !o)}
                    className="w-full flex items-center justify-between text-gray-700 hover:text-gray-900 hover:bg-gray-50 bg-white px-3 py-2 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
               >
                    <span className={value ? "text-gray-900" : "text-gray-500"}>
                         {value || placeholder}
                    </span>
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
               </Button>
               {open && (
                    <div className="absolute z-50 mt-2 rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
                         <div className="p-3">
                              <ReactDatePicker
                                   selected={selectedDate}
                                   onChange={(d) => {
                                        if (!d) return;
                                        const str = format(d);
                                        onChange && onChange(str);
                                        setOpen(false);
                                   }}
                                   inline
                                   minDate={minDateObj}
                                   showPopperArrow={false}
                                   calendarClassName="!border-0 !shadow-none"
                                   dayClassName={(date) => {
                                        const today = new Date();
                                        const isToday = date.toDateString() === today.toDateString();
                                        const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                                        const isDisabled = minDateObj && date < minDateObj;

                                        let className = "hover:bg-teal-50 hover:text-teal-700 rounded-lg transition-colors";

                                        if (isToday) {
                                             className += " bg-teal-100 text-teal-700 font-semibold";
                                        }
                                        if (isSelected) {
                                             className += " bg-teal-600 text-white hover:bg-teal-700";
                                        }
                                        if (isDisabled) {
                                             className += " text-gray-300 cursor-not-allowed hover:bg-transparent hover:text-gray-300";
                                        }

                                        return className;
                                   }}
                                   monthClassName={() => "text-gray-900 font-semibold"}
                                   yearClassName={() => "text-gray-900 font-semibold"}
                              />
                         </div>
                    </div>
               )}
          </div>
     );
}



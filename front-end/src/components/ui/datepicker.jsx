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

export function DatePicker({ value, onChange, min, className = "", fromYear = 2020, toYear = 2030 }) {
     const [open, setOpen] = useState(false);
     const containerRef = useRef(null);
     const selectedDate = value ? new Date(value) : undefined;
     const minDate = typeof min === "string" ? new Date(min) : undefined;

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
               <Button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between rounded-2xl  text-teal-600 hover:text-teal-700 hover:bg-teal-50 bg-white px-3 py-2 text-sm hover:border-teal-700 focus:outline-none focus:ring-2 focus:ring-gray-300">
                    <span>{value || "Select date"}</span>
                    <CalendarIcon className="w-4 h-4 text-gray-500" />
               </Button>
               {open && (
                    <div className="absolute z-50 mt-2 rounded-xl border border-gray-200 bg-white p-2 shadow-xl">
                         <ReactDatePicker
                              selected={selectedDate}
                              onChange={(d) => {
                                   if (!d) return;
                                   const str = format(d);
                                   onChange && onChange(str);
                                   setOpen(false);
                              }}
                              inline
                              minDate={minDate}
                              showPopperArrow={false}
                         />
                    </div>
               )}

          </div>
     );
}



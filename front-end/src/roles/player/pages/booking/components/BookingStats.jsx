import React from "react";
import { Clock } from "lucide-react";

export default function BookingStats({ stats }) {
     return (
          <div className="pt-2">
               <div className="flex items-center justify-between">
                    <div>
                         <h2 className="text-2xl font-bold text-teal-800">Lịch sử đặt sân</h2>
                         <div className="mt-1 h-1.5 w-24 bg-gradient-to-r from-teal-500 via-emerald-400 to-transparent rounded-full" />
                    </div>
                    <div className="hidden md:flex items-center gap-2">
                         <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200 shadow-sm">
                              Hoàn tất {stats.completed} • <span className="text-red-500">Hủy {stats.cancelled}</span>
                         </span>
                         {stats.pending > 0 && (
                              <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-yellow-50 text-yellow-700 border border-yellow-200 shadow-sm flex items-center gap-1">
                                   <Clock className="w-3 h-3" />
                                   Chờ xác nhận: {stats.pending}
                              </span>
                         )}
                    </div>
               </div>
          </div>
     );
}
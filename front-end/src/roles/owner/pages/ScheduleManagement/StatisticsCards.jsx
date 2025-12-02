import React from "react";
import { Card } from "../../../../shared/components/ui";
import { BarChart3, Calendar, Clock } from "lucide-react";

export default function StatisticsCards({ statistics }) {
     return (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
               <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-center justify-between">
                         <div>
                              <p className="text-sm font-medium text-blue-600">Tổng Slots</p>
                              <p className="text-2xl font-bold text-blue-900">{statistics.totalSlots}</p>
                         </div>
                         <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                              <BarChart3 className="w-5 h-5 text-white" />
                         </div>
                    </div>
               </Card>

               <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center justify-between">
                         <div>
                              <p className="text-sm font-medium text-green-600">Đã đặt</p>
                              <p className="text-2xl font-bold text-green-900">{statistics.bookedSlots}</p>
                         </div>
                         <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                              <Calendar className="w-5 h-5 text-white" />
                         </div>
                    </div>
               </Card>

               <Card className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200">
                    <div className="flex items-center justify-between">
                         <div>
                              <p className="text-sm font-medium text-gray-600">Còn trống</p>
                              <p className="text-2xl font-bold text-gray-900">{statistics.availableSlots}</p>
                         </div>
                         <div className="w-10 h-10 bg-gray-500 rounded-lg flex items-center justify-center">
                              <Clock className="w-5 h-5 text-white" />
                         </div>
                    </div>
               </Card>

               <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center justify-between">
                         <div>
                              <p className="text-sm font-medium text-purple-600">Tỷ lệ lấp đầy</p>
                              <p className="text-2xl font-bold text-purple-900">{statistics.occupancyRate}%</p>
                         </div>
                         <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                              <BarChart3 className="w-5 h-5 text-white" />
                         </div>
                    </div>
               </Card>
          </div>
     );
}

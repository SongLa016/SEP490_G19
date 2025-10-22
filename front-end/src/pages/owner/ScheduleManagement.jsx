import React from "react";
import OwnerLayout from "../../layouts/owner/OwnerLayout";
import { useAuth } from "../../contexts/AuthContext";
import { Card } from "../../components/ui/card";
import { Clock, Calendar, Settings } from "lucide-react";

export default function ScheduleManagement({ isDemo = false }) {
     const { user, logout } = useAuth();

     return (
          <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
               <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900">Quản lý lịch mở cửa</h1>
                              <p className="text-gray-600 mt-1">Thiết lập lịch mở/đóng cửa theo ngày, tuần, ngày lễ</p>
                         </div>
                    </div>

                    <Card className="p-6">
                         <div className="text-center py-12">
                              <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Tính năng đang phát triển</h3>
                              <p className="text-gray-500">Chức năng quản lý lịch mở cửa sẽ có sớm</p>
                         </div>
                    </Card>
               </div>
          </OwnerLayout>
     );
}



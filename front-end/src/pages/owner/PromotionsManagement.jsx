import React from "react";
import OwnerLayout from "../../layouts/owner/OwnerLayout";
import { useAuth } from "../../contexts/AuthContext";
import { Card } from "../../components/ui/card";
import { Gift, Percent, Calendar } from "lucide-react";

export default function PromotionsManagement({ isDemo = false }) {
     const { user, logout } = useAuth();

     return (
          <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
               <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900">Chiến dịch khuyến mãi</h1>
                              <p className="text-gray-600 mt-1">Tạo và quản lý khuyến mãi, voucher hiển thị ở bước thanh toán</p>
                         </div>
                    </div>

                    <Card className="p-6">
                         <div className="text-center py-12">
                              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Tính năng đang phát triển</h3>
                              <p className="text-gray-500">Chức năng quản lý khuyến mãi sẽ có sớm</p>
                         </div>
                    </Card>
               </div>
          </OwnerLayout>
     );
}



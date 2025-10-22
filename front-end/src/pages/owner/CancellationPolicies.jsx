import React from "react";
import OwnerLayout from "../../layouts/owner/OwnerLayout";
import { useAuth } from "../../contexts/AuthContext";
import { Card } from "../../components/ui/card";
import { Shield, AlertTriangle, Clock } from "lucide-react";

export default function CancellationPolicies({ isDemo = false }) {
     const { user, logout } = useAuth();

     return (
          <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
               <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900">Chính sách hủy</h1>
                              <p className="text-gray-600 mt-1">Thiết lập chính sách hủy (ví dụ: hủy trước 24h miễn phí, sau đó tính phí)</p>
                         </div>
                    </div>

                    <Card className="p-6">
                         <div className="text-center py-12">
                              <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                              <h3 className="text-lg font-medium text-gray-900 mb-2">Tính năng đang phát triển</h3>
                              <p className="text-gray-500">Chức năng quản lý chính sách hủy sẽ có sớm</p>
                         </div>
                    </Card>
               </div>
          </OwnerLayout>
     );
}



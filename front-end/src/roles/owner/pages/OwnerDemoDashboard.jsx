import OwnerDemoLayout from "./OwnerDemoLayout";
import { Card } from "@/components/ui/card";

export default function OwnerDemoDashboard() {
     const cards = [
          { title: "Đặt sân hôm nay", value: "12" },
          { title: "Doanh thu hôm nay", value: "3.5m" },
          { title: "Sân đang bảo trì", value: "1" },
          { title: "Yêu cầu hủy chờ duyệt", value: "2" },
     ];
     return (
          <OwnerDemoLayout>
               <h1 className="text-2xl font-bold text-slate-900 mb-4">Tổng quan (Demo)</h1>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {cards.map((c) => (
                         <Card key={c.title} className="p-4">
                              <div className="text-slate-500 text-sm">{c.title}</div>
                              <div className="text-2xl font-semibold">{c.value}</div>
                         </Card>
                    ))}
               </div>
          </OwnerDemoLayout>
     );
}



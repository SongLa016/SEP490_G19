import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Building2, DollarSign, Clock, ClipboardList, FileText, LineChart, LogIn } from "lucide-react";
import { Button } from "../../components/ui";

export default function OwnerDemoLayout({ children }) {
     const [isMenuOpen, setIsMenuOpen] = useState(false);
     const navigate = useNavigate();
     const location = useLocation();
     const items = [
          { id: "owner-demo", label: "Tổng quan", icon: Home, path: "/owner-demo" },
          { id: "fields", label: "Sân", icon: Building2, path: "/owner-demo/fields" },
          { id: "pricing", label: "Giá theo slot", icon: DollarSign, path: "/owner-demo/pricing" },
          { id: "schedule", label: "Lịch mở cửa", icon: Clock, path: "/owner-demo/schedule" },
          { id: "bookings", label: "Bookings", icon: ClipboardList, path: "/owner-demo/bookings" },
          { id: "reports", label: "Báo cáo", icon: FileText, path: "/owner-demo/reports" },
          { id: "revenue", label: "Biểu đồ", icon: LineChart, path: "/owner-demo/reports" },
     ];

     return (
          <div className="min-h-screen bg-slate-50">
               <header className="fixed top-0 left-0 right-0 z-40 bg-white/90 backdrop-blur border-b border-slate-200">
                    <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                         <div className="font-extrabold text-slate-900 tracking-tight">Owner Demo</div>
                         <nav className="hidden md:flex gap-2">
                              {items.map((item) => {
                                   const Icon = item.icon;
                                   const active = location.pathname === item.path;
                                   return (
                                        <Button key={item.id} onClick={() => navigate(item.path)} className={`px-3 py-2 rounded-xl text-sm ${active ? "bg-slate-900 text-white" : "bg-transparent text-slate-700 hover:bg-slate-100"}`}>
                                             <Icon className="w-4 h-4 mr-2" />
                                             {item.label}
                                        </Button>
                                   );
                              })}
                         </nav>
                         <div className="flex items-center gap-2">
                              <Button onClick={() => navigate("/register")} className="bg-slate-900 text-white px-3 py-2 rounded-lg text-sm">
                                   <LogIn className="w-4 h-4 mr-2" /> Đăng ký miễn phí
                              </Button>
                              <Button onClick={() => setIsMenuOpen((v) => !v)} className="md:hidden">Menu</Button>
                         </div>
                    </div>
                    {isMenuOpen && (
                         <div className="md:hidden border-t bg-white">
                              <div className="max-w-7xl mx-auto px-4 py-2 grid grid-cols-2 gap-2">
                                   {items.map((item) => {
                                        const Icon = item.icon;
                                        return (
                                             <Button key={item.id} onClick={() => { navigate(item.path); setIsMenuOpen(false); }} className="justify-start bg-slate-50 text-slate-800">
                                                  <Icon className="w-4 h-4 mr-2" /> {item.label}
                                             </Button>
                                        );
                                   })}
                              </div>
                         </div>
                    )}
               </header>
               <main className="pt-16 pb-8 max-w-7xl mx-auto px-4">{children}</main>
               <footer className="mt-8 border-t border-slate-200 py-6 text-center text-sm text-slate-500">© {new Date().getFullYear()} Owner Demo • SEP490 G19</footer>
          </div>
     );
}




import { Button } from "../../../../../shared/components/ui";
import { useNavigate } from "react-router-dom";
import { ScrollReveal } from "../../../../../shared/components/ScrollReveal";

export const CTASection = ({ user }) => {
     const navigate = useNavigate();

     if (user) return null;

     return (
          <ScrollReveal direction="up" delay={0.1}>
               <div className="relative py-16 bg-cover bg-center bg-no-repeat" style={{
                    backgroundImage: "url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1920&h=1080&fit=crop')"
               }}>
                    <div className="absolute inset-0 bg-black/45" />
                    <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                         <h2 className="text-3xl font-bold text-white mb-4">
                              Sẵn sàng bắt đầu?
                         </h2>
                         <p className="text-xl text-teal-300 mb-8">
                              Đăng ký ngay để trải nghiệm đầy đủ các tính năng
                         </p>
                         <Button
                              onClick={() => navigate("/auth")}
                              className="bg-white text-teal-500 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold text-lg transition-colors"
                         >
                              Đăng ký miễn phí
                         </Button>
                    </div>
               </div>
          </ScrollReveal>
     );
};


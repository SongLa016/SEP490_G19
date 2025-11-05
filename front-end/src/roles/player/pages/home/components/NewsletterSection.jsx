import { Button, Input } from "../../../../../shared/components/ui";
import { ScrollReveal } from "../../../../../shared/components/ScrollReveal";

export const NewsletterSection = () => {
     return (
          <ScrollReveal direction="up" delay={0.1}>
               <div className="py-20 relative bg-cover bg-center bg-no-repeat" style={{
                    backgroundImage: "url('https://thanhnien.mediacdn.vn/Uploaded/lanphuong/2022_04_06/san-my-dinh-dep-hoang-chup-3-8596.jpg')"
               }}>
                    <div className="absolute inset-0 bg-black/45" />
                    <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
                         <h2 className="text-3xl font-bold mb-3">Nhận khuyến mãi sớm nhất</h2>
                         <p className="text-teal-300 mb-6">Đăng ký email để không bỏ lỡ mã giảm giá và tin mới</p>
                         <div className="flex flex-col sm:flex-row gap-3 justify-center">
                              <Input type="email" placeholder="Email của bạn" className="w-full sm:w-80 px-4 py-3 rounded-lg text-gray-900" />
                              <Button className="px-6 py-3 rounded-lg bg-white text-teal-600 font-semibold hover:bg-gray-100">Đăng ký</Button>
                         </div>
                    </div>
               </div>
          </ScrollReveal>
     );
};


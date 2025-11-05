import { DollarSign, ShieldCheck, Sparkles } from "lucide-react";
import { ScrollReveal } from "../../../../../shared/components/ScrollReveal";
import { Container } from "../../../../../shared/components/ui";

export const WhyChooseUsSection = () => {
     return (
          <ScrollReveal direction="up" delay={0.1}>
               <Container className="py-8 my-10  bg-gradient-to-br from-white to-teal-50 rounded-2xl">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                         <h2 className="text-3xl md:text-4xl font-extrabold text-center text-teal-800 mb-10">Vì sao chọn chúng tôi?</h2>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-center">
                              <div>
                                   <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
                                        <DollarSign className="w-7 h-7 text-teal-600" />
                                   </div>
                                   <div className="font-semibold text-teal-900">Giá cạnh tranh</div>
                                   <p className="mt-2 text-teal-600 leading-relaxed text-sm">Giá minh bạch, ưu đãi thường xuyên cho người dùng mới và thân thiết</p>
                              </div>
                              <div>
                                   <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
                                        <ShieldCheck className="w-7 h-7 text-teal-600" />
                                   </div>
                                   <div className="font-semibold text-teal-900">Đặt chỗ an toàn</div>
                                   <p className="mt-2 text-teal-600 leading-relaxed text-sm">Xác nhận nhanh, bảo vệ thông tin và hỗ trợ khi có sự cố</p>
                              </div>
                              <div>
                                   <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center mb-4">
                                        <Sparkles className="w-7 h-7 text-teal-600" />
                                   </div>
                                   <div className="font-semibold text-teal-900">Trải nghiệm liền mạch</div>
                                   <p className="mt-2 text-teal-600 leading-relaxed text-sm">Tìm kiếm – chọn giờ – đặt sân nhanh chóng chỉ trong vài bước</p>
                              </div>
                         </div>
                    </div>
               </Container>
          </ScrollReveal>
     );
};


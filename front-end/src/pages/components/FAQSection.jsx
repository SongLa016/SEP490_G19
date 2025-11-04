import { ScrollReveal } from "../../shared/components/ScrollReveal";

export const FAQSection = () => {
     const faqs = [
          { q: "Làm sao để đặt sân?", a: "Bạn chọn sân, khung giờ trống và đăng nhập để xác nhận đặt." },
          { q: "Có thể hủy/đổi giờ không?", a: "Phụ thuộc chính sách từng sân. Bạn xem chi tiết trong mục đặt sân của mình." },
          { q: "Thanh toán thế nào?", a: "Hỗ trợ nhiều phương thức: Momo, VNPay, ZaloPay, v.v." },
     ];

     return (
          <ScrollReveal direction="up" delay={0.1}>
               <div className="py-16" >
               <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-10">
                         <h2 className="text-3xl font-bold text-teal-900 mb-3">Câu hỏi thường gặp</h2>
                         <p className="text-teal-600">Một số thắc mắc phổ biến khi đặt sân</p>
                    </div>
                    <div className="space-y-4 ">
                         {faqs.map((item, idx) => (
                              <div key={idx} className="border border-teal-200 p-4 rounded-xl">
                                   <div className="font-semibold text-teal-900">{item.q}</div>
                                   <div className="text-teal-600 mt-1">{item.a}</div>
                              </div>
                         ))}
                    </div>
               </div>
               </div>
          </ScrollReveal>
     );
};


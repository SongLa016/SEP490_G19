import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Shield, Users, CreditCard, AlertTriangle, Scale, Mail } from "lucide-react";

export default function TermsOfService() {
     useEffect(() => {
          window.scrollTo(0, 0);
     }, []);

     const sections = [
          {
               id: "introduction",
               icon: FileText,
               title: "1. Giới thiệu",
               content: (
                    <>
                         <p>Chào mừng bạn đến với <strong>BallSport</strong> - nền tảng đặt sân bóng đá trực tuyến hàng đầu Việt Nam.</p>
                         <p className="mt-2">Bằng việc truy cập và sử dụng dịch vụ của chúng tôi, bạn đồng ý tuân thủ và chịu ràng buộc bởi các điều khoản và điều kiện sau đây. Vui lòng đọc kỹ trước khi sử dụng.</p>
                         <p className="mt-2">Điều khoản này có hiệu lực từ ngày bạn đăng ký tài khoản hoặc sử dụng dịch vụ của chúng tôi.</p>
                    </>
               ),
          },
          {
               id: "definitions",
               icon: FileText,
               title: "2. Định nghĩa",
               content: (
                    <ul className="list-disc pl-5 space-y-2">
                         <li><strong>"Nền tảng"</strong>: Website và ứng dụng BallSport</li>
                         <li><strong>"Người dùng"</strong>: Cá nhân đăng ký và sử dụng dịch vụ đặt sân</li>
                         <li><strong>"Chủ sân"</strong>: Cá nhân hoặc tổ chức đăng ký cung cấp dịch vụ cho thuê sân</li>
                         <li><strong>"Dịch vụ"</strong>: Các tính năng đặt sân, thanh toán, quản lý lịch đặt và các tiện ích liên quan</li>
                         <li><strong>"Nội dung"</strong>: Thông tin, hình ảnh, đánh giá, bình luận do người dùng tạo ra</li>
                    </ul>
               ),
          },
          {
               id: "account",
               icon: Users,
               title: "3. Tài khoản người dùng",
               content: (
                    <>
                         <h4 className="font-semibold text-gray-800 mb-2">3.1. Đăng ký tài khoản</h4>
                         <ul className="list-disc pl-5 space-y-1 mb-4">
                              <li>Bạn phải từ 16 tuổi trở lên để đăng ký tài khoản</li>
                              <li>Thông tin đăng ký phải chính xác, đầy đủ và cập nhật</li>
                              <li>Mỗi người chỉ được sở hữu một tài khoản</li>
                              <li>Không được chuyển nhượng tài khoản cho người khác</li>
                         </ul>
                         <h4 className="font-semibold text-gray-800 mb-2">3.2. Bảo mật tài khoản</h4>
                         <ul className="list-disc pl-5 space-y-1">
                              <li>Bạn chịu trách nhiệm bảo mật thông tin đăng nhập</li>
                              <li>Thông báo ngay cho chúng tôi nếu phát hiện truy cập trái phép</li>
                              <li>Chúng tôi không chịu trách nhiệm cho các thiệt hại do lộ thông tin tài khoản</li>
                         </ul>
                    </>
               ),
          },
          {
               id: "booking",
               icon: CreditCard,
               title: "4. Quy định đặt sân và thanh toán",
               content: (
                    <>
                         <h4 className="font-semibold text-gray-800 mb-2">4.1. Quy trình đặt sân</h4>
                         <ul className="list-disc pl-5 space-y-1 mb-4">
                              <li>Chọn sân, khung giờ và xác nhận thông tin đặt sân</li>
                              <li>Thanh toán đặt cọc hoặc toàn bộ theo quy định của chủ sân</li>
                              <li>Nhận xác nhận đặt sân qua email và thông báo trên ứng dụng</li>
                              <li>Đến sân đúng giờ và xuất trình mã đặt sân</li>
                         </ul>
                         <h4 className="font-semibold text-gray-800 mb-2">4.2. Thanh toán</h4>
                         <ul className="list-disc pl-5 space-y-1 mb-4">
                              <li>Hỗ trợ thanh toán qua: Chuyển khoản ngân hàng, Ví điện tử (MoMo, ZaloPay, VNPay)</li>
                              <li>Giá hiển thị đã bao gồm thuế VAT (nếu có)</li>
                              <li>Hóa đơn điện tử được gửi qua email sau khi thanh toán thành công</li>
                         </ul>
                         <h4 className="font-semibold text-gray-800 mb-2">4.3. Hủy và hoàn tiền</h4>
                         <ul className="list-disc pl-5 space-y-1">
                              <li>Chính sách hủy áp dụng theo quy định của từng chủ sân</li>
                              <li>Hoàn tiền trong vòng 3-7 ngày làm việc tùy phương thức thanh toán</li>
                              <li>Phí hủy có thể áp dụng tùy theo thời điểm hủy</li>
                         </ul>
                    </>
               ),
          },
          {
               id: "conduct",
               icon: AlertTriangle,
               title: "5. Quy tắc ứng xử",
               content: (
                    <>
                         <h4 className="font-semibold text-gray-800 mb-2">5.1. Người dùng cam kết KHÔNG:</h4>
                         <ul className="list-disc pl-5 space-y-1 mb-4">
                              <li>Cung cấp thông tin sai lệch, gian lận</li>
                              <li>Sử dụng dịch vụ cho mục đích bất hợp pháp</li>
                              <li>Quấy rối, đe dọa người dùng khác hoặc chủ sân</li>
                              <li>Đăng nội dung vi phạm pháp luật, thuần phong mỹ tục</li>
                              <li>Can thiệp, phá hoại hệ thống của nền tảng</li>
                              <li>Sử dụng bot, script tự động để đặt sân</li>
                         </ul>
                         <h4 className="font-semibold text-gray-800 mb-2">5.2. Chủ sân cam kết:</h4>
                         <ul className="list-disc pl-5 space-y-1">
                              <li>Cung cấp thông tin sân chính xác, cập nhật</li>
                              <li>Đảm bảo chất lượng sân như mô tả</li>
                              <li>Xử lý đặt sân và hoàn tiền đúng quy định</li>
                              <li>Hỗ trợ khách hàng kịp thời, chuyên nghiệp</li>
                         </ul>
                    </>
               ),
          },
          {
               id: "liability",
               icon: Scale,
               title: "6. Giới hạn trách nhiệm",
               content: (
                    <>
                         <p className="mb-3">BallSport hoạt động như nền tảng trung gian kết nối người đặt sân và chủ sân. Chúng tôi:</p>
                         <ul className="list-disc pl-5 space-y-2">
                              <li><strong>Không chịu trách nhiệm</strong> về chất lượng thực tế của sân bóng</li>
                              <li><strong>Không chịu trách nhiệm</strong> về các tranh chấp giữa người dùng và chủ sân</li>
                              <li><strong>Không chịu trách nhiệm</strong> về thiệt hại gián tiếp, mất dữ liệu, mất lợi nhuận</li>
                              <li><strong>Có quyền</strong> tạm ngưng hoặc chấm dứt dịch vụ để bảo trì, nâng cấp</li>
                              <li><strong>Có quyền</strong> khóa tài khoản vi phạm điều khoản sử dụng</li>
                         </ul>
                         <p className="mt-3">Trách nhiệm bồi thường tối đa của chúng tôi không vượt quá số tiền bạn đã thanh toán trong 12 tháng gần nhất.</p>
                    </>
               ),
          },
          {
               id: "intellectual",
               icon: Shield,
               title: "7. Quyền sở hữu trí tuệ",
               content: (
                    <ul className="list-disc pl-5 space-y-2">
                         <li>Logo, thương hiệu, giao diện của BallSport thuộc sở hữu của chúng tôi</li>
                         <li>Nội dung do người dùng tạo ra vẫn thuộc quyền sở hữu của người dùng</li>
                         <li>Bạn cấp cho chúng tôi quyền sử dụng nội dung để vận hành dịch vụ</li>
                         <li>Không được sao chép, phân phối nội dung của nền tảng khi chưa được phép</li>
                    </ul>
               ),
          },
          {
               id: "changes",
               icon: FileText,
               title: "8. Thay đổi điều khoản",
               content: (
                    <>
                         <p>Chúng tôi có quyền cập nhật điều khoản này bất cứ lúc nào. Khi có thay đổi quan trọng:</p>
                         <ul className="list-disc pl-5 space-y-1 mt-2">
                              <li>Thông báo qua email đăng ký</li>
                              <li>Hiển thị thông báo trên nền tảng</li>
                              <li>Điều khoản mới có hiệu lực sau 7 ngày kể từ ngày thông báo</li>
                         </ul>
                         <p className="mt-2">Việc tiếp tục sử dụng dịch vụ sau khi điều khoản được cập nhật đồng nghĩa với việc bạn chấp nhận các thay đổi.</p>
                    </>
               ),
          },
          {
               id: "contact",
               icon: Mail,
               title: "9. Liên hệ",
               content: (
                    <>
                         <p className="mb-3">Nếu có thắc mắc về Điều khoản dịch vụ, vui lòng liên hệ:</p>
                         <div className="bg-gray-50 p-4 rounded-lg">
                              <p><strong>Bộ phận Bảo mật - BallSport</strong></p>
                              <p className="mt-2">📍 Địa chỉ: Thạch Hòa, Thạch Thất, Hà Nội</p>
                              <p>📧 Email: songla01062003@gmail.com</p>
                              <p>📞 Hotline: 0914347668(8:00 - 22:00)</p>
                         </div>
                    </>
               ),
          },
     ];

     return (
          <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">

               {/* Header */}
               <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
                    <div className="max-w-4xl mx-auto px-4 py-12">
                         <Link to="/auth" className="inline-flex items-center gap-2 text-teal-100 hover:text-white mb-6 transition-colors">
                              <ArrowLeft className="w-4 h-4" />
                              Quay lại
                         </Link>
                         <h1 className="text-3xl md:text-4xl font-bold mb-4">Điều khoản dịch vụ</h1>
                         <p className="text-teal-100">Cập nhật lần cuối: 18/12/2024</p>
                    </div>
               </div>

               {/* Table of Contents */}
               <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
                         <h2 className="text-lg font-semibold text-gray-800 mb-4">Mục lục</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {sections.map((section) => (
                                   <a
                                        key={section.id}
                                        href={`#${section.id}`}
                                        className="text-teal-600 hover:text-teal-700 hover:underline text-sm"
                                   >
                                        {section.title}
                                   </a>
                              ))}
                         </div>
                    </div>

                    {/* Content Sections */}
                    <div className="space-y-8">
                         {sections.map((section) => {
                              const Icon = section.icon;
                              return (
                                   <section
                                        key={section.id}
                                        id={section.id}
                                        className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 scroll-mt-4"
                                   >
                                        <div className="flex items-center gap-3 mb-4">
                                             <div className="p-2 bg-teal-100 rounded-lg">
                                                  <Icon className="w-5 h-5 text-teal-600" />
                                             </div>
                                             <h2 className="text-xl font-semibold text-gray-800">{section.title}</h2>
                                        </div>
                                        <div className="text-gray-600 leading-relaxed">{section.content}</div>
                                   </section>
                              );
                         })}
                    </div>

                    {/* Footer Note */}
                    <div className="mt-12 text-center text-gray-500 text-sm pb-8">
                         <p>Bằng việc sử dụng BallSport, bạn xác nhận đã đọc và đồng ý với các điều khoản trên.</p>
                         <div className="mt-4 flex justify-center gap-4">
                              <Link to="/privacy-policy" className="text-teal-600 hover:underline">
                                   Chính sách bảo mật
                              </Link>
                              <span>•</span>
                              <Link to="/" className="text-teal-600 hover:underline">
                                   Trang chủ
                              </Link>
                         </div>
                    </div>
               </div>
          </div>
     );
}

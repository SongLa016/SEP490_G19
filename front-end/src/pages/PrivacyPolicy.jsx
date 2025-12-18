import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Database, Eye, Lock, Share2, Cookie, UserCheck, Bell, Mail } from "lucide-react";

export default function PrivacyPolicy() {
     useEffect(() => {
          window.scrollTo(0, 0);
     }, []);

     const sections = [
          {
               id: "introduction",
               icon: Shield,
               title: "1. Giới thiệu",
               content: (
                    <>
                         <p><strong>BallSport</strong> cam kết bảo vệ quyền riêng tư của bạn. Chính sách này giải thích cách chúng tôi thu thập, sử dụng, lưu trữ và bảo vệ thông tin cá nhân của bạn.</p>
                         <p className="mt-2">Chính sách này áp dụng cho tất cả người dùng sử dụng website và ứng dụng của BallSport tại Việt Nam.</p>
                         <p className="mt-2">Bằng việc sử dụng dịch vụ, bạn đồng ý với việc thu thập và xử lý thông tin theo chính sách này.</p>
                    </>
               ),
          },
          {
               id: "data-collection",
               icon: Database,
               title: "2. Thông tin chúng tôi thu thập",
               content: (
                    <>
                         <h4 className="font-semibold text-gray-800 mb-2">2.1. Thông tin bạn cung cấp trực tiếp:</h4>
                         <ul className="list-disc pl-5 space-y-1 mb-4">
                              <li>Họ tên, email, số điện thoại khi đăng ký tài khoản</li>
                              <li>Thông tin thanh toán (số tài khoản, thông tin thẻ)</li>
                              <li>Ảnh đại diện, thông tin hồ sơ cá nhân</li>
                              <li>Nội dung đánh giá, bình luận, phản hồi</li>
                              <li>Thông tin liên hệ khi gửi yêu cầu hỗ trợ</li>
                         </ul>
                         <h4 className="font-semibold text-gray-800 mb-2">2.2. Thông tin thu thập tự động:</h4>
                         <ul className="list-disc pl-5 space-y-1 mb-4">
                              <li>Địa chỉ IP, loại trình duyệt, thiết bị sử dụng</li>
                              <li>Vị trí địa lý (khi bạn cho phép)</li>
                              <li>Lịch sử đặt sân, tìm kiếm, tương tác trên nền tảng</li>
                              <li>Thời gian truy cập, trang đã xem</li>
                              <li>Thông tin từ cookie và công nghệ tương tự</li>
                         </ul>
                         <h4 className="font-semibold text-gray-800 mb-2">2.3. Thông tin từ bên thứ ba:</h4>
                         <ul className="list-disc pl-5 space-y-1">
                              <li>Thông tin từ đăng nhập mạng xã hội (Google)</li>
                              <li>Thông tin từ đối tác thanh toán</li>
                         </ul>
                    </>
               ),
          },
          {
               id: "data-usage",
               icon: Eye,
               title: "3. Mục đích sử dụng thông tin",
               content: (
                    <>
                         <p className="mb-3">Chúng tôi sử dụng thông tin của bạn để:</p>
                         <ul className="list-disc pl-5 space-y-2">
                              <li><strong>Cung cấp dịch vụ:</strong> Xử lý đặt sân, thanh toán, gửi xác nhận</li>
                              <li><strong>Cá nhân hóa trải nghiệm:</strong> Đề xuất sân phù hợp, hiển thị nội dung liên quan</li>
                              <li><strong>Liên lạc:</strong> Gửi thông báo đặt sân, cập nhật dịch vụ, khuyến mãi</li>
                              <li><strong>Hỗ trợ khách hàng:</strong> Giải đáp thắc mắc, xử lý khiếu nại</li>
                              <li><strong>Bảo mật:</strong> Phát hiện và ngăn chặn gian lận, lạm dụng</li>
                              <li><strong>Phân tích:</strong> Cải thiện dịch vụ, nghiên cứu xu hướng sử dụng</li>
                              <li><strong>Tuân thủ pháp luật:</strong> Đáp ứng yêu cầu của cơ quan có thẩm quyền</li>
                         </ul>
                    </>
               ),
          },
          {
               id: "data-sharing",
               icon: Share2,
               title: "4. Chia sẻ thông tin",
               content: (
                    <>
                         <p className="mb-3">Chúng tôi <strong>KHÔNG</strong> bán thông tin cá nhân của bạn. Thông tin chỉ được chia sẻ trong các trường hợp:</p>
                         <ul className="list-disc pl-5 space-y-2">
                              <li><strong>Với chủ sân:</strong> Thông tin cần thiết để xác nhận và phục vụ đặt sân (tên, số điện thoại)</li>
                              <li><strong>Đối tác thanh toán:</strong> Xử lý giao dịch thanh toán an toàn</li>
                              <li><strong>Nhà cung cấp dịch vụ:</strong> Hosting, email, phân tích (có ràng buộc bảo mật)</li>
                              <li><strong>Yêu cầu pháp lý:</strong> Khi có yêu cầu từ cơ quan nhà nước có thẩm quyền</li>
                              <li><strong>Bảo vệ quyền lợi:</strong> Ngăn chặn gian lận, bảo vệ an toàn người dùng</li>
                         </ul>
                    </>
               ),
          },
          {
               id: "data-security",
               icon: Lock,
               title: "5. Bảo mật thông tin",
               content: (
                    <>
                         <p className="mb-3">Chúng tôi áp dụng các biện pháp bảo mật tiêu chuẩn ngành:</p>
                         <ul className="list-disc pl-5 space-y-2">
                              <li><strong>Mã hóa SSL/TLS:</strong> Bảo vệ dữ liệu truyền tải</li>
                              <li><strong>Mã hóa mật khẩu:</strong> Sử dụng thuật toán băm một chiều</li>
                              <li><strong>Kiểm soát truy cập:</strong> Chỉ nhân viên được ủy quyền mới truy cập dữ liệu</li>
                              <li><strong>Giám sát 24/7:</strong> Phát hiện và ngăn chặn xâm nhập</li>
                              <li><strong>Sao lưu định kỳ:</strong> Đảm bảo khôi phục dữ liệu khi cần</li>
                              <li><strong>Đánh giá bảo mật:</strong> Kiểm tra và cập nhật thường xuyên</li>
                         </ul>
                         <p className="mt-3 text-sm text-gray-500">Lưu ý: Không có hệ thống nào an toàn 100%. Chúng tôi khuyến khích bạn bảo vệ thông tin đăng nhập và báo cáo ngay khi phát hiện bất thường.</p>
                    </>
               ),
          },
          {
               id: "cookies",
               icon: Cookie,
               title: "6. Cookie và công nghệ theo dõi",
               content: (
                    <>
                         <p className="mb-3">Chúng tôi sử dụng cookie và công nghệ tương tự để:</p>
                         <ul className="list-disc pl-5 space-y-2 mb-4">
                              <li><strong>Cookie thiết yếu:</strong> Duy trì phiên đăng nhập, bảo mật</li>
                              <li><strong>Cookie chức năng:</strong> Ghi nhớ tùy chọn ngôn ngữ, vị trí</li>
                              <li><strong>Cookie phân tích:</strong> Thống kê lượt truy cập, hành vi người dùng</li>
                              <li><strong>Cookie quảng cáo:</strong> Hiển thị quảng cáo phù hợp (nếu có)</li>
                         </ul>
                         <div className="bg-teal-50 p-4 rounded-lg">
                              <p className="font-medium text-teal-800">Quản lý cookie:</p>
                              <p className="text-sm text-teal-700 mt-1">Bạn có thể tắt cookie trong cài đặt trình duyệt. Tuy nhiên, một số tính năng có thể không hoạt động đúng.</p>
                         </div>
                    </>
               ),
          },
          {
               id: "user-rights",
               icon: UserCheck,
               title: "7. Quyền của bạn",
               content: (
                    <>
                         <p className="mb-3">Theo quy định pháp luật Việt Nam, bạn có các quyền sau:</p>
                         <ul className="list-disc pl-5 space-y-2">
                              <li><strong>Quyền truy cập:</strong> Xem thông tin cá nhân chúng tôi lưu trữ</li>
                              <li><strong>Quyền chỉnh sửa:</strong> Cập nhật thông tin không chính xác</li>
                              <li><strong>Quyền xóa:</strong> Yêu cầu xóa tài khoản và dữ liệu liên quan</li>
                              <li><strong>Quyền hạn chế:</strong> Giới hạn cách chúng tôi sử dụng thông tin</li>
                              <li><strong>Quyền phản đối:</strong> Từ chối nhận email marketing</li>
                              <li><strong>Quyền di chuyển:</strong> Nhận bản sao dữ liệu của bạn</li>
                         </ul>
                         <p className="mt-3">Để thực hiện các quyền này, vui lòng liên hệ qua email: <strong>songla01062003@gmail.com</strong></p>
                    </>
               ),
          },
          {
               id: "data-retention",
               icon: Database,
               title: "8. Thời gian lưu trữ",
               content: (
                    <ul className="list-disc pl-5 space-y-2">
                         <li><strong>Thông tin tài khoản:</strong> Lưu trữ trong suốt thời gian tài khoản hoạt động</li>
                         <li><strong>Lịch sử đặt sân:</strong> 5 năm kể từ ngày giao dịch (theo quy định kế toán)</li>
                         <li><strong>Thông tin thanh toán:</strong> Theo yêu cầu của đối tác thanh toán và pháp luật</li>
                         <li><strong>Log hệ thống:</strong> 12 tháng cho mục đích bảo mật</li>
                         <li><strong>Sau khi xóa tài khoản:</strong> Dữ liệu được ẩn danh hoặc xóa trong 30 ngày</li>
                    </ul>
               ),
          },
          {
               id: "updates",
               icon: Bell,
               title: "9. Cập nhật chính sách",
               content: (
                    <>
                         <p>Chúng tôi có thể cập nhật chính sách này định kỳ. Khi có thay đổi quan trọng:</p>
                         <ul className="list-disc pl-5 space-y-1 mt-2">
                              <li>Thông báo qua email đăng ký</li>
                              <li>Hiển thị banner thông báo trên website</li>
                              <li>Cập nhật ngày "Cập nhật lần cuối" ở đầu trang</li>
                         </ul>
                         <p className="mt-2">Chúng tôi khuyến khích bạn xem lại chính sách này thường xuyên.</p>
                    </>
               ),
          },
          {
               id: "contact",
               icon: Mail,
               title: "10. Liên hệ",
               content: (
                    <>
                         <p className="mb-3">Nếu có câu hỏi về Chính sách bảo mật, vui lòng liên hệ:</p>
                         <div className="bg-gray-50 p-4 rounded-lg">
                              <p><strong>Bộ phận Bảo mật - BallSport</strong></p>
                              <p className="mt-2">📍 Địa chỉ: Thạch Hòa, Thạch Thất, Hà Nội</p>
                              <p>📧 Email: songla01062003@gmail.com</p>
                              <p>📞 Hotline: 0914347668(8:00 - 22:00)</p>
                         </div>
                         <p className="mt-4 text-sm text-gray-500">Chúng tôi sẽ phản hồi trong vòng 7 ngày làm việc.</p>
                    </>
               ),
          },
     ];

     return (
          <div className="min-h-screen bg-gradient-to-b from-teal-50 to-white">
               {/* Header */}
               <div className="bg-gradient-to-r from-teal-600 to-teal-700 text-white">
                    <div className="max-w-4xl mx-auto px-4 py-10s">
                         <Link to="/auth" className="inline-flex items-center gap-2 text-teal-100 hover:text-white mb-6 transition-colors">
                              <ArrowLeft className="w-4 h-4" />
                              Quay lại
                         </Link>
                         <div className="flex items-center gap-3 mb-4">
                              <Shield className="w-10 h-10" />
                              <h1 className="text-3xl md:text-4xl font-bold">Chính sách bảo mật</h1>
                         </div>
                         <p className="text-teal-100">Cập nhật lần cuối: 18/12/2024</p>
                    </div>
               </div>


               {/* Quick Summary */}
               <div className="max-w-4xl mx-auto px-4 py-8">
                    <div className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-xl p-6 text-white mb-8">
                         <h2 className="text-lg font-semibold mb-3">Tóm tắt nhanh</h2>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div className="flex items-start gap-2">
                                   <Lock className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                   <span>Dữ liệu được mã hóa và bảo vệ an toàn</span>
                              </div>
                              <div className="flex items-start gap-2">
                                   <Share2 className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                   <span>Không bán thông tin cho bên thứ ba</span>
                              </div>
                              <div className="flex items-start gap-2">
                                   <UserCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
                                   <span>Bạn có quyền kiểm soát dữ liệu của mình</span>
                              </div>
                         </div>
                    </div>

                    {/* Table of Contents */}
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
                         <p>Chúng tôi cam kết bảo vệ quyền riêng tư của bạn.</p>
                         <div className="mt-4 flex justify-center gap-4">
                              <Link to="/terms-of-service" className="text-teal-600 hover:underline">
                                   Điều khoản dịch vụ
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

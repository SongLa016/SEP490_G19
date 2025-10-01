import React from "react";
import { Receipt, MapPin, Calendar, Printer } from "lucide-react";
import { Container, Card, CardContent, Button } from "../../components/ui";

export default function Invoice({ user, navigateTo }) {
     // Mock invoice data
     const invoice = {
          id: "INV-20241215001",
          bookingId: "BK-20241215001",
          fieldName: "Sân bóng đá ABC",
          address: "123 Đường ABC, Quận 1, TP.HCM",
          date: "2024-12-15",
          time: "18:00-20:00",
          price: 400000,
          serviceFee: 15000,
          total() { return this.price + this.serviceFee; },
          paymentMethod: "VNPay",
          status: "paid",
          createdAt: "2024-12-10 10:30",
     };

     const formatPrice = (price) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(price);

     return (
          <Container className="max-w-3xl p-6">
               <Card className="overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-orange-500 px-6 py-8 text-white flex items-center justify-between">
                         <div>
                              <h1 className="text-2xl font-bold">Hóa đơn thanh toán</h1>
                              <p className="text-teal-100">Mã hóa đơn: {invoice.id}</p>
                         </div>
                         <Button onClick={() => window.print()} className="bg-white/20 hover:bg-white/30 px-4 py-2">
                              <Printer className="w-4 h-4 mr-2" /> In hóa đơn
                         </Button>
                    </div>

                    <CardContent>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <div>
                                   <h2 className="text-gray-900 font-semibold mb-2">Thông tin đặt sân</h2>
                                   <div className="text-sm text-gray-700">
                                        <div className="font-medium">{invoice.fieldName}</div>
                                        <div className="flex items-center text-gray-600 mt-1">
                                             <MapPin className="w-4 h-4 mr-1" /> {invoice.address}
                                        </div>
                                        <div className="flex items-center text-gray-600 mt-1">
                                             <Calendar className="w-4 h-4 mr-1" /> {invoice.date} • {invoice.time}
                                        </div>
                                   </div>
                              </div>
                              <div>
                                   <h2 className="text-gray-900 font-semibold mb-2">Thông tin thanh toán</h2>
                                   <div className="text-sm text-gray-700 space-y-1">
                                        <div>Phương thức: <span className="font-medium">{invoice.paymentMethod}</span></div>
                                        <div>Trạng thái: <span className="font-medium text-green-600">Đã thanh toán</span></div>
                                        <div>Ngày tạo: <span className="font-medium">{invoice.createdAt}</span></div>
                                        <div>Mã đặt sân: <span className="font-medium">{invoice.bookingId}</span></div>
                                   </div>
                              </div>
                         </div>

                         <div className="border-t my-6"></div>

                         <div>
                              <h2 className="text-gray-900 font-semibold mb-3">Chi tiết thanh toán</h2>
                              <div className="bg-gray-50 rounded-lg p-4 text-sm">
                                   <div className="flex justify-between">
                                        <span>Tiền sân</span>
                                        <span className="font-medium">{formatPrice(invoice.price)}</span>
                                   </div>
                                   <div className="flex justify-between">
                                        <span>Phí dịch vụ</span>
                                        <span className="font-medium">{formatPrice(invoice.serviceFee)}</span>
                                   </div>
                                   <div className="flex justify-between text-lg font-semibold mt-2">
                                        <span>Tổng cộng</span>
                                        <span className="text-teal-600">{formatPrice(invoice.total())}</span>
                                   </div>
                              </div>
                         </div>
                    </CardContent>
               </Card>
          </Container>
     );
}



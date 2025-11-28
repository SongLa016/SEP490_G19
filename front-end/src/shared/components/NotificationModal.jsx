import React, { useState, useEffect } from "react";
import {
     Card,
     CardHeader,
     CardTitle,
     CardContent,
     Button,
     Input,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
     Badge
} from "./ui";
import { Bell, Send, X, Users } from "lucide-react";
import { createNotification, createBulkNotifications } from "../services/notifications";
import { fetchAllUserStatistics } from "../services/adminStatistics";

export default function NotificationModal({ isOpen, onClose, preselectedUserId = null }) {
     const [users, setUsers] = useState([]);
     const [selectedRecipientId, setSelectedRecipientId] = useState(preselectedUserId?.toString() || "0");
     const [loading, setLoading] = useState(false);
     const [notificationData, setNotificationData] = useState({
          type: "System",
          message: ""
     });

     useEffect(() => {
          if (isOpen) {
               loadUsers();
               if (preselectedUserId) {
                    setSelectedRecipientId(preselectedUserId.toString());
               }
          }
     }, [isOpen, preselectedUserId]);

     const loadUsers = async () => {
          try {
               const result = await fetchAllUserStatistics();
               if (result.ok && result.data) {
                    const usersData = Array.isArray(result.data) ? result.data : (result.data.users || result.data.data || []);
                    const transformedUsers = usersData.map(user => ({
                         id: user.userId,
                         email: user.email,
                         fullName: user.fullName,
                         phone: user.phone || "N/A",
                         role: user.roleName
                    }));
                    setUsers(transformedUsers);
               }
          } catch (err) {
               console.error("Error loading users:", err);
          }
     };

     const handleSubmit = async () => {
          if (!notificationData.message.trim()) {
               alert("Vui lòng nhập nội dung thông báo");
               return;
          }

          try {
               setLoading(true);
               const recipientId = parseInt(selectedRecipientId);

               if (recipientId === 0) {
                    // Gửi hàng loạt cho tất cả
                    const notifications = users.map(user => ({
                         userId: user.id,
                         type: notificationData.type,
                         targetId: 0,
                         message: notificationData.message
                    }));

                    const result = await createBulkNotifications(notifications);

                    if (result.ok) {
                         alert(`Gửi thông báo thành công cho ${users.length} người dùng!`);
                         handleClose();
                    } else {
                         alert(result.reason || "Không thể gửi thông báo hàng loạt");
                    }
               } else {
                    // Gửi cho 1 người
                    const result = await createNotification({
                         userId: recipientId,
                         type: notificationData.type,
                         targetId: 0,
                         message: notificationData.message
                    });

                    if (result.ok) {
                         const recipient = users.find(u => u.id === recipientId);
                         alert(`Gửi thông báo thành công cho ${recipient?.fullName || 'người dùng'}!`);
                         handleClose();
                    } else {
                         alert(result.reason || "Không thể gửi thông báo");
                    }
               }
          } catch (err) {
               console.error("Error sending notification:", err);
               alert("Đã xảy ra lỗi khi gửi thông báo");
          } finally {
               setLoading(false);
          }
     };

     const handleClose = () => {
          setNotificationData({ type: "System", message: "" });
          setSelectedRecipientId("0");
          onClose();
     };

     if (!isOpen) return null;

     return (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
               <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                    <CardHeader className="border-b border-slate-200">
                         <div className="flex items-center justify-between">
                              <CardTitle className="text-xl font-bold">Tạo thông báo mới</CardTitle>
                              <Button onClick={handleClose} variant="ghost" size="sm">
                                   <X className="w-5 h-5" />
                              </Button>
                         </div>
                    </CardHeader>
                    <CardContent className="space-y-5 pt-6">
                         {/* Thông tin API */}
                         <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                              <div className="flex items-start space-x-2">
                                   <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                                   <div className="flex-1">
                                        <p className="font-semibold text-blue-900 mb-1">Thông tin API</p>
                                        <p className="text-sm text-blue-700">
                                             Thông báo sẽ được gửi theo format: userId, type, targetId, message
                                        </p>
                                   </div>
                              </div>
                         </div>

                         {/* Nội dung thông báo */}
                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Nội dung thông báo <span className="text-red-500">*</span>
                              </label>
                              <textarea
                                   value={notificationData.message}
                                   onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                                   placeholder="Nhập nội dung thông báo... (Ví dụ: Bạn có đặt sân mới, Hệ thống sẽ bảo trì từ 2:00-4:00, ...)"
                                   className="w-full min-h-[120px] px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-sm"
                              />
                              <p className="text-xs text-slate-500 mt-1">{notificationData.message.length} ký tự</p>
                         </div>

                         {/* Loại thông báo */}
                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Loại thông báo <span className="text-red-500">*</span>
                              </label>
                              <Select
                                   value={notificationData.type}
                                   onValueChange={(value) => setNotificationData({ ...notificationData, type: value })}
                              >
                                   <SelectTrigger className="w-full">
                                        <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="System">📢 System - Thông báo hệ thống</SelectItem>
                                        <SelectItem value="NewComment">💬 NewComment - Bình luận mới</SelectItem>
                                        <SelectItem value="Reply">↩️ Reply - Trả lời</SelectItem>
                                        <SelectItem value="Mention">@ Mention - Nhắc đến</SelectItem>
                                        <SelectItem value="Like">❤️ Like - Thích</SelectItem>
                                        <SelectItem value="ReportResult">⚠️ ReportResult - Kết quả báo cáo</SelectItem>
                                   </SelectContent>
                              </Select>
                              <p className="text-xs text-slate-500 mt-1">Loại thông báo xác định cách hiển thị và xử lý</p>
                         </div>

                         {/* User ID - Người nhận */}
                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   User ID (Người nhận)
                              </label>
                              <Select value={selectedRecipientId} onValueChange={setSelectedRecipientId}>
                                   <SelectTrigger className="w-full">
                                        <SelectValue />
                                   </SelectTrigger>
                                   <SelectContent className="max-h-[300px]">
                                        <SelectItem value="0">
                                             <div className="flex items-center space-x-2">
                                                  <Users className="w-4 h-4 text-blue-600" />
                                                  <span className="font-medium">0 = Gửi cho tất cả ({users.length} người)</span>
                                             </div>
                                        </SelectItem>
                                        {users.map((user) => (
                                             <SelectItem key={user.id} value={user.id.toString()}>
                                                  <div className="flex items-center space-x-2">
                                                       <div className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-xs font-semibold">
                                                            {user.fullName.charAt(0)}
                                                       </div>
                                                       <div className="flex-1">
                                                            <p className="font-medium text-sm">{user.fullName}</p>
                                                            <p className="text-xs text-slate-500">{user.email}</p>
                                                       </div>
                                                       <Badge className="text-xs">{user.role}</Badge>
                                                  </div>
                                             </SelectItem>
                                        ))}
                                   </SelectContent>
                              </Select>
                              <p className="text-xs text-slate-500 mt-1">
                                   Để trống hoặc nhập 0 để gửi thông báo hệ thống cho tất cả người dùng
                              </p>
                         </div>

                         {/* Target ID */}
                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Target ID (ID đối tượng liên quan)
                              </label>
                              <Input value="0" disabled placeholder="0 = Không áp dụng" className="bg-slate-50" />
                              <p className="text-xs text-slate-500 mt-1">
                                   ID của đối tượng liên quan (ví dụ: Booking ID, Post ID, Comment ID)
                              </p>
                         </div>

                         {/* Buttons */}
                         <div className="flex space-x-3 pt-4 border-t border-slate-200">
                              <Button
                                   onClick={handleSubmit}
                                   className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700"
                                   disabled={loading || !notificationData.message.trim()}
                              >
                                   {loading ? (
                                        <>
                                             <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                             Đang gửi...
                                        </>
                                   ) : (
                                        <>
                                             <Send className="w-4 h-4 mr-2" />
                                             Gửi thông báo
                                        </>
                                   )}
                              </Button>
                              <Button onClick={handleClose} variant="outline" className="flex-1" disabled={loading}>
                                   Hủy
                              </Button>
                         </div>
                    </CardContent>
               </Card>
          </div>
     );
}

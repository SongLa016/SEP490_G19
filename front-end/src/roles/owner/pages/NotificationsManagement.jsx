import React, { useState, useEffect } from "react";
import OwnerLayout from "../layouts/OwnerLayout";
import { useAuth } from "../../../contexts/AuthContext";
import { Card, Button, Input, Textarea, Modal } from "../../../shared/components/ui";
import { DemoRestrictedModal } from "../../../shared";
import {
     Bell,
     Plus,
     Edit,
     Trash2,
     Send,
     AlertTriangle,
     CheckCircle,
     Users,
     Target,
     Calendar,
     MessageSquare,
     AlertCircle,
} from "lucide-react";
import {
     fetchNotifications,
     createNotification,
     updateNotification,
     deleteNotification,
     getNotificationStats
} from "../../../shared/index";
import { fetchComplexes } from "../../../shared/index";

export default function NotificationsManagement({ isDemo = false }) {
     const { user, logout } = useAuth();
     const [notifications, setNotifications] = useState([]);
     const [complexes, setComplexes] = useState([]);
     const [stats, setStats] = useState(null);
     const [loading, setLoading] = useState(true);
     const [showModal, setShowModal] = useState(false);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [editingNotification, setEditingNotification] = useState(null);
     const [formData, setFormData] = useState({
          complexId: '',
          title: '',
          message: '',
          type: 'update',
          priority: 'medium',
          targetAudience: 'all_users',
          targetBookingIds: []
     });

     const notificationTypes = [
          { value: 'cancellation', label: 'Hủy đặt sân', icon: '❌', color: 'bg-red-100 text-red-800' },
          { value: 'maintenance', label: 'Bảo trì', icon: '🔧', color: 'bg-yellow-100 text-yellow-800' },
          { value: 'update', label: 'Cập nhật', icon: '📢', color: 'bg-blue-100 text-blue-800' },
          { value: 'promotion', label: 'Khuyến mãi', icon: '🎉', color: 'bg-green-100 text-green-800' }
     ];

     const priorityLevels = [
          { value: 'low', label: 'Thấp', color: 'bg-gray-100 text-gray-800' },
          { value: 'medium', label: 'Trung bình', color: 'bg-blue-100 text-blue-800' },
          { value: 'high', label: 'Cao', color: 'bg-orange-100 text-orange-800' },
          { value: 'urgent', label: 'Khẩn cấp', color: 'bg-red-100 text-red-800' }
     ];

     const targetAudiences = [
          { value: 'all_users', label: 'Tất cả người dùng' },
          { value: 'booking_users', label: 'Người đã đặt sân' }
     ];

     useEffect(() => {
          loadData();
     }, [user?.id]);

     const loadData = async () => {
          try {
               setLoading(true);
               const [notificationsData, complexesData, statsData] = await Promise.all([
                    fetchNotifications(user?.id || 1),
                    fetchComplexes(),
                    getNotificationStats(user?.id || 1)
               ]);

               // Filter complexes owned by current user
               const ownerComplexes = complexesData.filter(complex =>
                    complex.complexId === 101 || complex.complexId === 102 || complex.complexId === 103
               );

               setNotifications(notificationsData);
               setComplexes(ownerComplexes);
               setStats(statsData);
          } catch (error) {
               console.error('Error loading data:', error);
          } finally {
               setLoading(false);
          }
     };

     const handleCreateNotification = () => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setEditingNotification(null);
          setFormData({
               complexId: '',
               title: '',
               message: '',
               type: 'update',
               priority: 'medium',
               targetAudience: 'all_users',
               targetBookingIds: []
          });
          setShowModal(true);
     };

     const handleEditNotification = (notification) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          setEditingNotification(notification);
          setFormData({
               complexId: notification.complexId,
               title: notification.title,
               message: notification.message,
               type: notification.type,
               priority: notification.priority,
               targetAudience: notification.targetAudience,
               targetBookingIds: notification.targetBookingIds
          });
          setShowModal(true);
     };

     const handleSubmit = async (e) => {
          e.preventDefault();
          try {
               const notificationData = {
                    ...formData,
                    ownerId: user?.id || 1
               };

               if (editingNotification) {
                    await updateNotification(editingNotification.notificationId, notificationData);
               } else {
                    await createNotification(notificationData);
               }

               setShowModal(false);
               loadData();
          } catch (error) {
               console.error('Error saving notification:', error);
          }
     };

     const handleDeleteNotification = async (notificationId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }
          if (window.confirm('Bạn có chắc chắn muốn xóa thông báo này?')) {
               try {
                    await deleteNotification(notificationId);
                    loadData();
               } catch (error) {
                    console.error('Error deleting notification:', error);
               }
          }
     };

     const getComplexName = (complexId) => {
          const complex = complexes.find(c => c.complexId === complexId);
          return complex ? complex.name : 'Không xác định';
     };

     const getTypeInfo = (type) => {
          return notificationTypes.find(t => t.value === type) || notificationTypes[0];
     };

     const getPriorityInfo = (priority) => {
          return priorityLevels.find(p => p.value === priority) || priorityLevels[1];
     };

     const formatDate = (dateString) => {
          return new Date(dateString).toLocaleString("vi-VN");
     };

     if (loading) {
          return (
               <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
                    <div className="flex items-center justify-center h-64">
                         <div className="text-gray-500">Đang tải...</div>
                    </div>
               </OwnerLayout>
          );
     }

     return (
          <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
               <div className="space-y-6">
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-3xl font-bold text-gray-900">Quản lý thông báo</h1>
                              <p className="text-gray-600 mt-1">Gửi thông báo cho người dùng khi có thay đổi về sân</p>
                         </div>
                         <Button onClick={handleCreateNotification} className="flex items-center gap-2">
                              <Plus className="w-4 h-4" />
                              Gửi thông báo
                         </Button>
                    </div>

                    {/* Statistics */}
                    {stats && (
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                              <Card className="p-4">
                                   <div className="flex items-center gap-3">
                                        <Bell className="w-8 h-8 text-blue-600" />
                                        <div>
                                             <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                                             <div className="text-sm text-gray-600">Tổng thông báo</div>
                                        </div>
                                   </div>
                              </Card>
                              <Card className="p-4">
                                   <div className="flex items-center gap-3">
                                        <Send className="w-8 h-8 text-green-600" />
                                        <div>
                                             <div className="text-2xl font-bold text-gray-900">{stats.sent}</div>
                                             <div className="text-sm text-gray-600">Đã gửi</div>
                                        </div>
                                   </div>
                              </Card>
                              <Card className="p-4">
                                   <div className="flex items-center gap-3">
                                        <AlertCircle className="w-8 h-8 text-red-600" />
                                        <div>
                                             <div className="text-2xl font-bold text-gray-900">{stats.byPriority.urgent + stats.byPriority.high}</div>
                                             <div className="text-sm text-gray-600">Ưu tiên cao</div>
                                        </div>
                                   </div>
                              </Card>
                              <Card className="p-4">
                                   <div className="flex items-center gap-3">
                                        <MessageSquare className="w-8 h-8 text-purple-600" />
                                        <div>
                                             <div className="text-2xl font-bold text-gray-900">{stats.byType.cancellation}</div>
                                             <div className="text-sm text-gray-600">Hủy đặt sân</div>
                                        </div>
                                   </div>
                              </Card>
                         </div>
                    )}

                    {/* Notifications List */}
                    {notifications.length === 0 ? (
                         <Card className="p-6">
                              <div className="text-center py-12">
                                   <Bell className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                   <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có thông báo nào</h3>
                                   <p className="text-gray-500 mb-4">Gửi thông báo đầu tiên cho người dùng</p>
                                   <Button onClick={handleCreateNotification} className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        Gửi thông báo
                                   </Button>
                              </div>
                         </Card>
                    ) : (
                         <div className="grid gap-6">
                              {notifications.map((notification) => {
                                   const typeInfo = getTypeInfo(notification.type);
                                   const priorityInfo = getPriorityInfo(notification.priority);

                                   return (
                                        <Card key={notification.notificationId} className="p-6">
                                             <div className="flex items-start justify-between">
                                                  <div className="flex-1">
                                                       <div className="flex items-center gap-3 mb-2">
                                                            <span className="text-2xl">{typeInfo.icon}</span>
                                                            <h3 className="text-lg font-semibold text-gray-900">{notification.title}</h3>
                                                            <span className={`text-xs px-2 py-1 rounded-full ${typeInfo.color}`}>
                                                                 {typeInfo.label}
                                                            </span>
                                                            <span className={`text-xs px-2 py-1 rounded-full ${priorityInfo.color}`}>
                                                                 {priorityInfo.label}
                                                            </span>
                                                       </div>

                                                       <p className="text-gray-600 mb-3">{notification.message}</p>

                                                       <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                                                            <div className="flex items-center gap-1">
                                                                 <Target className="w-4 h-4" />
                                                                 <span>Sân: {getComplexName(notification.complexId)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                 <Users className="w-4 h-4" />
                                                                 <span>
                                                                      {notification.targetAudience === 'all_users'
                                                                           ? 'Tất cả người dùng'
                                                                           : 'Người đã đặt sân'
                                                                      }
                                                                 </span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                 <Calendar className="w-4 h-4" />
                                                                 <span>Gửi: {formatDate(notification.sentAt)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                 <CheckCircle className="w-4 h-4" />
                                                                 <span>{notification.isActive ? 'Đã gửi' : 'Chưa gửi'}</span>
                                                            </div>
                                                       </div>
                                                  </div>

                                                  <div className="flex items-center gap-2">
                                                       <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleEditNotification(notification)}
                                                            className="flex items-center gap-1"
                                                       >
                                                            <Edit className="w-4 h-4" />
                                                            Sửa
                                                       </Button>
                                                       <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteNotification(notification.notificationId)}
                                                            className="flex items-center gap-1 text-red-600 hover:text-red-700"
                                                       >
                                                            <Trash2 className="w-4 h-4" />
                                                            Xóa
                                                       </Button>
                                                  </div>
                                             </div>
                                        </Card>
                                   );
                              })}
                         </div>
                    )}

                    {/* Modal for creating/editing notification */}
                    <Modal
                         isOpen={showModal}
                         onClose={() => setShowModal(false)}
                         title={editingNotification ? 'Chỉnh sửa thông báo' : 'Gửi thông báo mới'}
                         size="lg"
                    >
                         <form onSubmit={handleSubmit} className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Sân áp dụng
                                        </label>
                                        <select
                                             value={formData.complexId}
                                             onChange={(e) => setFormData({ ...formData, complexId: e.target.value })}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                             required
                                        >
                                             <option value="">Chọn sân</option>
                                             {complexes.map((complex) => (
                                                  <option key={complex.complexId} value={complex.complexId}>
                                                       {complex.name}
                                                  </option>
                                             ))}
                                        </select>
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Loại thông báo
                                        </label>
                                        <select
                                             value={formData.type}
                                             onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                             required
                                        >
                                             {notificationTypes.map((type) => (
                                                  <option key={type.value} value={type.value}>
                                                       {type.icon} {type.label}
                                                  </option>
                                             ))}
                                        </select>
                                   </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Mức độ ưu tiên
                                        </label>
                                        <select
                                             value={formData.priority}
                                             onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                             required
                                        >
                                             {priorityLevels.map((priority) => (
                                                  <option key={priority.value} value={priority.value}>
                                                       {priority.label}
                                                  </option>
                                             ))}
                                        </select>
                                   </div>

                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                             Đối tượng nhận
                                        </label>
                                        <select
                                             value={formData.targetAudience}
                                             onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                                             className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                             required
                                        >
                                             {targetAudiences.map((audience) => (
                                                  <option key={audience.value} value={audience.value}>
                                                       {audience.label}
                                                  </option>
                                             ))}
                                        </select>
                                   </div>
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tiêu đề thông báo
                                   </label>
                                   <Input
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ví dụ: Sân bị hỏng - Hủy đặt sân"
                                        required
                                   />
                              </div>

                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nội dung thông báo
                                   </label>
                                   <Textarea
                                        value={formData.message}
                                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                                        placeholder="Nhập nội dung chi tiết của thông báo..."
                                        rows={4}
                                        required
                                   />
                              </div>

                              <div className="flex items-center gap-2 pt-4">
                                   <AlertTriangle className="w-4 h-4 text-amber-500" />
                                   <span className="text-sm text-gray-600">
                                        Thông báo sẽ được gửi ngay lập tức đến người dùng được chọn
                                   </span>
                              </div>

                              <div className="flex justify-end gap-3 pt-4">
                                   <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setShowModal(false)}
                                   >
                                        Hủy
                                   </Button>
                                   <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
                                        <Send className="w-4 h-4 mr-2" />
                                        {editingNotification ? 'Cập nhật' : 'Gửi thông báo'}
                                   </Button>
                              </div>
                         </form>
                    </Modal>

                    {/* Demo Restricted Modal */}
                    <DemoRestrictedModal
                         isOpen={showDemoRestrictedModal}
                         onClose={() => setShowDemoRestrictedModal(false)}
                         featureName="Thông báo"
                    />
               </div>
          </OwnerLayout>
     );
}



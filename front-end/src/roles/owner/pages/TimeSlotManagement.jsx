import React, { useState, useEffect, useCallback } from 'react';
import { Button, Card, Input, Modal, Table, Badge, Alert, AlertDescription } from '../../../shared/components/ui';
import {
     Plus,
     Edit,
     Trash2,
     Clock,
     Save,
     X,
     Calendar,
     Timer,
     AlertCircle,
     Info,
     ChevronRight,
     Settings,
     BarChart3
} from 'lucide-react';
import { fetchTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot } from '../../../shared/services/timeSlots';
import { DemoRestrictedModal } from '../../../shared';
import OwnerLayout from '../layouts/OwnerLayout';
import { useAuth } from '../../../contexts/AuthContext';


export default function TimeSlotManagement({ isDemo = false }) {
     const [timeSlots, setTimeSlots] = useState([]);
     const [loading, setLoading] = useState(false);
     const [showModal, setShowModal] = useState(false);
     const [editingSlot, setEditingSlot] = useState(null);
     const [showDemoRestrictedModal, setShowDemoRestrictedModal] = useState(false);
     const [activeTab, setActiveTab] = useState('overview');
     const [formData, setFormData] = useState({
          SlotName: '',
          StartTime: '',
          EndTime: ''
     });
     const { user, logout } = useAuth();

     const loadData = useCallback(async () => {
          setLoading(true);
          try {
               const result = await fetchTimeSlots();
               if (result.success) {
                    setTimeSlots(result.data);
               } else {
                    console.error('Error loading time slots:', result.error);
               }
          } catch (error) {
               console.error('Error loading time slots:', error);
          } finally {
               setLoading(false);
          }
     }, []);

     useEffect(() => {
          loadData();
     }, [loadData]);

     const handleOpenModal = (slot = null) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          if (slot) {
               setEditingSlot(slot);
               setFormData({
                    SlotName: slot.SlotName,
                    StartTime: slot.StartTime,
                    EndTime: slot.EndTime
               });
          } else {
               setEditingSlot(null);
               setFormData({
                    SlotName: '',
                    StartTime: '',
                    EndTime: ''
               });
          }
          setShowModal(true);
     };

     const handleCloseModal = () => {
          setShowModal(false);
          setEditingSlot(null);
          setFormData({
               SlotName: '',
               StartTime: '',
               EndTime: ''
          });
     };

     const handleSubmit = async (e) => {
          e.preventDefault();

          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          try {
               let result;
               if (editingSlot) {
                    result = await updateTimeSlot(editingSlot.SlotID, formData);
               } else {
                    result = await createTimeSlot(formData);
               }

               if (result.success) {
                    handleCloseModal();
                    loadData();
               } else {
                    alert(result.error);
               }
          } catch (error) {
               console.error('Error saving time slot:', error);
               alert('Có lỗi xảy ra khi lưu slot thời gian');
          }
     };

     const handleDelete = async (slotId) => {
          if (isDemo) {
               setShowDemoRestrictedModal(true);
               return;
          }

          if (window.confirm('Bạn có chắc chắn muốn xóa slot thời gian này?')) {
               try {
                    const result = await deleteTimeSlot(slotId);
                    if (result.success) {
                         loadData();
                    } else {
                         alert(result.error);
                    }
               } catch (error) {
                    console.error('Error deleting time slot:', error);
                    alert('Có lỗi xảy ra khi xóa slot thời gian');
               }
          }
     };

     const formatTime = (timeString) => {
          const [hours, minutes] = timeString.split(':');
          return `${hours}:${minutes}`;
     };

     const getTotalHours = () => {
          return timeSlots.reduce((total, slot) => {
               const start = new Date(`2000-01-01T${slot.StartTime}`);
               const end = new Date(`2000-01-01T${slot.EndTime}`);
               const duration = (end - start) / (1000 * 60 * 60);
               return total + duration;
          }, 0);
     };

     const navigationItems = [
          { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
          { id: 'manage', label: 'Quản lý', icon: Settings },
          { id: 'calendar', label: 'Lịch trình', icon: Calendar }
     ];

     const columns = [
          {
               key: 'SlotName',
               title: 'Tên Slot',
               render: (slot) => (
                    <div className="flex items-center space-x-3">
                         <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <Timer className="w-5 h-5 text-white" />
                         </div>
                         <div>
                              <span className="font-semibold text-gray-900">{slot.SlotName}</span>
                              <p className="text-sm text-gray-500">Slot thời gian</p>
                         </div>
                    </div>
               )
          },
          {
               key: 'StartTime',
               title: 'Giờ Bắt Đầu',
               render: (slot) => (
                    <div className="flex items-center space-x-2">
                         <Clock className="w-4 h-4 text-green-500" />
                         <span className="font-medium text-gray-900">{formatTime(slot.StartTime)}</span>
                    </div>
               )
          },
          {
               key: 'EndTime',
               title: 'Giờ Kết Thúc',
               render: (slot) => (
                    <div className="flex items-center space-x-2">
                         <Clock className="w-4 h-4 text-red-500" />
                         <span className="font-medium text-gray-900">{formatTime(slot.EndTime)}</span>
                    </div>
               )
          },
          {
               key: 'Duration',
               title: 'Thời Gian',
               render: (slot) => {
                    const start = new Date(`2000-01-01T${slot.StartTime}`);
                    const end = new Date(`2000-01-01T${slot.EndTime}`);
                    const duration = (end - start) / (1000 * 60 * 60);
                    return (
                         <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                              {duration} giờ
                         </Badge>
                    );
               }
          },
          {
               key: 'actions',
               title: 'Thao Tác',
               render: (slot) => (
                    <div className="flex items-center space-x-2">
                         <Button
                              onClick={() => handleOpenModal(slot)}
                              variant="outline"
                              size="sm"
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-200"
                         >
                              <Edit className="w-4 h-4" />
                         </Button>
                         <Button
                              onClick={() => handleDelete(slot.SlotID)}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                         >
                              <Trash2 className="w-4 h-4" />
                         </Button>
                    </div>
               )
          }
     ];

     const renderOverview = () => (
          <div className="space-y-6">
               {/* Stats Cards */}
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-blue-600">Tổng Slot</p>
                                   <p className="text-3xl font-bold text-blue-900">{timeSlots.length}</p>
                              </div>
                              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                                   <Timer className="w-6 h-6 text-white" />
                              </div>
                         </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-green-600">Tổng Giờ</p>
                                   <p className="text-3xl font-bold text-green-900">{getTotalHours()}</p>
                              </div>
                              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                                   <Clock className="w-6 h-6 text-white" />
                              </div>
                         </div>
                    </Card>

                    <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-purple-600">Trung Bình</p>
                                   <p className="text-3xl font-bold text-purple-900">
                                        {timeSlots.length > 0 ? (getTotalHours() / timeSlots.length).toFixed(1) : 0}
                                   </p>
                              </div>
                              <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                                   <BarChart3 className="w-6 h-6 text-white" />
                              </div>
                         </div>
                    </Card>
               </div>

               {/* Recent Activity */}
               <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                         <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                              <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                              Hoạt Động Gần Đây
                         </h3>
                    </div>
                    <div className="space-y-3">
                         {timeSlots.slice(0, 3).map((slot, index) => (
                              <div key={slot.SlotID} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                                   <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                        <Timer className="w-4 h-4 text-blue-600" />
                                   </div>
                                   <div className="flex-1">
                                        <p className="font-medium text-gray-900">{slot.SlotName}</p>
                                        <p className="text-sm text-gray-500">
                                             {formatTime(slot.StartTime)} - {formatTime(slot.EndTime)}
                                        </p>
                                   </div>
                                   <ChevronRight className="w-4 h-4 text-gray-400" />
                              </div>
                         ))}
                    </div>
               </Card>
          </div>
     );

     const renderManage = () => (
          <div className="space-y-6">
               {/* Action Bar */}
               <div className="flex items-center justify-between">
                    <div>
                         <h3 className="text-lg font-semibold text-gray-900">Quản Lý Slot Thời Gian</h3>
                         <p className="text-gray-600">Thêm, sửa, xóa các slot thời gian</p>
                    </div>
                    <Button
                         onClick={() => handleOpenModal()}
                         className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
                    >
                         <Plus className="w-4 h-4 mr-2" />
                         Thêm Slot Mới
                    </Button>
               </div>

               {/* Info Alert */}
               <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                         Slot thời gian sẽ được sử dụng để thiết lập giá và quản lý đặt sân.
                         Đảm bảo không có slot nào trùng lặp thời gian.
                    </AlertDescription>
               </Alert>

               {/* Time Slots Table */}
               <Card className="p-6">
                    <Table
                         data={timeSlots}
                         columns={columns}
                         loading={loading}
                         emptyMessage="Chưa có slot thời gian nào"
                    />
               </Card>
          </div>
     );

     const renderCalendar = () => (
          <div className="space-y-6">
               <div className="flex items-center justify-between">
                    <div>
                         <h3 className="text-lg font-semibold text-gray-900">Lịch Trình Slot</h3>
                         <p className="text-gray-600">Xem lịch trình các slot thời gian trong ngày</p>
                    </div>
               </div>

               <Card className="p-6">
                    <div className="space-y-4">
                         {timeSlots.map((slot, index) => {
                              const start = new Date(`2000-01-01T${slot.StartTime}`);
                              const end = new Date(`2000-01-01T${slot.EndTime}`);
                              const duration = (end - start) / (1000 * 60 * 60);
                              const startHour = start.getHours();
                              const startMinute = start.getMinutes();
                              const leftPosition = (startHour * 60 + startMinute) / 60 * 4; // 4rem per hour
                              const width = duration * 4;

                              return (
                                   <div key={slot.SlotID} className="relative">
                                        <div className="flex items-center space-x-4 mb-2">
                                             <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                                                  <Timer className="w-4 h-4 text-white" />
                                             </div>
                                             <div>
                                                  <h4 className="font-semibold text-gray-900">{slot.SlotName}</h4>
                                                  <p className="text-sm text-gray-500">
                                                       {formatTime(slot.StartTime)} - {formatTime(slot.EndTime)} ({duration} giờ)
                                                  </p>
                                             </div>
                                        </div>

                                        {/* Timeline Bar */}
                                        <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                                             <div
                                                  className="absolute top-0 h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center"
                                                  style={{
                                                       left: `${leftPosition}rem`,
                                                       width: `${width}rem`
                                                  }}
                                             >
                                                  <span className="text-white text-xs font-medium">
                                                       {formatTime(slot.StartTime)} - {formatTime(slot.EndTime)}
                                                  </span>
                                             </div>
                                        </div>
                                   </div>
                              );
                         })}
                    </div>
               </Card>
          </div>
     );

     return (
          <OwnerLayout user={user} onLoggedOut={logout} isDemo={isDemo}>
               <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                   <Timer className="w-8 h-8 mr-3 text-blue-600" />
                                   Quản Lý Slot Thời Gian
                              </h1>
                              <p className="text-gray-600 mt-1">
                                   Thiết lập và quản lý các khung giờ hoạt động cho sân bóng
                              </p>
                         </div>
                         {isDemo && (
                              <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                   <AlertCircle className="w-4 h-4 mr-1" />
                                   Demo Mode
                              </Badge>
                         )}
                    </div>

                    {/* Navigation */}
                    <div className="border-b border-gray-200">
                         <nav className="flex space-x-8">
                              {navigationItems.map((item) => {
                                   const Icon = item.icon;
                                   return (
                                        <button
                                             key={item.id}
                                             onClick={() => setActiveTab(item.id)}
                                             className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === item.id
                                                  ? 'border-blue-500 text-blue-600'
                                                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                                  }`}
                                        >
                                             <Icon className="w-4 h-4" />
                                             <span>{item.label}</span>
                                        </button>
                                   );
                              })}
                         </nav>
                    </div>

                    {/* Content */}
                    <div>
                         {activeTab === 'overview' && renderOverview()}
                         {activeTab === 'manage' && renderManage()}
                         {activeTab === 'calendar' && renderCalendar()}
                    </div>

                    {/* Add/Edit Modal */}
                    <Modal
                         isOpen={showModal}
                         onClose={handleCloseModal}
                         title={editingSlot ? 'Chỉnh Sửa Slot Thời Gian' : 'Thêm Slot Thời Gian'}
                         size="md"
                    >
                         <form onSubmit={handleSubmit} className="space-y-6">
                              <div>
                                   <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Tên Slot *
                                   </label>
                                   <Input
                                        type="text"
                                        value={formData.SlotName}
                                        onChange={(e) => setFormData({ ...formData, SlotName: e.target.value })}
                                        placeholder="Ví dụ: Slot Sáng, Slot Chiều..."
                                        required
                                   />
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Giờ Bắt Đầu *
                                        </label>
                                        <Input
                                             type="time"
                                             value={formData.StartTime}
                                             onChange={(e) => setFormData({ ...formData, StartTime: e.target.value })}
                                             required
                                        />
                                   </div>
                                   <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                             Giờ Kết Thúc *
                                        </label>
                                        <Input
                                             type="time"
                                             value={formData.EndTime}
                                             onChange={(e) => setFormData({ ...formData, EndTime: e.target.value })}
                                             required
                                        />
                                   </div>
                              </div>

                              <div className="flex justify-end space-x-3 pt-4">
                                   <Button
                                        type="button"
                                        variant="outline"
                                        onClick={handleCloseModal}
                                   >
                                        <X className="w-4 h-4 mr-2" />
                                        Hủy
                                   </Button>
                                   <Button
                                        type="submit"
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                   >
                                        <Save className="w-4 h-4 mr-2" />
                                        {editingSlot ? 'Cập Nhật' : 'Tạo Slot'}
                                   </Button>
                              </div>
                         </form>
                    </Modal>

                    {/* Demo Restricted Modal */}
                    <DemoRestrictedModal
                         isOpen={showDemoRestrictedModal}
                         onClose={() => setShowDemoRestrictedModal(false)}
                         featureName="Quản Lý Slot Thời Gian"
                    />
               </div>
          </OwnerLayout>
     );
}

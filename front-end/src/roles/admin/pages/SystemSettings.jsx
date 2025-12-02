import React, { useState, useEffect } from "react";
import {
     Card,
     Button,
     Input,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
     Modal,
     Badge
} from "../../../shared/components/ui";
import {
     Settings,
     Save,
     RefreshCw,
     Database,
     Server,
     Shield,
     Mail,
     Bell,
     Globe,
     Users,
     AlertTriangle,
     CheckCircle,
     Eye,
     EyeOff
} from "lucide-react";

export default function SystemSettings() {
     const [settings, setSettings] = useState({
          // General Settings
          siteName: "FieldBooking System",
          siteDescription: "Hệ thống đặt sân thể thao",
          siteUrl: "https://fieldbooking.com",
          timezone: "Asia/Ho_Chi_Minh",
          language: "vi",

          // Email Settings
          smtpHost: "smtp.gmail.com",
          smtpPort: 587,
          smtpUsername: "",
          smtpPassword: "",
          smtpFromEmail: "noreply@fieldbooking.com",
          smtpFromName: "FieldBooking System",

          // Notification Settings
          enableEmailNotifications: true,
          enableSmsNotifications: false,
          enablePushNotifications: true,
          notificationFrequency: "immediate",

          // Security Settings
          sessionTimeout: 30,
          maxLoginAttempts: 5,
          enableTwoFactor: false,
          passwordMinLength: 8,
          requireSpecialChars: true,

          // System Settings
          maintenanceMode: false,
          debugMode: false,
          logLevel: "info",
          backupFrequency: "daily",
          maxFileSize: 10,

          // Payment Settings
          enablePayments: true,
          defaultCurrency: "VND",
          paymentMethods: ["bank_transfer", "momo", "zalopay"],
          commissionRate: 5,

          // Booking Settings
          maxAdvanceBookingDays: 30,
          minAdvanceBookingHours: 2,
          autoCancelHours: 24,
          allowRecurringBookings: true,
          maxRecurringWeeks: 4
     });

     const [showPassword, setShowPassword] = useState(false);
     const [showEmailModal, setShowEmailModal] = useState(false);
     const [showSecurityModal, setShowSecurityModal] = useState(false);
     const [showSystemModal, setShowSystemModal] = useState(false);
     const [showPaymentModal, setShowPaymentModal] = useState(false);
     const [showBookingModal, setShowBookingModal] = useState(false);
     const [isSaving, setIsSaving] = useState(false);

     useEffect(() => {
          // Mock data - trong thực tế sẽ gọi API để lấy settings
     }, []);

     const handleSaveSettings = async (section) => {
          setIsSaving(true);
          try {
               // Mock API call
               await new Promise(resolve => setTimeout(resolve, 1000));
               // Show success message
               alert(`${section} settings đã được lưu thành công!`);

               // Close modal if open
               switch (section) {
                    case 'email':
                         setShowEmailModal(false);
                         break;
                    case 'security':
                         setShowSecurityModal(false);
                         break;
                    case 'system':
                         setShowSystemModal(false);
                         break;
                    case 'payment':
                         setShowPaymentModal(false);
                         break;
                    case 'booking':
                         setShowBookingModal(false);
                         break;
               }
          } catch (error) {
               console.error('Error saving settings:', error);
               alert('Có lỗi xảy ra khi lưu settings!');
          } finally {
               setIsSaving(false);
          }
     };

     const handleResetSettings = (section) => {
          if (window.confirm(`Bạn có chắc chắn muốn reset ${section} settings về mặc định?`)) {
               // Reset to default values
               alert(`${section} settings đã được reset về mặc định!`);
          }
     };

     const getStatusBadge = (value, type = 'boolean') => {
          if (type === 'boolean') {
               return value ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                         <CheckCircle className="w-3 h-3 mr-1" />
                         Bật
                    </Badge>
               ) : (
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800">
                         <AlertTriangle className="w-3 h-3 mr-1" />
                         Tắt
                    </Badge>
               );
          }
          return (
               <Badge variant="outline">
                    {value}
               </Badge>
          );
     };

     const settingsSections = [
          {
               id: 'general',
               title: 'Cài đặt chung',
               description: 'Thông tin cơ bản về hệ thống',
               icon: Globe,
               color: 'blue',
               fields: [
                    { key: 'siteName', label: 'Tên website', type: 'text' },
                    { key: 'siteDescription', label: 'Mô tả website', type: 'textarea' },
                    { key: 'siteUrl', label: 'URL website', type: 'text' },
                    { key: 'timezone', label: 'Múi giờ', type: 'select', options: ['Asia/Ho_Chi_Minh', 'UTC', 'Asia/Bangkok'] },
                    { key: 'language', label: 'Ngôn ngữ', type: 'select', options: ['vi', 'en', 'th'] }
               ]
          },
          {
               id: 'email',
               title: 'Cài đặt Email',
               description: 'Cấu hình SMTP và email notifications',
               icon: Mail,
               color: 'green',
               modal: true
          },
          {
               id: 'notifications',
               title: 'Thông báo',
               description: 'Cài đặt hệ thống thông báo',
               icon: Bell,
               color: 'purple',
               fields: [
                    { key: 'enableEmailNotifications', label: 'Email notifications', type: 'boolean' },
                    { key: 'enableSmsNotifications', label: 'SMS notifications', type: 'boolean' },
                    { key: 'enablePushNotifications', label: 'Push notifications', type: 'boolean' },
                    { key: 'notificationFrequency', label: 'Tần suất thông báo', type: 'select', options: ['immediate', 'hourly', 'daily'] }
               ]
          },
          {
               id: 'security',
               title: 'Bảo mật',
               description: 'Cài đặt bảo mật hệ thống',
               icon: Shield,
               color: 'red',
               modal: true
          },
          {
               id: 'system',
               title: 'Hệ thống',
               description: 'Cài đặt hệ thống và bảo trì',
               icon: Server,
               color: 'orange',
               modal: true
          },
          {
               id: 'payment',
               title: 'Thanh toán',
               description: 'Cài đặt phương thức thanh toán',
               icon: Database,
               color: 'teal',
               modal: true
          },
          {
               id: 'booking',
               title: 'Đặt sân',
               description: 'Cài đặt quy tắc đặt sân',
               icon: Users,
               color: 'indigo',
               modal: true
          }
     ];

     return (
          <div className="space-y-6">
               {/* Header */}
               <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200/50">
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
                                   Cài đặt hệ thống
                              </h1>
                              <p className="text-slate-600 mt-2 font-medium">
                                   Quản lý và cấu hình các thiết lập hệ thống
                              </p>
                         </div>
                         <div className="flex space-x-3">
                              <Button
                                   onClick={() => window.location.reload()}
                                   variant="outline"
                                   className="rounded-2xl"
                              >
                                   <RefreshCw className="w-4 h-4 mr-2" />
                                   Làm mới
                              </Button>
                              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                                   <Settings className="w-8 h-8 text-white" />
                              </div>
                         </div>
                    </div>
               </div>

               {/* Settings Grid */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {settingsSections.map((section) => {
                         const Icon = section.icon;
                         return (
                              <Card key={section.id} className="p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                                   <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center space-x-3">
                                             <div className={`w-12 h-12 bg-gradient-to-br from-${section.color}-400 to-${section.color}-600 rounded-2xl flex items-center justify-center shadow-lg`}>
                                                  <Icon className="w-6 h-6 text-white" />
                                             </div>
                                             <div>
                                                  <h3 className="text-lg font-bold text-slate-900">{section.title}</h3>
                                                  <p className="text-sm text-slate-600">{section.description}</p>
                                             </div>
                                        </div>
                                        {section.fields && (
                                             <div className="text-right">
                                                  {section.fields.slice(0, 2).map((field) => (
                                                       <div key={field.key} className="text-xs text-slate-500 mb-1">
                                                            {field.type === 'boolean' ? getStatusBadge(settings[field.key]) : (
                                                                 <span>{settings[field.key]}</span>
                                                            )}
                                                       </div>
                                                  ))}
                                             </div>
                                        )}
                                   </div>

                                   <div className="flex space-x-2">
                                        <Button
                                             onClick={() => {
                                                  if (section.modal) {
                                                       switch (section.id) {
                                                            case 'email':
                                                                 setShowEmailModal(true);
                                                                 break;
                                                            case 'security':
                                                                 setShowSecurityModal(true);
                                                                 break;
                                                            case 'system':
                                                                 setShowSystemModal(true);
                                                                 break;
                                                            case 'payment':
                                                                 setShowPaymentModal(true);
                                                                 break;
                                                            case 'booking':
                                                                 setShowBookingModal(true);
                                                                 break;
                                                       }
                                                  } else {
                                                       handleSaveSettings(section.id);
                                                  }
                                             }}
                                             className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-2xl"
                                        >
                                             <Settings className="w-4 h-4 mr-2" />
                                             Cấu hình
                                        </Button>
                                        <Button
                                             onClick={() => handleResetSettings(section.id)}
                                             variant="outline"
                                             className="rounded-2xl"
                                        >
                                             <RefreshCw className="w-4 h-4" />
                                        </Button>
                                   </div>
                              </Card>
                         );
                    })}
               </div>

               {/* Email Settings Modal */}
               <Modal
                    isOpen={showEmailModal}
                    onClose={() => setShowEmailModal(false)}
                    title="Cài đặt Email"
                    size="2xl"
                    className="max-h-[90vh] scrollbar-hide"
               >
                    <div className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        SMTP Host *
                                   </label>
                                   <Input
                                        value={settings.smtpHost}
                                        onChange={(e) => setSettings({ ...settings, smtpHost: e.target.value })}
                                        placeholder="smtp.gmail.com"
                                   />
                              </div>
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        SMTP Port *
                                   </label>
                                   <Input
                                        type="number"
                                        value={settings.smtpPort}
                                        onChange={(e) => setSettings({ ...settings, smtpPort: parseInt(e.target.value) })}
                                        placeholder="587"
                                   />
                              </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Username *
                                   </label>
                                   <Input
                                        value={settings.smtpUsername}
                                        onChange={(e) => setSettings({ ...settings, smtpUsername: e.target.value })}
                                        placeholder="your-email@gmail.com"
                                   />
                              </div>
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Password *
                                   </label>
                                   <div className="relative">
                                        <Input
                                             type={showPassword ? "text" : "password"}
                                             value={settings.smtpPassword}
                                             onChange={(e) => setSettings({ ...settings, smtpPassword: e.target.value })}
                                             placeholder="••••••••"
                                        />
                                        <Button
                                             type="button"
                                             variant="ghost"
                                             size="sm"
                                             className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                             onClick={() => setShowPassword(!showPassword)}
                                        >
                                             {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                   </div>
                              </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        From Email *
                                   </label>
                                   <Input
                                        value={settings.smtpFromEmail}
                                        onChange={(e) => setSettings({ ...settings, smtpFromEmail: e.target.value })}
                                        placeholder="noreply@fieldbooking.com"
                                   />
                              </div>
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        From Name *
                                   </label>
                                   <Input
                                        value={settings.smtpFromName}
                                        onChange={(e) => setSettings({ ...settings, smtpFromName: e.target.value })}
                                        placeholder="FieldBooking System"
                                   />
                              </div>
                         </div>

                         <div className="flex space-x-3 pt-4 border-t border-slate-200">
                              <Button
                                   onClick={() => handleSaveSettings('email')}
                                   className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-2xl"
                                   disabled={isSaving}
                              >
                                   {isSaving ? (
                                        <>
                                             <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                             Đang lưu...
                                        </>
                                   ) : (
                                        <>
                                             <Save className="w-4 h-4 mr-2" />
                                             Lưu cài đặt
                                        </>
                                   )}
                              </Button>
                              <Button
                                   onClick={() => setShowEmailModal(false)}
                                   variant="outline"
                                   className="flex-1 rounded-2xl"
                              >
                                   Hủy
                              </Button>
                         </div>
                    </div>
               </Modal>

               {/* Security Settings Modal */}
               <Modal
                    isOpen={showSecurityModal}
                    onClose={() => setShowSecurityModal(false)}
                    title="Cài đặt Bảo mật"
                    size="2xl"
                    className="max-h-[90vh] scrollbar-hide"
               >
                    <div className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Session Timeout (phút)
                                   </label>
                                   <Input
                                        type="number"
                                        value={settings.sessionTimeout}
                                        onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
                                        placeholder="30"
                                   />
                              </div>
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Max Login Attempts
                                   </label>
                                   <Input
                                        type="number"
                                        value={settings.maxLoginAttempts}
                                        onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
                                        placeholder="5"
                                   />
                              </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Password Min Length
                                   </label>
                                   <Input
                                        type="number"
                                        value={settings.passwordMinLength}
                                        onChange={(e) => setSettings({ ...settings, passwordMinLength: parseInt(e.target.value) })}
                                        placeholder="8"
                                   />
                              </div>
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Two Factor Authentication
                                   </label>
                                   <Select
                                        value={settings.enableTwoFactor ? 'true' : 'false'}
                                        onValueChange={(value) => setSettings({ ...settings, enableTwoFactor: value === 'true' })}
                                   >
                                        <SelectTrigger className="rounded-2xl">
                                             <SelectValue placeholder="Chọn trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="true">Bật</SelectItem>
                                             <SelectItem value="false">Tắt</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                         </div>

                         <div className="flex items-center space-x-2">
                              <input
                                   type="checkbox"
                                   id="requireSpecialChars"
                                   checked={settings.requireSpecialChars}
                                   onChange={(e) => setSettings({ ...settings, requireSpecialChars: e.target.checked })}
                                   className="rounded border-slate-300"
                              />
                              <label htmlFor="requireSpecialChars" className="text-sm font-medium text-slate-700">
                                   Yêu cầu ký tự đặc biệt trong mật khẩu
                              </label>
                         </div>

                         <div className="flex space-x-3 pt-4 border-t border-slate-200">
                              <Button
                                   onClick={() => handleSaveSettings('security')}
                                   className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-2xl"
                                   disabled={isSaving}
                              >
                                   {isSaving ? (
                                        <>
                                             <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                             Đang lưu...
                                        </>
                                   ) : (
                                        <>
                                             <Shield className="w-4 h-4 mr-2" />
                                             Lưu cài đặt
                                        </>
                                   )}
                              </Button>
                              <Button
                                   onClick={() => setShowSecurityModal(false)}
                                   variant="outline"
                                   className="flex-1 rounded-2xl"
                              >
                                   Hủy
                              </Button>
                         </div>
                    </div>
               </Modal>

               {/* System Settings Modal */}
               <Modal
                    isOpen={showSystemModal}
                    onClose={() => setShowSystemModal(false)}
                    title="Cài đặt Hệ thống"
                    size="2xl"
                    className="max-h-[90vh] scrollbar-hide"
               >
                    <div className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Log Level
                                   </label>
                                   <Select
                                        value={settings.logLevel}
                                        onValueChange={(value) => setSettings({ ...settings, logLevel: value })}
                                   >
                                        <SelectTrigger className="rounded-2xl">
                                             <SelectValue placeholder="Chọn log level" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="debug">Debug</SelectItem>
                                             <SelectItem value="info">Info</SelectItem>
                                             <SelectItem value="warn">Warning</SelectItem>
                                             <SelectItem value="error">Error</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Backup Frequency
                                   </label>
                                   <Select
                                        value={settings.backupFrequency}
                                        onValueChange={(value) => setSettings({ ...settings, backupFrequency: value })}
                                   >
                                        <SelectTrigger className="rounded-2xl">
                                             <SelectValue placeholder="Chọn tần suất" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="hourly">Hàng giờ</SelectItem>
                                             <SelectItem value="daily">Hàng ngày</SelectItem>
                                             <SelectItem value="weekly">Hàng tuần</SelectItem>
                                             <SelectItem value="monthly">Hàng tháng</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Max File Size (MB)
                                   </label>
                                   <Input
                                        type="number"
                                        value={settings.maxFileSize}
                                        onChange={(e) => setSettings({ ...settings, maxFileSize: parseInt(e.target.value) })}
                                        placeholder="10"
                                   />
                              </div>
                         </div>

                         <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                   <input
                                        type="checkbox"
                                        id="maintenanceMode"
                                        checked={settings.maintenanceMode}
                                        onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                                        className="rounded border-slate-300"
                                   />
                                   <label htmlFor="maintenanceMode" className="text-sm font-medium text-slate-700">
                                        Chế độ bảo trì
                                   </label>
                              </div>
                              <div className="flex items-center space-x-2">
                                   <input
                                        type="checkbox"
                                        id="debugMode"
                                        checked={settings.debugMode}
                                        onChange={(e) => setSettings({ ...settings, debugMode: e.target.checked })}
                                        className="rounded border-slate-300"
                                   />
                                   <label htmlFor="debugMode" className="text-sm font-medium text-slate-700">
                                        Chế độ debug
                                   </label>
                              </div>
                         </div>

                         <div className="flex space-x-3 pt-4 border-t border-slate-200">
                              <Button
                                   onClick={() => handleSaveSettings('system')}
                                   className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 rounded-2xl"
                                   disabled={isSaving}
                              >
                                   {isSaving ? (
                                        <>
                                             <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                             Đang lưu...
                                        </>
                                   ) : (
                                        <>
                                             <Server className="w-4 h-4 mr-2" />
                                             Lưu cài đặt
                                        </>
                                   )}
                              </Button>
                              <Button
                                   onClick={() => setShowSystemModal(false)}
                                   variant="outline"
                                   className="flex-1 rounded-2xl"
                              >
                                   Hủy
                              </Button>
                         </div>
                    </div>
               </Modal>

               {/* Payment Settings Modal */}
               <Modal
                    isOpen={showPaymentModal}
                    onClose={() => setShowPaymentModal(false)}
                    title="Cài đặt Thanh toán"
                    size="2xl"
                    className="max-h-[90vh] scrollbar-hide"
               >
                    <div className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Default Currency
                                   </label>
                                   <Select
                                        value={settings.defaultCurrency}
                                        onValueChange={(value) => setSettings({ ...settings, defaultCurrency: value })}
                                   >
                                        <SelectTrigger className="rounded-2xl">
                                             <SelectValue placeholder="Chọn tiền tệ" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             <SelectItem value="VND">VND (Việt Nam Đồng)</SelectItem>
                                             <SelectItem value="USD">USD (US Dollar)</SelectItem>
                                             <SelectItem value="EUR">EUR (Euro)</SelectItem>
                                        </SelectContent>
                                   </Select>
                              </div>
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Commission Rate (%)
                                   </label>
                                   <Input
                                        type="number"
                                        value={settings.commissionRate}
                                        onChange={(e) => setSettings({ ...settings, commissionRate: parseFloat(e.target.value) })}
                                        placeholder="5"
                                   />
                              </div>
                         </div>

                         <div className="flex items-center space-x-2">
                              <input
                                   type="checkbox"
                                   id="enablePayments"
                                   checked={settings.enablePayments}
                                   onChange={(e) => setSettings({ ...settings, enablePayments: e.target.checked })}
                                   className="rounded border-slate-300"
                              />
                              <label htmlFor="enablePayments" className="text-sm font-medium text-slate-700">
                                   Bật hệ thống thanh toán
                              </label>
                         </div>

                         <div className="flex space-x-3 pt-4 border-t border-slate-200">
                              <Button
                                   onClick={() => handleSaveSettings('payment')}
                                   className="flex-1 bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 rounded-2xl"
                                   disabled={isSaving}
                              >
                                   {isSaving ? (
                                        <>
                                             <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                             Đang lưu...
                                        </>
                                   ) : (
                                        <>
                                             <Database className="w-4 h-4 mr-2" />
                                             Lưu cài đặt
                                        </>
                                   )}
                              </Button>
                              <Button
                                   onClick={() => setShowPaymentModal(false)}
                                   variant="outline"
                                   className="flex-1 rounded-2xl"
                              >
                                   Hủy
                              </Button>
                         </div>
                    </div>
               </Modal>

               {/* Booking Settings Modal */}
               <Modal
                    isOpen={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    title="Cài đặt Đặt sân"
                    size="2xl"
                    className="max-h-[90vh] scrollbar-hide"
               >
                    <div className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Max Advance Booking (days)
                                   </label>
                                   <Input
                                        type="number"
                                        value={settings.maxAdvanceBookingDays}
                                        onChange={(e) => setSettings({ ...settings, maxAdvanceBookingDays: parseInt(e.target.value) })}
                                        placeholder="30"
                                   />
                              </div>
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Min Advance Booking (hours)
                                   </label>
                                   <Input
                                        type="number"
                                        value={settings.minAdvanceBookingHours}
                                        onChange={(e) => setSettings({ ...settings, minAdvanceBookingHours: parseInt(e.target.value) })}
                                        placeholder="2"
                                   />
                              </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Auto Cancel (hours)
                                   </label>
                                   <Input
                                        type="number"
                                        value={settings.autoCancelHours}
                                        onChange={(e) => setSettings({ ...settings, autoCancelHours: parseInt(e.target.value) })}
                                        placeholder="24"
                                   />
                              </div>
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Max Recurring Weeks
                                   </label>
                                   <Input
                                        type="number"
                                        value={settings.maxRecurringWeeks}
                                        onChange={(e) => setSettings({ ...settings, maxRecurringWeeks: parseInt(e.target.value) })}
                                        placeholder="4"
                                   />
                              </div>
                         </div>

                         <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                   <input
                                        type="checkbox"
                                        id="allowRecurringBookings"
                                        checked={settings.allowRecurringBookings}
                                        onChange={(e) => setSettings({ ...settings, allowRecurringBookings: e.target.checked })}
                                        className="rounded border-slate-300"
                                   />
                                   <label htmlFor="allowRecurringBookings" className="text-sm font-medium text-slate-700">
                                        Cho phép đặt sân định kỳ
                                   </label>
                              </div>
                         </div>

                         <div className="flex space-x-3 pt-4 border-t border-slate-200">
                              <Button
                                   onClick={() => handleSaveSettings('booking')}
                                   className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-2xl"
                                   disabled={isSaving}
                              >
                                   {isSaving ? (
                                        <>
                                             <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                             Đang lưu...
                                        </>
                                   ) : (
                                        <>
                                             <Users className="w-4 h-4 mr-2" />
                                             Lưu cài đặt
                                        </>
                                   )}
                              </Button>
                              <Button
                                   onClick={() => setShowBookingModal(false)}
                                   variant="outline"
                                   className="flex-1 rounded-2xl"
                              >
                                   Hủy
                              </Button>
                         </div>
                    </div>
               </Modal>
          </div>
     );
}

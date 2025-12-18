import { useState } from "react";
import { Phone, Target, Users, Star } from "lucide-react";
import {
     Modal,
     Button,
     Input,
     Textarea,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
     Card,
     CardContent,
     Avatar,
     AvatarFallback,
     AvatarImage,
     Badge,
} from "@/components/ui";
import { createTeam } from "@/utils/communityStore";
import Swal from "sweetalert2";

export default function TeamCreationModal({ isOpen, onClose, user, onTeamCreated }) {
     const [formData, setFormData] = useState({
          teamName: "",
          contactPhone: "",
          description: "",
          preferredSkillLevel: "Any",
          preferredPositions: "",
          maxMembers: 7,
     });
     const [isSubmitting, setIsSubmitting] = useState(false);
     // thay đổi nội dung
     const handleInputChange = (field, value) => {
          setFormData(prev => ({
               ...prev,
               [field]: value
          }));
     };

     // submit đội
     const handleSubmit = async () => {
          if (!formData.teamName.trim()) {
               Swal.fire({
                    icon: 'warning',
                    title: 'Thiếu thông tin',
                    text: 'Vui lòng nhập tên đội',
                    confirmButtonText: 'Đồng ý'
               });
               return;
          }

          if (!formData.contactPhone.trim()) {
               Swal.fire({
                    icon: 'warning',
                    title: 'Thiếu thông tin',
                    text: 'Vui lòng nhập số điện thoại liên hệ',
                    confirmButtonText: 'Đồng ý'
               });
               return;
          }

          if (formData.maxMembers < 2 || formData.maxMembers > 22) {
               Swal.fire({
                    icon: 'warning',
                    title: 'Thông tin không hợp lệ',
                    text: 'Số lượng thành viên phải từ 2 đến 22 người',
                    confirmButtonText: 'Đồng ý'
               });
               return;
          }

          setIsSubmitting(true);
          try {
               const team = createTeam({
                    teamName: formData.teamName.trim(),
                    createdBy: user.id,
                    contactPhone: formData.contactPhone.trim(),
                    description: formData.description.trim(),
                    preferredSkillLevel: formData.preferredSkillLevel,
                    preferredPositions: formData.preferredPositions.trim(),
                    maxMembers: formData.maxMembers,
                    createdByName: user.name || user.email,
               });

               Swal.fire({
                    toast: true,
                    position: 'top-end',
                    timer: 2000,
                    showConfirmButton: false,
                    icon: 'success',
                    title: 'Tạo đội thành công!'
               });

               setFormData({
                    teamName: "",
                    contactPhone: "",
                    description: "",
                    preferredSkillLevel: "Any",
                    preferredPositions: "",
                    maxMembers: 7,
               });

               onTeamCreated?.(team);
               onClose();
          } catch (error) {
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Không thể tạo đội',
                    confirmButtonText: 'Đồng ý'
               });
          } finally {
               setIsSubmitting(false);
          }
     };
     // đóng modal
     const handleClose = () => {
          if (!isSubmitting) {
               onClose();
          }
     };

     return (
          <>
               <Modal
                    isOpen={isOpen}
                    onClose={handleClose}
                    title="Tạo đội mới"
                    className="max-w-md"
               >
                    <div className="space-y-4">
                         {/* Team Name */}
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Tên đội *
                              </label>
                              <Input
                                   placeholder="Nhập tên đội..."
                                   value={formData.teamName}
                                   onChange={(e) => handleInputChange('teamName', e.target.value)}
                                   className="rounded-xl"
                              />
                         </div>

                         {/* Contact Phone */}
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Số điện thoại liên hệ *
                              </label>
                              <div className="relative">
                                   <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                   <Input
                                        placeholder="Nhập số điện thoại..."
                                        value={formData.contactPhone}
                                        onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                                        className="rounded-xl pl-10"
                                   />
                              </div>
                         </div>

                         {/* Description */}
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Mô tả đội
                              </label>
                              <Textarea
                                   placeholder="Mô tả về đội của bạn..."
                                   value={formData.description}
                                   onChange={(e) => handleInputChange('description', e.target.value)}
                                   className="rounded-xl min-h-[80px]"
                              />
                         </div>

                         {/* Skill Level */}
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Mức độ mong muốn
                              </label>
                              <Select value={formData.preferredSkillLevel} onValueChange={(value) => handleInputChange('preferredSkillLevel', value)}>
                                   <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Chọn mức độ" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="Any">Bất kỳ</SelectItem>
                                        <SelectItem value="Beginner">Beginner</SelectItem>
                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        <SelectItem value="Advanced">Advanced</SelectItem>
                                   </SelectContent>
                              </Select>
                         </div>

                         {/* Preferred Positions */}
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Vị trí cần tuyển
                              </label>
                              <div className="relative">
                                   <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                   <Input
                                        placeholder="VD: GK, DF, MF, FW..."
                                        value={formData.preferredPositions}
                                        onChange={(e) => handleInputChange('preferredPositions', e.target.value)}
                                        className="rounded-xl pl-10"
                                   />
                              </div>
                         </div>

                         {/* Max Members */}
                         <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                   Số lượng thành viên mong muốn
                              </label>
                              <Select value={formData.maxMembers.toString()} onValueChange={(value) => handleInputChange('maxMembers', parseInt(value))}>
                                   <SelectTrigger className="rounded-xl">
                                        <SelectValue placeholder="Chọn số lượng" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        {[5, 7, 9, 11, 15, 22].map(num => (
                                             <SelectItem key={num} value={num.toString()}>
                                                  {num} người
                                             </SelectItem>
                                        ))}
                                   </SelectContent>
                              </Select>
                         </div>

                    </div>

                    {/* Footer Buttons */}
                    <div className="flex gap-2 pt-4">
                         <Button
                              variant="outline"
                              onClick={handleClose}
                              disabled={isSubmitting}
                              className="rounded-xl flex-1"
                         >
                              Hủy
                         </Button>
                         <Button
                              onClick={handleSubmit}
                              disabled={isSubmitting}
                              className="bg-teal-500 hover:bg-teal-600 text-white rounded-xl flex-1"
                         >
                              {isSubmitting ? "Đang tạo..." : "Tạo đội"}
                         </Button>
                    </div>
               </Modal>

               {/* Floating Preview Card - Bottom Right */}
               {isOpen && (
                    <div className="fixed bottom-6 right-6 z-50 hidden lg:block animate-in fade-in slide-in-from-bottom-4 duration-300">
                         <Card className="w-80 border-2 border-teal-100 rounded-2xl shadow-2xl bg-gradient-to-br from-white to-teal-50/30 backdrop-blur-sm">
                              <CardContent className="p-5">
                                   <div className="text-center mb-4">
                                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 mb-2 shadow-lg">
                                             <Users className="w-8 h-8 text-white" />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-1">
                                             {formData.teamName || "Tên đội của bạn"}
                                        </h3>
                                        <div className="flex items-center justify-center gap-2 mt-1">
                                             <Badge className="bg-teal-100 text-teal-700 border-teal-300 text-xs">
                                                  {formData.preferredSkillLevel === "Any" ? "Tất cả cấp độ" :
                                                       formData.preferredSkillLevel === "Beginner" ? "Người mới" :
                                                            formData.preferredSkillLevel === "Intermediate" ? "Trung bình" :
                                                                 formData.preferredSkillLevel === "Advanced" ? "Nâng cao" : formData.preferredSkillLevel}
                                             </Badge>
                                        </div>
                                   </div>

                                   {formData.description && (
                                        <div className="mb-3">
                                             <p className="text-xs text-gray-600 line-clamp-2">
                                                  {formData.description}
                                             </p>
                                        </div>
                                   )}

                                   <div className="space-y-2 border-t border-gray-200 pt-3">
                                        <div className="flex items-center gap-2">
                                             <div className="w-8 h-8 rounded-lg bg-teal-100 flex items-center justify-center flex-shrink-0">
                                                  <Phone className="w-4 h-4 text-teal-600" />
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                  <p className="text-xs text-gray-500">Liên hệ</p>
                                                  <p className="text-xs font-semibold text-gray-900 truncate">
                                                       {formData.contactPhone || "Chưa có"}
                                                  </p>
                                             </div>
                                        </div>

                                        {formData.preferredPositions && (
                                             <div className="flex items-center gap-2">
                                                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                                       <Target className="w-4 h-4 text-blue-600" />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                       <p className="text-xs text-gray-500">Vị trí cần tuyển</p>
                                                       <p className="text-xs font-semibold text-gray-900 truncate">
                                                            {formData.preferredPositions}
                                                       </p>
                                                  </div>
                                             </div>
                                        )}

                                        <div className="flex items-center gap-2">
                                             <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                                                  <Users className="w-4 h-4 text-purple-600" />
                                             </div>
                                             <div className="flex-1 min-w-0">
                                                  <p className="text-xs text-gray-500">Số lượng thành viên</p>
                                                  <p className="text-xs font-semibold text-gray-900">
                                                       {formData.maxMembers} người
                                                  </p>
                                             </div>
                                        </div>
                                   </div>

                                   {/* Team Members Preview */}
                                   <div className="mt-4 pt-3 border-t border-gray-200">
                                        <p className="text-xs font-semibold text-gray-700 mb-2">Thành viên</p>
                                        <div className="flex items-center gap-1.5">
                                             {user && (
                                                  <div className="flex flex-col items-center">
                                                       <Avatar className="w-9 h-9 border-2 border-teal-500">
                                                            <AvatarImage src={user.avatar} />
                                                            <AvatarFallback className="bg-teal-100 text-teal-700 text-xs">
                                                                 {user.name?.charAt(0) || user.email?.charAt(0) || "U"}
                                                            </AvatarFallback>
                                                       </Avatar>
                                                       <p className="text-xs text-gray-600 mt-0.5 max-w-[50px] truncate">
                                                            {user.name || "Bạn"}
                                                       </p>
                                                       <Badge className="mt-0.5 text-xs bg-teal-500 text-white px-1 py-0">Trưởng</Badge>
                                                  </div>
                                             )}
                                             {Array.from({ length: Math.min(formData.maxMembers - 1, 4) }).map((_, i) => (
                                                  <div key={i} className="flex flex-col items-center">
                                                       <div className="w-9 h-9 rounded-full bg-gray-200 border-2 border-gray-300 flex items-center justify-center">
                                                            <Users className="w-4 h-4 text-gray-400" />
                                                       </div>
                                                       <p className="text-xs text-gray-400 mt-0.5 text-[10px]">Trống</p>
                                                  </div>
                                             ))}
                                        </div>
                                        {formData.maxMembers > 5 && (
                                             <p className="text-xs text-gray-500 text-center mt-1.5">
                                                  +{formData.maxMembers - 5} vị trí khác
                                             </p>
                                        )}
                                   </div>

                                   {/* Preview Footer */}
                                   <div className="mt-4 pt-3 border-t border-gray-200">
                                        <div className="bg-gradient-to-r from-teal-50 to-blue-50 rounded-lg p-2 text-center">
                                             <p className="text-xs text-gray-600">
                                                  <Star className="w-3 h-3 inline text-yellow-500 mr-1" />
                                                  Preview đội bóng
                                             </p>
                                        </div>
                                   </div>
                              </CardContent>
                         </Card>
                    </div>
               )}
          </>
     );
}

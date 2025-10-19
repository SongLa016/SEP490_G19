import { useState } from "react";
import { Phone, Target } from "lucide-react";
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
} from "../../../components/ui";
import { createTeam } from "../../utils/communityStore";
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

     const handleInputChange = (field, value) => {
          setFormData(prev => ({
               ...prev,
               [field]: value
          }));
     };

     const handleSubmit = async () => {
          // Validation
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

               // Reset form
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

     const handleClose = () => {
          if (!isSubmitting) {
               onClose();
          }
     };

     return (
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

                    {/* Footer */}
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
               </div>
          </Modal>
     );
}

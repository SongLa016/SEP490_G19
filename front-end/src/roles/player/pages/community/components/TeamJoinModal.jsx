import { useState } from "react";
import { Users, MessageSquare } from "lucide-react";
import {
     Modal,
     Button,
     Textarea,
     Avatar,
     AvatarImage,
     AvatarFallback,
} from "../../../../../shared/components/ui";
import { getUserAvatarAndName } from "./utils";
import { createTeamJoinRequest } from "../../../../../shared/index";
import Swal from "sweetalert2";

export default function TeamJoinModal({ isOpen, onClose, team, user, onJoinRequestSubmitted }) {
     const [message, setMessage] = useState("");
     const [isSubmitting, setIsSubmitting] = useState(false);

     const handleSubmit = async () => {
          if (!team || !user) return;

          setIsSubmitting(true);
          try {
               await createTeamJoinRequest({
                    teamId: team.teamId,
                    userId: user.id,
                    message: message.trim(),
                    userName: user.name || user.email,
               });

               Swal.fire({
                    toast: true,
                    position: 'top-end',
                    timer: 2000,
                    showConfirmButton: false,
                    icon: 'success',
                    title: 'Đã gửi yêu cầu tham gia đội!'
               });

               setMessage("");
               onJoinRequestSubmitted?.();
          } catch (error) {
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Không thể gửi yêu cầu tham gia',
                    confirmButtonText: 'Đồng ý'
               });
          } finally {
               setIsSubmitting(false);
          }
     };

     const handleClose = () => {
          if (!isSubmitting) {
               setMessage("");
               onClose();
          }
     };

     if (!team || !user) return null;

     const { avatarUrl, initial } = getUserAvatarAndName(user);

     return (
          <Modal
               isOpen={isOpen}
               onClose={handleClose}
               title="Tham gia đội"
               className="max-w-md"
          >
               <div className="space-y-4">
                    {/* Team Info */}
                    <div className="bg-gray-50 p-4 rounded-xl">
                         <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 border border-teal-200">
                                   <Users className="w-5 h-5" />
                              </div>
                              <div>
                                   <div className="font-semibold text-teal-800">{team.teamName}</div>
                                   <div className="text-sm text-gray-600">
                                        Tạo bởi: {team.createdByName}
                                   </div>
                              </div>
                         </div>

                         <div className="text-sm text-gray-600 space-y-1">
                              <div>Thành viên: {team.currentMembers}/{team.maxMembers}</div>
                              <div>Mức độ: {team.preferredSkillLevel}</div>
                              {team.preferredPositions && (
                                   <div>Vị trí cần: {team.preferredPositions}</div>
                              )}
                         </div>
                    </div>

                    {/* User Info */}
                    <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl">
                         <Avatar className="w-8 h-8">
                              <AvatarImage src={avatarUrl} />
                              <AvatarFallback className="bg-gray-200 text-gray-700">
                                   {initial}
                              </AvatarFallback>
                         </Avatar>
                         <div>
                              <div className="font-medium text-gray-800">
                                   {user?.name || user?.email}
                              </div>
                              <div className="text-sm text-gray-600">
                                   Bạn đang yêu cầu tham gia đội này
                              </div>
                         </div>
                    </div>

                    {/* Message */}
                    <div>
                         <label className="block text-sm font-medium text-gray-700 mb-2">
                              Lời nhắn (tùy chọn)
                         </label>
                         <div className="relative">
                              <MessageSquare className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                              <Textarea
                                   placeholder="Giới thiệu về bản thân hoặc lý do muốn tham gia đội..."
                                   value={message}
                                   onChange={(e) => setMessage(e.target.value)}
                                   className="rounded-xl pl-10 min-h-[100px]"
                                   maxLength={255}
                              />
                         </div>
                         <div className="text-xs text-gray-500 mt-1 text-right">
                              {message.length}/255 ký tự
                         </div>
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
                              {isSubmitting ? "Đang gửi..." : "Gửi yêu cầu"}
                         </Button>
                    </div>
               </div>
          </Modal>
     );
}

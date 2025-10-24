import { useEffect, useState, useRef } from "react";
import {
     Users,
     Phone,
     Target,
     MessageSquare,
     UserPlus,
     Clock,
     CheckCircle2,
     AlertCircle,
     UserCheck,
} from "lucide-react";
import {
     Card,
     CardContent,
     Button,
     Badge,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
} from "../../../../../shared/components/ui";
import { useAuth } from "../../../../../contexts/AuthContext";
import { listTeams, listTeamJoinRequestsByUser } from "../../../../../shared/index";
import Swal from "sweetalert2";
import TeamJoinModal from "./TeamJoinModal";

export default function TeamList({ onOpenTeamCreation }) {
     const { user } = useAuth();
     const [teams, setTeams] = useState([]);
     const [teamPage, setTeamPage] = useState(1);
     const [filterSkillLevel, setFilterSkillLevel] = useState("all");
     const [showJoinModal, setShowJoinModal] = useState(false);
     const [selectedTeam, setSelectedTeam] = useState(null);

     const [userJoinRequests, setUserJoinRequests] = useState([]);

     const teamEndRef = useRef(null);
     const pageSize = 10;
     const visibleTeams = teams.slice(0, teamPage * pageSize);

     // Load teams and user's join requests
     useEffect(() => {
          setTeams(listTeams({
               status: "Open",
               skillLevel: filterSkillLevel,
          }));

          if (user) {
               setUserJoinRequests(listTeamJoinRequestsByUser(user.id));
          }
     }, [filterSkillLevel, user]);

     // Infinite scroll for teams
     useEffect(() => {
          const el = teamEndRef.current;
          if (!el) return;
          const io = new IntersectionObserver((entries) => {
               entries.forEach((e) => {
                    if (e.isIntersecting) {
                         setTeamPage((p) => (visibleTeams.length >= teams.length ? p : p + 1));
                    }
               });
          }, { root: null, threshold: 0.1 });
          io.observe(el);
          return () => io.disconnect();
     }, [teams.length, visibleTeams.length]);
     const handleJoinTeam = (team) => {
          if (!user) {
               Swal.fire({
                    icon: 'warning',
                    title: 'Yêu cầu đăng nhập',
                    text: 'Vui lòng đăng nhập để tham gia đội.',
                    confirmButtonText: 'Đồng ý'
               });
               return;
          }

          if (user.id === team.createdBy) {
               Swal.fire({
                    icon: 'info',
                    title: 'Thông báo',
                    text: 'Bạn không thể tham gia đội của chính mình.',
                    confirmButtonText: 'Đồng ý'
               });
               return;
          }

          // Check if user already has a pending request
          const existingRequest = userJoinRequests.find(
               (r) => r.teamId === team.teamId && r.status === "Pending"
          );
          if (existingRequest) {
               Swal.fire({
                    icon: 'info',
                    title: 'Thông báo',
                    text: 'Bạn đã gửi yêu cầu tham gia đội này.',
                    confirmButtonText: 'Đồng ý'
               });
               return;
          }

          setSelectedTeam(team);
          setShowJoinModal(true);
     };

     const handleJoinRequestSubmitted = () => {
          // Refresh user's join requests
          if (user) {
               setUserJoinRequests(listTeamJoinRequestsByUser(user.id));
          }
          setShowJoinModal(false);
          setSelectedTeam(null);
     };

     const getStatusBadge = (team) => {
          if (team.status === "Full") {
               return (
                    <Badge className="text-xs bg-red-50 text-red-700 flex items-center gap-1">
                         <AlertCircle className="w-3 h-3" />
                         Đã đầy
                    </Badge>
               );
          }
          return (
               <Badge className="text-xs bg-green-50 text-green-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Đang mở
               </Badge>
          );
     };

     const getSkillLevelBadge = (skillLevel) => {
          const colors = {
               "Beginner": "bg-blue-50 text-blue-700",
               "Intermediate": "bg-yellow-50 text-yellow-700",
               "Advanced": "bg-red-50 text-red-700",
               "Any": "bg-gray-50 text-gray-700"
          };
          return (
               <Badge className={`text-xs ${colors[skillLevel] || colors["Any"]} flex items-center gap-1`}>
                    <UserCheck className="w-3 h-3" />
                    {skillLevel}
               </Badge>
          );
     };

     const getUserJoinStatus = (teamId) => {
          const request = userJoinRequests.find(r => r.teamId === teamId);
          if (!request) return null;

          switch (request.status) {
               case "Pending":
                    return (
                         <Badge className="text-xs bg-yellow-50 text-yellow-700 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Đang chờ
                         </Badge>
                    );
               case "Approved":
                    return (
                         <Badge className="text-xs bg-green-50 text-green-700 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Đã chấp nhận
                         </Badge>
                    );
               case "Rejected":
                    return (
                         <Badge className="text-xs bg-red-50 text-red-700 flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Bị từ chối
                         </Badge>
                    );
               default:
                    return null;
          }
     };

     return (
          <div className="border border-b-0 overflow-y-auto scrollbar-hide rounded-t-3xl bg-white border-gray-400 flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
               {/* Filter */}
               <div className="grid sticky top-0 z-10 grid-cols-1 md:grid-cols-3 gap-3 p-4 bg-gray-50 border-b border-gray-200">
                    <div className="md:col-span-1">
                         <div className="relative">
                              <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                              <Select value={filterSkillLevel} onValueChange={setFilterSkillLevel}>
                                   <SelectTrigger className="rounded-2xl pl-10">
                                        <SelectValue placeholder="Mức độ" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        <SelectItem value="all">Tất cả mức độ</SelectItem>
                                        <SelectItem value="Any">Bất kỳ</SelectItem>
                                        <SelectItem value="Beginner">Beginner</SelectItem>
                                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                                        <SelectItem value="Advanced">Advanced</SelectItem>
                                   </SelectContent>
                              </Select>
                         </div>
                    </div>
                    <div className="md:col-span-2 gap-2 flex items-center justify-end text-sm text-gray-600">
                         <span className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 px-3 py-2 rounded-xl">
                              <Users className="w-4 h-4 text-teal-500" />
                              {teams.length} đội
                         </span>
                         <Button
                              onClick={() => onOpenTeamCreation?.()}
                              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-xl flex items-center gap-2"
                         >
                              <Users className="w-4 h-4" />
                              Tạo đội
                         </Button>
                    </div>
               </div>

               {/* Teams Feed */}
               <div className="divide-y divide-gray-200">
                    {visibleTeams.map((team) => {
                         const userJoinStatus = getUserJoinStatus(team.teamId);
                         const isOwner = user?.id === team.createdBy;
                         const canJoin = !isOwner && team.status === "Open" && !userJoinStatus;

                         return (
                              <Card
                                   key={team.teamId}
                                   className="border m-2 rounded-3xl transition-all duration-200 border-teal-100 hover:shadow-lg"
                              >
                                   <CardContent className="p-4">
                                        <div className="flex items-start justify-between">
                                             <div className="flex-1">
                                                  <div className="flex items-center gap-3 mb-3">
                                                       <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 border border-teal-200">
                                                            <Users className="w-5 h-5" />
                                                       </div>
                                                       <div className="flex-1">
                                                            <div className="font-semibold text-teal-800 text-lg">{team.teamName}</div>
                                                            <div className="text-sm text-gray-600">
                                                                 Tạo bởi: {team.createdByName}
                                                            </div>
                                                       </div>
                                                  </div>

                                                  {/* Team Info */}
                                                  <div className="group h-7 hover:h-auto transition-all duration-300">
                                                       {/* Thông tin cơ bản - luôn hiển thị */}
                                                       <div className="text-xs mx-auto text-center text-gray-400 italic group-hover:hidden">
                                                            Chạm vào để xem thêm chi tiết
                                                       </div>

                                                       {/* Thông tin chi tiết - chỉ hiển thị khi hover */}
                                                       <div className="opacity-0 group-hover:opacity-100 transition-transform duration-300 translate-y-2 group-hover:translate-y-0 text-sm text-gray-600 mb-2 space-y-1">
                                                            <div className="text-sm text-gray-600 mb-2 space-y-1">
                                                                 <div className="flex items-center gap-2">
                                                                      <Phone className="w-4 h-4 text-gray-500" />
                                                                      <span className="font-medium">Liên hệ:</span>
                                                                      <span>{team.contactPhone}</span>
                                                                 </div>

                                                                 <div className="flex items-center gap-2">
                                                                      <Users className="w-4 h-4 text-gray-500" />
                                                                      <span className="font-medium">Thành viên:</span>
                                                                      <span>{team.currentMembers}/{team.maxMembers}</span>
                                                                 </div>

                                                                 {team.preferredPositions && (
                                                                      <div className="flex items-center gap-2">
                                                                           <Target className="w-4 h-4 text-gray-500" />
                                                                           <span className="font-medium">Vị trí cần:</span>
                                                                           <span>{team.preferredPositions}</span>
                                                                      </div>
                                                                 )}
                                                            </div>

                                                            {/* Description */}
                                                            {team.description && (
                                                                 <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded-lg border flex items-start gap-2">
                                                                      <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                                                                      <div>
                                                                           <strong>Mô tả:</strong> {team.description}
                                                                      </div>
                                                                 </div>
                                                            )}
                                                       </div>
                                                  </div>

                                                  {/* Badges */}
                                                  <div className="flex items-center gap-2 flex-wrap mb-3">
                                                       {getStatusBadge(team)}
                                                       {getSkillLevelBadge(team.preferredSkillLevel)}
                                                       {userJoinStatus}
                                                  </div>

                                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                                       <Clock className="w-3 h-3" />
                                                       Tạo lúc: {new Date(team.createdAt).toLocaleString('vi-VN')}
                                                  </div>
                                             </div>

                                             <div className="flex items-center gap-2 ml-4">
                                                  {isOwner ? (
                                                       <Button disabled className="bg-gray-200 !rounded-full py-2 text-sm text-gray-500 cursor-not-allowed flex items-center gap-2">
                                                            <Users className="w-4 h-4" />
                                                            Đội của bạn
                                                       </Button>
                                                  ) : canJoin ? (
                                                       <Button
                                                            onClick={() => handleJoinTeam(team)}
                                                            className="bg-teal-500 hover:bg-teal-600 text-white flex items-center gap-2"
                                                       >
                                                            <UserPlus className="w-4 h-4" />
                                                            Tham gia
                                                       </Button>
                                                  ) : (
                                                       <Button disabled className="bg-gray-200 !rounded-full py-2 text-sm text-gray-500 cursor-not-allowed flex items-center gap-2">
                                                            <AlertCircle className="w-4 h-4" />
                                                            Không thể tham gia
                                                       </Button>
                                                  )}
                                             </div>
                                        </div>
                                   </CardContent>
                              </Card>
                         );
                    })}
                    <div ref={teamEndRef} className="h-6" />
                    {teams.length === 0 && (
                         <Card>
                              <CardContent className="p-8 text-center text-gray-600 flex flex-col items-center gap-3">
                                   <Users className="w-12 h-12 text-gray-400" />
                                   <div className="text-lg font-medium">Không có đội nào</div>
                                   <div className="text-sm">Hãy thử điều chỉnh bộ lọc để tìm thêm kết quả</div>
                              </CardContent>
                         </Card>
                    )}
               </div>
               {/* Team Join Modal */}
               <TeamJoinModal
                    isOpen={showJoinModal}
                    onClose={() => {
                         setShowJoinModal(false);
                         setSelectedTeam(null);
                    }}
                    team={selectedTeam}
                    user={user}
                    onJoinRequestSubmitted={handleJoinRequestSubmitted}
               />
          </div>
     );
}

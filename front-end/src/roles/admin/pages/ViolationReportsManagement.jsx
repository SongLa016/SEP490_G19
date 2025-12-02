import React, { useState, useEffect, useCallback } from "react";
import {
     Card,
     Button,
     Input,
     Select,
     SelectContent,
     SelectItem,
     SelectTrigger,
     SelectValue,
     Textarea,
     Table,
     TableHeader,
     TableRow,
     TableHead,
     TableBody,
     TableCell,
     Modal
} from "../../../shared/components/ui";
import {
     AlertTriangle,
     Search,
     Eye,
     CheckCircle,
     Clock,
     Calendar,
     Shield,
     RefreshCw,
     FileWarning,
     Trash2
} from "lucide-react";
import {
     fetchReports,
     fetchReportStatistics,
     handleReport as handleReportApi,
     deleteReport as deleteReportApi
} from "../../../shared/services/reports";
import { createNotification } from "../../../shared/services/notifications";
import { fetchPostById } from "../../../shared/services/posts";
import { fetchCommentById } from "../../../shared/services/comments";
import Swal from "sweetalert2";

const STATUS_OPTIONS = [
     { value: "all", label: "Tất cả trạng thái" },
     { value: "Pending", label: "Chờ xử lý" },
     { value: "Reviewed", label: "Đã xem" },
     { value: "Resolved", label: "Đã giải quyết" },
     { value: "Rejected", label: "Đã từ chối" }
];

const TARGET_TYPE_OPTIONS = [
     { value: "all", label: "Tất cả loại nội dung" },
     { value: "Post", label: "Bài viết" },
     { value: "Comment", label: "Bình luận" }
];

const RESOLUTION_ACTIONS = [
     { value: "None", label: "Không thực hiện" },
     { value: "Hide", label: "Ẩn nội dung" },
     { value: "Delete", label: "Xóa nội dung" }
];

export default function ViolationReportsManagement() {
     const [reports, setReports] = useState([]);
     const [filteredReports, setFilteredReports] = useState([]);
     const [searchTerm, setSearchTerm] = useState("");
     const [statusFilter, setStatusFilter] = useState("all");
     const [typeFilter, setTypeFilter] = useState("all");
     const [selectedReport, setSelectedReport] = useState(null);
     const [showDetailModal, setShowDetailModal] = useState(false);
     const [showActionModal, setShowActionModal] = useState(false);
     const [actionStatus, setActionStatus] = useState("Reviewed");
     const [actionDecision, setActionDecision] = useState("None");
     const [actionNote, setActionNote] = useState("");
     const [isSubmittingAction, setIsSubmittingAction] = useState(false);
     const [isLoading, setIsLoading] = useState(true);
     const [errorMessage, setErrorMessage] = useState("");
     const [stats, setStats] = useState(null);
     const [isRefreshing, setIsRefreshing] = useState(false);

     const getReportId = useCallback((report) => report?.reportId ?? report?.ReportId ?? report?.id, []);
     const getStatusValue = useCallback((report) => report?.status ?? report?.Status ?? "Pending", []);
     const getTargetType = useCallback((report) => report?.targetType ?? report?.TargetType ?? "Post", []);
     const getReasonText = useCallback((report) => report?.reason ?? report?.Reason ?? "", []);
     const getReporterName = useCallback((report) => report?.reporterName ?? report?.ReporterName ?? "Không rõ", []);
     const getReporterId = useCallback((report) => report?.reporterId ?? report?.ReporterId ?? "", []);
     const getHandledByName = useCallback((report) => report?.handledByName ?? report?.HandledByName ?? null, []);
     const getCreatedAt = useCallback((report) => report?.createdAt ?? report?.CreatedAt ?? null, []);

     const loadReports = useCallback(async (showSkeleton = true) => {
          const params = {
               pageNumber: 1,
               pageSize: 100
          };
          if (statusFilter !== "all") {
               params.status = statusFilter;
          }
          if (typeFilter !== "all") {
               params.targetType = typeFilter;
          }

          if (showSkeleton) {
               setIsLoading(true);
          } else {
               setIsRefreshing(true);
          }
          setErrorMessage("");

          const result = await fetchReports(params);
          if (result?.ok) {
               setReports(result.data || []);
          } else {
               setReports([]);
               setErrorMessage(result?.reason || "Không thể tải danh sách báo cáo.");
          }

          if (showSkeleton) {
               setIsLoading(false);
          }
          setIsRefreshing(false);
     }, [statusFilter, typeFilter]);

     const loadStatistics = useCallback(async () => {
          const result = await fetchReportStatistics();
          if (result?.ok) {
               setStats(result.data);
          }
     }, []);

     const statusCount = useCallback((status) => {
          return reports.filter(report => getStatusValue(report) === status).length;
     }, [reports, getStatusValue]);

     const statsSummary = {
          total: stats?.totalReports ?? stats?.TotalReports ?? reports.length,
          pending: stats?.pendingReports ?? stats?.PendingReports ?? statusCount("Pending"),
          reviewed: stats?.reviewedReports ?? stats?.ReviewedReports ?? statusCount("Reviewed"),
          resolved: stats?.resolvedReports ?? stats?.ResolvedReports ?? statusCount("Resolved")
     };

     const handleRefresh = () => {
          loadReports(false);
     };

     useEffect(() => {
          loadReports();
     }, [loadReports]);

     useEffect(() => {
          loadStatistics();
     }, [loadStatistics]);

     useEffect(() => {
          let filtered = reports;
          if (searchTerm) {
               const searchValue = searchTerm.toLowerCase();
               filtered = filtered.filter(report => {
                    const reporterName = getReporterName(report).toLowerCase();
                    const reason = getReasonText(report).toLowerCase();
                    return reporterName.includes(searchValue) || reason.includes(searchValue);
               });
          }
          setFilteredReports(filtered);
     }, [reports, searchTerm, getReporterName, getReasonText]);

     const handleViewReport = (report) => {
          setSelectedReport(report);
          setShowDetailModal(true);
     };

     const handleTakeAction = (report) => {
          setSelectedReport(report);
          const currentStatus = getStatusValue(report);
          setActionStatus(currentStatus === "Pending" ? "Reviewed" : currentStatus);
          setActionDecision("None");
          setActionNote("");
          setShowActionModal(true);
     };

     // Hàm gửi thông báo cho người báo cáo
     const sendNotificationToReporter = async (report, status, action, adminNote) => {
          const reporterId = getReporterId(report);
          if (!reporterId) {
               console.warn("[ViolationReportsManagement] Cannot send notification: Reporter ID not found");
               return;
          }

          try {
               const targetType = getTargetType(report);
               const targetId = report?.targetId ?? report?.TargetId ?? 0;
               const targetTypeLabel = targetType === "Post" ? "bài viết" : "bình luận";

               let message = "";
               switch (status) {
                    case "Reviewed":
                         message = `Báo cáo của bạn về ${targetTypeLabel} đã được xem xét. Ghi chú từ Admin: ${adminNote}`;
                         break;
                    case "Resolved":
                         const actionLabel = action === "Hide" ? "đã bị ẩn" : action === "Delete" ? "đã bị xóa" : "đã được xử lý";
                         message = `Báo cáo của bạn về ${targetTypeLabel} đã được giải quyết. Nội dung ${actionLabel}. Ghi chú từ Admin: ${adminNote}`;
                         break;
                    case "Rejected":
                         message = `Báo cáo của bạn về ${targetTypeLabel} đã bị từ chối. Ghi chú từ Admin: ${adminNote}`;
                         break;
                    default:
                         message = `Báo cáo của bạn về ${targetTypeLabel} đã được cập nhật. Ghi chú từ Admin: ${adminNote}`;
               }

               const notificationPayload = {
                    userId: Number(reporterId),
                    type: "ReportResult",
                    targetId: Number(targetId),
                    message: message
               };

               const notifResult = await createNotification(notificationPayload);
               if (!notifResult?.ok) {
                    console.error("[ViolationReportsManagement] Failed to send notification to reporter:", notifResult?.reason);
               }
          } catch (error) {
               console.error("[ViolationReportsManagement] Error sending notification to reporter:", error);
          }
     };

     // Hàm gửi thông báo cho người bị báo cáo
     const sendNotificationToReportedUser = async (report, action, adminNote, reportedUserId = null) => {
          try {
               const targetType = getTargetType(report);
               const targetId = report?.targetId ?? report?.TargetId ?? 0;

               if (!targetId) {
                    console.warn("[ViolationReportsManagement] Cannot send notification: Target ID not found");
                    return;
               }

               // Nếu không có reportedUserId được truyền vào, thử fetch lại
               if (!reportedUserId) {

                    if (targetType === "Post") {
                         try {

                              const post = await fetchPostById(targetId);

                              // Thử nhiều cách lấy userId
                              reportedUserId = post?.userId ?? 
                                             post?.userID ?? 
                                             post?.UserID ??
                                             post?.PostID ??
                                             post?.postId ??
                                             post?.author?.id ?? 
                                             post?.author?.userId ?? 
                                             post?.author?.userID ??
                                             post?.author?.UserID ??
                                             post?.author?.ID ??
                                             null;
                              
                              console.log("[ViolationReportsManagement] Extracted userId from post:", reportedUserId, "Post keys:", Object.keys(post || {}));
                         } catch (error) {
                              console.error("[ViolationReportsManagement] Error fetching post:", error);
                              // Nếu fetch thất bại, có thể post đã bị xóa, nhưng vẫn cần gửi thông báo
                              // Nên không return ở đây
                         }
                    } else if (targetType === "Comment") {
                         try {

                              const comment = await fetchCommentById(targetId);

                              // Thử nhiều cách lấy userId từ comment
                              // Ưu tiên lấy từ rawCommentData (data gốc từ API)
                              reportedUserId = comment?.rawCommentData?.userId ??
                                             comment?.rawCommentData?.userID ??
                                             comment?.rawCommentData?.UserID ??
                                             comment?.rawCommentData?.UserId ??
                                             // Sau đó từ rawData.data
                                             comment?.rawData?.data?.userId ??
                                             comment?.rawData?.data?.userID ??
                                             comment?.rawData?.data?.UserID ??
                                             comment?.rawData?.data?.UserId ??
                                             // Từ author object
                                             comment?.author?.id ?? 
                                             comment?.author?.userId ?? 
                                             comment?.author?.userID ??
                                             comment?.author?.UserID ??
                                             comment?.author?.Id ??
                                             comment?.author?.ID ??
                                             // Từ comment normalized
                                             comment?.userId ?? 
                                             comment?.userID ?? 
                                             comment?.UserID ??
                                             comment?.UserId ??
                                             // Từ rawData trực tiếp
                                             comment?.rawData?.userId ??
                                             comment?.rawData?.userID ??
                                             comment?.rawData?.UserID ??
                                             comment?.rawData?.UserId ??
                                             comment?.rawData?.author?.id ??
                                             comment?.rawData?.author?.userId ??
                                             comment?.rawData?.author?.userID ??
                                             comment?.rawData?.author?.UserID ??
                                             null;

                              console.log("[ViolationReportsManagement] Comment keys:", Object.keys(comment || {}));
                              if (comment?.author) {

                                   console.log("[ViolationReportsManagement] Author keys:", Object.keys(comment.author));

                              }
                              if (comment?.rawData) {

                                   console.log("[ViolationReportsManagement] Raw data keys:", Object.keys(comment.rawData));
                                   if (comment.rawData.author) {

                                        console.log("[ViolationReportsManagement] Raw author keys:", Object.keys(comment.rawData.author));
                                   }
                              }
                         } catch (error) {
                              console.error("[ViolationReportsManagement] Error fetching comment:", error);
                         }
                    }
               } else {

               }

               if (!reportedUserId) {
                    console.warn("[ViolationReportsManagement] Cannot send notification: Reported user ID not found. Report:", report);
                    return;
               }

               const targetTypeLabel = targetType === "Post" ? "bài viết" : "bình luận";
               let message = "";
               if (action === "Hide") {
                    message = `${targetTypeLabel.charAt(0).toUpperCase() + targetTypeLabel.slice(1)} của bạn đã bị ẩn do vi phạm quy định. Ghi chú từ Admin: ${adminNote}`;
               } else if (action === "Delete") {
                    // Yêu cầu người dùng tự xóa thay vì xóa ngay
                    message = `${targetTypeLabel.charAt(0).toUpperCase() + targetTypeLabel.slice(1)} của bạn vi phạm quy định và yêu cầu xóa. Ghi chú từ Admin: ${adminNote}`;
               } else {
                    message = `${targetTypeLabel.charAt(0).toUpperCase() + targetTypeLabel.slice(1)} của bạn đã được xử lý. Ghi chú từ Admin: ${adminNote}`;
               }

               const notificationPayload = {
                    userId: Number(reportedUserId),
                    type: "ReportResult",
                    targetId: Number(targetId),
                    message: message
               };

               const notifResult = await createNotification(notificationPayload);

               if (!notifResult?.ok) {
                    console.error("[ViolationReportsManagement] Failed to send notification to reported user:", notifResult?.reason);
               } else {

               }
          } catch (error) {
               console.error("[ViolationReportsManagement] Error sending notification to reported user:", error);
          }
     };

     const handleSubmitAction = async () => {
          if (!selectedReport) {
               return;
          }

          if (!actionNote.trim()) {
               Swal.fire({
                    icon: "warning",
                    title: "Thiếu ghi chú",
                    text: "Vui lòng nhập ghi chú cho hành động này."
               });
               return;
          }

          // Nếu trạng thái là "Resolved" và hành động là "Hide" hoặc "Delete", 
          // cần lấy userId của người bị báo cáo TRƯỚC khi xử lý (vì sau khi xóa sẽ không fetch được)
          let reportedUserId = null;
          if (actionStatus === "Resolved" && (actionDecision === "Hide" || actionDecision === "Delete")) {
               const targetType = getTargetType(selectedReport);
               const targetId = selectedReport?.targetId ?? selectedReport?.TargetId ?? 0;
               
               if (targetId) {
                    try {
                         if (targetType === "Post") {

                              const post = await fetchPostById(targetId);

                              reportedUserId = post?.userId ?? 
                                             post?.userID ?? 
                                             post?.UserID ??
                                             post?.author?.id ?? 
                                             post?.author?.userId ?? 
                                             post?.author?.userID ??
                                             post?.author?.UserID ??
                                             null;
                         } else if (targetType === "Comment") {

                              const comment = await fetchCommentById(targetId);

                              reportedUserId = comment?.userId ?? 
                                             comment?.userID ?? 
                                             comment?.UserID ??
                                             comment?.author?.id ?? 
                                             comment?.author?.userId ?? 
                                             comment?.author?.userID ??
                                             comment?.author?.UserID ??
                                             null;
                         }

                    } catch (error) {
                         console.error("[ViolationReportsManagement] Error pre-fetching target:", error);
                    }
               }
          }

          // Nếu action là "Delete", không xóa ngay mà chỉ gửi thông báo yêu cầu người dùng tự xóa
          // Vì vậy action trong payload sẽ là "None" để không xóa ngay
          const payload = {
               status: actionStatus,
               action: (actionStatus === "Resolved" && actionDecision === "Delete") ? "None" : (actionStatus === "Resolved" ? actionDecision : "None"),
               adminNote: actionNote.trim()
          };

          setIsSubmittingAction(true);
          Swal.fire({
               title: "Đang cập nhật báo cáo...",
               allowOutsideClick: false,
               didOpen: () => {
                    Swal.showLoading();
               }
          });
          const result = await handleReportApi(getReportId(selectedReport), payload);
          Swal.close();
          setIsSubmittingAction(false);

          if (result?.ok) {
               // Gửi thông báo cho người báo cáo
               await sendNotificationToReporter(selectedReport, actionStatus, actionDecision, actionNote.trim());

               // Nếu trạng thái là "Resolved" và hành động là "Hide" hoặc "Delete", gửi thông báo cho người bị báo cáo
               // Luôn gọi hàm này, để hàm tự xử lý việc fetch userId nếu cần
               if (actionStatus === "Resolved" && (actionDecision === "Hide" || actionDecision === "Delete")) {

                    await sendNotificationToReportedUser(selectedReport, actionDecision, actionNote.trim(), reportedUserId);
               }

               await loadReports(false);
               setShowActionModal(false);
               setShowDetailModal(false);
               Swal.fire({
                    icon: "success",
                    title: "Đã cập nhật",
                    text: result?.message || "Báo cáo đã được xử lý thành công.",
                    timer: 2000,
                    showConfirmButton: false
               });
          } else {
               Swal.fire({
                    icon: "error",
                    title: "Không thể xử lý",
                    text: result?.reason || "Có lỗi xảy ra. Vui lòng thử lại."
               });
          }
     };

     const handleDeleteReport = async (report) => {
          const reportId = getReportId(report);
          const reporterName = getReporterName(report);
          const confirmResult = await Swal.fire({
               icon: "warning",
               title: "Xóa báo cáo?",
               html: `Bạn có chắc chắn muốn xóa báo cáo từ <strong>${reporterName}</strong>?<br/>Hành động này không thể hoàn tác.`,
               showCancelButton: true,
               confirmButtonText: "Xóa",
               cancelButtonText: "Hủy",
               confirmButtonColor: "#dc2626",
               cancelButtonColor: "#6b7280"
          });

          if (!confirmResult.isConfirmed) {
               return;
          }

          try {
               Swal.fire({
                    title: "Đang xóa báo cáo...",
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading()
               });
               const result = await deleteReportApi(reportId);
               Swal.close();

               if (result?.ok) {
                    await loadReports(false);
                    await loadStatistics();
                    Swal.fire({
                         icon: "success",
                         title: "Đã xóa",
                         text: result.message || "Báo cáo đã được xóa.",
                         timer: 2000,
                         showConfirmButton: false
                    });
               } else {
                    Swal.fire({
                         icon: "error",
                         title: "Không thể xóa",
                         text: result?.reason || "Vui lòng thử lại sau."
                    });
               }
          } catch (error) {
               console.error("Error deleting report:", error);
               Swal.close();
               Swal.fire({
                    icon: "error",
                    title: "Có lỗi xảy ra",
                    text: "Không thể xóa báo cáo. Vui lòng thử lại."
               });
          }
     };

     const getStatusBadgeColor = (status) => {
          switch (status) {
               case "Pending":
                    return "bg-yellow-100 text-yellow-800 border-yellow-200";
               case "Reviewed":
                    return "bg-blue-100 text-blue-800 border-blue-200";
               case "Resolved":
                    return "bg-green-100 text-green-800 border-green-200";
               case "Rejected":
                    return "bg-gray-100 text-gray-800 border-gray-200";
               default:
                    return "bg-gray-100 text-gray-800 border-gray-200";
          }
     };

     const getTypeBadgeColor = (type) => {
          return type === "Comment"
               ? "bg-purple-100 text-purple-800 border-purple-200"
               : "bg-orange-100 text-orange-800 border-orange-200";
     };

     const columns = [
          {
               key: "reporter",
               label: "Người báo cáo",
               render: (report) => {
                    const name = getReporterName(report);
                    return (
                         <div className="flex items-center space-x-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                   <span className="text-sm font-bold text-white">
                                        {name.charAt(0)}
                                   </span>
                              </div>
                              <div>
                                   <p className="font-medium text-slate-900">{name}</p>
                                   <p className="text-sm text-slate-500">
                                        ID: {getReporterId(report) || "N/A"}
                                   </p>
                              </div>
                         </div>
                    );
               }
          },
          {
               key: "target",
               label: "Mục tiêu",
               render: (report) => {
                    const type = getTargetType(report);
                    return (
                         <div className="flex items-center space-x-2">
                              <FileWarning className="w-4 h-4 text-slate-500" />
                              <div>
                                   <p className="text-sm font-semibold text-slate-900">{type}</p>
                                   <p className="text-xs text-slate-500">ID: {report.targetId || report.TargetId}</p>
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeBadgeColor(type)}`}>
                                   {type === "Comment" ? "Bình luận" : "Bài viết"}
                              </span>
                         </div>
                    );
               }
          },
          {
               key: "reason",
               label: "Lý do",
               render: (report) => (
                    <p className="text-sm text-slate-600 line-clamp-2 max-w-xs">
                         {getReasonText(report)}
                    </p>
               )
          },
          {
               key: "status",
               label: "Trạng thái",
               render: (report) => {
                    const status = getStatusValue(report);
                    return (
                         <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(status)}`}>
                              {status}
                         </span>
                    );
               }
          },
          {
               key: "createdAt",
               label: "Ngày báo cáo",
               render: (report) => (
                    <div className="flex items-center space-x-2">
                         <Calendar className="w-4 h-4 text-slate-400" />
                         <span className="text-sm text-slate-600">
                              {getCreatedAt(report)
                                   ? new Date(getCreatedAt(report)).toLocaleString("vi-VN")
                                   : "N/A"}
                         </span>
                    </div>
               )
          },
          {
               key: "actions",
               label: "Thao tác",
               render: (report) => {
                    const status = getStatusValue(report);
                    const isProcessed = status === "Resolved" || status === "Reviewed" || status === "Rejected";
                    return (
                         <div className="flex items-center space-x-2">
                              <Button
                                   onClick={() => handleViewReport(report)}
                                   variant="ghost"
                                   size="sm"
                                   className="text-blue-600 rounded-2xl hover:text-blue-800 hover:bg-blue-50"
                                   title="Xem chi tiết"
                              >
                                   <Eye className="w-4 h-4" />
                              </Button>
                              {status === "Pending" && (
                                   <Button
                                        onClick={() => handleTakeAction(report)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-emerald-600 rounded-2xl hover:text-emerald-800 hover:bg-emerald-50"
                                        title="Xử lý báo cáo"
                                   >
                                        <CheckCircle className="w-4 h-4" />
                                   </Button>
                              )}
                              {isProcessed && (
                                   <Button
                                        onClick={() => handleDeleteReport(report)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 rounded-2xl hover:text-red-800 hover:bg-red-50"
                                        title="Xóa báo cáo"
                                   >
                                        <Trash2 className="w-4 h-4" />
                                   </Button>
                              )}
                         </div>
                    );
               }
          }
     ];

     if (isLoading && reports.length === 0) {
          return (
               <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center text-slate-600 space-y-3">
                         <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-200 border-t-red-600 mx-auto"></div>
                         <p>Đang tải dữ liệu báo cáo...</p>
                    </div>
               </div>
          );
     }

     return (
          <div className="space-y-6">
               {/* Header */}
               <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200/50">
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-pink-700 bg-clip-text text-transparent">
                                   Quản lý báo cáo vi phạm
                              </h1>
                              <p className="text-slate-600 mt-2 font-medium">
                                   Xem xét và xử lý các báo cáo vi phạm từ người dùng
                              </p>
                         </div>
                         <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                              <AlertTriangle className="w-8 h-8 text-white" />
                         </div>
                    </div>
               </div>

               {/* Filters */}
               <Card className="p-6 rounded-2xl shadow-lg">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
                         <div className="flex-1">
                              <div className="relative">
                                   <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                                   <Input
                                        placeholder="Tìm kiếm theo tên người dùng hoặc mô tả..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                   />
                              </div>
                         </div>
                         <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
                              <div className="flex space-x-3">
                                   <Select value={typeFilter} onValueChange={setTypeFilter}>
                                        <SelectTrigger className="w-48 rounded-2xl">
                                             <SelectValue placeholder="Tất cả loại vi phạm" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {TARGET_TYPE_OPTIONS.map(option => (
                                                  <SelectItem key={option.value} value={option.value}>
                                                       {option.label}
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                                   <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-40 rounded-2xl">
                                             <SelectValue placeholder="Tất cả trạng thái" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {STATUS_OPTIONS.map(option => (
                                                  <SelectItem key={option.value} value={option.value}>
                                                       {option.label}
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>
                              <Button
                                   variant="outline"
                                   className="rounded-2xl"
                                   onClick={handleRefresh}
                                   disabled={isLoading || isRefreshing}
                              >
                                   <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                                   {isRefreshing ? "Đang tải..." : "Làm mới"}
                              </Button>
                         </div>
                    </div>
               </Card>

               {errorMessage && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700">
                         {errorMessage}
                    </div>
               )}

               {/* Stats */}
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card className="p-4 rounded-2xl shadow-lg">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Tổng báo cáo</p>
                                   <p className="text-2xl font-bold text-slate-900">{statsSummary.total}</p>
                              </div>
                              <AlertTriangle className="w-8 h-8 text-red-600" />
                         </div>
                    </Card>
                    <Card className="p-4">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Chờ xử lý</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {statsSummary.pending}
                                   </p>
                              </div>
                              <Clock className="w-8 h-8 text-yellow-600" />
                         </div>
                    </Card>
                    <Card className="p-4">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Đã xem</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {statsSummary.reviewed}
                                   </p>
                              </div>
                              <Shield className="w-8 h-8 text-blue-600" />
                         </div>
                    </Card>
                    <Card className="p-4">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Đã giải quyết</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {statsSummary.resolved}
                                   </p>
                              </div>
                              <CheckCircle className="w-8 h-8 text-green-600" />
                         </div>
                    </Card>
               </div>

               {/* Reports Table */}
               <Card className="p-5 rounded-2xl shadow-lg space-y-3">
                    <div className="flex items-center justify-between">
                         <h3 className="text-lg font-bold text-slate-900">
                              Danh sách báo cáo ({filteredReports.length})
                         </h3>
                    </div>
                    {filteredReports.length === 0 ? (
                         <div className="text-center py-8 text-slate-500">
                              Hiện chưa có báo cáo nào phù hợp với bộ lọc
                         </div>
                    ) : (
                         <Table className="w-full rounded-2xl border border-slate-200">
                              <TableHeader>
                                   <TableRow>
                                        {columns.map((column) => (
                                             <TableHead key={column.key}>{column.label}</TableHead>
                                        ))}
                                   </TableRow>
                              </TableHeader>
                              <TableBody>
                                   {filteredReports.map((report) => (
                                        <TableRow key={getReportId(report)}>
                                             {columns.map((column) => (
                                                  <TableCell key={column.key}>
                                                       {column.render(report)}
                                                  </TableCell>
                                             ))}
                                        </TableRow>
                                   ))}
                              </TableBody>
                         </Table>
                    )}
               </Card>

               {/* Report Detail Modal */}
               <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Chi tiết báo cáo vi phạm"
                    size="4xl"
                    className="max-h-[90vh] max-w-2xl rounded-2xl scrollbar-hide"
               >
                    {selectedReport && (
                         <div className="space-y-4 px-3">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                   <div>
                                        <h4 className="text-lg font-bold text-slate-900 mb-3">Người báo cáo</h4>
                                        <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-2xl border border-blue-200">
                                             <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                                                  <span className="text-lg font-bold text-white">
                                                       {getReporterName(selectedReport).charAt(0)}
                                                  </span>
                                             </div>
                                             <div>
                                                  <p className="font-bold text-slate-900">{getReporterName(selectedReport)}</p>
                                                  <p className="text-sm text-slate-600">ID: {getReporterId(selectedReport) || "Không xác định"}</p>
                                             </div>
                                        </div>
                                   </div>
                                   <div>
                                        <h4 className="text-lg font-bold text-slate-900 mb-3">Nội dung bị báo cáo</h4>
                                        <div className="flex items-center space-x-3 p-2 bg-orange-50 rounded-2xl border border-orange-200">
                                             <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                                                  <FileWarning className="w-6 h-6 text-white" />
                                             </div>
                                             <div>
                                                  <p className="font-bold text-slate-900">{getTargetType(selectedReport) === "Comment" ? "Bình luận" : "Bài viết"}</p>
                                                  <p className="text-sm text-slate-600">Target ID: {selectedReport.targetId || selectedReport.TargetId}</p>
                                             </div>
                                        </div>
                                   </div>
                              </div>

                              <div>
                                   <h4 className="text-lg font-bold text-slate-900 mb-2">Thông tin báo cáo</h4>
                                   <div className="space-y-2">
                                        <div className="flex items-center space-x-2">
                                             <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getTypeBadgeColor(getTargetType(selectedReport))}`}>
                                                  {getTargetType(selectedReport)}
                                             </span>
                                             <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(getStatusValue(selectedReport))}`}>
                                                  {getStatusValue(selectedReport)}
                                             </span>
                                        </div>
                                        <div>
                                             <p className="text-sm font-medium text-yellow-700 mb-1">Lý do:</p>
                                             <p className="text-slate-900 bg-slate-50 p-3 rounded-2xl border">
                                                  {getReasonText(selectedReport)}
                                             </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                             <Calendar className="w-4 h-4 text-slate-400" />
                                             <span className="text-sm text-slate-600">
                                                  Gửi lúc: {getCreatedAt(selectedReport) ? new Date(getCreatedAt(selectedReport)).toLocaleString("vi-VN") : "Không xác định"}
                                             </span>
                                        </div>
                                   </div>
                              </div>

                              {getHandledByName(selectedReport) && (
                                   <div className="justify-end">
                                        <h4 className="text-lg font-bold text-slate-900 mb-1">Thông tin xử lý</h4>
                                        <p className="text-sm text-slate-600">Người xử lý: <span className="font-semibold text-slate-900">{getHandledByName(selectedReport)}</span></p>
                                   </div>
                              )}

                              {getStatusValue(selectedReport) === "Pending" && (
                                   <div className="pt-4 border-t border-slate-200">
                                        <Button
                                             onClick={() => handleTakeAction(selectedReport)}
                                             className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-2xl"
                                        >
                                             <CheckCircle className="w-4 h-4 mr-2" />
                                             Xử lý báo cáo
                                        </Button>
                                   </div>
                              )}
                         </div>
                    )
                    }
               </Modal >

               {/* Action Modal */}
               <Modal
                    isOpen={showActionModal}
                    onClose={() => setShowActionModal(false)}
                    title="Xử lý báo cáo"
                    size="2xl"
                    className="max-h-[90vh] scrollbar-hide"
               >
                    <div className="space-y-4">
                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Trạng thái mới *
                              </label>
                              <Select value={actionStatus} onValueChange={setActionStatus}>
                                   <SelectTrigger className="w-full rounded-2xl">
                                        <SelectValue placeholder="Chọn trạng thái" />
                                   </SelectTrigger>
                                   <SelectContent>
                                        {STATUS_OPTIONS.filter(option => option.value !== "all").map(option => (
                                             <SelectItem key={option.value} value={option.value}>
                                                  {option.label}
                                             </SelectItem>
                                        ))}
                                   </SelectContent>
                              </Select>
                         </div>

                         {actionStatus === "Resolved" && (
                              <div>
                                   <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Hành động đối với nội dung *
                                   </label>
                                   <Select value={actionDecision} onValueChange={setActionDecision}>
                                        <SelectTrigger className="w-full rounded-2xl">
                                             <SelectValue placeholder="Chọn hành động" />
                                        </SelectTrigger>
                                        <SelectContent>
                                             {RESOLUTION_ACTIONS.map(option => (
                                                  <SelectItem key={option.value} value={option.value}>
                                                       {option.label}
                                                  </SelectItem>
                                             ))}
                                        </SelectContent>
                                   </Select>
                              </div>
                         )}

                         <div>
                              <label className="block text-sm font-medium text-slate-700 mb-2">
                                   Ghi chú hành động *
                              </label>
                              <Textarea
                                   value={actionNote}
                                   onChange={(e) => setActionNote(e.target.value)}
                                   placeholder="Nhập ghi chú về hành động này..."
                                   rows={4}
                              />
                         </div>

                         <div className="flex space-x-3 pt-4 border-t border-slate-200">
                              <Button
                                   onClick={handleSubmitAction}
                                   className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-2xl"
                                   disabled={!actionNote.trim() || isSubmittingAction}
                              >
                                   {isSubmittingAction ? "Đang xử lý..." : "Cập nhật trạng thái"}
                              </Button>
                              <Button
                                   onClick={() => setShowActionModal(false)}
                                   variant="outline"
                                   className="flex-1 rounded-2xl"
                                   disabled={isSubmittingAction}
                              >
                                   Hủy
                              </Button>
                         </div>
                    </div>
               </Modal>
          </div >
     );
}

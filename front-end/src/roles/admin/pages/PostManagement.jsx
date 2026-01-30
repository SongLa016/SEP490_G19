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
     Table,
     TableHeader,
     TableRow,
     TableHead,
     TableBody,
     TableCell,
     Modal
} from "../../../shared/components/ui";
import {
     FileText,
     Eye,
     Trash2,
     Calendar,
     User,
     Search,
     CheckCircle,
     Clock,
     RefreshCw,
     AlertCircle,
     XCircle
} from "lucide-react";
import {
     fetchPosts,
     fetchPostById,
     fetchTrendingPosts,
     fetchPendingPosts,
     deletePostAsAdmin,
     reviewPost
} from "../../../shared/services/posts";
import { createNotification } from "../../../shared/services/notifications";
import Swal from 'sweetalert2';

const STATUS_OPTIONS = [
     { value: "all", label: "Tất cả" },
     { value: "Pending", label: "Chờ duyệt" },
     { value: "Published", label: "Đã xuất bản" },
     { value: "Rejected", label: "Đã từ chối" },
];

export default function PostManagement() {
     const [posts, setPosts] = useState([]);
     const [filteredPosts, setFilteredPosts] = useState([]);
     const [searchTerm, setSearchTerm] = useState("");
     const [statusFilter, setStatusFilter] = useState("all");
     const [viewMode, setViewMode] = useState("all"); // all, pending, trending
     const [selectedPost, setSelectedPost] = useState(null);
     const [showDetailModal, setShowDetailModal] = useState(false);
     const [isLoading, setIsLoading] = useState(true);
     const [isRefreshing, setIsRefreshing] = useState(false);
     const [errorMessage, setErrorMessage] = useState("");

     const loadPosts = useCallback(async (showSkeleton = true) => {
          if (showSkeleton) {
               setIsLoading(true);
          } else {
               setIsRefreshing(true);
          }
          setErrorMessage("");

          try {
               let result;

               if (viewMode === "pending") {
                    // Chế độ xem bài chờ duyệt
                    result = await fetchPendingPosts();
               } else if (viewMode === "trending") {
                    // Chế độ xem bài nổi bật
                    result = await fetchTrendingPosts();
               } else {
                    // Chế độ xem tất cả - áp dụng statusFilter
                    if (statusFilter === "all") {
                         const allStatuses = ["Pending", "Published", "Rejected", "Hidden", "Inactive"];
                         const allResults = await Promise.all(
                              allStatuses.map(async (status) => {
                                   try {
                                        const params = {
                                             pageNumber: 1,
                                             pageSize: 1000,
                                             status: status
                                        };
                                        const statusResult = await fetchPosts(params);
                                        return Array.isArray(statusResult) ? statusResult : [];
                                   } catch (error) {
                                        return [];
                                   }
                              })
                         );
                         // Merge tất cả kết quả lại
                         result = allResults.flat();
                         // Loại bỏ duplicate posts (nếu có)
                         const uniquePosts = new Map();
                         result.forEach(post => {
                              const postId = post?.PostID ?? post?.postId ?? post?.id;
                              if (postId && !uniquePosts.has(postId)) {
                                   uniquePosts.set(postId, post);
                              }
                         });
                         result = Array.from(uniquePosts.values());
                    } else {
                         // Khi chọn một trạng thái cụ thể, chỉ gọi API với trạng thái đó
                         const params = {
                              pageNumber: 1,
                              pageSize: 1000
                         };
                         params.status = statusFilter;
                         result = await fetchPosts(params);
                    }

                    if (result && result.length > 0) {
                         console.log("[PostManagement] Sample post statuses:", result.slice(0, 5).map(p => ({
                              id: p?.PostID ?? p?.postId ?? p?.id,
                              status: p?.status ?? p?.Status ?? p?.PostStatus ?? "N/A",
                              isPending: p?.isPending ?? p?.is_pending ?? false
                         })));
                    }
               }

               // Áp dụng filter theo statusFilter cho tất cả các viewMode (nếu cần)
               // Nếu viewMode là "pending" hoặc "trending", vẫn có thể filter thêm theo statusFilter
               if ((viewMode === "pending" || viewMode === "trending") && statusFilter !== "all" && Array.isArray(result)) {
                    result = result.filter(post => {
                         const status = getPostStatus(post);
                         if (statusFilter === "Published") {
                              return status === "Published" || status === "Active";
                         }
                         return status === statusFilter;
                    });
               }

               if (Array.isArray(result)) {
                    setPosts(result || []);
               } else {
                    setPosts([]);
                    setErrorMessage("Không thể tải danh sách bài viết.");
               }
          } catch (error) {
               console.error("Error loading posts:", error);
               setPosts([]);
               setErrorMessage(error.message || "Không thể tải danh sách bài viết.");
          } finally {
               if (showSkeleton) {
                    setIsLoading(false);
               }
               setIsRefreshing(false);
          }
     }, [viewMode, statusFilter]);

     useEffect(() => {
          loadPosts();
     }, [loadPosts]);

     useEffect(() => {
          let filtered = posts;

          // Filter by search term (luôn áp dụng)
          if (searchTerm) {
               const searchValue = searchTerm.toLowerCase();
               filtered = filtered.filter(post => {
                    const title = (post.Title || post.title || "").toLowerCase();
                    const content = (post.Content || post.content || "").toLowerCase();
                    return title.includes(searchValue) || content.includes(searchValue);
               });
          }

          // Filter theo statusFilter (áp dụng cho tất cả viewMode nếu cần)
          // Khi viewMode === "all", statusFilter đã được áp dụng ở API level
          // Nhưng vẫn có thể filter lại ở client-side để đảm bảo chính xác
          if (statusFilter !== "all") {
               filtered = filtered.filter(post => {
                    const status = getPostStatus(post);
                    if (statusFilter === "Published") {
                         return status === "Published" || status === "Active";
                    }
                    return status === statusFilter;
               });
          }

          setFilteredPosts(filtered);
     }, [posts, searchTerm, statusFilter, viewMode]);

     const handleViewPost = async (post) => {
          try {
               const postId = post.PostID || post.postId || post.id;
               const postDetail = await fetchPostById(postId);
               setSelectedPost(postDetail);
               setShowDetailModal(true);
          } catch (error) {
               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || 'Không thể tải chi tiết bài viết.',
                    confirmButtonText: 'Đã hiểu'
               });
          }
     };

     const handleReviewPost = async (post) => {
          const result = await Swal.fire({
               title: 'Duyệt bài viết?',
               text: `Bạn có chắc chắn muốn duyệt bài viết "${post.Title || post.title || 'này'}"?`,
               icon: 'question',
               showCancelButton: true,
               confirmButtonColor: '#10b981',
               cancelButtonColor: '#6b7280',
               confirmButtonText: 'Duyệt',
               cancelButtonText: 'Hủy'
          });

          if (result.isConfirmed) {
               try {
                    Swal.fire({
                         title: 'Đang xử lý...',
                         allowOutsideClick: false,
                         didOpen: () => {
                              Swal.showLoading();
                         }
                    });

                    const postId = post.PostID || post.postId || post.id;
                    const reviewResult = await reviewPost(postId);
                    // Gửi thông báo cho Player (người tạo bài viết)
                    const authorId = getPostAuthorId(post);
                    if (authorId) {
                         try {
                              const postTitle = getPostTitle(post);
                              const notificationPayload = {
                                   userId: Number(authorId),
                                   type: "PostReview",
                                   targetId: Number(postId),
                                   message: `Bài viết "${postTitle}" của bạn đã được duyệt và đã được xuất bản.`
                              };
                              const notifResult = await createNotification(notificationPayload);
                              if (!notifResult?.ok) {
                                   console.error("[PostManagement] Notification failed:", notifResult?.reason);
                              }
                         } catch (notifError) {
                              console.error("[PostManagement] Error sending notification:", notifError);
                              // Không block flow nếu gửi thông báo thất bại
                         }
                    } else {
                         console.warn("[PostManagement] Cannot send notification: Author ID not found for post:", post);
                    }

                    // Close loading dialog
                    Swal.close();

                    Swal.fire({
                         icon: 'success',
                         title: 'Đã duyệt!',
                         text: reviewResult?.message || 'Bài viết đã được duyệt thành công.',
                         timer: 2000,
                         showConfirmButton: false,
                         toast: true,
                         position: 'top-end'
                    });

                    // Reload posts to reflect changes
                    await loadPosts(false);
               } catch (error) {
                    console.error("[PostManagement] Error reviewing post:", error);

                    // Close loading dialog
                    Swal.close();

                    // Extract error message
                    let errorMessage = 'Không thể duyệt bài viết.';
                    if (error.response) {
                         // API returned an error response
                         errorMessage = error.response.data?.message ||
                              error.response.data?.error ||
                              error.response.data?.title ||
                              `Lỗi ${error.response.status}: ${error.response.statusText}`;
                    } else if (error.message) {
                         errorMessage = error.message;
                    }

                    Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: errorMessage,
                         confirmButtonText: 'Đã hiểu'
                    });
               }
          }
     };

     const handleRejectPost = async (post) => {
          // Prompt for rejection reason (optional)
          const result = await Swal.fire({
               title: 'Từ chối bài viết?',
               text: `Bạn có chắc chắn muốn từ chối bài viết "${post.Title || post.title || 'này'}"?`,
               input: 'textarea',
               inputLabel: 'Lý do từ chối (tùy chọn)',
               inputPlaceholder: 'Nhập lý do từ chối bài viết...',
               inputAttributes: {
                    'aria-label': 'Lý do từ chối'
               },
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280',
               confirmButtonText: 'Từ chối',
               cancelButtonText: 'Hủy'
          });

          if (result.isConfirmed) {
               try {
                    Swal.fire({
                         title: 'Đang xử lý...',
                         allowOutsideClick: false,
                         didOpen: () => {
                              Swal.showLoading();
                         }
                    });

                    const postId = post.PostID || post.postId || post.id;
                    // Call reviewPost with status "Rejected"
                    const payload = {
                         status: "Rejected"
                    };
                    // Add note if provided
                    if (result.value && result.value.trim()) {
                         payload.note = result.value.trim();
                    }

                    const rejectResult = await reviewPost(postId, payload);
                    // Gửi thông báo cho Player (người tạo bài viết)
                    const authorId = getPostAuthorId(post);
                    if (authorId) {
                         try {
                              const postTitle = getPostTitle(post);
                              const rejectionReason = result.value && result.value.trim()
                                   ? ` Lý do: ${result.value.trim()}`
                                   : '';
                              const notificationPayload = {
                                   userId: Number(authorId),
                                   type: "PostReview",
                                   targetId: Number(postId),
                                   message: `Bài viết "${postTitle}" của bạn đã bị từ chối.${rejectionReason}`
                              };
                              const notifResult = await createNotification(notificationPayload);
                              if (!notifResult?.ok) {
                                   console.error("[PostManagement] Rejection notification failed:", notifResult?.reason);
                              }
                         } catch (notifError) {
                              console.error("[PostManagement] Error sending rejection notification:", notifError);
                              // Không block flow nếu gửi thông báo thất bại
                         }
                    } else {
                         console.warn("[PostManagement] Cannot send rejection notification: Author ID not found for post:", post);
                    }

                    // Close loading dialog
                    Swal.close();

                    Swal.fire({
                         icon: 'success',
                         title: 'Đã từ chối!',
                         text: rejectResult?.message || 'Bài viết đã được từ chối thành công.',
                         timer: 2000,
                         showConfirmButton: false,
                         toast: true,
                         position: 'top-end'
                    });

                    // Reload posts to reflect changes
                    await loadPosts(false);
               } catch (error) {
                    console.error("[PostManagement] Error rejecting post:", error);

                    // Close loading dialog
                    Swal.close();

                    // Extract error message
                    let errorMessage = 'Không thể từ chối bài viết.';
                    if (error.response) {
                         // API returned an error response
                         errorMessage = error.response.data?.message ||
                              error.response.data?.error ||
                              error.response.data?.title ||
                              `Lỗi ${error.response.status}: ${error.response.statusText}`;
                    } else if (error.message) {
                         errorMessage = error.message;
                    }

                    Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: errorMessage,
                         confirmButtonText: 'Đã hiểu'
                    });
               }
          }
     };

     const handleDeletePost = async (post) => {
          const result = await Swal.fire({
               title: 'Xóa bài viết?',
               text: `Bạn có chắc chắn muốn xóa bài viết "${post.Title || post.title || 'này'}"?\n\nHành động này không thể hoàn tác.`,
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#ef4444',
               cancelButtonColor: '#6b7280',
               confirmButtonText: 'Xóa',
               cancelButtonText: 'Hủy'
          });

          if (result.isConfirmed) {
               try {
                    Swal.fire({
                         title: 'Đang xóa...',
                         allowOutsideClick: false,
                         didOpen: () => {
                              Swal.showLoading();
                         }
                    });

                    const postId = post.PostID || post.postId || post.id;
                    await deletePostAsAdmin(postId);

                    Swal.fire({
                         icon: 'success',
                         title: 'Đã xóa!',
                         text: 'Bài viết đã được xóa thành công.',
                         timer: 2000,
                         showConfirmButton: false
                    });

                    await loadPosts(false);
               } catch (error) {
                    Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: error.message || 'Không thể xóa bài viết.',
                         confirmButtonText: 'Đã hiểu'
                    });
               }
          }
     };

     const getStatusBadgeColor = (status) => {
          if (!status) {
               return "bg-gray-100 text-gray-800 border-gray-200";
          }
          switch (status) {
               case "Published":
               case "Active":
                    return "bg-green-100 text-green-800 border-green-200";
               case "Pending":
                    return "bg-yellow-100 text-yellow-800 border-yellow-200";
               case "Rejected":
                    return "bg-red-100 text-red-800 border-red-200";
               default:
                    return "bg-blue-100 text-blue-800 border-blue-200";
          }
     };

     const getStatusLabel = (status) => {
          if (!status) return "Không xác định";
          switch (status) {
               case "Published":
                    return "Đã xuất bản";
               case "Active":
                    return "Hoạt động";
               case "Pending":
                    return "Chờ duyệt";
               case "Rejected":
                    return "Đã từ chối";
               default:
                    return status; // Hiển thị trạng thái gốc nếu không match
          }
     };

     const getPostId = (post) => post?.PostID ?? post?.postId ?? post?.id;
     const getPostTitle = (post) => post?.Title ?? post?.title ?? "Không có tiêu đề";
     const getPostContent = (post) => post?.Content ?? post?.content ?? "";
     const getPostStatus = (post) => {
          let status = post?.status ?? post?.Status ?? post?.PostStatus ?? post?.postStatus ?? null;

          // Kiểm tra các flag để xác định status thực tế
          // normalizePost có các flag isPending, isRejected
          if (post?.isPending || post?.is_pending) {
               status = "Pending";
          } else if (post?.isRejected || post?.is_rejected) {
               status = "Rejected";
          }

          // Nếu status là "Active" nhưng đang ở chế độ pending, có thể là default từ normalizePost
          // Trong trường hợp này, nếu không có flag isPending, vẫn giữ "Active"
          // Nhưng nếu có flag isPending, đã được set ở trên

          return status; // Trả về null nếu không có, không default
     };
     const getPostAuthor = (post) => {
          if (post?.author) {
               return post.author.FullName || post.author.fullName || post.author.Username || post.author.username || "Không rõ";
          }
          return post?.AuthorName ?? post?.authorName ?? "Không rõ";
     };
     const getPostAuthorId = (post) => {
          // Lấy userId của người tạo bài viết
          if (post?.author) {
               return post.author.id || post.author.userId || post.author.userID || post.author.UserID || null;
          }
          return post?.userId ?? post?.userID ?? post?.UserID ?? null;
     };
     const getPostCreatedAt = (post) => post?.CreatedAt ?? post?.createdAt ?? null;

     const columns = [
          {
               key: "title",
               label: "Tiêu đề",
               render: (post) => (
                    <div className="max-w-xs">
                         <p className="font-medium text-slate-900 truncate">{getPostTitle(post)}</p>
                         <p className="text-sm text-slate-500 truncate">{getPostContent(post).substring(0, 100)}...</p>
                    </div>
               )
          },
          {
               key: "author",
               label: "Tác giả",
               render: (post) => (
                    <div className="flex items-center space-x-2">
                         <User className="w-4 h-4 text-slate-400" />
                         <span className="text-sm text-slate-600">{getPostAuthor(post)}</span>
                    </div>
               )
          },
          {
               key: "status",
               label: "Trạng thái",
               render: (post) => {
                    const status = getPostStatus(post);
                    return (
                         <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(status)}`}>
                              {getStatusLabel(status)}
                         </span>
                    );
               }
          },
          {
               key: "createdAt",
               label: "Ngày tạo",
               render: (post) => (
                    <div className="flex items-center space-x-2">
                         <Calendar className="w-4 h-4 text-slate-400" />
                         <span className="text-sm text-slate-600">
                              {getPostCreatedAt(post) ? new Date(getPostCreatedAt(post)).toLocaleDateString('vi-VN') : "N/A"}
                         </span>
                    </div>
               )
          },
          {
               key: "actions",
               label: "Thao tác",
               render: (post) => {
                    const status = getPostStatus(post);
                    return (
                         <div className="flex items-center space-x-2">
                              <Button
                                   onClick={() => handleViewPost(post)}
                                   variant="ghost"
                                   size="sm"
                                   className="text-blue-600 rounded-2xl hover:text-blue-800 hover:bg-blue-50"
                                   title="Xem chi tiết"
                              >
                                   <Eye className="w-4 h-4" />
                              </Button>
                              {status === "Pending" && (
                                   <>
                                        <Button
                                             onClick={() => handleReviewPost(post)}
                                             variant="ghost"
                                             size="sm"
                                             className="text-emerald-600 rounded-2xl hover:text-emerald-800 hover:bg-emerald-50"
                                             title="Duyệt bài viết"
                                        >
                                             <CheckCircle className="w-4 h-4" />
                                        </Button>
                                        <Button
                                             onClick={() => handleRejectPost(post)}
                                             variant="ghost"
                                             size="sm"
                                             className="text-red-600 rounded-2xl hover:text-red-800 hover:bg-red-50"
                                             title="Từ chối bài viết"
                                        >
                                             <XCircle className="w-4 h-4" />
                                        </Button>
                                   </>
                              )}
                              {(status === "Active" || status === "Published" || status === "Rejected") && (
                                   <Button
                                        onClick={() => handleDeletePost(post)}
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-600 rounded-2xl hover:text-red-800 hover:bg-red-50"
                                        title="Xóa bài viết"
                                   >
                                        <Trash2 className="w-4 h-4" />
                                   </Button>
                              )}
                         </div>
                    );
               }
          }
     ];

     const statsSummary = {
          total: posts.length,
          pending: posts.filter(p => {
               const status = getPostStatus(p);
               return status === "Pending";
          }).length,
          published: posts.filter(p => {
               const status = getPostStatus(p);
               return status === "Published" || status === "Active";
          }).length,
          hidden: posts.filter(p => {
               const status = getPostStatus(p);
               return status === "Hidden" || status === "Inactive";
          }).length
     };

     if (isLoading && posts.length === 0) {
          return (
               <div className="min-h-[60vh] flex items-center justify-center">
                    <div className="text-center text-slate-600 space-y-3">
                         <div className="animate-spin rounded-full h-10 w-10 border-2 border-red-200 border-t-red-600 mx-auto"></div>
                         <p>Đang tải dữ liệu bài viết...</p>
                    </div>
               </div>
          );
     }

     return (
          <div className="space-y-6">
               {/* Header */}
               <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 shadow-md border border-red-200/50">
                    <div className="flex items-center justify-between">
                         <div>
                              <h1 className="text-3xl font-bold bg-gradient-to-r from-red-700 to-pink-700 bg-clip-text text-transparent">
                                   Quản lý bài viết
                              </h1>
                              <p className="text-slate-600 mt-2 font-medium">
                                   Quản lý và duyệt các bài viết trên nền tảng
                              </p>
                         </div>
                         <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                              <FileText className="w-8 h-8 text-white" />
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
                                        placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 rounded-2xl"
                                   />
                              </div>
                         </div>
                         <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 space-y-3 sm:space-y-0">
                              <div className="flex space-x-3">
                                   <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-48 rounded-2xl">
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
                                   onClick={() => loadPosts(false)}
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
                                   <p className="text-sm font-medium text-slate-600">Tổng bài viết</p>
                                   <p className="text-2xl font-bold text-slate-900">{statsSummary.total}</p>
                              </div>
                              <FileText className="w-8 h-8 text-blue-600" />
                         </div>
                    </Card>
                    <Card className="p-4 rounded-2xl shadow-lg ">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Chờ duyệt</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {statsSummary.pending}
                                   </p>
                              </div>
                              <Clock className="w-8 h-8 text-yellow-600" />
                         </div>
                    </Card>
                    <Card className="p-4 rounded-2xl shadow-lg">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Đã xuất bản</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {statsSummary.published}
                                   </p>
                              </div>
                              <CheckCircle className="w-8 h-8 text-green-600" />
                         </div>
                    </Card>
                    <Card className="p-4 rounded-2xl shadow-lg">
                         <div className="flex items-center justify-between">
                              <div>
                                   <p className="text-sm font-medium text-slate-600">Đã ẩn</p>
                                   <p className="text-2xl font-bold text-slate-900">
                                        {statsSummary.hidden}
                                   </p>
                              </div>
                              <AlertCircle className="w-8 h-8 text-gray-600" />
                         </div>
                    </Card>
               </div>

               {/* Posts Table */}
               <Card className="p-6 rounded-2xl shadow-lg space-y-4">
                    <div className="flex items-center justify-between">
                         <h3 className="text-lg font-bold text-slate-900">
                              Danh sách bài viết ({filteredPosts.length})
                         </h3>
                    </div>
                    {filteredPosts.length === 0 ? (
                         <div className="text-center py-8 text-slate-500">
                              Hiện chưa có bài viết nào phù hợp với bộ lọc
                         </div>
                    ) : (
                         <Table className="w-full rounded-2xl shadow-lg border border-slate-200">
                              <TableHeader>
                                   <TableRow>
                                        {columns.map((column) => (
                                             <TableHead key={column.key}>{column.label}</TableHead>
                                        ))}
                                   </TableRow>
                              </TableHeader>
                              <TableBody>
                                   {filteredPosts.map((post) => (
                                        <TableRow key={getPostId(post)}>
                                             {columns.map((column) => (
                                                  <TableCell key={column.key}>
                                                       {column.render(post)}
                                                  </TableCell>
                                             ))}
                                        </TableRow>
                                   ))}
                              </TableBody>
                         </Table>
                    )}
               </Card>

               {/* Post Detail Modal */}
               <Modal
                    isOpen={showDetailModal}
                    onClose={() => setShowDetailModal(false)}
                    title="Chi tiết bài viết"
                    size="4xl"
                    className="max-h-[90vh] rounded-2xl shadow-lg border overflow-y-auto border-slate-200 max-w-2xl scrollbar-hide"
               >
                    {selectedPost && (
                         <div className="space-y-3 px-3">
                              <div>
                                   <h4 className="text-2xl font-bold text-slate-900 mb-2">{getPostTitle(selectedPost)}</h4>
                                   <div className="flex items-center space-x-4 text-sm text-slate-600">
                                        <div className="flex items-center space-x-1">
                                             <User className="w-4 h-4" />
                                             <span>{getPostAuthor(selectedPost)}</span>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                             <Calendar className="w-4 h-4" />
                                             <span>{getPostCreatedAt(selectedPost) ? new Date(getPostCreatedAt(selectedPost)).toLocaleDateString('vi-VN') : "N/A"}</span>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusBadgeColor(getPostStatus(selectedPost))}`}>
                                             {getStatusLabel(getPostStatus(selectedPost))}
                                        </span>
                                   </div>
                              </div>

                              <div>
                                   <h5 className="text-lg font-bold text-slate-900 mb-1">Nội dung:</h5>
                                   <div className="prose max-w-none">
                                        <p className="text-slate-900 whitespace-pre-wrap leading-relaxed">
                                             {getPostContent(selectedPost)}
                                        </p>
                                   </div>
                              </div>

                              {selectedPost.MediaURL || selectedPost.mediaUrl ? (
                                   <div>
                                        <h5 className="text-lg font-bold text-slate-900 mb-1">Hình ảnh:</h5>
                                        <img
                                             src={selectedPost.MediaURL || selectedPost.mediaUrl}
                                             alt="Post content"
                                             className="max-w-full h-auto rounded-2xl border border-teal-300"
                                        />
                                   </div>
                              ) : null}

                              {getPostStatus(selectedPost) === "Pending" && (
                                   <div className="flex space-x-3 pt-4 border-t border-slate-200">
                                        <Button
                                             onClick={() => {
                                                  setShowDetailModal(false);
                                                  handleReviewPost(selectedPost);
                                             }}
                                             className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 rounded-2xl"
                                        >
                                             <CheckCircle className="w-4 h-4 mr-2" />
                                             Duyệt bài viết
                                        </Button>
                                        <Button
                                             onClick={() => {
                                                  setShowDetailModal(false);
                                                  handleRejectPost(selectedPost);
                                             }}
                                             className="flex-1 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 rounded-2xl"
                                        >
                                             <XCircle className="w-4 h-4 mr-2" />
                                             Từ chối bài viết
                                        </Button>
                                   </div>
                              )}
                         </div>
                    )}
               </Modal>
          </div>
     );
}


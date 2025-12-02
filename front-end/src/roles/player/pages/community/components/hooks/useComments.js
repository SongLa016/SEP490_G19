import { useState } from "react";
import {
  getStoredToken,
  isTokenExpired,
} from "../../../../../../shared/utils/tokenManager";
import { getCurrentUserFromToken } from "../../../../../../shared/services/posts";
import {
  createComment,
  getCommentCount,
} from "../../../../../../shared/services/comments";
import Swal from "sweetalert2";

export function useComments(user, posts, setPosts) {
  const [showCommentInput, setShowCommentInput] = useState({});
  const [commentContent, setCommentContent] = useState({});

  const toggleCommentInput = (postId) => {
    const token = getStoredToken();
    if (!token || isTokenExpired(token) || !user) {
      Swal.fire({
        icon: "info",
        title: "Yêu cầu đăng nhập",
        text: "Vui lòng đăng nhập để bình luận.",
        showCancelButton: true,
        confirmButtonText: "Đăng nhập",
        cancelButtonText: "Hủy",
        confirmButtonColor: "#0ea5e9",
        cancelButtonColor: "#6b7280",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/login";
        }
      });
      return;
    }

    setShowCommentInput((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };

  const handleCommentChange = (postId, content) => {
    setCommentContent((prev) => ({
      ...prev,
      [postId]: content,
    }));
  };

  const handleCreateComment = async (
    postId,
    content,
    parentCommentId = null
  ) => {
    if (!content || !content.trim()) {
      return;
    }

    const token = getStoredToken();
    if (!token || isTokenExpired(token)) {
      Swal.fire({
        icon: "error",
        title: "Phiên đăng nhập đã hết hạn",
        text: "Vui lòng đăng nhập lại để bình luận.",
        confirmButtonText: "Đăng nhập",
        confirmButtonColor: "#0ea5e9",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/login";
        }
      });
      return;
    }

    if (!user) {
      Swal.fire({
        icon: "info",
        title: "Yêu cầu đăng nhập",
        text: "Vui lòng đăng nhập để bình luận.",
        confirmButtonText: "Đăng nhập",
        confirmButtonColor: "#0ea5e9",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/login";
        }
      });
      return;
    }

    const currentUser = getCurrentUserFromToken();
    if (!currentUser) {
      Swal.fire({
        icon: "error",
        title: "Lỗi xác thực",
        text: "Không thể xác thực người dùng. Vui lòng đăng nhập lại.",
        confirmButtonText: "Đăng nhập",
        confirmButtonColor: "#0ea5e9",
      }).then((result) => {
        if (result.isConfirmed) {
          window.location.href = "/login";
        }
      });
      return;
    }

    try {
      Swal.fire({
        title: "Đang đăng bình luận...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const numericPostId = Number(postId);
      if (isNaN(numericPostId)) {
        throw new Error("Post ID không hợp lệ.");
      }

      // Call API with optional parentCommentId
      await createComment({
        postId: numericPostId,
        content: content.trim(),
        parentCommentId: parentCommentId,
      });

      const updatedCount = await getCommentCount(postId);

      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.PostID === postId) {
            // Ensure updatedCount is a number, fallback to incrementing current count
            const commentCount =
              typeof updatedCount === "number" && updatedCount > 0
                ? updatedCount
                : (post.comments || 0) + 1;

            return {
              ...post,
              comments: commentCount,
            };
          }
          return post;
        })
      );

      Swal.close();
      Swal.fire({
        icon: "success",
        title: "Đã đăng!",
        text: "Bình luận của bạn đã được đăng thành công",
        timer: 2000,
        showConfirmButton: false,
        toast: true,
        position: "top-end",
      });

      return true; // Success
    } catch (error) {
      console.error("Error creating comment:", error);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Lỗi",
        text: error.message || "Không thể đăng bình luận. Vui lòng thử lại.",
        confirmButtonText: "Đã hiểu",
      });
      return false; // Failed
    }
  };

  const handleCommentSubmit = async (postId) => {
    const content = commentContent[postId];
    const success = await handleCreateComment(postId, content);

    if (success) {
      setCommentContent((prev) => ({
        ...prev,
        [postId]: "",
      }));
    }
  };

  return {
    showCommentInput,
    commentContent,
    toggleCommentInput,
    handleCommentChange,
    handleCommentSubmit,
    handleCreateComment,
  };
}

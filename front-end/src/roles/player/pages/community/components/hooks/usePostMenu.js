import { useState, useEffect } from "react";
import {
  fetchField,
  fetchFieldComplex,
} from "../../../../../../shared/services/fields";
import { createReport } from "../../../../../../shared/services/reports";
import { isCurrentUserPost } from "../utils";
import Swal from "sweetalert2";

export function usePostMenu(
  posts,
  setPosts,
  user,
  setEditingPost,
  setEditPostTitle,
  setEditPostContent,
  setEditSelectedField,
  setEditImagePreview,
  setEditSelectedImage,
  setShowNewThread,
  handleDeletePost,
  loadPosts
) {
  const [showPostMenu, setShowPostMenu] = useState({});

  // đóng menu khi click ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".post-menu-container")) {
        setShowPostMenu({});
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // mở/đóng menu
  const togglePostMenu = (postId) => {
    setShowPostMenu((prev) => ({
      ...prev,
      [postId]: !prev[postId],
    }));
  };
  // mở menu
  const handleMenuAction = async (postId, action) => {
    const post = posts.find((p) => p.PostID === postId);
    if (!post) return;

    switch (action) {
      case "save":
        Swal.fire({
          icon: "success",
          title: post.isBookmarked ? "Đã bỏ lưu" : "Đã lưu",
          text: post.isBookmarked
            ? "Bài viết đã được bỏ khỏi danh sách đã lưu"
            : "Bài viết đã được lưu",
          timer: 2000,
          showConfirmButton: false,
          toast: true,
          position: "top-end",
        });
        break;
      case "report":
        const reportPrompt = await Swal.fire({
          title: "Báo cáo bài viết",
          input: "textarea",
          inputLabel: "Mô tả lý do báo cáo (tối thiểu 10 ký tự)",
          inputPlaceholder: "Ví dụ: Bài viết chứa nội dung không phù hợp...",
          inputAttributes: {
            "aria-label": "Lý do báo cáo",
          },
          showCancelButton: true,
          confirmButtonText: "Gửi báo cáo",
          cancelButtonText: "Hủy",
          preConfirm: (value) => {
            if (!value || value.trim().length < 10) {
              Swal.showValidationMessage(
                "Vui lòng nhập lý do tối thiểu 10 ký tự."
              );
            }
            return value;
          },
        });
        if (reportPrompt.isConfirmed) {
          try {
            const payload = {
              targetType: "Post",
              targetId: Number(postId),
              reason: reportPrompt.value.trim(),
            };
            const response = await createReport(payload);
            if (response?.ok) {
              Swal.fire({
                icon: "success",
                title: "Đã gửi báo cáo",
                text:
                  response.message ||
                  "Cảm ơn bạn, chúng tôi sẽ xem xét bài viết này.",
                timer: 2500,
                showConfirmButton: false,
              });
            } else {
              Swal.fire({
                icon: "error",
                title: "Không thể gửi báo cáo",
                text: response?.reason || "Vui lòng thử lại sau.",
                confirmButtonText: "Đã hiểu",
              });
            }
          } catch (error) {
            console.error("Failed to create report:", error);
            Swal.fire({
              icon: "error",
              title: "Có lỗi xảy ra",
              text: error.message || "Không thể gửi báo cáo lúc này.",
              confirmButtonText: "Đã hiểu",
            });
          }
        }
        break;
      case "copy":
        try {
          await navigator.clipboard.writeText(
            `${window.location.origin}/post/${postId}`
          );
          Swal.fire({
            icon: "success",
            title: "Đã sao chép!",
            text: "Link bài viết đã được sao chép vào clipboard",
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: "top-end",
          });
        } catch (err) {
          console.error("Failed to copy link:", err);
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Không thể sao chép link. Vui lòng thử lại.",
            timer: 2000,
            showConfirmButton: false,
          });
        }
        break;
      case "edit":
        const postToEdit = posts.find((p) => p.PostID === postId);
        if (!postToEdit) {
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Không tìm thấy bài viết.",
            confirmButtonText: "Đã hiểu",
          });
          break;
        }

        const hasPermission = isCurrentUserPost(postToEdit, user);
        if (!hasPermission) {
          Swal.fire({
            icon: "error",
            title: "Lỗi",
            text: "Bạn không có quyền chỉnh sửa bài viết này.",
            confirmButtonText: "Đã hiểu",
          });
          break;
        }

        // Set up edit mode
        setEditingPost(postToEdit);
        setEditPostTitle(postToEdit.Title || "");
        setEditPostContent(postToEdit.Content || "");

        // Fetch full field details if field exists
        if (postToEdit.field && postToEdit.field.FieldID) {
          try {
            const fieldData = await fetchField(postToEdit.field.FieldID);
            if (fieldData) {
              const complexId =
                fieldData.complexId ||
                fieldData.complexID ||
                fieldData.ComplexID ||
                fieldData.complex_id;
              let complexName = postToEdit.field.ComplexName || "";
              let address =
                postToEdit.field.Address || postToEdit.field.Location || "";

              if (complexId) {
                try {
                  const complex = await fetchFieldComplex(complexId);
                  if (complex) {
                    complexName = complex.name || complex.Name || complexName;
                    address = complex.address || complex.Address || address;
                  }
                } catch (err) {
                  console.error(
                    `[usePostMenu] Failed to fetch complex ${complexId} for edit:`,
                    err
                  );
                }
              }

              setEditSelectedField({
                fieldId: postToEdit.field.FieldID,
                name:
                  fieldData.name ||
                  fieldData.Name ||
                  postToEdit.field.FieldName ||
                  "",
                typeName: fieldData.typeName || fieldData.TypeName || "",
                address: address,
                complexName: complexName,
              });
            } else {
              setEditSelectedField({
                fieldId: postToEdit.field.FieldID,
                name: postToEdit.field.FieldName,
                typeName: "",
                address:
                  postToEdit.field.Address || postToEdit.field.Location || "",
                complexName: postToEdit.field.ComplexName || "",
              });
            }
          } catch (error) {
            console.error(
              "[usePostMenu] Failed to fetch field detail for edit:",
              error
            );
            setEditSelectedField({
              fieldId: postToEdit.field.FieldID,
              name: postToEdit.field.FieldName,
              typeName: "",
              address:
                postToEdit.field.Address || postToEdit.field.Location || "",
              complexName: postToEdit.field.ComplexName || "",
            });
          }
        } else {
          setEditSelectedField(null);
        }

        // Load existing image - check both MediaURL and imageFiles array
        let existingImageUrl = postToEdit.MediaURL || null;
        if (
          !existingImageUrl &&
          postToEdit.imageFiles &&
          Array.isArray(postToEdit.imageFiles) &&
          postToEdit.imageFiles.length > 0
        ) {
          existingImageUrl = postToEdit.imageFiles[0];
        }
        setEditImagePreview(existingImageUrl);
        setEditSelectedImage(null);
        setShowNewThread(true);
        break;
      case "delete":
        await handleDeletePost(postId);
        break;
    }
    setShowPostMenu((prev) => ({
      ...prev,
      [postId]: false,
    }));
  };

  return {
    showPostMenu,
    togglePostMenu,
    handleMenuAction,
  };
}

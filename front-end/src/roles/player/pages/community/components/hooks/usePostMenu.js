import { useState, useEffect } from "react";
import { fetchField, fetchFieldComplex } from "../../../../../../shared/services/fields";
import { isCurrentUserPost } from "../utils";
import Swal from 'sweetalert2';

export function usePostMenu(posts, setPosts, user, setEditingPost, setEditPostTitle, setEditPostContent, setEditSelectedField, setEditImagePreview, setEditSelectedImage, setShowNewThread, handleDeletePost, handleToggleVisibility, loadPosts) {
     const [showPostMenu, setShowPostMenu] = useState({});

     // Close menu when clicking outside
     useEffect(() => {
          const handleClickOutside = (event) => {
               if (!event.target.closest('.post-menu-container')) {
                    setShowPostMenu({});
               }
          };

          document.addEventListener('mousedown', handleClickOutside);
          return () => {
               document.removeEventListener('mousedown', handleClickOutside);
          };
     }, []);

     const togglePostMenu = (postId) => {
          setShowPostMenu(prev => ({
               ...prev,
               [postId]: !prev[postId]
          }));
     };

     const handleMenuAction = async (postId, action) => {
          const post = posts.find(p => p.PostID === postId);
          if (!post) return;

          switch (action) {
               case 'save':
                    // Toggle bookmark is handled in parent component
                    Swal.fire({
                         icon: 'success',
                         title: post.isBookmarked ? 'Đã bỏ lưu' : 'Đã lưu',
                         text: post.isBookmarked ? 'Bài viết đã được bỏ khỏi danh sách đã lưu' : 'Bài viết đã được lưu',
                         timer: 2000,
                         showConfirmButton: false,
                         toast: true,
                         position: 'top-end'
                    });
                    break;
               case 'report':
                    const reportResult = await Swal.fire({
                         title: 'Báo cáo bài viết',
                         text: 'Bạn có chắc chắn muốn báo cáo bài viết này?',
                         icon: 'warning',
                         showCancelButton: true,
                         confirmButtonColor: '#d33',
                         cancelButtonColor: '#3085d6',
                         confirmButtonText: 'Báo cáo',
                         cancelButtonText: 'Hủy'
                    });
                    if (reportResult.isConfirmed) {
                         console.log('Reporting post:', postId);
                         Swal.fire({
                              icon: 'success',
                              title: 'Đã báo cáo',
                              text: 'Cảm ơn bạn đã báo cáo. Chúng tôi sẽ xem xét bài viết này.',
                              timer: 2000,
                              showConfirmButton: false
                         });
                    }
                    break;
               case 'copy':
                    try {
                         await navigator.clipboard.writeText(`${window.location.origin}/post/${postId}`);
                         Swal.fire({
                              icon: 'success',
                              title: 'Đã sao chép!',
                              text: 'Link bài viết đã được sao chép vào clipboard',
                              timer: 2000,
                              showConfirmButton: false,
                              toast: true,
                              position: 'top-end'
                         });
                    } catch (err) {
                         console.error('Failed to copy link:', err);
                         Swal.fire({
                              icon: 'error',
                              title: 'Lỗi',
                              text: 'Không thể sao chép link. Vui lòng thử lại.',
                              timer: 2000,
                              showConfirmButton: false
                         });
                    }
                    break;
               case 'edit':
                    const postToEdit = posts.find(p => p.PostID === postId);
                    if (!postToEdit) {
                         Swal.fire({
                              icon: 'error',
                              title: 'Lỗi',
                              text: 'Không tìm thấy bài viết.',
                              confirmButtonText: 'Đã hiểu'
                         });
                         break;
                    }

                    const hasPermission = isCurrentUserPost(postToEdit, user);
                    if (!hasPermission) {
                         Swal.fire({
                              icon: 'error',
                              title: 'Lỗi',
                              text: 'Bạn không có quyền chỉnh sửa bài viết này.',
                              confirmButtonText: 'Đã hiểu'
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
                                   const complexId = fieldData.complexId || fieldData.complexID || fieldData.ComplexID || fieldData.complex_id;
                                   let complexName = postToEdit.field.ComplexName || "";
                                   let address = postToEdit.field.Address || postToEdit.field.Location || "";

                                   if (complexId) {
                                        try {
                                             const complex = await fetchFieldComplex(complexId);
                                             if (complex) {
                                                  complexName = complex.name || complex.Name || complexName;
                                                  address = complex.address || complex.Address || address;
                                             }
                                        } catch (err) {
                                             console.error(`[usePostMenu] Failed to fetch complex ${complexId} for edit:`, err);
                                        }
                                   }

                                   setEditSelectedField({
                                        fieldId: postToEdit.field.FieldID,
                                        name: fieldData.name || fieldData.Name || postToEdit.field.FieldName || "",
                                        typeName: fieldData.typeName || fieldData.TypeName || "",
                                        address: address,
                                        complexName: complexName
                                   });
                              } else {
                                   setEditSelectedField({
                                        fieldId: postToEdit.field.FieldID,
                                        name: postToEdit.field.FieldName,
                                        typeName: "",
                                        address: postToEdit.field.Address || postToEdit.field.Location || "",
                                        complexName: postToEdit.field.ComplexName || ""
                                   });
                              }
                         } catch (error) {
                              console.error("[usePostMenu] Failed to fetch field detail for edit:", error);
                              setEditSelectedField({
                                   fieldId: postToEdit.field.FieldID,
                                   name: postToEdit.field.FieldName,
                                   typeName: "",
                                   address: postToEdit.field.Address || postToEdit.field.Location || "",
                                   complexName: postToEdit.field.ComplexName || ""
                              });
                         }
                    } else {
                         setEditSelectedField(null);
                    }

                    setEditImagePreview(postToEdit.MediaURL || null);
                    setEditSelectedImage(null);
                    setShowNewThread(true);
                    break;
               case 'toggle-visibility':
                    await handleToggleVisibility(postId, loadPosts);
                    break;
               case 'delete':
                    await handleDeletePost(postId);
                    break;
          }
          setShowPostMenu(prev => ({
               ...prev,
               [postId]: false
          }));
     };

     return {
          showPostMenu,
          togglePostMenu,
          handleMenuAction
     };
}


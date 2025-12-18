import { useState } from "react";
import { createPost, updatePost, deletePost } from "../../../../../../shared/services/posts";
import { fetchFieldInfoForPost } from "../utils/postTransformers";
import { deleteImageFromCloudinary } from "../../../../../../shared/services/cloudinary";
import Swal from 'sweetalert2';

export function usePostActions(user, posts, setPosts) {
     const [editingPost, setEditingPost] = useState(null);
     const [editPostTitle, setEditPostTitle] = useState("");
     const [editPostContent, setEditPostContent] = useState("");
     const [editSelectedField, setEditSelectedField] = useState(null);
     const [editSelectedImage, setEditSelectedImage] = useState(null);
     const [editImagePreview, setEditImagePreview] = useState(null);

     // Đăng bài viết
     const handlePostSubmit = async (title, content, field, imageFile) => {
          if (!user || !content.trim()) return;

          try {
               Swal.fire({
                    title: editingPost ? 'Đang cập nhật...' : 'Đang đăng...',
                    allowOutsideClick: false,
                    didOpen: () => {
                         Swal.showLoading();
                    }
               });
               let imageFiles = null;
               let imageUrls = null;
               
               if (imageFile) {
                    imageFiles = imageFile;
               } else if (editingPost) {
                    if (imageFile === null) {
                         imageUrls = [];
                    } else if (imageFile === undefined) {
                         if (editingPost.MediaURL) {
                              imageUrls = [editingPost.MediaURL];
                         }
                    }
               }

               if (editingPost) {
                    // Cập nhật bài viết hiện tại
                    await updatePost(editingPost.PostID, {
                         title: title || "",
                         content: content,
                         fieldId: field?.fieldId || 0,
                         imageFiles: imageFiles,
                         imageUrls: imageUrls 
                    });

                    // tải thông tin bài viết
                    const fieldInfo = await fetchFieldInfoForPost(field);

                    // cập nhật bài viết trong danh sách
                    const updatedMediaURL = imageFiles ? null 
                         : (imageUrls && imageUrls.length > 0 ? imageUrls[0] : null);
                    
                    setPosts(prevPosts => prevPosts.map(p =>
                         p.PostID === editingPost.PostID ? {
                              ...p,
                              Title: title || "",
                              Content: content,
                              MediaURL: updatedMediaURL,
                              imageFiles: imageUrls || [], 
                              FieldID: field?.fieldId || 0,
                              field: fieldInfo,
                              UpdatedAt: new Date().toISOString()
                         } : p
                    ));

                    // reset trạng thái chỉnh sửa
                    setEditingPost(null);
                    setEditPostTitle("");
                    setEditPostContent("");
                    setEditSelectedField(null);
                    setEditImagePreview(null);
                    setEditSelectedImage(null);

                    Swal.fire({
                         icon: 'success',
                         title: 'Thành công!',
                         text: 'Bài viết đã được cập nhật.',
                         timer: 2000,
                         showConfirmButton: false,
                         toast: true,
                         position: 'top-end'
                    });
               } else {
                    const newPost = await createPost({
                         title: title || "",
                         content: content,
                         fieldId: field?.fieldId || 0,
                         imageFiles: imageFiles  
                    });

                    // tải thông tin sân
                    const fieldInfo = await fetchFieldInfoForPost(field);
                    let mediaUrl = null;
                    if (newPost.imageFiles && Array.isArray(newPost.imageFiles) && newPost.imageFiles.length > 0) {
                         mediaUrl = newPost.imageFiles[0];
                    } 
                    else if (newPost.mediaUrl) {
                         mediaUrl = newPost.mediaUrl;
                    }
                   
                    const transformedPost = {
                         PostID: newPost.id || newPost.postId,
                         UserID: newPost.userId,
                         Title: newPost.title,
                         Content: newPost.content,
                         MediaURL: mediaUrl,
                         FieldID: newPost.fieldId || field?.fieldId || null,
                         CreatedAt: newPost.createdAt,
                         UpdatedAt: newPost.updatedAt,
                         Status: newPost.status,
                         author: {
                              UserID: user.id,
                              Username: user.username || "user",
                              FullName: user.name || user.fullName || "Người dùng",
                              Avatar: user.avatar || "https://ui-avatars.com/api/?name=User&background=0ea5e9&color=fff&size=100",
                              Verified: false
                         },
                         field: fieldInfo,
                         likes: 0,
                         comments: 0,
                         reposts: 0,
                         shares: 0,
                         isLiked: false,
                         isReposted: false,
                         isBookmarked: false
                    };

                    setPosts(prevPosts => [transformedPost, ...prevPosts]);

                    Swal.fire({
                         icon: 'success',
                         title: 'Đã đăng!',
                         text: 'Bài viết của bạn đã được đăng thành công',
                         timer: 2000,
                         showConfirmButton: false,
                         toast: true,
                         position: 'top-end'
                    });
               }
          } catch (error) {
               Swal.close();

               if (editingPost && error.message && error.message.includes('quyền')) {
                    setEditingPost(null);
                    setEditPostTitle("");
                    setEditPostContent("");
                    setEditSelectedField(null);
                    setEditImagePreview(null);
                    setEditSelectedImage(null);
               }

               Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: error.message || (editingPost ? 'Không thể cập nhật bài viết. Vui lòng thử lại.' : 'Không thể tạo bài viết. Vui lòng thử lại.'),
                    confirmButtonText: 'Đã hiểu'
               });
          }
     };
     // Xóa bài viết
     const handleDeletePost = async (postId) => {
          const deleteResult = await Swal.fire({
               title: 'Xóa bài viết?',
               text: 'Bạn có chắc chắn muốn xóa bài viết này? Hành động này không thể hoàn tác.',
               icon: 'warning',
               showCancelButton: true,
               confirmButtonColor: '#d33',
               cancelButtonColor: '#3085d6',
               confirmButtonText: 'Xóa',
               cancelButtonText: 'Hủy',
               reverseButtons: true
          });

          if (deleteResult.isConfirmed) {
               try {
                    Swal.fire({
                         title: 'Đang xóa...',
                         text: 'Vui lòng chờ',
                         allowOutsideClick: false,
                         didOpen: () => {
                              Swal.showLoading();
                         }
                    });

                    // Find post to get image URL before deleting
                    const postToDelete = posts.find(p => p.PostID === postId);
                    
                    // Delete post from database
                    await deletePost(postId);
                    
                    // Delete image from Cloudinary if exists
                    if (postToDelete?.MediaURL) {
                         try {
                              await deleteImageFromCloudinary(postToDelete.MediaURL);
                         } catch (deleteError) {
                              console.warn("[handleDeletePost] Failed to delete image from Cloudinary:", deleteError);
                              // Don't throw error - post is already deleted
                         }
                    }
                    
                    setPosts(prevPosts => prevPosts.filter(p => p.PostID !== postId));

                    Swal.fire({
                         icon: 'success',
                         title: 'Đã xóa!',
                         text: 'Bài viết đã được xóa thành công',
                         timer: 2000,
                         showConfirmButton: false,
                         toast: true,
                         position: 'top-end'
                    });
               } catch (error) {
                    console.error('Error deleting post:', error);
                    Swal.fire({
                         icon: 'error',
                         title: 'Lỗi',
                         text: error.message || 'Không thể xóa bài viết. Vui lòng thử lại.',
                         confirmButtonText: 'Đã hiểu'
                    });
               }
          }
     };

     return {
          editingPost,
          setEditingPost,
          editPostTitle,
          setEditPostTitle,
          editPostContent,
          setEditPostContent,
          editSelectedField,
          setEditSelectedField,
          editSelectedImage,
          setEditSelectedImage,
          editImagePreview,
          setEditImagePreview,
          handlePostSubmit,
          handleDeletePost
     };
}


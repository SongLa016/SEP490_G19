import { useState } from "react";
import { createPost, updatePost, deletePost } from "../../../../../../shared/services/posts";
import { fetchFieldInfoForPost } from "../utils/postTransformers";
import { uploadImageToCloudinary, deleteImageFromCloudinary } from "../../../../../../shared/services/cloudinary";
import Swal from 'sweetalert2';

export function usePostActions(user, posts, setPosts) {
     const [editingPost, setEditingPost] = useState(null);
     const [editPostTitle, setEditPostTitle] = useState("");
     const [editPostContent, setEditPostContent] = useState("");
     const [editSelectedField, setEditSelectedField] = useState(null);
     const [editSelectedImage, setEditSelectedImage] = useState(null);
     const [editImagePreview, setEditImagePreview] = useState(null);

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

               // Prepare image data - send File directly to API (API will handle Cloudinary upload)
               let imageFiles = null;
               let imageUrls = null;
               
               if (imageFile) {
                    // Send File directly to API (API will upload to Cloudinary)
                    imageFiles = imageFile;
                    console.log("[handlePostSubmit] Sending image file directly to API");
               } else if (editingPost) {
                    // When editing, handle different cases:
                    // - imageFile === null: Image was explicitly removed
                    // - imageFile === undefined: Keep existing image (no change)
                    if (imageFile === null) {
                         // Image was removed - send empty array
                         imageUrls = [];
                    } else if (imageFile === undefined) {
                         // Keep existing image URL
                         if (editingPost.MediaURL) {
                              imageUrls = [editingPost.MediaURL];
                         }
                    }
               }

               if (editingPost) {
                    // Update existing post (API will handle image upload/delete)
                    await updatePost(editingPost.PostID, {
                         title: title || "",
                         content: content,
                         fieldId: field?.fieldId || 0,
                         imageFiles: imageFiles, // File object if new image
                         imageUrls: imageUrls // URLs if keeping existing or removed
                    });

                    // Fetch field information
                    const fieldInfo = await fetchFieldInfoForPost(field);

                    // Update post in list
                    const updatedMediaURL = imageFiles 
                         ? null // Will be updated from API response
                         : (imageUrls && imageUrls.length > 0 ? imageUrls[0] : null);
                    
                    setPosts(prevPosts => prevPosts.map(p =>
                         p.PostID === editingPost.PostID ? {
                              ...p,
                              Title: title || "",
                              Content: content,
                              MediaURL: updatedMediaURL,
                              imageFiles: imageUrls || [], // Update imageFiles array
                              FieldID: field?.fieldId || 0,
                              field: fieldInfo,
                              UpdatedAt: new Date().toISOString()
                         } : p
                    ));

                    // Reset edit state
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
                    // Create new post - send File directly to API
                    const newPost = await createPost({
                         title: title || "",
                         content: content,
                         fieldId: field?.fieldId || 0,
                         imageFiles: imageFiles // File object, API will handle upload
                    });

                    // Fetch field information
                    const fieldInfo = await fetchFieldInfoForPost(field);

                    // Transform and add to posts
                    // Extract mediaUrl from imageFiles array (first image) or from mediaUrl field
                    let mediaUrl = null;
                    
                    // Check if newPost has imageFiles (from API response)
                    if (newPost.imageFiles && Array.isArray(newPost.imageFiles) && newPost.imageFiles.length > 0) {
                         mediaUrl = newPost.imageFiles[0];
                    } 
                    // Check if newPost has mediaUrl (backward compatibility)
                    else if (newPost.mediaUrl) {
                         mediaUrl = newPost.mediaUrl;
                    }
                    // If no URL from API, and we uploaded a file, we can't show it immediately unless we use the local preview
                    // But for now, let's rely on API response. If API didn't return URL, it might be processing.
                    
                    console.log("[usePostActions] New post created:", {
                         id: newPost.id,
                         title: newPost.title,
                         mediaUrl: mediaUrl,
                         imageFiles: newPost.imageFiles
                    });
                    
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
               console.error("Error creating/updating post:", error);
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
                              console.log("[handleDeletePost] Image deleted from Cloudinary");
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


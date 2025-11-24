// File: BallSport.Application.Services/Community/PostService.cs
using BallSport.Application.DTOs.Community;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories.Community;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Application.Services.Community
{
    public class PostService : IPostService
    {
        private readonly IPostRepository _postRepository;
        private readonly IPostLikeRepository _postLikeRepository;
        private readonly ICommentRepository _commentRepository;
        private readonly INotificationService _notificationService;
        private readonly Sep490G19v1Context _context;
        private readonly Cloudinary _cloudinary;

        public PostService(
            IPostRepository postRepository,
            IPostLikeRepository postLikeRepository,
            ICommentRepository commentRepository,
            INotificationService notificationService,
            Sep490G19v1Context context,
            Cloudinary cloudinary)
        {
            _postRepository = postRepository;
            _postLikeRepository = postLikeRepository;
            _commentRepository = commentRepository;
            _notificationService = notificationService;
            _context = context;
            _cloudinary = cloudinary;
        }

        // CREATE POST – TỰ ĐỘNG PENDING
        public async Task<PostDTO> CreatePostAsync(CreatePostDTO dto, int userId)
        {
            if (dto.FieldId.HasValue && !await FieldExistsAsync(dto.FieldId.Value))
                throw new InvalidOperationException($"Sân bóng ID {dto.FieldId.Value} không tồn tại.");

            var imageUrls = new List<string>();
            if (dto.ImageFiles?.Count > 0)
            {
                foreach (var file in dto.ImageFiles)
                {
                    var url = await UploadToCloudinary(file);
                    if (!string.IsNullOrEmpty(url))
                        imageUrls.Add(url);
                }
            }

            var post = new Post
            {
                UserId = userId,
                Title = dto.Title,
                Content = dto.Content,
                MediaUrl = imageUrls.Any() ? string.Join(",", imageUrls) : null,
                FieldId = dto.FieldId,
                CreatedAt = DateTime.UtcNow,
                Status = "Pending"
            };

            var createdPost = await _postRepository.CreatePostAsync(post);
            return await MapToPostDTOAsync(createdPost, userId);
        }

        private async Task<string?> UploadToCloudinary(IFormFile file)
        {
            if (file == null || file.Length == 0) return null;
            await using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                Folder = "ballsport/posts",
                Transformation = new Transformation().Quality("auto").FetchFormat("auto").Width(1200).Crop("limit")
            };
            var result = await _cloudinary.UploadAsync(uploadParams);
            return result.SecureUrl?.ToString();
        }

        public async Task<bool> FieldExistsAsync(int fieldId)
            => await _context.Fields.AnyAsync(f => f.FieldId == fieldId);

        // MAP DTO – DÙNG BOOL THAY STRING STATUS (SIÊU CHUẨN!)
        private async Task<PostDTO> MapToPostDTOAsync(Post post, int? currentUserId = null)
        {
            var likeCount = await _postLikeRepository.CountLikesByPostIdAsync(post.PostId);
            var commentCount = await _commentRepository.CountCommentsByPostIdAsync(post.PostId);
            var isOwner = currentUserId.HasValue && post.UserId == currentUserId.Value;

            var imageUrls = string.IsNullOrWhiteSpace(post.MediaUrl)
                ? new List<string>()
                : post.MediaUrl.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim()).ToList();

            return new PostDTO
            {
                PostId = post.PostId,
                UserId = post.UserId,
                UserName = post.User?.FullName ?? "Unknown",
                Title = post.Title,
                Content = post.Content,
                ImageUrls = imageUrls,
                FieldId = post.FieldId,
                FieldName = post.Field?.Name,
                LikeCount = likeCount,
                CommentCount = commentCount,
                CreatedAt = post.CreatedAt ?? DateTime.UtcNow,
                UpdatedAt = post.UpdatedAt,

                // DÙNG BOOL – FRONTEND CẢM ƠN BẠN MỖI NGÀY!
                IsPending = post.Status == "Pending",
                IsRejected = post.Status == "Rejected",

                IsOwner = isOwner,
                CanEdit = isOwner && (post.Status == "Active" || post.Status == "Pending"),
                CanDelete = isOwner && post.Status != "Rejected", // Không cho xóa nếu bị từ chối
                ShowReviewButtons = post.Status == "Pending"
            };
        }

        private async Task<PostDetailDTO> MapToPostDetailDTOAsync(Post post, int? currentUserId = null)
        {
            var baseDto = await MapToPostDTOAsync(post, currentUserId);
            var isLiked = currentUserId.HasValue && await _postLikeRepository.IsPostLikedByUserAsync(post.PostId, currentUserId.Value);

            return new PostDetailDTO
            {
                PostId = baseDto.PostId,
                UserId = baseDto.UserId,
                UserName = baseDto.UserName,
                Title = baseDto.Title,
                Content = baseDto.Content,
                ImageUrls = baseDto.ImageUrls,
                FieldId = baseDto.FieldId,
                FieldName = baseDto.FieldName,
                LikeCount = baseDto.LikeCount,
                CommentCount = baseDto.CommentCount,
                IsLiked = isLiked,
                CreatedAt = baseDto.CreatedAt,
                UpdatedAt = baseDto.UpdatedAt,

                IsPending = baseDto.IsPending,
                IsRejected = baseDto.IsRejected,

                IsOwner = baseDto.IsOwner,
                CanEdit = baseDto.CanEdit,
                CanDelete = baseDto.CanDelete,
                ShowReviewButtons = baseDto.ShowReviewButtons,
                IsAdmin = false // Sẽ được set ở Controller nếu cần
            };
        }

        public async Task<PostDetailDTO?> GetPostByIdAsync(int postId, int? currentUserId = null)
        {
            var post = await _postRepository.GetPostByIdAsync(postId);
            return post == null ? null : await MapToPostDetailDTOAsync(post, currentUserId);
        }

        public async Task<(IEnumerable<PostDTO> Posts, int TotalCount)> GetAllPostsAsync(int pageNumber, int pageSize, PostFilterDTO? filter = null)
        {
            var result = await _postRepository.GetAllPostsAsync(
                pageNumber, pageSize,
                filter?.Status ?? "Active",
                filter?.FieldId,
                filter?.UserId);

            var dtos = new List<PostDTO>();
            foreach (var p in result.Posts)
                dtos.Add(await MapToPostDTOAsync(p, filter?.UserId));

            return (dtos, result.TotalCount);
        }

        public async Task<PostDTO?> UpdatePostAsync(int postId, UpdatePostDTO dto, int userId)
        {
            var post = await _postRepository.GetPostByIdAsync(postId);
            if (post == null || post.UserId != userId || (post.Status != "Active" && post.Status != "Pending"))
                return null;

            if (dto.FieldId.HasValue && !await FieldExistsAsync(dto.FieldId.Value))
                throw new InvalidOperationException("Sân không tồn tại!");

            // CẬP NHẬT NỘI DUNG
            post.Title = dto.Title ?? post.Title;
            post.Content = dto.Content ?? post.Content;
            post.FieldId = dto.FieldId ?? post.FieldId;

            // XỬ LÝ ẢNH MỚI (nếu có)
            if (dto.ImageFiles != null && dto.ImageFiles.Count > 0)
            {
                var newImageUrls = new List<string>();
                foreach (var file in dto.ImageFiles)
                {
                    var url = await UploadToCloudinary(file);
                    if (!string.IsNullOrEmpty(url))
                        newImageUrls.Add(url);
                }
                post.MediaUrl = string.Join(",", newImageUrls);
            }
            // Nếu không có ảnh mới → giữ nguyên ảnh cũ

            post.UpdatedAt = DateTime.UtcNow;

            await _postRepository.UpdatePostAsync(post);
            return await MapToPostDTOAsync(post, userId);
        }

        // USER TỰ XÓA → XÓA THẬT
        public async Task<bool> DeleteMyPostAsync(int postId, int userId)
            => await _postRepository.DeleteMyPostAsync(postId, userId);

        // ADMIN XÓA → XÓA THẬT (rõ ràng hơn)
        public async Task<bool> DeletePostByAdminAsync(int postId)
            => await _postRepository.HardDeletePostAsync(postId);

        // ADMIN DUYỆT BÀI
        public async Task<bool> ReviewPostAsync(int postId, string status)
            => await _postRepository.ReviewPostAsync(postId, status);

        // XÓA HOÀN TOÀN ModeratePostAsync → Vì bạn KHÔNG CẦN ẨN BÀI

        // LẤY BÀI ĐANG CHỜ DUYỆT
        public async Task<(IEnumerable<PostDTO> Posts, int TotalCount)> GetPendingPostsAsync(int pageNumber = 1, int pageSize = 20)
        {
            var result = await _postRepository.GetPendingPostsAsync(pageNumber, pageSize);
            var dtos = new List<PostDTO>();
            foreach (var p in result.Posts)
                dtos.Add(await MapToPostDTOAsync(p));
            return (dtos, result.TotalCount);
        }

        public async Task<IEnumerable<PostDTO>> GetPostsByUserIdAsync(int userId)
        {
            var posts = await _postRepository.GetPostsByUserIdAsync(userId, "All");
            var dtos = new List<PostDTO>();
            foreach (var p in posts)
                dtos.Add(await MapToPostDTOAsync(p, userId));
            return dtos;
        }

        public async Task<IEnumerable<PostDTO>> GetPostsByFieldIdAsync(int fieldId)
        {
            var posts = await _postRepository.GetPostsByFieldIdAsync(fieldId);
            var dtos = new List<PostDTO>();
            foreach (var p in posts)
                dtos.Add(await MapToPostDTOAsync(p));
            return dtos;
        }

        public async Task<IEnumerable<PostDTO>> GetTrendingPostsAsync(int topCount = 10)
        {
            var posts = await _postRepository.GetTrendingPostsAsync(topCount);
            var dtos = new List<PostDTO>();
            foreach (var p in posts)
                dtos.Add(await MapToPostDTOAsync(p));
            return dtos;
        }

        public async Task<(IEnumerable<PostFeedDTO> Posts, int TotalCount)> GetNewsFeedAsync(int userId, int pageNumber, int pageSize)
        {
            var result = await _postRepository.GetAllPostsAsync(pageNumber, pageSize, "Active");
            var dtos = new List<PostFeedDTO>();

            foreach (var p in result.Posts)
            {
                var imageUrls = string.IsNullOrWhiteSpace(p.MediaUrl)
                    ? new List<string>()
                    : p.MediaUrl.Split(',', StringSplitOptions.RemoveEmptyEntries).Select(x => x.Trim()).ToList();

                dtos.Add(new PostFeedDTO
                {
                    PostId = p.PostId,
                    UserId = p.UserId,
                    UserName = p.User?.FullName ?? "Unknown",
                    Title = p.Title,
                    Content = p.Content,
                    ImageUrls = imageUrls,
                    FieldId = p.FieldId,
                    FieldName = p.Field?.Name,
                    LikeCount = await _postLikeRepository.CountLikesByPostIdAsync(p.PostId),
                    CommentCount = await _commentRepository.CountCommentsByPostIdAsync(p.PostId),
                    IsLiked = await _postLikeRepository.IsPostLikedByUserAsync(p.PostId, userId),
                    CreatedAt = p.CreatedAt ?? DateTime.UtcNow
                });
            }

            return (dtos, result.TotalCount);
        }

        public async Task<(IEnumerable<PostDTO> Posts, int TotalCount)> SearchPostsAsync(string keyword, int pageNumber, int pageSize)
        {
            var result = await _postRepository.SearchPostsAsync(keyword, pageNumber, pageSize);
            var dtos = new List<PostDTO>();
            foreach (var p in result.Posts)
                dtos.Add(await MapToPostDTOAsync(p));
            return (dtos, result.TotalCount);
        }

        public async Task<bool> LikePostAsync(int postId, int userId)
        {
            var result = await _postLikeRepository.LikePostAsync(postId, userId);
            if (result != null)
            {
                var post = await _postRepository.GetPostByIdAsync(postId);
                if (post != null && post.UserId != userId)
                {
                    await _notificationService.CreateNotificationAsync(new CreateNotificationDTO
                    {
                        UserId = post.UserId,
                        Type = "Like",
                        TargetId = postId,
                        Message = "đã thích bài viết của bạn"
                    });
                }
            }
            return result != null;
        }

        public async Task<bool> UnlikePostAsync(int postId, int userId)
            => await _postLikeRepository.UnlikePostAsync(postId, userId);

        public async Task<bool> IsPostOwnerAsync(int postId, int userId)
        {
            var post = await _postRepository.GetPostByIdAsync(postId);
            return post != null && post.UserId == userId;
        }
    }
}
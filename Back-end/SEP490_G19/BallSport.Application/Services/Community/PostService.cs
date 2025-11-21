using BallSport.Application.DTOs.Community;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories.Community;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Application.Services.Community
{
    public class PostService : IPostService
    {
        private readonly IPostRepository _postRepository;
        private readonly IPostLikeRepository _postLikeRepository;
        private readonly ICommentRepository _commentRepository;
        private readonly INotificationService _notificationService;
        private readonly Sep490G19v1Context _context; // THÊM ĐỂ CHECK FIELD

        public PostService(
            IPostRepository postRepository,
            IPostLikeRepository postLikeRepository,
            ICommentRepository commentRepository,
            INotificationService notificationService,
            Sep490G19v1Context context)
        {
            _postRepository = postRepository;
            _postLikeRepository = postLikeRepository;
            _commentRepository = commentRepository;
            _notificationService = notificationService;
            _context = context;
        }

        // ĐÃ FIX 100% LỖI 500 → TRẢ 400 KHI FIELDID KHÔNG TỒN TẠI
        public async Task<PostDTO> CreatePostAsync(CreatePostDTO createPostDto, int userId)
        {
            // KIỂM TRA FIELD TỒN TẠI TRƯỚC KHI TẠO BÀI VIẾT
            if (createPostDto.FieldId.HasValue)
            {
                var fieldExists = await _context.Fields.AnyAsync(f => f.FieldId == createPostDto.FieldId.Value);
                if (!fieldExists)
                {
                    throw new InvalidOperationException(
                        $"Sân bóng với ID = {createPostDto.FieldId.Value} không tồn tại. Vui lòng chọn sân hợp lệ.");
                }
            }

            var post = new Post
            {
                UserId = userId,
                Title = createPostDto.Title,
                Content = createPostDto.Content,
                MediaUrl = createPostDto.MediaUrl,
                FieldId = createPostDto.FieldId
            };

            var createdPost = await _postRepository.CreatePostAsync(post);
            return await MapToPostDTOAsync(createdPost);
        }

        // HÀM KIỂM TRA FIELD TỒN TẠI – DÙNG ĐƯỢC Ở NHIỀU NƠI
        public async Task<bool> FieldExistsAsync(int fieldId)
        {
            return await _context.Fields.AnyAsync(f => f.FieldId == fieldId);
        }

        public async Task<(IEnumerable<PostDTO> Posts, int TotalCount)> GetAllPostsAsync(
            int pageNumber, int pageSize, PostFilterDTO? filter = null)
        {
            var (posts, totalCount) = await _postRepository.GetAllPostsAsync(
                pageNumber, pageSize,
                filter?.Status ?? "Active",
                filter?.FieldId,
                filter?.UserId);

            var postDtos = await MapToPostDTOsAsync(posts);
            return (postDtos, totalCount);
        }

        public async Task<PostDetailDTO?> GetPostByIdAsync(int postId, int? currentUserId = null)
        {
            var post = await _postRepository.GetPostByIdAsync(postId);
            if (post == null) return null;

            var likeCount = await _postLikeRepository.CountLikesByPostIdAsync(postId);
            var commentCount = await _commentRepository.CountCommentsByPostIdAsync(postId);
            var isLiked = currentUserId.HasValue
                ? await _postLikeRepository.IsPostLikedByUserAsync(postId, currentUserId.Value)
                : false;

            return new PostDetailDTO
            {
                PostId = post.PostId,
                UserId = post.UserId,
                UserName = post.User?.FullName ?? "Unknown",
                UserAvatar = post.User?.Avatar != null ? Convert.ToBase64String(post.User.Avatar) : null,
                Title = post.Title,
                Content = post.Content,
                MediaUrl = post.MediaUrl,
                FieldId = post.FieldId,
                FieldName = post.Field?.Name,
                LikeCount = likeCount,
                CommentCount = commentCount,
                IsLiked = isLiked,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                Status = post.Status
            };
        }

        public async Task<PostDTO?> UpdatePostAsync(int postId, UpdatePostDTO updatePostDto, int userId)
        {
            var existingPost = await _postRepository.GetPostByIdAsync(postId);
            if (existingPost == null || existingPost.UserId != userId)
                return null;

            // KIỂM TRA FIELD MỚI (NẾU CÓ)
            if (updatePostDto.FieldId.HasValue)
            {
                var fieldExists = await FieldExistsAsync(updatePostDto.FieldId.Value);
                if (!fieldExists)
                    throw new InvalidOperationException($"Sân bóng với ID = {updatePostDto.FieldId.Value} không tồn tại.");
            }

            existingPost.Title = updatePostDto.Title ?? existingPost.Title;
            existingPost.Content = updatePostDto.Content ?? existingPost.Content;
            existingPost.MediaUrl = updatePostDto.MediaUrl ?? existingPost.MediaUrl;
            existingPost.FieldId = updatePostDto.FieldId ?? existingPost.FieldId;

            var updatedPost = await _postRepository.UpdatePostAsync(existingPost);
            return updatedPost != null ? await MapToPostDTOAsync(updatedPost) : null;
        }

        public async Task<bool> DeletePostAsync(int postId, int userId, bool isAdmin = false)
        {
            var post = await _postRepository.GetPostByIdAsync(postId);
            if (post == null) return false;
            if (!isAdmin && post.UserId != userId) return false;

            await _commentRepository.DeleteCommentsByPostIdAsync(postId);
            await _postLikeRepository.DeleteLikesByPostIdAsync(postId);
            return await _postRepository.DeletePostAsync(postId);
        }

        public async Task<IEnumerable<PostDTO>> GetPostsByUserIdAsync(int userId)
        {
            var posts = await _postRepository.GetPostsByUserIdAsync(userId);
            return await MapToPostDTOsAsync(posts);
        }

        public async Task<IEnumerable<PostDTO>> GetPostsByFieldIdAsync(int fieldId)
        {
            var posts = await _postRepository.GetPostsByFieldIdAsync(fieldId);
            return await MapToPostDTOsAsync(posts);
        }

        public async Task<IEnumerable<PostDTO>> GetTrendingPostsAsync(int topCount = 10)
        {
            var posts = await _postRepository.GetTrendingPostsAsync(topCount);
            return await MapToPostDTOsAsync(posts);
        }

        public async Task<(IEnumerable<PostFeedDTO> Posts, int TotalCount)> GetNewsFeedAsync(
            int userId, int pageNumber, int pageSize)
        {
            var (posts, totalCount) = await _postRepository.GetAllPostsAsync(pageNumber, pageSize, "Active");
            var feedDtos = new List<PostFeedDTO>();

            foreach (var post in posts)
            {
                var likeCount = await _postLikeRepository.CountLikesByPostIdAsync(post.PostId);
                var commentCount = await _commentRepository.CountCommentsByPostIdAsync(post.PostId);
                var isLiked = await _postLikeRepository.IsPostLikedByUserAsync(post.PostId, userId);

                feedDtos.Add(new PostFeedDTO
                {
                    PostId = post.PostId,
                    UserId = post.UserId,
                    UserName = post.User?.FullName ?? "Unknown",
                    UserAvatar = post.User?.Avatar != null ? Convert.ToBase64String(post.User.Avatar) : null,
                    Title = post.Title,
                    Content = post.Content,
                    MediaUrl = post.MediaUrl,
                    FieldId = post.FieldId,
                    FieldName = post.Field?.Name,
                    LikeCount = likeCount,
                    CommentCount = commentCount,
                    IsLiked = isLiked,
                    CreatedAt = post.CreatedAt
                });
            }
            return (feedDtos, totalCount);
        }

        public async Task<(IEnumerable<PostDTO> Posts, int TotalCount)> SearchPostsAsync(
            string keyword, int pageNumber, int pageSize)
        {
            var (posts, totalCount) = await _postRepository.SearchPostsAsync(keyword, pageNumber, pageSize);
            var postDtos = await MapToPostDTOsAsync(posts);
            return (postDtos, totalCount);
        }

        public async Task<bool> LikePostAsync(int postId, int userId)
        {
            var post = await _postRepository.GetPostByIdAsync(postId);
            if (post == null) return false;

            var like = await _postLikeRepository.LikePostAsync(postId, userId);
            if (like == null) return false;

            if (post.UserId != userId)
            {
                await _notificationService.CreateNotificationAsync(new CreateNotificationDTO
                {
                    UserId = post.UserId,
                    Type = "Like",
                    TargetId = postId,
                    Message = $"đã thích bài viết của bạn"
                });
            }
            return true;
        }

        public async Task<bool> UnlikePostAsync(int postId, int userId)
        {
            return await _postLikeRepository.UnlikePostAsync(postId, userId);
        }

        public async Task<bool> IsPostOwnerAsync(int postId, int userId)
        {
            var post = await _postRepository.GetPostByIdAsync(postId);
            return post != null && post.UserId == userId;
        }

        public async Task<bool> TogglePostVisibilityAsync(int postId, string status)
        {
            var post = await _postRepository.GetPostByIdAsync(postId);
            if (post == null) return false;

            post.Status = status;
            var updated = await _postRepository.UpdatePostAsync(post);
            return updated != null;
        }

        // HELPER METHODS – HOÀN HẢO
        private async Task<PostDTO> MapToPostDTOAsync(Post post)
        {
            var likeCount = await _postLikeRepository.CountLikesByPostIdAsync(post.PostId);
            var commentCount = await _commentRepository.CountCommentsByPostIdAsync(post.PostId);

            return new PostDTO
            {
                PostId = post.PostId,
                UserId = post.UserId,
                UserName = post.User?.FullName ?? "Unknown",
                UserAvatar = post.User?.Avatar != null ? Convert.ToBase64String(post.User.Avatar) : null,
                Title = post.Title,
                Content = post.Content,
                MediaUrl = post.MediaUrl,
                FieldId = post.FieldId,
                FieldName = post.Field?.Name,
                LikeCount = likeCount,
                CommentCount = commentCount,
                CreatedAt = post.CreatedAt,
                UpdatedAt = post.UpdatedAt,
                Status = post.Status
            };
        }

        private async Task<IEnumerable<PostDTO>> MapToPostDTOsAsync(IEnumerable<Post> posts)
        {
            var dtos = new List<PostDTO>();
            foreach (var post in posts)
                dtos.Add(await MapToPostDTOAsync(post));
            return dtos;
        }
    }
}
using BallSport.Application.DTOs.Community;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories.Community;

namespace BallSport.Application.Services.Community
{
    public class PostService : IPostService
    {
        private readonly IPostRepository _postRepository;
        private readonly IPostLikeRepository _postLikeRepository;
        private readonly ICommentRepository _commentRepository;
        private readonly INotificationService _notificationService;

        public PostService(
            IPostRepository postRepository,
            IPostLikeRepository postLikeRepository,
            ICommentRepository commentRepository,
            INotificationService notificationService)
        {
            _postRepository = postRepository;
            _postLikeRepository = postLikeRepository;
            _commentRepository = commentRepository;
            _notificationService = notificationService;
        }

        public async Task<(IEnumerable<PostDTO> Posts, int TotalCount)> GetAllPostsAsync(
            int pageNumber,
            int pageSize,
            PostFilterDTO? filter = null)
        {
            var (posts, totalCount) = await _postRepository.GetAllPostsAsync(
                pageNumber,
                pageSize,
                filter?.Status ?? "Active",
                filter?.FieldId,
                filter?.UserId
            );

            var postDtos = await MapToPostDTOsAsync(posts);

            return (postDtos, totalCount);
        }

        public async Task<PostDetailDTO?> GetPostByIdAsync(int postId, int? currentUserId = null)
        {
            var post = await _postRepository.GetPostByIdAsync(postId);
            if (post == null)
                return null;

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

        public async Task<PostDTO> CreatePostAsync(CreatePostDTO createPostDto, int userId)
        {
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

        public async Task<PostDTO?> UpdatePostAsync(int postId, UpdatePostDTO updatePostDto, int userId)
        {
            var existingPost = await _postRepository.GetPostByIdAsync(postId);
            if (existingPost == null || existingPost.UserId != userId)
                return null;

            existingPost.Title = updatePostDto.Title ?? existingPost.Title;
            existingPost.Content = updatePostDto.Content ?? existingPost.Content;
            existingPost.MediaUrl = updatePostDto.MediaUrl ?? existingPost.MediaUrl;
            existingPost.FieldId = updatePostDto.FieldId ?? existingPost.FieldId;

            var updatedPost = await _postRepository.UpdatePostAsync(existingPost);
            if (updatedPost == null)
                return null;

            return await MapToPostDTOAsync(updatedPost);
        }

        public async Task<bool> DeletePostAsync(int postId, int userId, bool isAdmin = false)
        {
            var post = await _postRepository.GetPostByIdAsync(postId);
            if (post == null)
                return false;

            // Kiểm tra quyền: phải là chủ bài viết hoặc admin
            if (!isAdmin && post.UserId != userId)
                return false;

            // Xóa các comment của bài viết
            await _commentRepository.DeleteCommentsByPostIdAsync(postId);

            // Xóa các like
            await _postLikeRepository.DeleteLikesByPostIdAsync(postId);

            // Xóa bài viết (soft delete)
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
            int userId,
            int pageNumber,
            int pageSize)
        {
            // Lấy tất cả bài viết Active, sắp xếp theo thời gian
            var (posts, totalCount) = await _postRepository.GetAllPostsAsync(
                pageNumber,
                pageSize,
                "Active"
            );

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
            string keyword,
            int pageNumber,
            int pageSize)
        {
            var (posts, totalCount) = await _postRepository.SearchPostsAsync(keyword, pageNumber, pageSize);
            var postDtos = await MapToPostDTOsAsync(posts);

            return (postDtos, totalCount);
        }

        public async Task<bool> LikePostAsync(int postId, int userId)
        {
            var post = await _postRepository.GetPostByIdAsync(postId);
            if (post == null)
                return false;

            var like = await _postLikeRepository.LikePostAsync(postId, userId);
            if (like == null)
                return false; // Đã like rồi

            // Gửi thông báo cho chủ bài viết (nếu không phải tự like)
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
            if (post == null)
                return false;

            post.Status = status;
            var updatedPost = await _postRepository.UpdatePostAsync(post);

            return updatedPost != null;
        }

        // Helper methods
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
            var postDtos = new List<PostDTO>();
            foreach (var post in posts)
            {
                postDtos.Add(await MapToPostDTOAsync(post));
            }
            return postDtos;
        }
    }
}
using BallSport.Application.DTOs.Community;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories.Community;

namespace BallSport.Application.Services.Community
{
    public class CommentService : ICommentService
    {
        private readonly ICommentRepository _commentRepository;
        private readonly IPostRepository _postRepository;
        private readonly INotificationService _notificationService;

        public CommentService(
            ICommentRepository commentRepository,
            IPostRepository postRepository,
            INotificationService notificationService)
        {
            _commentRepository = commentRepository;
            _postRepository = postRepository;
            _notificationService = notificationService;
        }

        public async Task<IEnumerable<CommentDTO>> GetCommentsByPostIdAsync(int postId)
        {
            var comments = await _commentRepository.GetCommentsByPostIdAsync(postId);
            return MapToCommentDTOs(comments);
        }

        public async Task<CommentDTO?> GetCommentByIdAsync(int commentId)
        {
            var comment = await _commentRepository.GetCommentByIdAsync(commentId);
            if (comment == null)
                return null;

            return MapToCommentDTO(comment);
        }

        public async Task<IEnumerable<CommentDTO>> GetRepliesByCommentIdAsync(int parentCommentId)
        {
            var replies = await _commentRepository.GetRepliesByCommentIdAsync(parentCommentId);
            return MapToCommentDTOs(replies);
        }

        public async Task<CommentDTO> CreateCommentAsync(CreateCommentDTO createCommentDto, int userId)
        {
            // Validate post exists
            var post = await _postRepository.GetPostByIdAsync(createCommentDto.PostId);
            if (post == null)
                throw new Exception("Bài viết không tồn tại");

            // Validate parent comment nếu là reply
            if (createCommentDto.ParentCommentId.HasValue)
            {
                var parentComment = await _commentRepository.GetCommentByIdAsync(createCommentDto.ParentCommentId.Value);
                if (parentComment == null)
                    throw new Exception("Comment cha không tồn tại");
            }

            var comment = new Comment
            {
                PostId = createCommentDto.PostId,
                UserId = userId,
                ParentCommentId = createCommentDto.ParentCommentId,
                Content = createCommentDto.Content
            };

            var createdComment = await _commentRepository.CreateCommentAsync(comment);

            // Gửi thông báo
            if (createCommentDto.ParentCommentId.HasValue)
            {
                // Thông báo cho người được reply
                var parentComment = await _commentRepository.GetCommentByIdAsync(createCommentDto.ParentCommentId.Value);
                if (parentComment != null && parentComment.UserId != userId)
                {
                    await _notificationService.CreateNotificationAsync(new CreateNotificationDTO
                    {
                        UserId = parentComment.UserId,
                        Type = "Reply",
                        TargetId = createdComment.CommentId,
                        Message = $"đã trả lời bình luận của bạn"
                    });
                }
            }
            else
            {
                // Thông báo cho chủ bài viết
                if (post.UserId != userId)
                {
                    await _notificationService.CreateNotificationAsync(new CreateNotificationDTO
                    {
                        UserId = post.UserId,
                        Type = "NewComment",
                        TargetId = createdComment.CommentId,
                        Message = $"đã bình luận bài viết của bạn"
                    });
                }
            }

            return MapToCommentDTO(createdComment);
        }

        public async Task<CommentDTO?> UpdateCommentAsync(int commentId, UpdateCommentDTO updateCommentDto, int userId)
        {
            var existingComment = await _commentRepository.GetCommentByIdAsync(commentId);
            if (existingComment == null || existingComment.UserId != userId)
                return null;

            existingComment.Content = updateCommentDto.Content ?? existingComment.Content;

            var updatedComment = await _commentRepository.UpdateCommentAsync(existingComment);
            if (updatedComment == null)
                return null;

            return MapToCommentDTO(updatedComment);
        }

        public async Task<bool> DeleteCommentAsync(int commentId, int userId, bool isAdmin = false)
        {
            var comment = await _commentRepository.GetCommentByIdAsync(commentId);
            if (comment == null)
                return false;

            // Kiểm tra quyền: phải là chủ comment hoặc admin
            if (!isAdmin && comment.UserId != userId)
                return false;

            return await _commentRepository.DeleteCommentAsync(commentId);
        }

        public async Task<IEnumerable<CommentDTO>> GetCommentsByUserIdAsync(int userId)
        {
            var comments = await _commentRepository.GetCommentsByUserIdAsync(userId);
            return MapToCommentDTOs(comments);
        }

        public async Task<int> CountCommentsByPostIdAsync(int postId)
        {
            return await _commentRepository.CountCommentsByPostIdAsync(postId);
        }

        public async Task<bool> IsCommentOwnerAsync(int commentId, int userId)
        {
            var comment = await _commentRepository.GetCommentByIdAsync(commentId);
            return comment != null && comment.UserId == userId;
        }

        // Helper methods
        private CommentDTO MapToCommentDTO(Comment comment)
        {
            return new CommentDTO
            {
                CommentId = comment.CommentId,
                PostId = comment.PostId,
                UserId = comment.UserId,
                UserName = comment.User?.FullName ?? "Unknown",
                UserAvatar = comment.User?.Avatar != null ? Convert.ToBase64String(comment.User.Avatar) : null,
                ParentCommentId = comment.ParentCommentId,
                Content = comment.Content,
                CreatedAt = comment.CreatedAt,
                Status = comment.Status
            };
        }

        private IEnumerable<CommentDTO> MapToCommentDTOs(IEnumerable<Comment> comments)
        {
            return comments.Select(MapToCommentDTO).ToList();
        }
    }
}
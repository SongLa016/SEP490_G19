// File: BallSport.Application.Services/Community/CommentService.cs
using BallSport.Application.Common.Extensions; // THÊM DÒNG NÀY – BẮT BUỘC!
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
            var comments = await _commentRepository.GetCommentsByPostIdAsync(postId, "Active");
            return MapToCommentDTOs(comments);
        }

        public async Task<CommentDTO?> GetCommentByIdAsync(int commentId)
        {
            var comment = await _commentRepository.GetCommentByIdAsync(commentId);
            return comment == null ? null : MapToCommentDTO(comment);
        }

        public async Task<IEnumerable<CommentDTO>> GetRepliesByCommentIdAsync(int parentCommentId)
        {
            var replies = await _commentRepository.GetRepliesByCommentIdAsync(parentCommentId, "Active");
            return MapToCommentDTOs(replies);
        }

        public async Task<CommentDTO> CreateCommentAsync(CreateCommentDTO dto, int userId)
        {
            if (!await PostExistsAsync(dto.PostId))
                throw new Exception("Bài viết không tồn tại");

            if (dto.ParentCommentId.HasValue && dto.ParentCommentId.Value > 0)
            {
                if (!await CommentExistsAsync(dto.ParentCommentId.Value))
                    throw new Exception("Bình luận cha không tồn tại hoặc đã bị xóa");
            }

            var comment = new Comment
            {
                PostId = dto.PostId,
                UserId = userId,
                ParentCommentId = dto.ParentCommentId,
                Content = dto.Content.Trim()
            };

            var createdComment = await _commentRepository.CreateCommentAsync(comment);

            // Gửi thông báo
            if (dto.ParentCommentId.HasValue)
            {
                var parentComment = await _commentRepository.GetCommentByIdAsync(dto.ParentCommentId.Value);
                if (parentComment != null && parentComment.UserId != userId)
                {
                    await _notificationService.CreateNotificationAsync(new CreateNotificationDTO
                    {
                        UserId = parentComment.UserId,
                        Type = "Reply",
                        TargetId = createdComment.CommentId,
                        Message = "đã trả lời bình luận của bạn"
                    });
                }
            }
            else
            {
                var post = await _postRepository.GetPostByIdAsync(dto.PostId);
                if (post != null && post.UserId != userId)
                {
                    await _notificationService.CreateNotificationAsync(new CreateNotificationDTO
                    {
                        UserId = post.UserId,
                        Type = "NewComment",
                        TargetId = createdComment.CommentId,
                        Message = "đã bình luận bài viết của bạn"
                    });
                }
            }

            return MapToCommentDTO(createdComment);
        }

        public async Task<CommentDTO?> UpdateCommentAsync(int commentId, UpdateCommentDTO dto, int userId)
        {
            var comment = await _commentRepository.GetCommentByIdAsync(commentId);
            if (comment == null || comment.UserId != userId || comment.Status != "Active")
                return null;

            comment.Content = dto.Content.Trim();
            var updated = await _commentRepository.UpdateCommentAsync(comment);
            return updated == null ? null : MapToCommentDTO(updated);
        }

        public async Task<bool> DeleteCommentAsync(int commentId, int userId, bool isAdmin = false)
        {
            var comment = await _commentRepository.GetCommentByIdAsync(commentId);
            if (comment == null) return false;
            if (!isAdmin && comment.UserId != userId) return false;

            return await _commentRepository.HardDeleteCommentAsync(commentId);
        }

        public async Task<IEnumerable<CommentDTO>> GetCommentsByUserIdAsync(int userId)
        {
            var comments = await _commentRepository.GetCommentsByUserIdAsync(userId, "Active");
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

        public async Task<bool> PostExistsAsync(int postId)
            => await _postRepository.GetPostByIdAsync(postId) != null;

        public async Task<bool> CommentExistsAsync(int commentId)
            => await _commentRepository.CommentExistsAsync(commentId);

        // CHỈ SỬA 1 DÒNG DUY NHẤT Ở ĐÂY – GIỜ VIỆT NAM ĐÚNG MÃI MÃI!
        private CommentDTO MapToCommentDTO(Comment comment)
        {
            return new CommentDTO
            {
                CommentId = comment.CommentId,
                PostId = comment.PostId,
                UserId = comment.UserId,
                UserName = comment.User?.FullName ?? "Người dùng ẩn danh",
                ParentCommentId = comment.ParentCommentId,
                Content = comment.Content,
                // DÒNG THẦN THÁNH – FIX +07:00 HOÀN TOÀN!
                CreatedAt = comment.CreatedAt?.ToVietnamTime() ?? DateTimeExtensions.VietnamNow,
                Status = comment.Status ?? "Active"
            };
        }

        private IEnumerable<CommentDTO> MapToCommentDTOs(IEnumerable<Comment> comments)
            => comments.Select(MapToCommentDTO);
    }
}
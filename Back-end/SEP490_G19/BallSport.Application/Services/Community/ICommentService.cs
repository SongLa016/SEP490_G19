using BallSport.Application.DTOs.Community;

namespace BallSport.Application.Services.Community
{
    public interface ICommentService
    {
        // Lấy danh sách comment của bài viết
        Task<IEnumerable<CommentDTO>> GetCommentsByPostIdAsync(int postId);

        // Lấy chi tiết comment
        Task<CommentDTO?> GetCommentByIdAsync(int commentId);

        // Lấy reply của comment
        Task<IEnumerable<CommentDTO>> GetRepliesByCommentIdAsync(int parentCommentId);

        // Tạo comment mới
        Task<CommentDTO> CreateCommentAsync(CreateCommentDTO createCommentDto, int userId);

        // Cập nhật comment
        Task<CommentDTO?> UpdateCommentAsync(int commentId, UpdateCommentDTO updateCommentDto, int userId);

        // Xóa comment
        Task<bool> DeleteCommentAsync(int commentId, int userId, bool isAdmin = false);

        // Lấy comment của user
        Task<IEnumerable<CommentDTO>> GetCommentsByUserIdAsync(int userId);

        // Đếm số comment của bài viết
        Task<int> CountCommentsByPostIdAsync(int postId);

        // Kiểm tra quyền sở hữu comment
        Task<bool> IsCommentOwnerAsync(int commentId, int userId);
    }
}
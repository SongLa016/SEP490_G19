using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories.Community
{
    public interface ICommentRepository
    {
        // Lấy tất cả comment của bài viết
        Task<IEnumerable<Comment>> GetCommentsByPostIdAsync(int postId, string? status = "Active");

        // Lấy comment theo ID
        Task<Comment?> GetCommentByIdAsync(int commentId);

        // Tạo comment mới
        Task<Comment> CreateCommentAsync(Comment comment);

        // Cập nhật comment
        Task<Comment?> UpdateCommentAsync(Comment comment);

        // Xóa comment (soft delete)
        Task<bool> DeleteCommentAsync(int commentId);

        // Lấy reply của comment (comment con)
        Task<IEnumerable<Comment>> GetRepliesByCommentIdAsync(int parentCommentId, string? status = "Active");

        // Đếm số comment của bài viết
        Task<int> CountCommentsByPostIdAsync(int postId);

        // Đếm số comment của user
        Task<int> CountCommentsByUserIdAsync(int userId);

        // Kiểm tra comment có tồn tại
        Task<bool> CommentExistsAsync(int commentId);

        // Lấy comment của user
        Task<IEnumerable<Comment>> GetCommentsByUserIdAsync(int userId, string? status = "Active");

        // Xóa tất cả comment của bài viết (cascade khi xóa post)
        Task<bool> DeleteCommentsByPostIdAsync(int postId);
    }
}
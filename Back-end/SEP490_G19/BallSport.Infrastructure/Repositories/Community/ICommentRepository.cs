// File: BallSport.Infrastructure.Repositories/Community/ICommentRepository.cs
using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories.Community
{
    public interface ICommentRepository
    {
        // Lấy tất cả comment của bài viết (có Include User, Likes, Replies nếu cần)
        Task<IEnumerable<Comment>> GetCommentsByPostIdAsync(int postId, string? status = "Active");

        // Lấy comment theo ID (Include navigation nếu cần)
        Task<Comment?> GetCommentByIdAsync(int commentId);

        // Tạo comment mới
        Task<Comment> CreateCommentAsync(Comment comment);

        // Cập nhật comment
        Task<Comment?> UpdateCommentAsync(Comment comment);

        // XÓA THẬT COMMENT (Hard Delete) – DÙNG KHI BỊ BÁO CÁO HOẶC XÓA BÀI
        Task<bool> HardDeleteCommentAsync(int commentId);

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

        // XÓA TẤT CẢ COMMENT + LIKE + REPLY CỦA BÀI VIẾT (cascade hard delete)
        Task<bool> HardDeleteCommentsByPostIdAsync(int postId);

        // XÓA TẤT CẢ COMMENT CON (replies) CỦA 1 COMMENT (khi xóa comment cha)
        Task<bool> HardDeleteRepliesByParentIdAsync(int parentCommentId);
    }
}
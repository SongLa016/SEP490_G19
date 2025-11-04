using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories.Community
{
    public interface IPostRepository
    {
        // Lấy tất cả bài viết (có phân trang)
        Task<(IEnumerable<Post> Posts, int TotalCount)> GetAllPostsAsync(
            int pageNumber,
            int pageSize,
            string? status = "Active",
            int? fieldId = null,
            int? userId = null);

        // Lấy bài viết theo ID
        Task<Post?> GetPostByIdAsync(int postId);

        // Tạo bài viết mới
        Task<Post> CreatePostAsync(Post post);

        // Cập nhật bài viết
        Task<Post?> UpdatePostAsync(Post post);

        // Xóa bài viết (soft delete)
        Task<bool> DeletePostAsync(int postId);

        // Lấy bài viết theo User
        Task<IEnumerable<Post>> GetPostsByUserIdAsync(int userId, string? status = "Active");

        // Lấy bài viết theo Field
        Task<IEnumerable<Post>> GetPostsByFieldIdAsync(int fieldId, string? status = "Active");

        // Đếm số lượng bài viết của user
        Task<int> CountPostsByUserIdAsync(int userId);

        // Kiểm tra bài viết có tồn tại không
        Task<bool> PostExistsAsync(int postId);

        // Lấy bài viết phổ biến nhất (nhiều like, comment)
        Task<IEnumerable<Post>> GetTrendingPostsAsync(int topCount = 10, int daysBack = 7);

        // Search bài viết
        Task<(IEnumerable<Post> Posts, int TotalCount)> SearchPostsAsync(
            string keyword,
            int pageNumber,
            int pageSize);
    }
}
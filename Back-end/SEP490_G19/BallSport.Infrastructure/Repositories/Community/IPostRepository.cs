using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories.Community
{
    public interface IPostRepository
    {
        // 1. DANH SÁCH BÀI VIẾT – CHỈ TRẢ VỀ BÀI ACTIVE (HOẶC PENDING/REJECTED KHI CẦN)
        Task<(IEnumerable<Post> Posts, int TotalCount)> GetAllPostsAsync(
            int pageNumber,
            int pageSize,
            string? status = "Active",  // "Active" | "Pending" | "Rejected" 
            int? fieldId = null,
            int? userId = null);

        Task<Post?> GetPostByIdAsync(int postId);

        Task<Post> CreatePostAsync(Post post);
        Task<Post?> UpdatePostAsync(Post post);

        
        Task<bool> HardDeletePostAsync(int postId); // XÓA THẬT – DÙNG CHO USER + ADMIN

        Task<IEnumerable<Post>> GetPostsByUserIdAsync(int userId, string? status = "Active");
        Task<IEnumerable<Post>> GetPostsByFieldIdAsync(int fieldId, string? status = "Active");
        Task<int> CountPostsByUserIdAsync(int userId);
        Task<bool> PostExistsAsync(int postId);
        Task<IEnumerable<Post>> GetTrendingPostsAsync(int topCount = 10, int daysBack = 7);

        Task<(IEnumerable<Post> Posts, int TotalCount)> SearchPostsAsync(
            string keyword, int pageNumber, int pageSize);

        
        Task<bool> ReviewPostAsync(int postId, string newStatus); // "Active" hoặc "Rejected"
        Task<bool> ModeratePostAsync(int postId, string newStatus); // "Hidden" hoặc "Rejected" (nếu còn dùng)
        Task<bool> DeleteMyPostAsync(int postId, int userId); // GỌI HardDeletePostAsync bên trong
        Task<(IEnumerable<Post> Posts, int TotalCount)> GetPendingPostsAsync(
            int pageNumber = 1, int pageSize = 20);
    }
}
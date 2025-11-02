using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories.Community
{
    public interface IPostLikeRepository
    {
        // Like bài viết
        Task<PostLike?> LikePostAsync(int postId, int userId);

        // Unlike bài viết
        Task<bool> UnlikePostAsync(int postId, int userId);

        // Kiểm tra user đã like bài viết chưa
        Task<bool> IsPostLikedByUserAsync(int postId, int userId);

        // Đếm số lượt like của bài viết
        Task<int> CountLikesByPostIdAsync(int postId);

        // Lấy danh sách user đã like bài viết
        Task<IEnumerable<PostLike>> GetLikesByPostIdAsync(int postId);

        // Lấy danh sách bài viết user đã like
        Task<IEnumerable<PostLike>> GetLikesByUserIdAsync(int userId);

        // Lấy thông tin like cụ thể
        Task<PostLike?> GetLikeAsync(int postId, int userId);

        // Xóa tất cả like của bài viết (cascade khi xóa post)
        Task<bool> DeleteLikesByPostIdAsync(int postId);
    }
}
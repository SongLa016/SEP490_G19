// File: BallSport.Application.Services/Community/IPostService.cs
using BallSport.Application.DTOs.Community;

namespace BallSport.Application.Services.Community
{
    public interface IPostService
    {
        Task<PostDTO> CreatePostAsync(CreatePostDTO dto, int userId);

        Task<PostDetailDTO?> GetPostByIdAsync(int postId, int? currentUserId = null);

        Task<(IEnumerable<PostDTO> Posts, int TotalCount)> GetAllPostsAsync(
            int pageNumber, int pageSize, PostFilterDTO? filter = null);

        Task<PostDTO?> UpdatePostAsync(int postId, UpdatePostDTO dto, int userId);

        // USER & ADMIN XÓA BÀI → CẢ 2 ĐỀU XÓA THẬT (hard delete)
        Task<bool> DeleteMyPostAsync(int postId, int userId);           // User tự xóa
        Task<bool> DeletePostByAdminAsync(int postId);                  // Admin xóa (xóa thật luôn)

        // ADMIN DUYỆT BÀI
        Task<bool> ReviewPostAsync(int postId, string status); // "Active" hoặc "Rejected"

        
        Task<(IEnumerable<PostDTO> Posts, int TotalCount)> GetPendingPostsAsync(
            int pageNumber = 1, int pageSize = 20);

        Task<IEnumerable<PostDTO>> GetPostsByUserIdAsync(int userId);
        Task<IEnumerable<PostDTO>> GetPostsByFieldIdAsync(int fieldId);
        Task<IEnumerable<PostDTO>> GetTrendingPostsAsync(int topCount = 10);

        Task<(IEnumerable<PostFeedDTO> Posts, int TotalCount)> GetNewsFeedAsync(
            int userId, int pageNumber, int pageSize);

        Task<(IEnumerable<PostDTO> Posts, int TotalCount)> SearchPostsAsync(
            string keyword, int pageNumber, int pageSize);

        Task<bool> LikePostAsync(int postId, int userId);
        Task<bool> UnlikePostAsync(int postId, int userId);

        Task<bool> IsPostOwnerAsync(int postId, int userId);
        Task<bool> FieldExistsAsync(int fieldId);
    }
}
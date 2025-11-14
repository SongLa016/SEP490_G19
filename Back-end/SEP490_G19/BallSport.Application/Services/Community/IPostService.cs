using BallSport.Application.DTOs.Community;

namespace BallSport.Application.Services.Community
{
    public interface IPostService
    {
        // Lấy danh sách bài viết (có phân trang)
        Task<(IEnumerable<PostDTO> Posts, int TotalCount)> GetAllPostsAsync(
            int pageNumber,
            int pageSize,
            PostFilterDTO? filter = null);

        // Lấy chi tiết bài viết
        Task<PostDetailDTO?> GetPostByIdAsync(int postId, int? currentUserId = null);

        // Tạo bài viết mới
        Task<PostDTO> CreatePostAsync(CreatePostDTO createPostDto, int userId);

        // Cập nhật bài viết
        Task<PostDTO?> UpdatePostAsync(int postId, UpdatePostDTO updatePostDto, int userId);

        // Xóa bài viết
        Task<bool> DeletePostAsync(int postId, int userId, bool isAdmin = false);

        // Lấy bài viết của user
        Task<IEnumerable<PostDTO>> GetPostsByUserIdAsync(int userId);

        // Lấy bài viết theo sân
        Task<IEnumerable<PostDTO>> GetPostsByFieldIdAsync(int fieldId);

        // Lấy bài viết trending
        Task<IEnumerable<PostDTO>> GetTrendingPostsAsync(int topCount = 10);

        // Lấy newsfeed cho user
        Task<(IEnumerable<PostFeedDTO> Posts, int TotalCount)> GetNewsFeedAsync(
            int userId,
            int pageNumber,
            int pageSize);

        // Tìm kiếm bài viết
        Task<(IEnumerable<PostDTO> Posts, int TotalCount)> SearchPostsAsync(
            string keyword,
            int pageNumber,
            int pageSize);

        // Like bài viết
        Task<bool> LikePostAsync(int postId, int userId);

        // Unlike bài viết
        Task<bool> UnlikePostAsync(int postId, int userId);

        // Kiểm tra quyền sở hữu bài viết
        Task<bool> IsPostOwnerAsync(int postId, int userId);

        // Ẩn/Hiện bài viết (Admin)
        Task<bool> TogglePostVisibilityAsync(int postId, string status);
    }
}
using BallSport.Application.DTOs.Community;

namespace BallSport.Application.Services.Community
{
    public interface IPostService
    {
        Task<(IEnumerable<PostDTO> Posts, int TotalCount)> GetAllPostsAsync(
            int pageNumber, int pageSize, PostFilterDTO? filter = null);

        Task<PostDetailDTO?> GetPostByIdAsync(int postId, int? currentUserId = null);

        Task<PostDTO> CreatePostAsync(CreatePostDTO createPostDto, int userId);

        Task<PostDTO?> UpdatePostAsync(int postId, UpdatePostDTO updatePostDto, int userId);

        Task<bool> DeletePostAsync(int postId, int userId, bool isAdmin = false);

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
        Task<bool> TogglePostVisibilityAsync(int postId, string status);

        // THÊM HÀM NÀY – SIÊU QUAN TRỌNG
        Task<bool> FieldExistsAsync(int fieldId);
    }
}
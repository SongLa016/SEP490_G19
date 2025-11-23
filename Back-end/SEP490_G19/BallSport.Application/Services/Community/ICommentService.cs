// File: BallSport.Application.Services/Community/ICommentService.cs
using BallSport.Application.DTOs.Community;

namespace BallSport.Application.Services.Community
{
    public interface ICommentService
    {
    
        Task<IEnumerable<CommentDTO>> GetCommentsByPostIdAsync(int postId);

        
        Task<CommentDTO?> GetCommentByIdAsync(int commentId);

       
        Task<IEnumerable<CommentDTO>> GetRepliesByCommentIdAsync(int parentCommentId);

        
        Task<CommentDTO> CreateCommentAsync(CreateCommentDTO dto, int userId);

     
        Task<CommentDTO?> UpdateCommentAsync(int commentId, UpdateCommentDTO dto, int userId);

        Task<bool> DeleteCommentAsync(int commentId, int userId, bool isAdmin = false);


        Task<IEnumerable<CommentDTO>> GetCommentsByUserIdAsync(int userId);

      
        Task<int> CountCommentsByPostIdAsync(int postId);

      
        Task<bool> IsCommentOwnerAsync(int commentId, int userId);

      
        Task<bool> PostExistsAsync(int postId);

    
        Task<bool> CommentExistsAsync(int commentId);
    }
}
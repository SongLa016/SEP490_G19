namespace BallSport.Application.DTOs.Community
{
    public class CommentDTO
    {
        public int CommentId { get; set; }
        public int PostId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? UserAvatar { get; set; }
        public int? ParentCommentId { get; set; }  // Null nếu là comment gốc
        public string Content { get; set; } = string.Empty;
        public DateTime? CreatedAt { get; set; }
        public string? Status { get; set; }
    }
}
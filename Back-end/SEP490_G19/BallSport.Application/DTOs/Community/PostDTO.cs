namespace BallSport.Application.DTOs.Community
{
    public class PostDTO
    {
        public int PostId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string? UserAvatar { get; set; }
        public string? Title { get; set; }
        public string Content { get; set; } = string.Empty;
        public string? MediaUrl { get; set; }
        public int? FieldId { get; set; }
        public string? FieldName { get; set; }
        public int LikeCount { get; set; }
        public int CommentCount { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? Status { get; set; }
    }
}
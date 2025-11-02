namespace BallSport.Application.DTOs.Community
{
    public class PostFeedDTO
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
        public bool IsLiked { get; set; }  // Người dùng hiện tại đã like chưa
        public DateTime? CreatedAt { get; set; }
    }
}
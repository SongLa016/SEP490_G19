using System.Collections.Generic;

namespace BallSport.Application.DTOs.Community
{
    public class PostFeedDTO
    {
        public int PostId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = string.Empty;

        public string? Title { get; set; }
        public string Content { get; set; } = string.Empty;

        // NHIỀU ẢNH – TRẢ VỀ DANH SÁCH URL
        public List<string> ImageUrls { get; set; } = new();

        public int? FieldId { get; set; }
        public string? FieldName { get; set; }

        public int LikeCount { get; set; }
        public int CommentCount { get; set; }
        public bool IsLiked { get; set; } // Người dùng hiện tại đã like chưa

        public DateTime CreatedAt { get; set; }
    }
}
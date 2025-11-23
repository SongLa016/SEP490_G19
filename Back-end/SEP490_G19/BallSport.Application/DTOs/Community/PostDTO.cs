// File: BallSport.Application.DTOs/Community/PostDTO.cs
using System.Collections.Generic;

namespace BallSport.Application.DTOs.Community
{
    /// <summary>
    /// Dùng để trả về danh sách bài viết (trang chủ, newsfeed, tìm kiếm, v.v.)
    /// </summary>
    public class PostDTO
    {
        public int PostId { get; set; }
        public int UserId { get; set; }
        public string UserName { get; set; } = "Unknown";

        public string? Title { get; set; }
        public string Content { get; set; } = string.Empty;
        public List<string> ImageUrls { get; set; } = new();

        public int? FieldId { get; set; }
        public string? FieldName { get; set; }

        public int LikeCount { get; set; }
        public int CommentCount { get; set; }

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // THAY STRING STATUS BẰNG 2 BOOL – SIÊU DỄ DÙNG CHO FRONTEND
        public bool IsPending { get; set; } = false;   // Đang chờ duyệt
        public bool IsRejected { get; set; } = false;  // Bị từ chối

        // QUYỀN & NÚT HIỂN THỊ – GIỮ NGUYÊN, SIÊU CHUẨN
        public bool IsOwner { get; set; }
        public bool CanEdit { get; set; }
        public bool CanDelete { get; set; }
        public bool ShowReviewButtons { get; set; } // Chỉ Admin thấy khi IsPending = true
    }
}
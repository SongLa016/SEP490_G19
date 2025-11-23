// File: BallSport.Application.DTOs/Community/PostDetailDTO.cs
using System.Collections.Generic;

namespace BallSport.Application.DTOs.Community
{
    /// <summary>
    /// Dùng khi lấy chi tiết 1 bài viết (GET /api/Post/{id})
    /// </summary>
    public class PostDetailDTO
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
        public bool IsLiked { get; set; } // Người đang xem đã like chưa

        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }

        // CHỈ GIỮ 1 TRONG 2 DƯỚI ĐÂY – KHUYẾN KHÍCH DÙNG CÁI THỨ 2 (SẠCH HƠN)

        //// CÁCH 1: Giữ Status (nếu bạn muốn frontend biết chính xác trạng thái)
        //public string Status { get; set; } = "Active"; // "Pending" | "Active" | "Rejected"

        // CÁCH 2: (TỐI ƯU HƠN) – Thay Status bằng các bool để frontend dễ xử lý UI
        public bool IsPending { get; set; } = false;
        public bool IsRejected { get; set; } = false;

        // ===== QUYỀN & NÚT HIỂN THỊ =====
        public bool IsOwner { get; set; }           // Có phải chủ bài không
        public bool CanEdit { get; set; }           // Được sửa không (chỉ khi Pending hoặc Active)
        public bool CanDelete { get; set; }         // Được xóa không (chỉ khi chưa bị xóa thật)
        public bool IsAdmin { get; set; }           // Người xem có phải Admin không
        public bool ShowReviewButtons { get; set; } // Chỉ Admin thấy khi bài đang Pending
    }
}
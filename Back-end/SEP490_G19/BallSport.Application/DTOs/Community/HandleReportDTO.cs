// File: HandleReportDTO.cs → DÙNG LẠI BẢN CŨ ĐỂ KHÔNG LỖI
using System.ComponentModel.DataAnnotations;

public class HandleReportDTO
{
    [Required]
    public string Status { get; set; } = "Reviewed"; // hoặc "Rejected"

    public string? Action { get; set; } // "Delete" hoặc "None"

    [MaxLength(500)]
    public string? AdminNote { get; set; }
}
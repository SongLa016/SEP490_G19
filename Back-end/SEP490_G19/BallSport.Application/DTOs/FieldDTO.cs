using Microsoft.AspNetCore.Http;
using System;

namespace BallSport.Application.DTOs
{
    public class FieldDTO
    {
        public int FieldId { get; set; }

        public int? ComplexId { get; set; }

        public int? TypeId { get; set; }

        public string Name { get; set; } = null!;

        public string? Size { get; set; }

        public string? GrassType { get; set; }

        public string? Description { get; set; }

        public List<IFormFile>? ImageFiles { get; set; } 
        public decimal? PricePerHour { get; set; }

        public string? Status { get; set; }

        public DateTime? CreatedAt { get; set; }

        // 🏦 Thông tin tài khoản ngân hàng (user nhập)
        public string? BankName { get; set; }

        public string ? BankShortCode {  get; set; }
        public string? AccountNumber { get; set; }
        public string? AccountHolder { get; set; }

      
    }
}

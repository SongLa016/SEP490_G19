using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class FieldResponseDTO
    {
        public int FieldId { get; set; }
        public int? ComplexId { get; set; }
        public int? TypeId { get; set; }
        public string Name { get; set; } = null!;
        public string? Size { get; set; }
        public string? GrassType { get; set; }
        public string? Description { get; set; }
        public decimal? PricePerHour { get; set; }
        public string? Status { get; set; }
        public DateTime? CreatedAt { get; set; }

        public string? BankName { get; set; }
        public string? BankShortCode { get; set; }
        public string? AccountNumber { get; set; }
        public string? AccountHolder { get; set; }

        public string? MainImageBase64 { get; set; }
        public List<string>? ImageFilesBase64 { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class FieldComplexResponseDTO
    {
        public int ComplexId { get; set; }
        public int? OwnerId { get; set; }
        public string Name { get; set; } = null!;
        public string Address { get; set; } = null!;
        public string? Description { get; set; }
        public string? Status { get; set; }
        public DateTime? CreatedAt { get; set; }
        public string? ImageUrl { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }
}

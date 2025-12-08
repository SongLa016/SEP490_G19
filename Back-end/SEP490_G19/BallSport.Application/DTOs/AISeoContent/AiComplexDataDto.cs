using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs.AISeoContent
{
    public class AiComplexDataDto
    {
        public int ComplexId { get; set; }
        public string? Name { get; set; }
        public string? Address { get; set; }
        public string? Ward { get; set; }
        public string? District { get; set; }
        public string? Province { get; set; }
        public string? Description { get; set; }

        public double AvgStars { get; set; }
        public int TotalBookings { get; set; }

        public List<FieldDto> Fields { get; set; } = new();
        public List<string> TopComments { get; set; } = new();
    }
    public class FieldDto
    {
        public int FieldId { get; set; }
        public string? Name { get; set; }
        public string? Size { get; set; }
        public string? GrassType { get; set; }
        public decimal? PricePerHour { get; set; }
    }
}

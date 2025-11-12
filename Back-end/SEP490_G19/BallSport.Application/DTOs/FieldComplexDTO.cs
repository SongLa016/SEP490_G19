using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class FieldComplexDTO
    {
        public int ComplexId { get; set; }

        public int? OwnerId { get; set; }

        public string Name { get; set; } = null!;

        public string Address { get; set; } = null!;

        public string? Description { get; set; }

        public byte[]? Image { get; set; }

        public string? Status { get; set; }

        public DateTime? CreatedAt { get; set; }

        public string? OwnerName { get; set; }

    }
}

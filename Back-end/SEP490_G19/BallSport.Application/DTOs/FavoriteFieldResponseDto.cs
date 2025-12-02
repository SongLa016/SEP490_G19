using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class FavoriteFieldResponseDto
    {
        public int UserId { get; set; }
        public int FieldId { get; set; }
        public int? ComplexId { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

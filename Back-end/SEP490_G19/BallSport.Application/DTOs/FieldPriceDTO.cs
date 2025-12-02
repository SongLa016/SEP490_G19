using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class FieldPriceDTO
    {
        public int? FieldId { get; set; }
        public int? SlotId { get; set; }
        public decimal Price { get; set; }
    }
}

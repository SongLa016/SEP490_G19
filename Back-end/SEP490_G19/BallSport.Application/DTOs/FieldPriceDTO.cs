using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class FieldPriceDTO
    {
        public int PriceId { get; set; }
        public int? FieldId { get; set; }
        public string? FieldName { get; set; }
        public int? SlotId { get; set; }
        public string? SlotName { get; set; }
        public decimal Price { get; set; }
    }
}

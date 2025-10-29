using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class PaymentCreateDto
    {
        public int BookingId { get; set; }
        public int OwnerId { get; set; } // Chủ sân nhận tiền
        public int FieldId { get; set; }
        public decimal Amount { get; set; }
        public string Method { get; set; } = "payOs";
    }
}

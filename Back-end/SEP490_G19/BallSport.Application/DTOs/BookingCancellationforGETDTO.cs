using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class BookingCancellationforGETDTO
    {
        public int RequestId { get; set; }
        public int BookingId { get; set; }
        public string RequestedByRole { get; set; }
        public string RequestStatus { get; set; }
        public decimal RefundAmount { get; set; }
        public decimal PenaltyAmount { get; set; }
        public decimal FinalRefundAmount { get; set; }
        public DateTime? RequestedAt { get; set; }
        public string? RequestReason { get; set; }
    }
}

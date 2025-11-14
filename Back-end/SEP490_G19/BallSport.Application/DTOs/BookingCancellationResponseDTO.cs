using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class BookingCancellationResponseDTO
    {
        public int CancellationId { get; set; }
        public int BookingId { get; set; }
        public int RequestId { get; set; }
        public string CancelledBy { get; set; }
        public string CancelReason { get; set; }
        public decimal RefundAmount { get; set; }
        public decimal PenaltyAmount { get; set; }
        public DateTime? CreatedAt { get; set; }
        public int VerifiedBy { get; set; }
        public DateTime? VerifiedAt { get; set; }
        public string BookingStatus { get; set; }
        public string RequestStatus { get; set; }
    }
}

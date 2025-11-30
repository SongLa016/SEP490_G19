using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class reposeDraftDTO
    {
        public int BookingPackageId { get; set; }
        public int UserId { get; set; }
        public int FieldId { get; set; }
        public string PackageName { get; set; } = null!;
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public decimal TotalPrice { get; set; }
        public string BookingStatus { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public string? Qrcode { get; set; }
        public DateTime? QrexpiresAt { get; set; }
    }
}

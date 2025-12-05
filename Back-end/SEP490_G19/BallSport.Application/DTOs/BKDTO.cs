using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class BKDTO
    {
        public int BookingPackageId { get; set; }
        public int UserId { get; set; }
        public int FieldId { get; set; }
        public string PackageName { get; set; } = null!;
        public DateOnly StartDate { get; set; }
        public DateOnly EndDate { get; set; }
        public decimal TotalPrice { get; set; }
        public string? BookingStatus { get; set; }
        public string? PaymentStatus { get; set; }
        public string? Qrcode { get; set; }
        public DateTime? QrexpiresAt { get; set; }
        public DateTime? CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public string? FieldName { get; set; }
        public string? FieldStatus { get; set; }
    }
}

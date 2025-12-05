using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class PSDTO
    {
        public int PackageSessionId { get; set; }

        public int BookingPackageId { get; set; }
        public DateOnly SessionDate { get; set; }
        public decimal PricePerSession { get; set; }
        public string? SessionStatus { get; set; }
        public int UserId { get; set; }
        public int ScheduleId { get; set; }

       
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs.StatisticOwner
{
    public class RecentBookingDTO
    {
        public string CustomerName { get; set; } = string.Empty;
        public string FieldName { get; set; } = string.Empty;
        public string TimeSlot { get; set; } = string.Empty; 
        public decimal Price { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}

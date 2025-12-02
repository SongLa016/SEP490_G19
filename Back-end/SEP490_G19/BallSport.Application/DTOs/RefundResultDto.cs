using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class RefundResultDto
    {
        public int SessionId { get; set; }
        public DateOnly SessionDate { get; set; }
        public int? ScheduleId { get; set; }
        public string SessionStatus { get; set; } = string.Empty;
        public decimal RefundAmount { get; set; }
        public string QrImageUrl { get; set; } = string.Empty;
    }
}

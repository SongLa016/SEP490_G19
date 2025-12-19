using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application
{
    public class FieldSchedulePublicDTO
    {
        public int ScheduleID { get; set; }
        public int? FieldID { get; set; }
        public DateOnly Date { get; set; }
        public string? Status { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
    }
}

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs.MatchFinding
{
    public class BookingUsDTO
    {
        public int BookingId { get; set; }
        public string FieldName { get; set; }
        public string ComplexName { get; set; }
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string SlotName { get; set; }
    }
}

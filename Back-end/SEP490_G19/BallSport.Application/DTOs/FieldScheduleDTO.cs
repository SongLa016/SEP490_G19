using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.DTOs
{
    public class FieldScheduleDTO
    {
        public int ScheduleId { get; set; }
        public int? FieldId { get; set; }
        public string? FieldName { get; set; }     // lấy từ Field.Name
        public int? SlotId { get; set; }
        public string? SlotName { get; set; }      // lấy từ TimeSlot.SlotName
        public TimeOnly? StartTime { get; set; }
        public TimeOnly? EndTime { get; set; }
        public DateOnly Date { get; set; }
        public string? Status { get; set; }
    }
}

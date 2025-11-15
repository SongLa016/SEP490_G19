using System;

namespace BallSport.Application.DTOs
{
    public class FieldScheduleDTO
    {
        public int ScheduleId { get; set; }
        public int? FieldId { get; set; }
        public string? FieldName { get; set; }
        public int? SlotId { get; set; }
        public string? SlotName { get; set; }
        public TimeOnly? StartTime { get; set; }
        public TimeOnly? EndTime { get; set; }
        public DateOnly Date { get; set; }
        public string? Status { get; set; }
    }
}

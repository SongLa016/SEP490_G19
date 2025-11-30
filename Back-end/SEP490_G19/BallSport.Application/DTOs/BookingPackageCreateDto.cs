using System;
using System.Collections.Generic;

namespace BallSport.Application.DTOs
{
    public class BookingPackageCreateDto
    {
        public int UserId { get; set; }
        public int FieldId { get; set; }
        public string PackageName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public decimal? TotalPrice { get; set; }
        public List<SelectedSlotDto> SelectedSlots { get; set; } = new();

    }

    
    public class SelectedSlotDto
    {
       
        public int SlotId { get; set; }
        public byte DayOfWeek { get; set; }
        public int? FieldId { get; set; }
        public int? ScheduleId { get; set; }
    }
}

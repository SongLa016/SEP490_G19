namespace BallSport.Application.DTOs
{
    public class TimeSlotDTO
    {
        public int SlotId { get; set; }
        public string? SlotName { get; set; }
        public int FieldId { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
        public decimal Price { get; set; }  
    }
}

    namespace BallSport.Application.DTOs
{
    public class TimeSlotDTO
    {
        public int SlotId { get; set; }
        public string? SlotName { get; set; }
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
    }
}

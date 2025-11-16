namespace BallSport.Application.DTOs.MatchFinding
{
    public class BookingInfoDTO
    {
        public int BookingId { get; set; }
        public int FieldId { get; set; }
        public string FieldName { get; set; } = string.Empty;
        public string FieldType { get; set; } = string.Empty;
        public string FieldSize { get; set; } = string.Empty;
        public string FieldComplexName { get; set; } = string.Empty;
        public string FieldAddress { get; set; } = string.Empty;
        public DateTime MatchDate { get; set; }
        public string TimeSlot { get; set; } = string.Empty;
        public decimal TotalPrice { get; set; }
        public string BookingStatus { get; set; } = string.Empty;
    }
}
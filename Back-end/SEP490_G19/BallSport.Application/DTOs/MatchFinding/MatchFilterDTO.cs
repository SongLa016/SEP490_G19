namespace BallSport.Application.DTOs.MatchFinding
{
    public class MatchFilterDTO
    {
        public string? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public int? FieldId { get; set; }
        public string? FieldType { get; set; }
    }
}
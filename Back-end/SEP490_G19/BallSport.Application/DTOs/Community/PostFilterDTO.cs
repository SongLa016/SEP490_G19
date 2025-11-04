namespace BallSport.Application.DTOs.Community
{
    public class PostFilterDTO
    {
        public string? Status { get; set; } = "Active";
        public int? FieldId { get; set; }
        public int? UserId { get; set; }
    }
}
namespace BallSport.Application.DTOs
{
    public class DepositPolicyDTO
    {
        public int DepositPolicyId { get; set; }
        public int FieldId { get; set; }
        public string? FieldName { get; set; }
        public decimal DepositPercent { get; set; }
        public decimal? MinDeposit { get; set; }
        public decimal? MaxDeposit { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}

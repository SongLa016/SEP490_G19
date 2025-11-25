// 11. MatchSuccessResponseDto.cs
namespace BallSport.Application.DTOs.MatchFinding
{
    public class MatchSuccessResponseDto
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = "GHÉP ĐỘI THÀNH CÔNG! CHÚC HAI ĐỘI ĐÁ VUI!";
        public MatchSuccessData Data { get; set; } = new();
    }
}
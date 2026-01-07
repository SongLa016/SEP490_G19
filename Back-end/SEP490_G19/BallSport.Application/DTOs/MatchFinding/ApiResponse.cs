// 1. ApiResponse.cs
namespace BallSport.Application.DTOs.MatchFinding
{
    public class ApiResponse<T>
    {
        public bool Success { get; set; } = true;
        public string Message { get; set; } = "Thành công";
        public T? Data { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.Now;

        public static ApiResponse<T> Ok(T data, string message = "Thành công")
            => new() { Data = data, Message = message };

        public static ApiResponse<T> Fail(string message)
            => new() { Success = false, Message = message };
    }
}
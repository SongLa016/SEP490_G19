// 2. PagedResponse.cs
namespace BallSport.Application.DTOs.MatchFinding
{
    public class PagedResponse<T>
    {
        public List<T> Content { get; set; } = new();
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
        public long TotalElements { get; set; }
        public int TotalPages { get; set; }
        public bool HasNext => PageNumber < TotalPages;
        public bool HasPrevious => PageNumber > 1;
    }
}
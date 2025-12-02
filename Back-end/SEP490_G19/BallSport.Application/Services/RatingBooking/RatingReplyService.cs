using BallSport.Application.DTOs.RatingBooking;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories.RatingBooking;
using RatingReplyDto = BallSport.Application.DTOs.RatingBooking.RatingReplyDto;

public class RatingReplyService
{
    private readonly RatingReplyRepository _replyRepo;

    public RatingReplyService(RatingReplyRepository replyRepo)
    {
        _replyRepo = replyRepo;
    }

    // Thêm reply
    public async Task<bool> AddReplyAsync(int userId, CreateReplyRequest request)
    {
        // Lấy rating từ repository
        var rating = await _replyRepo.GetRatingByIdAsync(request.RatingId);
        if (rating == null)
            throw new Exception("Rating không tồn tại.");

        int fieldId = rating.FieldId;

        // Kiểm tra user đã từng booking sân chưa
        bool hasBooked = await _replyRepo.HasUserBookedFieldAsync(userId, fieldId);
        if (!hasBooked)
            throw new Exception("Bạn phải từng đặt sân này mới được phản hồi.");

        var reply = new RatingReply
        {
            RatingId = request.RatingId,
            UserId = userId,
            ReplyText = request.ReplyText,
            CreatedAt = DateTime.Now
        };

        await _replyRepo.AddReplyAsync(reply);
        return true;
    }

    // Lấy danh sách reply theo Rating
    public async Task<List<RatingReplyDto>> GetRepliesAsync(int ratingId)
    {
        var replies = await _replyRepo.GetRepliesByRatingIdAsync(ratingId);

        return replies.Select(r => new RatingReplyDto
        {
            RatingId = r.RatingId,
            ReplyId = r.ReplyId,
            UserId = r.UserId,
            UserName = r.User.FullName,
            ReplyText = r.ReplyText,
            CreatedAt = r.CreatedAt
        }).ToList();
    }

    // Cập nhật reply
    public async Task<bool> UpdateReplyAsync(int replyId, string text)
    {
        return await _replyRepo.UpdateReplyAsync(replyId, text);
    }

    // Xóa reply
    public async Task<bool> DeleteReplyAsync(int replyId)
    {
        return await _replyRepo.DeleteReplyAsync(replyId);
    }
}

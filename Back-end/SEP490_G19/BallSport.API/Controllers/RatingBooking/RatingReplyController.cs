using BallSport.Application.DTOs.RatingBooking;
using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
public class RatingReplyController : ControllerBase
{
    private readonly RatingReplyService _service;

    public RatingReplyController(RatingReplyService service)
    {
        _service = service;
    }

    // POST: thêm phản hồi
    [HttpPost("{userId}/add")]
    public async Task<IActionResult> AddReply(int userId, [FromBody] CreateReplyRequest request)
    {
        var result = await _service.AddReplyAsync(userId, request);
        return result ? Ok("Reply added successfully") : BadRequest("Failed to add reply");
    }

    // GET: lấy reply theo ratingId
    [HttpGet("{ratingId}/list")]
    public async Task<IActionResult> GetReplies(int ratingId)
    {
        var replies = await _service.GetRepliesAsync(ratingId);
        return Ok(replies);
    }

    // PUT: cập nhật reply
    [HttpPut("{replyId}/update")]
    public async Task<IActionResult> UpdateReply(int replyId, [FromBody] UpdateReplyRequest request)
    {
        var result = await _service.UpdateReplyAsync(replyId, request.ReplyText);
        return result ? Ok("Reply updated") : NotFound("Reply not found");
    }

    // DELETE: xóa reply
    [HttpDelete("{replyId}/delete")]
    public async Task<IActionResult> DeleteReply(int replyId)
    {
        var result = await _service.DeleteReplyAsync(replyId);
        return result ? Ok("Reply deleted") : NotFound("Reply not found");
    }
}

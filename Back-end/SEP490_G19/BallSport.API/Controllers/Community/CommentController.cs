// File: BallSport.API/Controllers/Community/CommentController.cs
using BallSport.Application.DTOs.Community;
using BallSport.Application.Services.Community;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BallSport.API.Controllers.Community
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class CommentController : ControllerBase
    {
        private readonly ICommentService _commentService;

        public CommentController(ICommentService commentService)
        {
            _commentService = commentService;
        }

        private int? CurrentUserId => GetCurrentUserId();

        // ==================== GET ====================

        [HttpGet("post/{postId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCommentsByPost(int postId)
            => Ok(new { success = true, data = await _commentService.GetCommentsByPostIdAsync(postId) });

        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCommentById(int id)
        {
            var comment = await _commentService.GetCommentByIdAsync(id);
            return comment is null
                ? NotFound(new { success = false, message = "Không tìm thấy bình luận" })
                : Ok(new { success = true, data = comment });
        }

        [HttpGet("{commentId}/replies")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReplies(int commentId)
            => Ok(new { success = true, data = await _commentService.GetRepliesByCommentIdAsync(commentId) });

        [HttpGet("user/{userId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCommentsByUser(int userId)
            => Ok(new { success = true, data = await _commentService.GetCommentsByUserIdAsync(userId) });

        [HttpGet("post/{postId}/count")]
        [AllowAnonymous]
        public async Task<IActionResult> CountCommentsByPost(int postId)
            => Ok(new { success = true, data = new { postId, commentCount = await _commentService.CountCommentsByPostIdAsync(postId) } });

        // ==================== POST ====================

        [HttpPost]
        public async Task<IActionResult> CreateComment([FromBody] CreateCommentDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

            if (!CurrentUserId.HasValue)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            try
            {
                var comment = await _commentService.CreateCommentAsync(dto, CurrentUserId.Value);

                var message = dto.ParentCommentId.HasValue
                    ? "Trả lời bình luận thành công!"
                    : "Bình luận thành công!";

                return CreatedAtAction(
                    nameof(GetCommentById),
                    new { id = comment.CommentId },
                    new { success = true, message, data = comment }
                );
            }
            catch (Exception ex) when (ex.Message.Contains("không tồn tại"))
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // ==================== PUT ====================

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateComment(int id, [FromBody] UpdateCommentDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

            if (!CurrentUserId.HasValue)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var comment = await _commentService.UpdateCommentAsync(id, dto, CurrentUserId.Value);

            return comment is null
                ? NotFound(new { success = false, message = "Không tìm thấy bình luận hoặc bạn không có quyền chỉnh sửa" })
                : Ok(new { success = true, message = "Cập nhật bình luận thành công!", data = comment });
        }

        // ==================== DELETE ====================

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComment(int id)
        {
            if (!CurrentUserId.HasValue)
                return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var isAdmin = User.IsInRole("Admin");
            var success = await _commentService.DeleteCommentAsync(id, CurrentUserId.Value, isAdmin);

            return success
                ? Ok(new { success = true, message = "Xóa bình luận thành công!" })
                : NotFound(new { success = false, message = "Không tìm thấy bình luận hoặc bạn không có quyền xóa" });
        }

        // ==================== HELPER ====================

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst("UserID") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            return int.TryParse(claim?.Value, out int userId) ? userId : null;
        }
    }
}
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

        // GET: api/Comment/post/5
        [HttpGet("post/{postId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCommentsByPost(int postId)
        {
            try
            {
                var comments = await _commentService.GetCommentsByPostIdAsync(postId);
                return Ok(new { success = true, data = comments });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Comment/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCommentById(int id)
        {
            try
            {
                var comment = await _commentService.GetCommentByIdAsync(id);

                if (comment == null)
                    return NotFound(new { success = false, message = "Không tìm thấy bình luận" });

                return Ok(new { success = true, data = comment });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Comment/5/replies
        [HttpGet("{commentId}/replies")]
        [AllowAnonymous]
        public async Task<IActionResult> GetReplies(int commentId)
        {
            try
            {
                var replies = await _commentService.GetRepliesByCommentIdAsync(commentId);
                return Ok(new { success = true, data = replies });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Comment/user/5
        [HttpGet("user/{userId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetCommentsByUser(int userId)
        {
            try
            {
                var comments = await _commentService.GetCommentsByUserIdAsync(userId);
                return Ok(new { success = true, data = comments });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Comment/post/5/count
        [HttpGet("post/{postId}/count")]
        [AllowAnonymous]
        public async Task<IActionResult> CountCommentsByPost(int postId)
        {
            try
            {
                var count = await _commentService.CountCommentsByPostIdAsync(postId);
                return Ok(new { success = true, data = new { postId, commentCount = count } });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // POST: api/Comment
        [HttpPost]
        public async Task<IActionResult> CreateComment([FromBody] CreateCommentDTO createCommentDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var comment = await _commentService.CreateCommentAsync(createCommentDto, userId.Value);

                return CreatedAtAction(nameof(GetCommentById), new { id = comment.CommentId }, new
                {
                    success = true,
                    message = createCommentDto.ParentCommentId.HasValue ? "Trả lời bình luận thành công" : "Bình luận thành công",
                    data = comment
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        // PUT: api/Comment/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateComment(int id, [FromBody] UpdateCommentDTO updateCommentDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var comment = await _commentService.UpdateCommentAsync(id, updateCommentDto, userId.Value);

                if (comment == null)
                    return NotFound(new { success = false, message = "Không tìm thấy bình luận hoặc bạn không có quyền chỉnh sửa" });

                return Ok(new { success = true, message = "Cập nhật bình luận thành công", data = comment });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // DELETE: api/Comment/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteComment(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var isAdmin = User.IsInRole("Admin");

                var success = await _commentService.DeleteCommentAsync(id, userId.Value, isAdmin);

                if (!success)
                    return NotFound(new { success = false, message = "Không tìm thấy bình luận hoặc bạn không có quyền xóa" });

                return Ok(new { success = true, message = "Xóa bình luận thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // Helper method
        private int? GetCurrentUserId()
        {
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(userIdClaim, out int userId))
            {
                return userId;
            }
            return null;
        }
    }
}
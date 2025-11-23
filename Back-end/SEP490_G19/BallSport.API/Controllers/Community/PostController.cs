// File: BallSport.API/Controllers/Community/PostController.cs
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
    public class PostController : ControllerBase
    {
        private readonly IPostService _postService;

        public PostController(IPostService postService)
        {
            _postService = postService;
        }

        private int? GetCurrentUserId()
        {
            var claim = User.FindFirst("UserID") ?? User.FindFirst(ClaimTypes.NameIdentifier);
            return int.TryParse(claim?.Value, out int userId) ? userId : null;
        }

        private bool IsAdmin => User.IsInRole("Admin");

        // GET: api/Post
        [HttpGet]
        [AllowAnonymous]
        public async Task<IActionResult> GetPosts(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = "Active",
            [FromQuery] int? fieldId = null,
            [FromQuery] int? userId = null)
        {
            var filter = new PostFilterDTO
            {
                Status = status,
                FieldId = fieldId,
                UserId = userId
            };

            var (posts, totalCount) = await _postService.GetAllPostsAsync(pageNumber, pageSize, filter);

            return Ok(new
            {
                success = true,
                data = posts,
                pagination = new
                {
                    currentPage = pageNumber,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }
            });
        }

        // GET: api/Post/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetPostById(int id)
        {
            var currentUserId = GetCurrentUserId();
            var post = await _postService.GetPostByIdAsync(id, currentUserId);

            if (post == null)
                return NotFound(new { success = false, message = "Không tìm thấy bài viết" });

            // ẨN HOÀN TOÀN nếu đang Pending/Rejected mà không phải chủ hoặc admin
            if ((post.IsPending || post.IsRejected) && !post.IsOwner && !IsAdmin)
                return NotFound(new { success = false, message = "Không tìm thấy bài viết" });

            return Ok(new { success = true, data = post });
        }

        // GET: api/Post/trending
        [HttpGet("trending")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTrendingPosts([FromQuery] int topCount = 10)
        {
            var posts = await _postService.GetTrendingPostsAsync(topCount);
            return Ok(new { success = true, data = posts });
        }

        // GET: api/Post/newsfeed
        [HttpGet("newsfeed")]
        public async Task<IActionResult> GetNewsFeed([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

            var (posts, totalCount) = await _postService.GetNewsFeedAsync(userId.Value, pageNumber, pageSize);

            return Ok(new
            {
                success = true,
                data = posts,
                pagination = new
                {
                    currentPage = pageNumber,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }
            });
        }

        // GET: api/Post/search
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchPosts([FromQuery] string keyword, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            if (string.IsNullOrWhiteSpace(keyword))
                return BadRequest(new { success = false, message = "Từ khóa không được để trống" });

            var (posts, totalCount) = await _postService.SearchPostsAsync(keyword, pageNumber, pageSize);

            return Ok(new
            {
                success = true,
                data = posts,
                pagination = new
                {
                    currentPage = pageNumber,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }
            });
        }

        // GET: api/Post/user/{userId}
        [HttpGet("user/{userId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPostsByUser(int userId)
        {
            var posts = await _postService.GetPostsByUserIdAsync(userId);
            return Ok(new { success = true, data = posts });
        }

        // GET: api/Post/field/{fieldId}
        [HttpGet("field/{fieldId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPostsByField(int fieldId)
        {
            var posts = await _postService.GetPostsByFieldIdAsync(fieldId);
            return Ok(new { success = true, data = posts });
        }

        // POST: api/Post
        [HttpPost]
        public async Task<IActionResult> CreatePost([FromForm] CreatePostDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized();

            var post = await _postService.CreatePostAsync(dto, userId.Value);

            return CreatedAtAction(nameof(GetPostById), new { id = post.PostId }, new
            {
                success = true,
                message = "Tạo bài viết thành công! Đang chờ duyệt...",
                data = post
            });
        }

        
        // PUT: api/Post/{id} → CHO PHÉP UP ẢNH KHI SỬA
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePost(int id, [FromForm] UpdatePostDTO dto)
        {
            if (!ModelState.IsValid)
                return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized();

            var post = await _postService.UpdatePostAsync(id, dto, userId.Value);
            if (post == null)
                return NotFound(new { success = false, message = "Không tìm thấy bài viết hoặc bạn không có quyền chỉnh sửa" });

            return Ok(new { success = true, message = "Cập nhật bài viết thành công", data = post });
        }

        // DELETE: api/Post/{id}/mine → User tự xóa (xóa thật)
        [HttpDelete("{id}/mine")]
        public async Task<IActionResult> DeleteMyPost(int id)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized();

            var success = await _postService.DeleteMyPostAsync(id, userId.Value);
            if (!success)
                return NotFound(new { success = false, message = "Không tìm thấy bài viết hoặc bạn không có quyền xóa" });

            return Ok(new { success = true, message = "Đã xóa bài viết của bạn vĩnh viễn" });
        }

        // DELETE: api/Post/{id} → Admin xóa bất kỳ bài nào (xóa thật)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePostByAdmin(int id)
        {
            var success = await _postService.DeletePostByAdminAsync(id);
            if (!success)
                return NotFound(new { success = false, message = "Không tìm thấy bài viết" });

            return Ok(new { success = true, message = "Đã xóa bài viết vĩnh viễn (Admin)" });
        }

        // POST: api/Post/{id}/like
        [HttpPost("{id}/like")]
        public async Task<IActionResult> LikePost(int id)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized();

            var success = await _postService.LikePostAsync(id, userId.Value);
            if (!success) return BadRequest(new { success = false, message = "Bạn đã thích bài này rồi" });

            return Ok(new { success = true, message = "Đã thích bài viết" });
        }

        // DELETE: api/Post/{id}/like
        [HttpDelete("{id}/like")]
        public async Task<IActionResult> UnlikePost(int id)
        {
            var userId = GetCurrentUserId();
            if (!userId.HasValue) return Unauthorized();

            await _postService.UnlikePostAsync(id, userId.Value);
            return Ok(new { success = true, message = "Đã bỏ thích" });
        }

        // ADMIN: DUYỆT BÀI (Pending → Active / Rejected)
        [HttpPut("{id}/review")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ReviewPost(int id, [FromBody] ReviewPostRequest request)
        {
            if (!new[] { "Active", "Rejected" }.Contains(request.Status))
                return BadRequest(new { success = false, message = "Status phải là Active hoặc Rejected" });

            var success = await _postService.ReviewPostAsync(id, request.Status);
            if (!success) return NotFound(new { success = false, message = "Không tìm thấy bài viết" });

            var msg = request.Status == "Active" ? "đã được duyệt" : "đã bị từ chối";
            return Ok(new { success = true, message = $"Bài viết {msg}" });
        }

        // ADMIN: LẤY DANH SÁCH BÀI ĐANG CHỜ DUYỆT
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingPosts([FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20)
        {
            var (posts, totalCount) = await _postService.GetPendingPostsAsync(pageNumber, pageSize);

            return Ok(new
            {
                success = true,
                data = posts,
                pagination = new
                {
                    currentPage = pageNumber,
                    pageSize,
                    totalCount,
                    totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                }
            });
        }
    }

    // Request DTO nhỏ gọn
    public class ReviewPostRequest
    {
        public string Status { get; set; } = string.Empty; // "Active" | "Rejected"
    }
}
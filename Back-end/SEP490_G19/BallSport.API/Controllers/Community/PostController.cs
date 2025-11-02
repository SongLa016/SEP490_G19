using BallSport.Application.DTOs.Community;
using BallSport.Application.Services.Community;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace BallSport.API.Controllers.Community
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // Yêu cầu đăng nhập cho tất cả endpoints
    public class PostController : ControllerBase
    {
        private readonly IPostService _postService;

        public PostController(IPostService postService)
        {
            _postService = postService;
        }

        // GET: api/Post?pageNumber=1&pageSize=10&status=Active&fieldId=5
        [HttpGet]
        [AllowAnonymous] // Cho phép xem bài viết không cần đăng nhập
        public async Task<IActionResult> GetPosts(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10,
            [FromQuery] string? status = "Active",
            [FromQuery] int? fieldId = null,
            [FromQuery] int? userId = null)
        {
            try
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
                        pageSize = pageSize,
                        totalCount = totalCount,
                        totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Post/5
        [HttpGet("{id}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPostById(int id)
        {
            try
            {
                var currentUserId = GetCurrentUserId();
                var post = await _postService.GetPostByIdAsync(id, currentUserId);

                if (post == null)
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết" });

                return Ok(new { success = true, data = post });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Post/trending?topCount=10
        [HttpGet("trending")]
        [AllowAnonymous]
        public async Task<IActionResult> GetTrendingPosts([FromQuery] int topCount = 10)
        {
            try
            {
                var posts = await _postService.GetTrendingPostsAsync(topCount);
                return Ok(new { success = true, data = posts });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Post/newsfeed?pageNumber=1&pageSize=10
        [HttpGet("newsfeed")]
        public async Task<IActionResult> GetNewsFeed(
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var (posts, totalCount) = await _postService.GetNewsFeedAsync(userId.Value, pageNumber, pageSize);

                return Ok(new
                {
                    success = true,
                    data = posts,
                    pagination = new
                    {
                        currentPage = pageNumber,
                        pageSize = pageSize,
                        totalCount = totalCount,
                        totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Post/search?keyword=bóng đá&pageNumber=1&pageSize=10
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<IActionResult> SearchPosts(
            [FromQuery] string keyword,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 10)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(keyword))
                    return BadRequest(new { success = false, message = "Từ khóa tìm kiếm không được để trống" });

                var (posts, totalCount) = await _postService.SearchPostsAsync(keyword, pageNumber, pageSize);

                return Ok(new
                {
                    success = true,
                    data = posts,
                    pagination = new
                    {
                        currentPage = pageNumber,
                        pageSize = pageSize,
                        totalCount = totalCount,
                        totalPages = (int)Math.Ceiling(totalCount / (double)pageSize)
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Post/user/5
        [HttpGet("user/{userId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPostsByUser(int userId)
        {
            try
            {
                var posts = await _postService.GetPostsByUserIdAsync(userId);
                return Ok(new { success = true, data = posts });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // GET: api/Post/field/5
        [HttpGet("field/{fieldId}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetPostsByField(int fieldId)
        {
            try
            {
                var posts = await _postService.GetPostsByFieldIdAsync(fieldId);
                return Ok(new { success = true, data = posts });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // POST: api/Post
        [HttpPost]
        public async Task<IActionResult> CreatePost([FromBody] CreatePostDTO createPostDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var post = await _postService.CreatePostAsync(createPostDto, userId.Value);

                return CreatedAtAction(nameof(GetPostById), new { id = post.PostId }, new
                {
                    success = true,
                    message = "Tạo bài viết thành công",
                    data = post
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // PUT: api/Post/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePost(int id, [FromBody] UpdatePostDTO updatePostDto)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(new { success = false, message = "Dữ liệu không hợp lệ", errors = ModelState });

                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var post = await _postService.UpdatePostAsync(id, updatePostDto, userId.Value);

                if (post == null)
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết hoặc bạn không có quyền chỉnh sửa" });

                return Ok(new { success = true, message = "Cập nhật bài viết thành công", data = post });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // DELETE: api/Post/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePost(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                // Kiểm tra xem user có role Admin không
                var isAdmin = User.IsInRole("Admin");

                var success = await _postService.DeletePostAsync(id, userId.Value, isAdmin);

                if (!success)
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết hoặc bạn không có quyền xóa" });

                return Ok(new { success = true, message = "Xóa bài viết thành công" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // POST: api/Post/5/like
        [HttpPost("{id}/like")]
        public async Task<IActionResult> LikePost(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var success = await _postService.LikePostAsync(id, userId.Value);

                if (!success)
                    return BadRequest(new { success = false, message = "Bạn đã thích bài viết này rồi" });

                return Ok(new { success = true, message = "Đã thích bài viết" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // DELETE: api/Post/5/unlike
        [HttpDelete("{id}/unlike")]
        public async Task<IActionResult> UnlikePost(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                if (userId == null)
                    return Unauthorized(new { success = false, message = "Vui lòng đăng nhập" });

                var success = await _postService.UnlikePostAsync(id, userId.Value);

                if (!success)
                    return BadRequest(new { success = false, message = "Bạn chưa thích bài viết này" });

                return Ok(new { success = true, message = "Đã bỏ thích bài viết" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // PUT: api/Post/5/toggle-visibility
        [HttpPut("{id}/toggle-visibility")]
        [Authorize(Roles = "Admin")] // Chỉ Admin mới có quyền
        public async Task<IActionResult> TogglePostVisibility(int id, [FromBody] string status)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(status) ||
                    (status != "Active" && status != "Hidden" && status != "Deleted"))
                {
                    return BadRequest(new { success = false, message = "Status phải là Active, Hidden hoặc Deleted" });
                }

                var success = await _postService.TogglePostVisibilityAsync(id, status);

                if (!success)
                    return NotFound(new { success = false, message = "Không tìm thấy bài viết" });

                return Ok(new { success = true, message = $"Đã cập nhật trạng thái bài viết thành {status}" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Lỗi server", error = ex.Message });
            }
        }

        // Helper method để lấy UserID từ JWT token
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
using BallSport.Application.DTOs;
using BallSport.Application.Services;
using BallSport.Infrastructure.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

[Route("api/[controller]")]
[ApiController]
public class FavoriteFieldsController : ControllerBase
{
    private readonly IFavoriteFieldService _service;

    public FavoriteFieldsController(IFavoriteFieldService service)
    {
        _service = service;
    }

    private int GetUserId()
    {
        return int.Parse(User.FindFirst("UserID")!.Value);
    }

    // ADD Favorite
    [HttpPost]
    [Authorize(Roles = "Player")]
    public async Task<IActionResult> AddFavorite([FromBody] AddFavoriteFieldDto request)
    {
        int userId = GetUserId();

        var result = await _service.AddFavoriteAsync(userId, request.FieldId);
        if (result == null)
            return BadRequest(new { message = "Field not found or already in favorites" });

        return Ok(result);
    }

    // GET List Favorites
    [HttpGet]
    [Authorize(Roles = "Player")]
    public async Task<IActionResult> GetFavorites()
    {
        int userId = GetUserId();
        var favorites = await _service.GetFavoritesAsync(userId);
        return Ok(favorites);
    }

    // DELETE Favorite
    [HttpDelete("{fieldId}")]
    [Authorize(Roles = "Player")]
    public async Task<IActionResult> DeleteFavorite(int fieldId)
    {
        int userId = GetUserId();

        bool deleted = await _service.DeleteFavoriteAsync(userId, fieldId);
        if (!deleted)
            return NotFound(new { message = "Favorite not found" });

        return Ok(new { message = "Removed from favorites" });
    }

    // CHECK IsFavorite
    [HttpGet("is-favorite/{fieldId}")]
    [Authorize(Roles = "Player")]
    public async Task<IActionResult> IsFavorite(int fieldId)
    {
        int userId = GetUserId();

        bool isFav = await _service.IsFavoriteAsync(userId, fieldId);
        return Ok(new { isFavorite = isFav });
    }
}

using System;
using System.Threading.Tasks;
using BallSport.Application.DTOs;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;

namespace BallSport.Application.Services
{
    public interface IFavoriteFieldService
    {
        Task<FavoriteFieldResponseDto> AddFavoriteAsync(int userId, int fieldId);
        Task<List<FavoriteFieldResponseDto>> GetFavoritesAsync(int userId);
        Task<bool> DeleteFavoriteAsync(int userId, int fieldId);
        Task<bool> IsFavoriteAsync(int userId, int fieldId);
    }

    public class FavoriteFieldService : IFavoriteFieldService
    {
        private readonly IFavoriteFieldRepository _favoriteRepo;
        private readonly Sep490G19v1Context _context;

        public FavoriteFieldService(
            IFavoriteFieldRepository favoriteRepo,
            Sep490G19v1Context context)
        {
            _favoriteRepo = favoriteRepo;
            _context = context;
        }

        public async Task<FavoriteFieldResponseDto?> AddFavoriteAsync(int userId, int fieldId)
        {
            var field = await _context.Fields.FindAsync(fieldId);
            if (field == null) return null;

            var exists = await _favoriteRepo.GetByUserAndFieldAsync(userId, fieldId);
            if (exists != null) return null;

            var favorite = new FavoriteField
            {
                UserId = userId,
                FieldId = fieldId,
                ComplexId = field.ComplexId ?? 0,
                CreatedAt = DateTime.UtcNow
            };

            var saved = await _favoriteRepo.AddAsync(favorite);

            return new FavoriteFieldResponseDto
            {
                UserId = saved.UserId,
                FieldId = saved.FieldId,
                ComplexId = saved.ComplexId,
                CreatedAt = saved.CreatedAt
            };
        }

        public async Task<bool> DeleteFavoriteAsync(int userId, int fieldId)
        {
            var fav = await _favoriteRepo.GetByUserAndFieldAsync(userId, fieldId);
            if (fav == null) return false;

            return await _favoriteRepo.DeleteAsync(fav);
        }

        public async Task<List<FavoriteFieldResponseDto>> GetFavoritesAsync(int userId)
        {
            var favorites = await _favoriteRepo.GetFavoritesByUserAsync(userId);

            return favorites.Select(f => new FavoriteFieldResponseDto
            {
                UserId = f.UserId,
                FieldId = f.FieldId,
                ComplexId = f.ComplexId,
                CreatedAt = f.CreatedAt
            }).ToList();
        }

        public async Task<bool> IsFavoriteAsync(int userId, int fieldId)
        {
            var fav = await _favoriteRepo.GetByUserAndFieldAsync(userId, fieldId);
            return fav != null;
        }
    }
}

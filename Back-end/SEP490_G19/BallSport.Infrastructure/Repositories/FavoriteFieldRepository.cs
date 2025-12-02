using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories
{
    public interface IFavoriteFieldRepository
    {
        Task<FavoriteField?> GetByUserAndFieldAsync(int userId, int fieldId);
        Task<List<FavoriteField>> GetFavoritesByUserAsync(int userId);
        Task<bool> DeleteAsync(FavoriteField favorite);
        Task<FavoriteField> AddAsync(FavoriteField favorite);
    }
    public class FavoriteFieldRepository : IFavoriteFieldRepository
    {
        private readonly Sep490G19v1Context _context;

        public FavoriteFieldRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task<FavoriteField> AddAsync(FavoriteField favorite)
        {
            _context.FavoriteFields.Add(favorite);
            await _context.SaveChangesAsync();
            return favorite;
        }

        public async Task<bool> DeleteAsync(FavoriteField favorite)
        {
            _context.FavoriteFields.Remove(favorite);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<FavoriteField?> GetByUserAndFieldAsync(int userId, int fieldId)
        {
            return await _context.FavoriteFields
            .FirstOrDefaultAsync(f => f.UserId == userId && f.FieldId == fieldId);
        }

        public async Task<List<FavoriteField>> GetFavoritesByUserAsync(int userId)
        {
            return await _context.FavoriteFields
            .Include(f => f.Field)
            .Where(f => f.UserId == userId)
            .OrderByDescending(f => f.CreatedAt)
            .ToListAsync();
        }
    }

}

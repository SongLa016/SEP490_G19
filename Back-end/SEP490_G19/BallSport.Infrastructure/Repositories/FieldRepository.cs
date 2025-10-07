using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories
{
    public class FieldRepository
    {
        private readonly Sep490G19v1Context _context;

        public FieldRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        // CREATE
        public async Task<Field> AddFieldAsync(Field field)
        {
            _context.Fields.Add(field);
            await _context.SaveChangesAsync();
            return field;
        }

        // Lấy tất cả sân trong khu sân
        public async Task<List<Field>> GetFieldsByComplexIdAsync(int complexId)
        {
            return await _context.Fields
                .Where(f => f.ComplexId == complexId)
                .Include(f => f.Type)
                .Include(f => f.Complex)
                .ToListAsync();
        }

        //  Lấy 1 sân theo ID
        public async Task<Field?> GetFieldByIdAsync(int fieldId)
        {
            return await _context.Fields
                .Include(f => f.Type)
                .Include(f => f.Complex)
                .FirstOrDefaultAsync(f => f.FieldId == fieldId);
        }

        // UPDATE
        public async Task<Field> UpdateFieldAsync(Field field)
        {
            _context.Fields.Update(field);
            await _context.SaveChangesAsync();
            return field;
        }

        // DELETE
        public async Task<bool> DeleteFieldAsync(int fieldId)
        {
            var field = await _context.Fields.FindAsync(fieldId);
            if (field == null) return false;

            _context.Fields.Remove(field);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}

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

        public async Task<Field> AddFieldAsync(Field field)
        {
            _context.Fields.Add(field);
            await _context.SaveChangesAsync();
            return field;
        }

        public async Task<List<Field>> GetFieldsByComplexIdAsync(int complexId)
        {
            return await _context.Fields
                .Where(f => f.ComplexId == complexId)
                .ToListAsync();
        }

        public async Task<Field?> GetFieldByIdAsync(int fieldId)
        {
            return await _context.Fields
                .Include(f => f.Type)
                .Include(f => f.Complex)
                .FirstOrDefaultAsync(f => f.FieldId == fieldId);
        }
    }
}

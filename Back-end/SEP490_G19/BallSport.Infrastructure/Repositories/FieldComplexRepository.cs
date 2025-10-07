
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace BallSport.Infrastructure.Repositories
{
    public class FieldComplexRepository
    {
        private readonly Sep490G19v1Context _context;
        public FieldComplexRepository(Sep490G19v1Context context)
        {
            _context = context;
        }
        public async Task<FieldComplex> AddComplexAsync(FieldComplex complex)
        {
            _context.FieldComplexes.Add(complex);
            await _context.SaveChangesAsync();
            return complex;
        }

        public async Task<FieldComplex?> GetComplexByIdAsync(int complexId)
        {
            return await _context.FieldComplexes
                .Include(fc => fc.Fields)
                .FirstOrDefaultAsync(fc => fc.ComplexId == complexId);
        }

        public async Task<List<FieldComplex>> GetAllComplexesAsync()
        {
            return await _context.FieldComplexes
                .Include(fc => fc.Fields)
                .ToListAsync();
        }
    }
}

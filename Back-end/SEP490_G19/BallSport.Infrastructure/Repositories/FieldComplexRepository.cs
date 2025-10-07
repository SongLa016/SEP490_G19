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

        // Thêm khu sân mới
        public async Task<FieldComplex> AddComplexAsync(FieldComplex complex)
        {
            _context.FieldComplexes.Add(complex);
            await _context.SaveChangesAsync();
            return complex;
        }

        //  Lấy 1 khu sân theo ID
        public async Task<FieldComplex?> GetComplexByIdAsync(int complexId)
        {
            return await _context.FieldComplexes
                .Include(fc => fc.Fields)
                .FirstOrDefaultAsync(fc => fc.ComplexId == complexId);
        }

        // Lấy tất cả khu sân
        public async Task<List<FieldComplex>> GetAllComplexesAsync()
        {
            return await _context.FieldComplexes
                .Include(fc => fc.Fields)
                .ToListAsync();
        }

        // UPDATE 
        public async Task<FieldComplex?> UpdateComplexAsync(FieldComplex complex)
        {
            var existing = await _context.FieldComplexes.FindAsync(complex.ComplexId);
            if (existing == null) return null;

            existing.Name = complex.Name;
            existing.Address = complex.Address;
            existing.OwnerId = complex.OwnerId;
            existing.Description = complex.Description;

            _context.FieldComplexes.Update(existing);
            await _context.SaveChangesAsync();
            return existing;
        }

        // DELETE 
        public async Task<bool> DeleteComplexAsync(int complexId)
        {
            var existing = await _context.FieldComplexes.FindAsync(complexId);
            if (existing == null) return false;

            _context.FieldComplexes.Remove(existing);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}

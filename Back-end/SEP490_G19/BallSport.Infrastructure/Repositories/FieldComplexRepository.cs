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

        // 🟢 THÊM KHU SÂN
        public async Task<FieldComplex> AddComplexAsync(FieldComplex complex)
        {
            _context.FieldComplexes.Add(complex);
            await _context.SaveChangesAsync();
            return complex;
        }

        // 🟢 LẤY 1 KHU SÂN THEO ID ✅ (ĐÃ FIX)
        public async Task<FieldComplex?> GetComplexByIdAsync(int complexId)
        {
            return await _context.FieldComplexes
                .FirstOrDefaultAsync(fc => fc.ComplexId == complexId);
        }

        // 🟢 LẤY TẤT CẢ KHU SÂN
        public async Task<List<FieldComplex>> GetAllComplexesAsync()
        {
            return await _context.FieldComplexes.ToListAsync();
        }

        // 🟢 CẬP NHẬT KHU SÂN ✅ (ĐÃ FIX LƯU TỌA ĐỘ)
        public async Task<FieldComplex?> UpdateComplexAsync(FieldComplex complex)
        {
            var existing = await _context.FieldComplexes.FindAsync(complex.ComplexId);
            if (existing == null) return null;

            existing.Name = complex.Name;
            existing.Address = complex.Address;
            existing.OwnerId = complex.OwnerId;
            existing.Description = complex.Description;
            existing.Status = complex.Status;
            existing.ImageUrl = complex.ImageUrl;

            // ✅ QUAN TRỌNG: LƯU TỌA ĐỘ
            existing.Latitude = complex.Latitude;
            existing.Longitude = complex.Longitude;

            await _context.SaveChangesAsync();
            return existing;
        }

        // 🟢 XÓA KHU SÂN
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

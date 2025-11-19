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

        // 🔹 CREATE Field + lưu main image
        public async Task<Field> AddFieldAsync(Field field)
        {
            _context.Fields.Add(field);
            await _context.SaveChangesAsync();

            // Load lại Field kèm FieldImages để tránh Base64 null
            return await _context.Fields
                .Include(f => f.FieldImages)
                .FirstOrDefaultAsync(f => f.FieldId == field.FieldId)
                ?? field;
        }

        // 🔹 Thêm nhiều ảnh cho Field
        public async Task AddFieldImagesAsync(int fieldId, List<byte[]> images)
        {
            if (images == null || images.Count == 0) return;

            var fieldImages = images.Select(img => new FieldImage
            {
                FieldId = fieldId,
                Image = img
            }).ToList();

            _context.FieldImages.AddRange(fieldImages);
            await _context.SaveChangesAsync();
        }

        // 🔹 Lấy tất cả sân theo ComplexId (include ảnh, type, complex)
        public async Task<List<Field>> GetFieldsByComplexIdAsync(int complexId)
        {
            return await _context.Fields
                .Where(f => f.ComplexId == complexId)
                .Include(f => f.Type)
                .Include(f => f.Complex)
                .Include(f => f.FieldImages)
                .ToListAsync();
        }

        // 🔹 Lấy 1 sân theo ID (include ảnh, type, complex)
        public async Task<Field?> GetFieldByIdAsync(int fieldId)
        {
            return await _context.Fields
                .Include(f => f.Type)
                .Include(f => f.Complex)
                .Include(f => f.FieldImages)
                .FirstOrDefaultAsync(f => f.FieldId == fieldId);
        }

        // 🔹 UPDATE Field + main image
        public async Task<Field> UpdateFieldAsync(Field field)
        {
            _context.Fields.Update(field);
            await _context.SaveChangesAsync();

            // Load lại để đảm bảo navigation properties
            return await _context.Fields
                .Include(f => f.FieldImages)
                .FirstOrDefaultAsync(f => f.FieldId == field.FieldId)
                ?? field;
        }

        // 🔹 DELETE Field (xóa ảnh phụ luôn)
        public async Task<bool> DeleteFieldAsync(int fieldId)
        {
            var field = await _context.Fields
                .Include(f => f.FieldImages)
                .FirstOrDefaultAsync(f => f.FieldId == fieldId);

            if (field == null) return false;

            // Xóa ảnh phụ
            if (field.FieldImages.Any())
            {
                _context.FieldImages.RemoveRange(field.FieldImages);
            }

            // Xóa field
            _context.Fields.Remove(field);

            await _context.SaveChangesAsync();
            return true;
        }


        public async Task<List<Field>> GetFieldsByOwnerIdAsync(int ownerId)
        {
            return await _context.Fields
                .Include(f => f.Type)
                .Include(f => f.Complex)
                .Include(f => f.FieldImages)
                .Where(f => f.Complex.OwnerId == ownerId) 
                .ToListAsync();
        }



    }
}

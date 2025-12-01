 
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

            return await _context.Fields
                .Include(f => f.FieldImages)
                .FirstOrDefaultAsync(f => f.FieldId == field.FieldId)
                ?? field;
        }

        // ADD FIELD IMAGES - URL BASED
        public async Task AddFieldImagesAsync(int fieldId, List<string> imageUrls)
        {
            if (imageUrls == null || imageUrls.Count == 0) return;

            var fieldImages = imageUrls.Select(url => new FieldImage
            {
                FieldId = fieldId,
                ImageUrl = url
            }).ToList();

            _context.FieldImages.AddRange(fieldImages);
            await _context.SaveChangesAsync();
        }

        // GET FIELDS BY COMPLEX
        public async Task<List<Field>> GetFieldsByComplexIdAsync(int complexId)
        {
            return await _context.Fields
                .Where(f => f.ComplexId == complexId)
                .Include(f => f.Type)
                .Include(f => f.Complex)
                .Include(f => f.FieldImages)
                .ToListAsync();
        }

        // GET FIELD BY ID
        public async Task<Field?> GetFieldByIdAsync(int fieldId)
        {
            return await _context.Fields
                .Include(f => f.Type)
                .Include(f => f.Complex)
                .Include(f => f.FieldImages)
                .FirstOrDefaultAsync(f => f.FieldId == fieldId);
        }

        // GET FIELDS BY OWNER
        public async Task<List<Field>> GetFieldsByOwnerIdAsync(int ownerId)
        {
            return await _context.Fields
                .Where(f => f.BankAccount != null && f.BankAccount.OwnerId == ownerId)
                .Include(f => f.FieldImages)
                .ToListAsync();
        }

        // UPDATE
        public async Task<Field> UpdateFieldAsync(Field field)
        {
            _context.Fields.Update(field);
            await _context.SaveChangesAsync();

            return await _context.Fields
                .Include(f => f.FieldImages)
                .FirstOrDefaultAsync(f => f.FieldId == field.FieldId)
                ?? field;
        }

        // DELETE
        public async Task<bool> DeleteFieldAsync(int fieldId)
        {
            var field = await _context.Fields
                .Include(f => f.FieldImages)
                .FirstOrDefaultAsync(f => f.FieldId == fieldId);

            if (field == null) return false;

            if (field.FieldImages.Any())
                _context.FieldImages.RemoveRange(field.FieldImages);

            _context.Fields.Remove(field);

            await _context.SaveChangesAsync();
            return true;
        }
    }
}

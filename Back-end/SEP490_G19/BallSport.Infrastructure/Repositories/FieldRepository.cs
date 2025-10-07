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

        // -------------------------------
        // 1️ Phần loại sân (5,7,9,11 người)
        // -------------------------------

        public async Task<FieldType> AddFieldTypeAsync(FieldType fieldType)
        {
            _context.FieldTypes.Add(fieldType);
            await _context.SaveChangesAsync();
            return fieldType;
        }

        public async Task<FieldType?> GetFieldTypeByIdAsync(int typeId)
        {
            return await _context.FieldTypes
                .FirstOrDefaultAsync(f => f.TypeId == typeId);
        }

        public async Task<List<FieldType>> GetAllFieldTypesAsync()
        {
            return await _context.FieldTypes.ToListAsync();
        }

        // -------------------------------
        // 2️ Phần khu sân lớn (FieldComplex)
        // -------------------------------

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

        // -------------------------------
        // 3 Phần sân nhỏ (Field)
        // -------------------------------

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

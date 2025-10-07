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
    public class FieldTypesRepository
    {
        private readonly Sep490G19v1Context _context;
        public FieldTypesRepository(Sep490G19v1Context context)
        {
            _context = context;
        }
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
    }
}

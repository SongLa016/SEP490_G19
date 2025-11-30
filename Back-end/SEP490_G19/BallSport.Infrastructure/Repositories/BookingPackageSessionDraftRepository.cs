using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Infrastructure.Repositories
{
    public class BookingPackageSessionDraftRepository
    {
        private readonly Sep490G19v1Context _context;

        public BookingPackageSessionDraftRepository(Sep490G19v1Context context)
        {
            _context = context;
        }

        public async Task CreateDraftAsync(BookingPackageSessionDraft draft)
        {
            _context.BookingPackageSessionDrafts.Add(draft);
            await _context.SaveChangesAsync();
        }

       
        public async Task<List<BookingPackageSessionDraft>> GetDraftsByPackageIdAsync(int packageId)
        {
            return await _context.BookingPackageSessionDrafts
                .Where(x => x.BookingPackageId == packageId)
                .ToListAsync();
        }
    }
}

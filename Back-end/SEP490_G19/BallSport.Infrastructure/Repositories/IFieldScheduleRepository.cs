using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.Infrastructure.Models;

namespace BallSport.Infrastructure.Repositories
{
    public interface IFieldScheduleRepository
    {
        Task<FieldSchedule> GetByIdAsync(int scheduleId);
        Task UpdateAsync(FieldSchedule schedule);
        Task SaveChangesAsync();
    }
}

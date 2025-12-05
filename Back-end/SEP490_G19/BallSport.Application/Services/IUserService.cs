using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Application.Services
{
    public interface IUserService
    {
        Task<bool?> ToggleLockUserAsync(int userId);
    }
}

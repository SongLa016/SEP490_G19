using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.Infrastructure.Repositories;

namespace BallSport.Application.Services
{
    public class LockUserService : IUserService
    {
        private readonly IUserRepository _repo;
        public LockUserService(IUserRepository repo)
        {
            _repo = repo;
        }
        public async Task<bool?> ToggleLockUserAsync(int userId)
        {
            var user = await _repo.GetByIdAsync(userId);
            if (user == null) return null;

            bool isNowLocked;
            if (user.Status == "Locked")
            {
                user.Status = "Active"; // mở khóa
                isNowLocked = false;
            }
            else
            {
                user.Status = "Locked"; // khóa
                isNowLocked = true;
            }

            await _repo.UpdateAsync(user);
            return isNowLocked;
        }
    }
}

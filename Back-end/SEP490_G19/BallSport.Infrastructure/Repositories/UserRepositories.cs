using BallSport.Infrastructure.Data;
using BallSport.Infrastructure.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace BallSport.Infrastructure.Repositories
{
    public class UserRepositories
    {
        private readonly Sep490G19v1Context _context;

        public UserRepositories(Sep490G19v1Context context)
        {
            _context = context;
        }

        public User? GetUserByPhone(string phone)
        {
            return _context.Users.FirstOrDefault(u => u.Phone == phone);
        }

       

    }
}

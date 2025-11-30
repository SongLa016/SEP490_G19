using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.Infrastructure.Repositories;

namespace BallSport.Application.Services
{
    public interface IPlayerProfileService
    {
        Task<PlayerProfileDto?> GetProfileByUserIdAsync(int userId);
    }
    public class PlayerProfileService : IPlayerProfileService
    {
        private readonly IPlayerProfileRepository _repository;


        public PlayerProfileService(IPlayerProfileRepository repository)
        {
            _repository = repository;
        }


        public Task<PlayerProfileDto?> GetProfileByUserIdAsync(int userId)
        {
            return _repository.GetProfileByUserIdAsync(userId);
        }
    }
}

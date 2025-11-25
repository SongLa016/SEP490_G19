using BallSport.Infrastructure.Repositories.AdminStatistics;
using static BallSport.Infrastructure.Repositories.AdminStatistics.UserListRepository;

namespace BallSport.Application.Services.AdminStatistics
{
    public interface IUserListService
    {
        Task<List<UserListDto>> GetUsersAsync();
    }

    public class UserListService : IUserListService
    {
        private readonly IUserListRepository _repo;

        public UserListService(IUserListRepository repo)
        {
            _repo = repo;
        }

        public async Task<List<UserListDto>> GetUsersAsync()
        {
            return await _repo.GetAllNonAdminUsersAsync();
        }
    }
}

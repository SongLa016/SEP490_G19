using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.Infrastructure;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using Microsoft.EntityFrameworkCore;



namespace BallSport.Application.Services
{
    public class UserService
    {
        private readonly UserRepositories _userRepository;
        private readonly JwtService _jwtService;


////////////////////////////////////// Login ////////////////////////////////////////////////
        public UserService(UserRepositories userRepository, JwtService jwtService)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
        }

        public bool CheckPassword(string phone, string inputPassword)
        {
            var user = _userRepository.GetUserByPhone(phone);
            if (user == null) return false;
            return inputPassword == user.PasswordHash;
        }

        public string? Login(string phone, string inputPassword)
        {
            var user = _userRepository.GetUserByPhone(phone);
            if (user == null) return null;

            if (CheckPassword(phone, inputPassword))
            {
                
                return _jwtService.GenerateToken(user.UserId, user.Email, user.FullName, user.Phone
                );
            }

            return null;
        }

        ///////////////////////////////////////// Login Google ///////////////////////////////////////////////////


        public User HandleGoogleLogin(string email, string fullName)
        {
            
            var existingUser = _userRepository.GetUserByEmail(email);
            if (existingUser != null)
            {
                return existingUser; 
            }


            var newUser = new User
            {
                Email = email,
                FullName = fullName,
                PasswordHash = _userRepository.GenerateRandomPassword(),
                CreatedAt = DateTime.Now,
                Status = "Active"
            };
            _userRepository.AddUser(newUser);

            var playerRole = _userRepository.GetPlayerRole();
            if (playerRole != null)
            {
                _userRepository.AddUserRole(newUser.UserId, playerRole.RoleId);
            }

            return newUser;
        }





    }
}

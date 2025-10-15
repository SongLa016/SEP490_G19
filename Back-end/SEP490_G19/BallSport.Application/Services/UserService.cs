using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using BallSport.Infrastructure;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using Banking.Application.Services;
using Microsoft.EntityFrameworkCore;



namespace BallSport.Application.Services
{
    public class UserService
    {
        private readonly UserRepositories _userRepository;
        private readonly JwtService _jwtService;
        private readonly EmailService _emailService;
        private readonly OTPService _otpService;

        public UserService(UserRepositories userRepository, JwtService jwtService, EmailService emailService, OTPService otpService)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
            _emailService = emailService;
            _otpService = otpService;
        }





        ////////////////////////////////////// Login ////////////////////////////////////////////////



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

        public string HandleGoogleLogin(string email, string fullName)
        {
           
            var existingUser = _userRepository.GetUserByEmail(email);
            User user = existingUser;
            var randompass = _userRepository.GenerateRandomPassword();

            if (existingUser == null)
            {
                
                var newUser = new User
                {
                    Email = email,
                    FullName = fullName,
                    PasswordHash = randompass,
                    CreatedAt = DateTime.Now,
                    Status = "Active"
                };
                _userRepository.AddUser(newUser);

                
                var playerRole = _userRepository.GetPlayerRole();
                if (playerRole != null)
                {
                    _userRepository.AddUserRole(newUser.UserId, playerRole.RoleId);
                }
                _emailService.SendEmailAsync(
           email,
           "Xác nhận tạo tài khoản BallSport",
           $"<p>Xin chào <b>{fullName}</b>,</p>" +
           $"<p>Quý khách vừa tạo tài khoản bằng Google trên hệ thống BallSport.</p>" +
           $"<p>Mật khẩu tạm thời của bạn là: <b>{randompass}</b></p>" +
           $"<p>Vui lòng đăng nhập và đổi mật khẩu ngay sau khi sử dụng.</p>" +
           $"<p>Trân trọng,<br/>Đội ngũ BallSport</p>"
       );

                user = newUser;
            }

           
            var token = _jwtService.GenerateToken(user.UserId, user.Email, user.FullName, user.Phone);

           
            return token;
        }



        //////////////////////////////// Resert Pass ////////////////////////////////////////////////

        public async Task<User?> SendOtpForForgotPasswordAsync(string email)
        {
            var user = _userRepository.GetUserByEmail(email);
            if (user == null) return null;


            var otp = _userRepository.GenerateOtp();


            _otpService.SaveOtp(email, otp, expireMinutes: 5);


            await _emailService.SendOtpEmailAsync(email, otp);

            return user; 
        }


        public async Task<bool> VerifyOtpAndResetPasswordAsync(string otp)
        {
            
            var email = _otpService.VerifyAndGetEmailByOtp(otp);
            if (email == null) return false; 

            var user = _userRepository.GetUserByEmail(email);
            if (user == null) return false;

         
            var newPassword = _userRepository.GenerateRandomPassword();
            user.PasswordHash = newPassword; 
            _userRepository.UpdateUser(user);

           
            await _emailService.SendEmailAsync(email, "Mật khẩu mới", $"Mật khẩu mới của bạn là: {newPassword}");

            return true;



        }
    }
}

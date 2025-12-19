using System;
using System.Collections.Generic;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Threading.Tasks;
using BallSport.Application.DTOs;
using BallSport.Infrastructure;
using BallSport.Infrastructure.Models;
using BallSport.Infrastructure.Repositories;
using Banking.Application.Services;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;



namespace BallSport.Application.Services
{
    public class UserService
    {
        private readonly UserRepositories _userRepository;
        private readonly JwtService _jwtService;
        private readonly EmailService _emailService;
        private readonly OTPService _otpService;
        private readonly IMemoryCache _cache;
        private readonly ICloudinaryService _cloudinaryService;
        private readonly PasswordHasher<User> _passwordHasher;
        public UserService(UserRepositories userRepository, 
            JwtService jwtService, 
            EmailService emailService, 
            OTPService otpService, 
            IMemoryCache cache, 
            ICloudinaryService cloudinaryService)
        {
            _userRepository = userRepository;
            _jwtService = jwtService;
            _emailService = emailService;
            _otpService = otpService;
            _cache = cache;
            _cloudinaryService = cloudinaryService;
            _passwordHasher = new PasswordHasher<User>();
        }


        ////////////////////////////////////// Login ////////////////////////////////////////////////



        public bool CheckPassword(string phone, string inputPassword)
        {
            var user = _userRepository.GetUserByPhone(phone);
            if (user == null) return false;

            var result = _passwordHasher.VerifyHashedPassword(
                user,
                user.PasswordHash,
                inputPassword
            );

            return result == PasswordVerificationResult.Success;
        }


        public string? Login(string phone, string inputPassword)
        {
            var user = _userRepository.GetUserByPhone(phone);
            if (user == null) return null;

            var roles = _userRepository.GetRolesByUserId(user.UserId);
            if (user.Status == "Locked")
                throw new UnauthorizedAccessException("Tài khoản của bạn đã bị khóa.");
            if (CheckPassword(phone, inputPassword))
            {

                return _jwtService.GenerateToken(user.UserId, user.Email, user.FullName, user.Phone, roles
                );
            }

            return null;
        }

        ///////////////////////////////////////// Login Google ///////////////////////////////////////////////////

        public string HandleGoogleLogin(string email, string fullName)
        {
            var existingUser = _userRepository.GetUserByEmail(email);
            User user = existingUser;

            if (existingUser == null)
            {
                // 🔐 Tạo mật khẩu tạm
                var randomPass = _userRepository.GenerateRandomPassword();

                // 🔐 HASH mật khẩu tạm
                var passwordHash = _passwordHasher.HashPassword(
                    new User { Email = email },
                    randomPass
                );

                var newUser = new User
                {
                    Email = email,
                    FullName = fullName,
                    PasswordHash = passwordHash, // ✅ LƯU HASH
                    CreatedAt = DateTime.Now,
                    Status = "Active"
                };

                _userRepository.AddUser(newUser);

                var playerRole = _userRepository.GetPlayerRole();
                if (playerRole != null)
                {
                    _userRepository.AddUserRole(newUser.UserId, playerRole.RoleId);
                }

                // 📧 Gửi mật khẩu gốc cho user (chỉ gửi email, KHÔNG lưu)
                _emailService.SendEmailAsync(
                    email,
                    "Xác nhận tạo tài khoản BallSport",
                    $"<p>Xin chào <b>{fullName}</b>,</p>" +
                    $"<p>Quý khách vừa tạo tài khoản bằng Google trên hệ thống BallSport.</p>" +
                    $"<p>Mật khẩu tạm thời của bạn là: <b>{randomPass}</b></p>" +
                    $"<p>Vui lòng đăng nhập và đổi mật khẩu ngay sau khi sử dụng.</p>" +
                    $"<p>Trân trọng,<br/>Đội ngũ BallSport</p>"
                );

                user = newUser;
            }

            var roles = _userRepository.GetRolesByUserId(user.UserId);

            var token = _jwtService.GenerateToken(
                user.UserId,
                user.Email,
                user.FullName,
                user.Phone,
                roles
            );

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
            var passwordHash = _passwordHasher.HashPassword(user, newPassword);
            user.PasswordHash = passwordHash;
            _userRepository.UpdateUser(user);
           
            await _emailService.SendEmailAsync(email, "Mật khẩu mới", $"Mật khẩu mới của bạn là: {newPassword}");

            return true;

        }

        ////////////////////////////////////////////  Register //////////////////////////////////////////////////////////

        

        public async Task<bool> SendOtpForRegisterAsync(
            string fullName,
            string email,
            string phone,
            string password,
            string roleName,
            IFormFile avatar)
        {
            if (_userRepository.IsEmailExists(email))
                throw new Exception("Email đã được sử dụng.");

            if (_userRepository.IsPhoneExists(phone))
                throw new Exception("Số điện thoại đã được sử dụng.");

            var role = _userRepository.GetRoleByName(roleName);
            if (role == null)
                throw new Exception("Vai trò không hợp lệ. Chỉ chấp nhận 'Owner' hoặc 'Player'.");

            // Generate OTP
            var otp = _userRepository.GenerateOtp();
            _otpService.SaveOtp(email, otp, expireMinutes: 5);
            // hash pass
            var tempUser = new User { Email = email };
            var passwordHash = _passwordHasher.HashPassword(tempUser, password);

            // Upload avatar -> Cloudinary
            string avatarUrl = null;
            if (avatar != null && avatar.Length > 0)
            {
                avatarUrl = await _cloudinaryService.UploadImageAsync(avatar);
            }

            // Save pending register
            var pending = new PendingRegisterDTO
            {
                FullName = fullName,
                Email = email,
                Phone = phone,
                Password = passwordHash,
                RoleName = roleName,
                AvatarUrl = avatarUrl
            };

            _cache.Set(email, pending, TimeSpan.FromMinutes(5));

            // Send email OTP
            await _emailService.SendOtpEmailAsync(email, otp);

            return true;
        }



        public async Task<bool> VerifyOtpAndRegisterAsync(string otp)
        {
            var verifiedEmail = _otpService.VerifyAndGetEmailByOtp(otp);
            if (verifiedEmail == null)
                throw new Exception("OTP không hợp lệ hoặc đã hết hạn.");

            // ✅ Lấy dữ liệu đăng ký tạm từ cache
            if (!_cache.TryGetValue(verifiedEmail, out PendingRegisterDTO pending))
                throw new Exception("Không tìm thấy thông tin đăng ký. Vui lòng đăng ký lại.");

            var role = _userRepository.GetRoleByName(pending.RoleName);

            var newUser = new User
            {
                FullName = pending.FullName,
                Email = pending.Email,
                Phone = pending.Phone,
                PasswordHash = pending.Password, 
                Avatar = pending.AvatarUrl,
                CreatedAt = DateTime.Now,
                Status = "Active"
            };

            _userRepository.AddUser(newUser);
            _userRepository.AddUserRole(newUser.UserId, role.RoleId);

            
            _cache.Remove(verifiedEmail);

            
            string subject = "Đăng ký BallSport thành công";
            string message = $"<p>Xin chào <b>{pending.FullName}</b>,</p>" +
                             $"<p>Tài khoản của bạn đã được tạo thành công với vai trò <b>{pending.RoleName}</b>.</p>" +
                             $"<p>Chúc bạn trải nghiệm vui vẻ cùng BallSport!</p>" +
                             $"<p>Trân trọng,<br/>Đội ngũ BallSport</p>";
            await _emailService.SendEmailAsync(pending.Email, subject, message);

            return true;
        }

        ////////////////////////////////// UPdate profile /////////////////////////
        ///



        public async Task<bool> ChangePasswordAsync(  int userId,string oldPassword,string newPassword, string confirmNewPassword)
        {
            // 1. Check user tồn tại
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
                throw new Exception("User not found.");

            // 2. Check mật khẩu hiện tại
            var isCorrectPassword = _userRepository.CheckCurrentPassword(userId, oldPassword);
            if (!isCorrectPassword)
                throw new Exception("Mật khẩu hiện tại không đúng.");

            // 3. Check mật khẩu mới
            if (newPassword != confirmNewPassword)
                throw new Exception("Mật khẩu mới không khớp.");

            if (newPassword.Length < 6)
                throw new Exception("Mật khẩu mới phải có ít nhất 6 ký tự.");

            // 4. Update mật khẩu
            _userRepository.UpdatePassword(userId, newPassword);
            if (!string.IsNullOrEmpty(user.Email))
            {
                string subject = "Thông báo thay đổi mật khẩu BallSport";
                string message =
                    $"<p>Xin chào <b>{user.FullName}</b>,</p>" +
                    $"<p>Mật khẩu tài khoản BallSport của bạn vừa được <b>thay đổi thành công</b>.</p>" +
                    $"<p>Thời gian: {DateTime.Now:dd/MM/yyyy HH:mm}</p>" +
                    $"<p>Trân trọng,<br/>Đội ngũ BallSport</p>";

                await _emailService.SendEmailAsync(user.Email, subject, message);
            }
            return true;
        }


    }
}

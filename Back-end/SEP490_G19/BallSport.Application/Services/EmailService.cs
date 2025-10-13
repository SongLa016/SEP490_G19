using System;
using System.Net.Mail;
using System.Net;
using System.Threading.Tasks;
using BallSport.Infrastructure.Models;

namespace Banking.Application.Services
{
    public class EmailService
    {
        private readonly SmtpSettings _smtpSettings;

        public EmailService(SmtpSettings smtpSettings)
        {
            _smtpSettings = smtpSettings;
        }

        /// <summary>
        /// Gửi email chung (dùng cho reset password, thông báo,...)
        /// </summary>
        public async Task SendEmailAsync(string recipientEmail, string subject, string message)
        {
            await SendMail(recipientEmail, subject, message, isHtml: true);
        }

        /// <summary>
        /// Gửi email chứa mã OTP
        /// </summary>
        public async Task SendOtpEmailAsync(string recipientEmail, string otp)
        {
            string subject = "Xác nhận OTP đăng ký";
            string message = $"Mã OTP của bạn là: <b>{otp}</b>. Vui lòng nhập OTP để xác nhận tài khoản.";
            await SendMail(recipientEmail, subject, message, isHtml: true);
        }

        /// <summary>
        /// Hàm dùng chung để gửi email
        /// </summary>
        private async Task SendMail(string recipientEmail, string subject, string message, bool isHtml)
        {
            try
            {
                using var client = new SmtpClient(_smtpSettings.Server, _smtpSettings.Port)
                {
                    // Dùng SenderEmail làm login
                    Credentials = new NetworkCredential(_smtpSettings.SenderEmail, _smtpSettings.Password),
                    EnableSsl = true
                };

                using var mailMessage = new MailMessage
                {
                    From = new MailAddress(_smtpSettings.SenderEmail, _smtpSettings.SenderName),
                    Subject = subject,
                    Body = message,
                    IsBodyHtml = isHtml
                };

                mailMessage.To.Add(recipientEmail);
                await client.SendMailAsync(mailMessage);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Lỗi gửi email: {ex.Message}");
                throw;
            }
        }
    }
}
